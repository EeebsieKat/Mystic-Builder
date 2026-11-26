import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, shouldUseSecureCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: shouldUseSecureCookie(request),
        path: "/",
        maxAge: 0,
    });
    return response;
}
