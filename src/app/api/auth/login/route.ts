import { NextResponse } from "next/server";
import {
    SESSION_COOKIE_NAME,
    shouldUseSecureCookie,
    signSessionToken,
    verifyPassword,
} from "@/lib/auth";
import { findAccountByUsername } from "@/lib/auth-store";

export const dynamic = "force-dynamic";

// Constant-time dummy hash used when a username doesn't exist so timing stays uniform
const DUMMY_SCRYPT_HASH =
    "scrypt$00000000000000000000000000000000$000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => ({}))) as {
            username?: string;
            password?: string;
        };

        const rawUsername = (body.username || "").trim().replace(/^@/, "");
        const password = body.password || "";

        if (!rawUsername || !password) {
            return NextResponse.json(
                { error: "Username and password are required." },
                { status: 400 }
            );
        }

        const account = await findAccountByUsername(rawUsername.toLowerCase());
        const hashToCheck = account?.passwordHash || DUMMY_SCRYPT_HASH;
        const valid = verifyPassword(password, hashToCheck);

        if (!account || !valid) {
            return NextResponse.json(
                { error: "Invalid username or password." },
                { status: 401 }
            );
        }

        const sessionUser = {
            id: account.id,
            username: account.username,
            displayName: account.displayName ?? account.username,
        };
        const token = signSessionToken(sessionUser);

        const response = NextResponse.json({ user: sessionUser }, { status: 200 });
        response.cookies.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: shouldUseSecureCookie(request),
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
    }
}
