import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { toggleCommunityCommentLike } from "@/lib/community-builds";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ commentId: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json(
            { error: "Please sign in to like comments.", requiresAuth: true },
            { status: 401 }
        );
    }

    const { commentId } = await params;
    const body = (await request.json().catch(() => ({}))) as { buildTitle?: string };

    try {
        const result = await toggleCommunityCommentLike(commentId, session.id, {
            username: session.username,
            displayName: session.displayName || session.username,
            buildTitle: typeof body.buildTitle === "string" ? body.buildTitle.trim() : null,
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ liked: result.liked, likes: result.likes });
    } catch (error) {
        console.error("Failed to toggle comment like:", error);
        return NextResponse.json({ error: "Unable to like comment." }, { status: 500 });
    }
}
