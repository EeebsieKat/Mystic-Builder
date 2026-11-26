import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { deleteCommunityComment } from "@/lib/community-builds";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ commentId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteContext) {
    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { commentId } = await params;

    try {
        const result = await deleteCommunityComment(commentId, session.id);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to delete community comment:", error);
        return NextResponse.json({ error: "Unable to delete comment." }, { status: 500 });
    }
}
