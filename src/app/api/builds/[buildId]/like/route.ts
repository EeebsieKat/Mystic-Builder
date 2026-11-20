import { NextResponse } from "next/server";
import { computeServerFingerprint, getBuildLikeStatus, toggleBuildLike } from "@/lib/build-likes";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ buildId: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
    const { buildId } = await params;
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");
    const clientFp = url.searchParams.get("fingerprint");

    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";
    const acceptLanguage = request.headers.get("accept-language") || "";

    const fingerprint = computeServerFingerprint(clientFp, ip, userAgent, acceptLanguage);

    try {
        const result = await getBuildLikeStatus(buildId, clientId, fingerprint, ip, userAgent);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to get build like status:", error);
        return NextResponse.json({ error: "Failed to get like status" }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: RouteContext) {
    const { buildId } = await params;

    let clientId = "";
    let clientFp = "";
    try {
        const body = (await request.json()) as { clientId?: string; fingerprint?: string };
        clientId = body.clientId?.trim() || "";
        clientFp = body.fingerprint?.trim() || "";
    } catch {
        // empty body
    }

    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";
    const acceptLanguage = request.headers.get("accept-language") || "";

    const fingerprint = computeServerFingerprint(clientFp, ip, userAgent, acceptLanguage);

    if (!clientId) {
        clientId = `client_${fingerprint.slice(0, 16)}`;
    }

    try {
        const result = await toggleBuildLike(buildId, clientId, fingerprint, ip, userAgent);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to toggle build like:", error);
        return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
    }
}
