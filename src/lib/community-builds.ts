import { db } from "@/lib/db";
import { allowLocalFallback, d1Request, isD1Mode } from "@/lib/d1-client";
import { createLocalNotification } from "@/lib/notifications";
import {
    COMMUNITY_CATEGORIES,
    type BuildVisibility,
    type CommunityBuildRecord,
    type CommunityCommentRecord,
} from "@/lib/community-types";

export { COMMUNITY_CATEGORIES, type BuildVisibility, type CommunityBuildRecord, type CommunityCommentRecord };

const normalizeVisibility = (val?: string | null): BuildVisibility =>
    val === "private" ? "private" : "public";

export class DuplicateCommunityBuildError extends Error {
    existingId?: string;
    constructor(
        message = "This exact build has already been published to the community.",
        existingId?: string
    ) {
        super(message);
        this.name = "DuplicateCommunityBuildError";
        this.existingId = existingId;
    }
}

export async function listCommunityBuilds(
    viewerAccountId?: string | null
): Promise<CommunityBuildRecord[]> {
    if (isD1Mode()) {
        try {
            const qs = viewerAccountId ? `?accountId=${encodeURIComponent(viewerAccountId)}` : "";
            const res = await d1Request<{ builds: CommunityBuildRecord[] }>(`/community/builds${qs}`);
            return (res.builds || []).map((b) => ({
                ...b,
                visibility: normalizeVisibility(b.visibility),
            }));
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for listCommunityBuilds:", err);
        }
    }

    const builds = await db.communityBuild.findMany({
        where: viewerAccountId
            ? { OR: [{ visibility: "public" }, { accountId: viewerAccountId }] }
            : { visibility: "public" },
        orderBy: { createdAt: "desc" },
        take: 200,
    });

    const buildIds = Array.from(new Set(builds.map((b) => b.buildId)));
    const communityIds = builds.map((b) => b.id);

    const [stats, commentCounts] = await Promise.all([
        buildIds.length > 0
            ? db.buildStat.findMany({
                where: { buildId: { in: buildIds } },
                select: { buildId: true, likes: true, views: true },
            })
            : Promise.resolve([] as Array<{ buildId: string; likes: number; views: number }>),
        communityIds.length > 0
            ? db.communityComment.groupBy({
                by: ["communityBuildId"],
                where: { communityBuildId: { in: communityIds } },
                _count: { _all: true },
            })
            : Promise.resolve([] as Array<{ communityBuildId: string; _count: { _all: number } }>),
    ]);

    const statMap = new Map<string, { buildId: string; likes: number; views: number }>(
        stats.map((s) => [s.buildId, s])
    );
    const commentMap = new Map<string, number>(
        commentCounts.map((c) => [c.communityBuildId, c._count._all])
    );

    return builds.map((b) => {
        const st = statMap.get(b.buildId);
        return {
            ...b,
            visibility: normalizeVisibility(b.visibility),
            likes: st?.likes ?? 0,
            views: st?.views ?? 0,
            commentCount: commentMap.get(b.id) ?? 0,
        };
    });
}

export async function getCommunityBuildById(
    id: string,
    viewerAccountId?: string | null
): Promise<CommunityBuildRecord | null> {
    if (isD1Mode()) {
        try {
            const baseUrl = process.env.D1_WORKER_URL?.trim().replace(/\/$/, "");
            const headers: Record<string, string> = {};
            if (process.env.D1_API_SECRET?.trim()) {
                headers["Authorization"] = `Bearer ${process.env.D1_API_SECRET.trim()}`;
            }
            const qs = viewerAccountId ? `?accountId=${encodeURIComponent(viewerAccountId)}` : "";
            const res = await fetch(`${baseUrl}/community/builds/${encodeURIComponent(id)}${qs}`, {
                headers,
                cache: "no-store",
            });
            if (res.status === 404) return null;
            if (!res.ok) throw new Error(`D1 error (${res.status})`);
            const data = (await res.json()) as { build: CommunityBuildRecord | null };
            if (!data.build) return null;
            return {
                ...data.build,
                visibility: normalizeVisibility(data.build.visibility),
            };
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for getCommunityBuildById:", err);
        }
    }

    const build = await db.communityBuild.findUnique({ where: { id } });
    if (!build) return null;
    if (normalizeVisibility(build.visibility) === "private" && build.accountId !== viewerAccountId) {
        return null;
    }

    const [stat, commentCount] = await Promise.all([
        db.buildStat.findUnique({
            where: { buildId: build.buildId },
            select: { likes: true, views: true },
        }),
        db.communityComment.count({ where: { communityBuildId: build.id } }),
    ]);

    return {
        ...build,
        visibility: normalizeVisibility(build.visibility),
        likes: stat?.likes ?? 0,
        views: stat?.views ?? 0,
        commentCount,
    };
}

export async function createCommunityBuild(data: {
    buildId: string;
    title: string;
    description: string | null;
    category: string;
    visibility?: BuildVisibility;
    weaponType: string;
    weaponName: string;
    element: string | null;
    omnicell: string | null;
    accountId: string;
    authorUsername: string;
    authorDisplayName: string;
}): Promise<CommunityBuildRecord> {
    const visibility = normalizeVisibility(data.visibility);

    if (isD1Mode()) {
        try {
            const baseUrl = process.env.D1_WORKER_URL?.trim().replace(/\/$/, "");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (process.env.D1_API_SECRET?.trim()) {
                headers["Authorization"] = `Bearer ${process.env.D1_API_SECRET.trim()}`;
            }
            const res = await fetch(`${baseUrl}/community/builds`, {
                method: "POST",
                headers,
                body: JSON.stringify({ ...data, visibility }),
                cache: "no-store",
            });
            const json = (await res.json().catch(() => ({}))) as {
                build?: CommunityBuildRecord;
                error?: string;
                existingId?: string;
            };
            if (res.status === 409) {
                throw new DuplicateCommunityBuildError(json.error, json.existingId);
            }
            if (!res.ok || !json.build) {
                throw new Error(json.error || `D1 error (${res.status})`);
            }
            return {
                ...json.build,
                visibility: normalizeVisibility(json.build.visibility ?? visibility),
            };
        } catch (err) {
            if (err instanceof DuplicateCommunityBuildError) throw err;
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for createCommunityBuild:", err);
        }
    }

    const existing = await db.communityBuild.findUnique({
        where: { buildId: data.buildId },
        select: { id: true, accountId: true, visibility: true },
    });
    if (existing) {
        const canSee = existing.visibility !== "private" || existing.accountId === data.accountId;
        throw new DuplicateCommunityBuildError(undefined, canSee ? existing.id : undefined);
    }

    try {
        const created = await db.communityBuild.create({
            data: { ...data, visibility },
        });
        const stat = await db.buildStat.findUnique({
            where: { buildId: created.buildId },
            select: { likes: true, views: true },
        });
        return {
            ...created,
            visibility: normalizeVisibility(created.visibility),
            likes: stat?.likes ?? 0,
            views: stat?.views ?? 0,
            commentCount: 0,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Unique constraint")) {
            throw new DuplicateCommunityBuildError();
        }
        throw err;
    }
}

export async function updateCommunityBuild(
    id: string,
    accountId: string,
    patch: {
        title?: string;
        description?: string | null;
        category?: string;
        visibility?: BuildVisibility;
        buildId?: string;
        weaponType?: string;
        weaponName?: string;
        element?: string | null;
        omnicell?: string | null;
    }
): Promise<{
    ok: boolean;
    status: number;
    build?: CommunityBuildRecord;
    error?: string;
    existingId?: string;
}> {
    if (isD1Mode()) {
        try {
            const baseUrl = process.env.D1_WORKER_URL?.trim().replace(/\/$/, "");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (process.env.D1_API_SECRET?.trim()) {
                headers["Authorization"] = `Bearer ${process.env.D1_API_SECRET.trim()}`;
            }
            const res = await fetch(`${baseUrl}/community/builds/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ ...patch, accountId }),
                cache: "no-store",
            });
            const json = (await res.json().catch(() => ({}))) as {
                build?: CommunityBuildRecord;
                error?: string;
                existingId?: string;
            };
            if (res.ok && json.build) {
                return {
                    ok: true,
                    status: 200,
                    build: {
                        ...json.build,
                        visibility: normalizeVisibility(json.build.visibility),
                    },
                };
            }
            return {
                ok: false,
                status: res.status,
                error: json.error || "Update failed",
                existingId: json.existingId,
            };
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for updateCommunityBuild:", err);
        }
    }

    const existing = await db.communityBuild.findUnique({ where: { id } });
    if (!existing) return { ok: false, status: 404, error: "Build not found" };
    if (existing.accountId !== accountId) return { ok: false, status: 403, error: "Forbidden" };

    const nextBuildId = patch.buildId ?? existing.buildId;
    if (nextBuildId !== existing.buildId) {
        const dup = await db.communityBuild.findUnique({
            where: { buildId: nextBuildId },
            select: { id: true, accountId: true, visibility: true },
        });
        if (dup && dup.id !== id) {
            const canSee = dup.visibility !== "private" || dup.accountId === accountId;
            return {
                ok: false,
                status: 409,
                error: "Another build with that exact loadout already exists.",
                existingId: canSee ? dup.id : undefined,
            };
        }
    }

    const updated = await db.communityBuild.update({
        where: { id },
        data: {
            title: patch.title ?? existing.title,
            description: "description" in patch ? (patch.description ?? null) : existing.description,
            category: patch.category ?? existing.category,
            visibility: patch.visibility ?? existing.visibility,
            buildId: nextBuildId,
            weaponType: patch.weaponType ?? existing.weaponType,
            weaponName: patch.weaponName ?? existing.weaponName,
            element: "element" in patch ? (patch.element ?? null) : existing.element,
            omnicell: "omnicell" in patch ? (patch.omnicell ?? null) : existing.omnicell,
        },
    });

    const [stat, commentCount] = await Promise.all([
        db.buildStat.findUnique({
            where: { buildId: updated.buildId },
            select: { likes: true, views: true },
        }),
        db.communityComment.count({ where: { communityBuildId: updated.id } }),
    ]);

    return {
        ok: true,
        status: 200,
        build: {
            ...updated,
            visibility: normalizeVisibility(updated.visibility),
            likes: stat?.likes ?? 0,
            views: stat?.views ?? 0,
            commentCount,
        },
    };
}

export async function deleteCommunityBuild(
    id: string,
    accountId: string
): Promise<{ ok: boolean; status: number; error?: string }> {
    if (isD1Mode()) {
        try {
            const baseUrl = process.env.D1_WORKER_URL?.trim().replace(/\/$/, "");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (process.env.D1_API_SECRET?.trim()) {
                headers["Authorization"] = `Bearer ${process.env.D1_API_SECRET.trim()}`;
            }
            const res = await fetch(`${baseUrl}/community/builds/${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers,
                body: JSON.stringify({ accountId }),
                cache: "no-store",
            });
            if (res.ok) return { ok: true, status: 200 };
            const err = (await res.json().catch(() => ({}))) as { error?: string };
            return { ok: false, status: res.status, error: err.error || "Delete failed" };
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for deleteCommunityBuild:", err);
        }
    }

    const existing = await db.communityBuild.findUnique({
        where: { id },
        select: { accountId: true },
    });
    if (!existing) return { ok: false, status: 404, error: "Build not found" };
    if (existing.accountId !== accountId) return { ok: false, status: 403, error: "Forbidden" };

    const commentIds = await db.communityComment.findMany({
        where: { communityBuildId: id },
        select: { id: true },
    });
    if (commentIds.length > 0) {
        await db.communityCommentLike
            .deleteMany({ where: { commentId: { in: commentIds.map((c) => c.id) } } })
            .catch(() => { });
    }
    await db.communityComment.deleteMany({ where: { communityBuildId: id } }).catch(() => { });
    await db.communityBuild.delete({ where: { id } });
    return { ok: true, status: 200 };
}

export async function listCommunityComments(
    communityBuildId: string,
    accountId?: string | null
): Promise<CommunityCommentRecord[]> {
    if (isD1Mode()) {
        try {
            const qs = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
            const res = await d1Request<{ comments: CommunityCommentRecord[] }>(
                `/community/builds/${encodeURIComponent(communityBuildId)}/comments${qs}`
            );
            return res.comments || [];
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for listCommunityComments:", err);
        }
    }

    const comments = await db.communityComment.findMany({
        where: { communityBuildId },
        orderBy: { createdAt: "asc" },
        take: 200,
    });

    const commentIds = comments.map((c) => c.id);
    const [likeCounts, myLikes] = await Promise.all([
        commentIds.length > 0
            ? db.communityCommentLike.groupBy({
                by: ["commentId"],
                where: { commentId: { in: commentIds } },
                _count: { _all: true },
            })
            : Promise.resolve([] as Array<{ commentId: string; _count: { _all: number } }>),
        accountId && commentIds.length > 0
            ? db.communityCommentLike.findMany({
                where: { commentId: { in: commentIds }, accountId },
                select: { commentId: true },
            })
            : Promise.resolve([] as Array<{ commentId: string }>),
    ]);

    const countMap = new Map<string, number>(
        likeCounts.map((l) => [l.commentId, l._count._all])
    );
    const myLikeSet = new Set(myLikes.map((l) => l.commentId));

    return comments.map((c) => ({
        ...c,
        likes: countMap.get(c.id) ?? 0,
        likedByMe: myLikeSet.has(c.id),
    }));
}

export async function createCommunityComment(data: {
    communityBuildId: string;
    parentId?: string | null;
    accountId: string;
    authorUsername: string;
    authorDisplayName: string;
    content: string;
    gifUrl?: string | null;
    buildTitle?: string | null;
}): Promise<{ ok: boolean; status: number; comment?: CommunityCommentRecord; error?: string }> {
    if (isD1Mode()) {
        try {
            const baseUrl = process.env.D1_WORKER_URL?.trim().replace(/\/$/, "");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (process.env.D1_API_SECRET?.trim()) {
                headers["Authorization"] = `Bearer ${process.env.D1_API_SECRET.trim()}`;
            }
            const res = await fetch(
                `${baseUrl}/community/builds/${encodeURIComponent(data.communityBuildId)}/comments`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify(data),
                    cache: "no-store",
                }
            );
            const json = (await res.json().catch(() => ({}))) as {
                comment?: CommunityCommentRecord;
                error?: string;
            };
            if (res.ok && json.comment) {
                return { ok: true, status: 201, comment: json.comment };
            }
            return { ok: false, status: res.status, error: json.error || "Unable to post comment." };
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for createCommunityComment:", err);
        }
    }

    let communityBuild: { id: string; title: string; accountId: string; visibility: string } | null = null;
    if (!data.communityBuildId.startsWith("meta:")) {
        communityBuild = await db.communityBuild.findUnique({
            where: { id: data.communityBuildId },
            select: { id: true, title: true, accountId: true, visibility: true },
        });
        if (!communityBuild) {
            return { ok: false, status: 404, error: "Community build not found." };
        }
        if (normalizeVisibility(communityBuild.visibility) === "private" && communityBuild.accountId !== data.accountId) {
            return { ok: false, status: 403, error: "This build is private." };
        }
    }

    let parentComment: { id: string; accountId: string } | null = null;
    if (data.parentId) {
        parentComment = await db.communityComment.findFirst({
            where: { id: data.parentId, communityBuildId: data.communityBuildId },
            select: { id: true, accountId: true },
        });
        if (!parentComment) {
            return { ok: false, status: 404, error: "Parent comment not found." };
        }
    }

    const comment = await db.communityComment.create({
        data: {
            communityBuildId: data.communityBuildId,
            parentId: data.parentId ?? null,
            accountId: data.accountId,
            authorUsername: data.authorUsername,
            authorDisplayName: data.authorDisplayName,
            content: data.content,
            gifUrl: data.gifUrl ?? null,
        },
    });

    const pageId = data.communityBuildId.startsWith("meta:")
        ? data.communityBuildId.slice(5)
        : data.communityBuildId;
    const commentHref = `/builds/${encodeURIComponent(pageId)}#comment-${comment.id}`;
    const targetTitle = communityBuild?.title || data.buildTitle || "Build Discussion";
    const snippet = data.content ? data.content.slice(0, 120) : "Sent a GIF";

    if (parentComment && parentComment.accountId !== data.accountId) {
        await createLocalNotification({
            accountId: parentComment.accountId,
            actorId: data.accountId,
            actorUsername: data.authorUsername,
            actorDisplayName: data.authorDisplayName,
            type: "comment_reply",
            title: targetTitle,
            message: `replied: "${snippet}"`,
            href: commentHref,
        });
    }

    if (
        communityBuild &&
        communityBuild.accountId !== data.accountId &&
        communityBuild.accountId !== parentComment?.accountId
    ) {
        await createLocalNotification({
            accountId: communityBuild.accountId,
            actorId: data.accountId,
            actorUsername: data.authorUsername,
            actorDisplayName: data.authorDisplayName,
            type: "build_comment",
            title: communityBuild.title,
            message: `commented: "${snippet}"`,
            href: commentHref,
        });
    }

    return { ok: true, status: 201, comment: { ...comment, likes: 0, likedByMe: false } };
}

export async function toggleCommunityCommentLike(
    commentId: string,
    accountId: string,
    actor?: { username: string; displayName: string; buildTitle?: string | null }
): Promise<{ ok: boolean; status: number; liked?: boolean; likes?: number; error?: string }> {
    if (isD1Mode()) {
        try {
            const baseUrl = process.env.D1_WORKER_URL?.trim().replace(/\/$/, "");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (process.env.D1_API_SECRET?.trim()) {
                headers["Authorization"] = `Bearer ${process.env.D1_API_SECRET.trim()}`;
            }
            const res = await fetch(
                `${baseUrl}/community/comments/${encodeURIComponent(commentId)}/like`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        accountId,
                        actorUsername: actor?.username,
                        actorDisplayName: actor?.displayName,
                        buildTitle: actor?.buildTitle,
                    }),
                    cache: "no-store",
                }
            );
            const json = (await res.json().catch(() => ({}))) as {
                liked?: boolean;
                likes?: number;
                error?: string;
            };
            if (res.ok) {
                return { ok: true, status: 200, liked: Boolean(json.liked), likes: Number(json.likes ?? 0) };
            }
            return { ok: false, status: res.status, error: json.error || "Unable to toggle comment like." };
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for toggleCommunityCommentLike:", err);
        }
    }

    const comment = await db.communityComment.findUnique({
        where: { id: commentId },
        select: { id: true, accountId: true, communityBuildId: true, content: true },
    });
    if (!comment) return { ok: false, status: 404, error: "Comment not found" };

    const existing = await db.communityCommentLike.findFirst({
        where: { commentId, accountId },
        select: { id: true },
    });

    let liked = false;
    if (existing) {
        await db.communityCommentLike.delete({ where: { id: existing.id } });
        liked = false;
    } else {
        try {
            await db.communityCommentLike.create({ data: { commentId, accountId } });
        } catch {
            // Already liked
        }
        liked = true;

        if (actor && comment.accountId !== accountId) {
            const communityBuild = !comment.communityBuildId.startsWith("meta:")
                ? await db.communityBuild.findUnique({
                    where: { id: comment.communityBuildId },
                    select: { title: true },
                })
                : null;
            const pageId = comment.communityBuildId.startsWith("meta:")
                ? comment.communityBuildId.slice(5)
                : comment.communityBuildId;
            const snippet = comment.content ? comment.content.slice(0, 80) : "GIF comment";
            await createLocalNotification({
                accountId: comment.accountId,
                actorId: accountId,
                actorUsername: actor.username,
                actorDisplayName: actor.displayName,
                type: "comment_like",
                title: communityBuild?.title || actor.buildTitle || "Build Discussion",
                message: `liked your comment: "${snippet}"`,
                href: `/builds/${encodeURIComponent(pageId)}#comment-${commentId}`,
                dedupeUnread: true,
            });
        }
    }

    const likes = await db.communityCommentLike.count({ where: { commentId } });
    return { ok: true, status: 200, liked, likes };
}

export async function deleteCommunityComment(
    commentId: string,
    accountId: string
): Promise<{ ok: boolean; status: number; error?: string }> {
    if (isD1Mode()) {
        try {
            const baseUrl = process.env.D1_WORKER_URL?.trim().replace(/\/$/, "");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (process.env.D1_API_SECRET?.trim()) {
                headers["Authorization"] = `Bearer ${process.env.D1_API_SECRET.trim()}`;
            }
            const res = await fetch(`${baseUrl}/community/comments/${encodeURIComponent(commentId)}`, {
                method: "DELETE",
                headers,
                body: JSON.stringify({ accountId }),
                cache: "no-store",
            });
            if (res.ok) return { ok: true, status: 200 };
            const json = (await res.json().catch(() => ({}))) as { error?: string };
            return { ok: false, status: res.status, error: json.error || "Delete failed" };
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for deleteCommunityComment:", err);
        }
    }

    const comment = await db.communityComment.findUnique({
        where: { id: commentId },
        select: { accountId: true, communityBuildId: true },
    });
    if (!comment) return { ok: false, status: 404, error: "Comment not found" };

    const build = await db.communityBuild.findUnique({
        where: { id: comment.communityBuildId },
        select: { accountId: true },
    });
    if (comment.accountId !== accountId && build?.accountId !== accountId) {
        return { ok: false, status: 403, error: "Forbidden" };
    }

    const replies = await db.communityComment.findMany({
        where: { parentId: commentId },
        select: { id: true },
    });
    const allIds = [commentId, ...replies.map((r) => r.id)];

    await db.communityCommentLike.deleteMany({ where: { commentId: { in: allIds } } }).catch(() => { });
    await db.communityComment.deleteMany({ where: { parentId: commentId } }).catch(() => { });
    await db.communityComment.delete({ where: { id: commentId } });
    return { ok: true, status: 200 };
}
