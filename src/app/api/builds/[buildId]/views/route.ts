import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentSession, shouldUseSecureCookie } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";
import { getBuildViews, incrementBuildViews } from "@/lib/stats";

export const dynamic = "force-dynamic";

const BUILD_ID_PATTERN = /^[A-Za-z0-9_.\-~]{16,200}$/;
const VIEW_COOKIE_NAME = "mystic_vb";
const VIEW_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_COOKIE_HASHES = 100;
const MAX_RECENT_MAP_SIZE = 20_000;

const recentViews = new Map<string, number>();

function hashBuildId(buildId: string): string {
    return crypto.createHash("sha256").update(buildId).digest("base64url").slice(0, 12);
}

function parseViewedCookie(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw
        .split(",")
        .map((item) => item.trim())
        .filter((item) => /^[A-Za-z0-9_-]{8,16}$/.test(item))
        .slice(-MAX_COOKIE_HASHES);
}

function pruneRecentViews(now: number) {
    if (recentViews.size < MAX_RECENT_MAP_SIZE) return;
    for (const [key, ts] of recentViews) {
        if (now - ts >= VIEW_TTL_MS || recentViews.size >= MAX_RECENT_MAP_SIZE) {
            recentViews.delete(key);
        }
        if (recentViews.size < MAX_RECENT_MAP_SIZE * 0.75) break;
    }
}

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

export async function POST(request: Request, { params }: RouteContext) {
    const { buildId } = await params;

    if (!BUILD_ID_PATTERN.test(buildId)) {
        return NextResponse.json({ error: "invalid build id" }, { status: 400 });
    }

    try {
        const now = Date.now();
        const buildHash = hashBuildId(buildId);

        const cookieStore = await cookies();
        const viewedHashes = parseViewedCookie(cookieStore.get(VIEW_COOKIE_NAME)?.value);
        const hasCookieView = viewedHashes.includes(buildHash);

        const session = await getCurrentSession().catch(() => null);
        const clientIp = getClientIp(request.headers);
        const viewerKey = session ? `acc:${session.id}` : `ip:${clientIp}`;
        const dedupeKey = `${viewerKey}:${buildHash}`;

        const lastSeenAt = recentViews.get(dedupeKey);
        const hasRecentServerView = typeof lastSeenAt === "number" && now - lastSeenAt < VIEW_TTL_MS;

        if (hasCookieView || hasRecentServerView) {
            recentViews.set(dedupeKey, lastSeenAt ?? now);
            const views = await getBuildViews(buildId);
            return NextResponse.json({ views, counted: false });
        }

        // Claim synchronously before awaiting I/O so concurrent/StrictMode double-calls cannot double-count.
        pruneRecentViews(now);
        recentViews.set(dedupeKey, now);

        const views = await incrementBuildViews(buildId);
        const updatedHashes = [...viewedHashes.filter((h) => h !== buildHash), buildHash].slice(
            -MAX_COOKIE_HASHES
        );

        const response = NextResponse.json({ views, counted: true });
        response.cookies.set(VIEW_COOKIE_NAME, updatedHashes.join(","), {
            httpOnly: true,
            sameSite: "lax",
            secure: shouldUseSecureCookie(request),
            path: "/",
            maxAge: Math.floor(VIEW_TTL_MS / 1000),
        });
        return response;
    } catch {
        return NextResponse.json({ error: "stats unavailable" }, { status: 500 });
    }
}
