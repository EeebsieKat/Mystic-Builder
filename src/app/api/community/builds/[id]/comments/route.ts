import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createCommunityComment, listCommunityComments } from "@/lib/community-builds";
import { sanitizeGifUrl } from "@/lib/gifs";
import { extractMetaBuildId, findMetaBuildById } from "@/lib/meta-builds";
import { validateCleanText } from "@/lib/profanity";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
    const { id } = await params;
    const rawId = decodeURIComponent(id);

    try {
        const session = await getCurrentSession();
        const comments = await listCommunityComments(rawId, session?.id ?? null);
        return NextResponse.json({ comments });
    } catch (error) {
        console.error("Failed to fetch community comments:", error);
        return NextResponse.json({ error: "Unable to load comments." }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: RouteContext) {
    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json(
            {
                error: "Please sign in to post a comment.",
                requiresAuth: true,
            },
            { status: 401 }
        );
    }

    const { id } = await params;

    const rawId = decodeURIComponent(id);
    const metaId = extractMetaBuildId(rawId);
    const metaBuild = metaId !== null ? findMetaBuildById(metaId) : null;
    if (metaId !== null && !metaBuild) {
        return NextResponse.json({ error: "Meta build not found." }, { status: 404 });
    }

    try {
        const body = (await request.json().catch(() => ({}))) as {
            content?: string;
            parentId?: string | null;
            gifUrl?: string | null;
        };
        const content = (body.content || "").trim();
        const rawGif = typeof body.gifUrl === "string" ? body.gifUrl.trim() : "";
        const gifUrl = rawGif ? sanitizeGifUrl(rawGif) : null;

        if (rawGif && !gifUrl) {
            return NextResponse.json(
                { error: "Unsupported GIF URL. Pick a GIF or paste a valid Giphy / Tenor / HTTPS .gif URL." },
                { status: 400 }
            );
        }

        if (!content && !gifUrl) {
            return NextResponse.json(
                { error: "Please write a comment or select a GIF." },
                { status: 400 }
            );
        }

        if (content.length > 500) {
            return NextResponse.json(
                { error: "Comment must be 500 characters or fewer." },
                { status: 400 }
            );
        }

        if (content) {
            const cleanCheck = validateCleanText(content, "Comment");
            if (!cleanCheck.valid) {
                return NextResponse.json({ error: cleanCheck.error }, { status: 400 });
            }
        }

        const result = await createCommunityComment({
            communityBuildId: rawId,
            parentId: typeof body.parentId === "string" && body.parentId.trim() ? body.parentId.trim() : null,
            accountId: session.id,
            authorUsername: session.username,
            authorDisplayName: session.displayName || session.username,
            content,
            gifUrl,
            buildTitle: metaBuild?.title ?? null,
        });

        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({ comment: result.comment }, { status: 201 });
    } catch (error) {
        console.error("Failed to post community comment:", error);
        return NextResponse.json({ error: "Unable to post comment." }, { status: 500 });
    }
}
