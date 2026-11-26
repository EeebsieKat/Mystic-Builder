import { db } from "@/lib/db";
import { allowLocalFallback, d1Request, isD1Mode } from "@/lib/d1-client";
import { createLocalNotification } from "@/lib/notifications";

export interface LikeResult {
    liked: boolean;
    count: number;
}

export interface AllLikesResult {
    likes: Record<string, number>;
    userLikes: string[];
    commentCounts?: Record<string, number>;
}

export async function toggleBuildLike(
    buildId: string,
    accountId: string,
    actor?: { username: string; displayName: string }
): Promise<LikeResult> {
    if (isD1Mode()) {
        try {
            return await d1Request<LikeResult>(`/likes/${encodeURIComponent(buildId)}/toggle`, {
                method: "POST",
                body: JSON.stringify({
                    accountId,
                    actorUsername: actor?.username,
                    actorDisplayName: actor?.displayName,
                }),
            });
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for toggleBuildLike:", err);
        }
    }

    const existing = await db.buildLike.findFirst({
        where: { buildId, accountId },
    });

    if (existing) {
        await db.buildLike.delete({
            where: { id: existing.id },
        });
        const count = await db.buildLike.count({ where: { buildId } });
        await db.buildStat.upsert({
            where: { buildId },
            create: { buildId, likes: count },
            update: { likes: count },
        });
        return { liked: false, count };
    } else {
        const syntheticKey = `account:${accountId}`;
        try {
            await db.buildLike.create({
                data: {
                    buildId,
                    accountId,
                    clientId: syntheticKey,
                    fingerprint: syntheticKey,
                    ip: null,
                    userAgent: null,
                },
            });
        } catch {
            // Already liked by this account
        }

        const count = await db.buildLike.count({ where: { buildId } });
        await db.buildStat.upsert({
            where: { buildId },
            create: { buildId, likes: count },
            update: { likes: count },
        });

        if (actor) {
            const communityBuild = await db.communityBuild.findUnique({
                where: { buildId },
                select: { id: true, title: true, accountId: true },
            });
            if (communityBuild && communityBuild.accountId !== accountId) {
                await createLocalNotification({
                    accountId: communityBuild.accountId,
                    actorId: accountId,
                    actorUsername: actor.username,
                    actorDisplayName: actor.displayName,
                    type: "build_like",
                    title: communityBuild.title,
                    message: `liked your build "${communityBuild.title}"`,
                    href: `/builds/${encodeURIComponent(communityBuild.id)}`,
                    dedupeUnread: true,
                });
            }
        }

        return { liked: true, count };
    }
}

export async function getBuildLikeStatus(
    buildId: string,
    accountId?: string | null,
): Promise<LikeResult> {
    if (isD1Mode()) {
        try {
            const qs = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
            return await d1Request<LikeResult>(`/likes/${encodeURIComponent(buildId)}${qs}`);
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for getBuildLikeStatus:", err);
        }
    }

    const [count, userLike] = await Promise.all([
        db.buildLike.count({ where: { buildId } }),
        accountId
            ? db.buildLike.findFirst({
                  where: { buildId, accountId },
                  select: { id: true },
              })
            : null,
    ]);

    return {
        liked: Boolean(userLike),
        count,
    };
}

export async function getAllBuildLikes(accountId?: string | null): Promise<AllLikesResult> {
    if (isD1Mode()) {
        try {
            const qs = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
            return await d1Request<AllLikesResult>(`/likes${qs}`);
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for getAllBuildLikes:", err);
        }
    }

    const stats = await db.buildStat.findMany({
        select: { buildId: true, likes: true },
    });

    const likesMap: Record<string, number> = {};
    for (const stat of stats) {
        if (stat.likes > 0) {
            likesMap[stat.buildId] = stat.likes;
        }
    }

    let userLikes: string[] = [];
    if (accountId) {
        const userLikeRecords = await db.buildLike.findMany({
            where: { accountId },
            select: { buildId: true },
        });
        userLikes = Array.from(new Set(userLikeRecords.map((r) => r.buildId)));
    }

    const metaCommentCounts = await db.communityComment
        .groupBy({
            by: ["communityBuildId"],
            where: { communityBuildId: { startsWith: "meta:" } },
            _count: { _all: true },
        })
        .catch(() => [] as Array<{ communityBuildId: string; _count: { _all: number } }>);

    const commentCounts: Record<string, number> = {};
    for (const row of metaCommentCounts) {
        const bid = row.communityBuildId.slice(5);
        if (bid && row._count._all > 0) {
            commentCounts[bid] = row._count._all;
        }
    }

    return {
        likes: likesMap,
        userLikes,
        commentCounts,
    };
}
