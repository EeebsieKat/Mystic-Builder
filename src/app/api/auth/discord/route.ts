import crypto from "crypto";
import { NextResponse } from "next/server";
import { shouldUseSecureCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const DISCORD_STATE_COOKIE = "mystic_discord_state";

export function resolveRequestOrigin(request: Request): string {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto");
    if (host) {
        const scheme = proto
            ? proto.split(",")[0].trim()
            : host.startsWith("localhost") || host.startsWith("127.0.0.1")
              ? "http"
              : "https";
        return `${scheme}://${host}`;
    }
    return new URL(request.url).origin;
}

export function getDiscordRedirectUri(request: Request): string {
    const override = process.env.DISCORD_REDIRECT_URI?.trim();
    if (override) return override;
    return `${resolveRequestOrigin(request)}/api/auth/discord/callback`;
}

function sanitizeNextPath(raw: string | null): string {
    if (!raw) return "/builder";
    const trimmed = raw.trim();
    // Only allow safe local relative paths
    if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
        return "/builder";
    }
    return trimmed;
}

export async function GET(request: Request) {
    const clientId = process.env.DISCORD_CLIENT_ID?.trim();
    const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL("/login?error=discord_not_configured", request.url));
    }

    const url = new URL(request.url);
    const nextPath = sanitizeNextPath(url.searchParams.get("next"));
    const nonce = crypto.randomBytes(24).toString("base64url");
    const statePayload = Buffer.from(JSON.stringify({ nonce, next: nextPath }), "utf8").toString("base64url");

    const redirectUri = getDiscordRedirectUri(request);
    const authorizeUrl = new URL("https://discord.com/oauth2/authorize");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("scope", "identify");
    authorizeUrl.searchParams.set("state", statePayload);

    const response = NextResponse.redirect(authorizeUrl.toString());
    response.cookies.set(DISCORD_STATE_COOKIE, statePayload, {
        httpOnly: true,
        sameSite: "lax",
        secure: shouldUseSecureCookie(request),
        path: "/",
        maxAge: 60 * 10, // 10 minutes
    });

    return response;
}
