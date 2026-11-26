import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getBuildLikeStatus, toggleBuildLike } from "@/lib/build-likes";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ buildId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
    const { buildId } = await params;

    try {
        const session = await getCurrentSession();
        const result = await getBuildLikeStatus(buildId, session?.id ?? null);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to get build like status:", error);
        return NextResponse.json({ error: "Failed to get like status" }, { status: 500 });
    }
}

export async function POST(_request: Request, { params }: RouteContext) {
    const { buildId } = await params;

    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json(
            {
                error: "Please sign in with your Discord username to like builds.",
                requiresAuth: true,
            },
            { status: 401 }
        );
    }

    try {
        const result = await toggleBuildLike(buildId, session.id, {
            username: session.username,
            displayName: session.displayName || session.username,
        });
        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to toggle build like:", error);
        return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
    }
}
