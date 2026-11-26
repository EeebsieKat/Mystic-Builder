import { NextResponse } from "next/server";
import {
    SESSION_COOKIE_NAME,
    hashPassword,
    shouldUseSecureCookie,
    signSessionToken,
    validatePassword,
    validateUsername,
} from "@/lib/auth";
import { UsernameTakenError, createAccount } from "@/lib/auth-store";
import { validateCleanText } from "@/lib/profanity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => ({}))) as {
            username?: string;
            password?: string;
        };

        const usernameCheck = validateUsername(body.username || "");
        if (!usernameCheck.valid) {
            return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
        }

        const cleanUsername = validateCleanText(usernameCheck.username, "Username");
        if (!cleanUsername.valid) {
            return NextResponse.json({ error: cleanUsername.error }, { status: 400 });
        }

        const passwordCheck = validatePassword(body.password || "");
        if (!passwordCheck.valid) {
            return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
        }

        const passwordHash = hashPassword(body.password as string);

        const account = await createAccount({
            username: usernameCheck.username,
            usernameLower: usernameCheck.usernameLower,
            displayName: usernameCheck.username,
            passwordHash,
        });

        const sessionUser = {
            id: account.id,
            username: account.username,
            displayName: account.displayName ?? account.username,
        };
        const token = signSessionToken(sessionUser);

        const response = NextResponse.json({ user: sessionUser }, { status: 201 });
        response.cookies.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: shouldUseSecureCookie(request),
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });

        return response;
    } catch (error) {
        if (error instanceof UsernameTakenError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("Register error:", error);
        return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
    }
}
