import { NextResponse } from "next/server";
import { getBuildViews, incrementBuildViews } from "@/lib/stats";

export const dynamic = "force-dynamic";

const BUILD_ID_PATTERN = /^[A-Za-z0-9_.\-~]{40,200}$/;

interface RouteContext {
    params: Promise<{ buildId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
    const { buildId } = await params;

    if (!BUILD_ID_PATTERN.test(buildId)) {
        return NextResponse.json({ error: "invalid build id" }, { status: 400 });
    }

    try {
        const views = await getBuildViews(buildId);
        return NextResponse.json({ views });
    } catch {
        return NextResponse.json({ error: "stats unavailable" }, { status: 500 });
    }
}

export async function POST(_request: Request, { params }: RouteContext) {
    const { buildId } = await params;

    if (!BUILD_ID_PATTERN.test(buildId)) {
        return NextResponse.json({ error: "invalid build id" }, { status: 400 });
    }

    try {
        const views = await incrementBuildViews(buildId);
        return NextResponse.json({ views });
    } catch {
        return NextResponse.json({ error: "stats unavailable" }, { status: 500 });
    }
}
