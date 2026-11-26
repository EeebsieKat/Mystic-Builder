import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    SESSION_COOKIE_NAME,
    hashPassword,
    shouldUseSecureCookie,
    signSessionToken,
} from "@/lib/auth";
import { upsertDiscordAccount } from "@/lib/auth-store";
import {
    DISCORD_STATE_COOKIE,
    getDiscordRedirectUri,
    resolveRequestOrigin,
} from "@/app/api/auth/discord/route";

export const dynamic = "force-dynamic";

interface DiscordTokenResponse {
    access_token?: string;
    token_type?: string;
    error?: string;
}

interface DiscordUserProfile {
    id: string;
    username: string;
    global_name?: string | null;
}

function sanitizeDiscordUsername(raw: string, discordId: string): string {
    const cleaned = raw.trim().replace(/[^a-zA-Z0-9._-]/g, "");
    if (cleaned.length >= 2 && cleaned.length <= 32) {
        return cleaned;
    }
    return `slayer_${discordId.slice(-8)}`;
}

export async function GET(request: Request) {
    const origin = resolveRequestOrigin(request);
    const url = new URL(request.url);
    const errorParam = url.searchParams.get("error");
    const code = url.searchParams.get("code")?.trim();
    const state = url.searchParams.get("state")?.trim();

    const failRedirect = (reason: string) => {
        const res = NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);
        res.cookies.set(DISCORD_STATE_COOKIE, "", { path: "/", maxAge: 0 });
        return res;
    };

    if (errorParam) {
        return failRedirect(errorParam === "access_denied" ? "discord_cancelled" : "discord_failed");
    }

    if (!code || !state) {
        return failRedirect("discord_invalid_request");
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get(DISCORD_STATE_COOKIE)?.value || "";

    const stateBuf = Buffer.from(state, "utf8");
    const storedBuf = Buffer.from(storedState, "utf8");
    if (
        !storedState ||
        stateBuf.length !== storedBuf.length ||
        !crypto.timingSafeEqual(stateBuf, storedBuf)
    ) {
        return failRedirect("discord_state_mismatch");
    }

    let nextPath = "/builder";
    try {
        const parsedState = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
            next?: string;
        };
        if (parsedState?.next && parsedState.next.startsWith("/") && !parsedState.next.startsWith("//")) {
            nextPath = parsedState.next;
        }
    } catch {
        // Default to /builder
    }

    const clientId = process.env.DISCORD_CLIENT_ID?.trim();
    const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
        return failRedirect("discord_not_configured");
    }

    try {
        const redirectUri = getDiscordRedirectUri(request);
        const tokenBody = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
        });

        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: tokenBody.toString(),
            cache: "no-store",
        });

        const tokenData = (await tokenRes.json().catch(() => ({}))) as DiscordTokenResponse;
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error("Discord OAuth token exchange failed:", tokenRes.status, tokenData);
            return failRedirect("discord_token_failed");
        }

        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
            cache: "no-store",
        });

        if (!userRes.ok) {
            console.error("Discord user profile fetch failed:", userRes.status);
            return failRedirect("discord_profile_failed");
        }

        const profile = (await userRes.json()) as DiscordUserProfile;
        if (!profile?.id || !profile?.username) {
            return failRedirect("discord_profile_failed");
        }

        const username = sanitizeDiscordUsername(profile.username, profile.id);
        const displayName = profile.global_name?.trim() || username;
        const randomHash = hashPassword(crypto.randomBytes(32).toString("hex"));

        const account = await upsertDiscordAccount({
            discordId: profile.id,
            username,
            usernameLower: username.toLowerCase(),
            displayName,
            passwordHash: randomHash,
        });

        const jwt = signSessionToken({
            id: account.id,
            username: account.username,
            displayName: account.displayName ?? displayName,
        });
        const secure = shouldUseSecureCookie(request);

        const response = NextResponse.redirect(`${origin}${nextPath}`);
        response.cookies.set(DISCORD_STATE_COOKIE, "", {
            httpOnly: true,
            sameSite: "lax",
            secure,
            path: "/",
            maxAge: 0,
        });
        response.cookies.set(SESSION_COOKIE_NAME, jwt, {
            httpOnly: true,
            sameSite: "lax",
            secure,
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });

        return response;
    } catch (error) {
        console.error("Discord OAuth callback error:", error);
        return failRedirect("discord_failed");
    }
}
