import { NextResponse } from "next/server";
import { computeServerFingerprint, getAllBuildLikes } from "@/lib/build-likes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
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

        const data = await getAllBuildLikes(clientId, fingerprint, ip, userAgent);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to fetch build likes:", error);
        return NextResponse.json({ error: "Failed to fetch build likes" }, { status: 500 });
    }
}
