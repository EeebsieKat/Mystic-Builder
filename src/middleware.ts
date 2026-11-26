import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";

// Scanner probes and suspicious file extensions to reject immediately with 403 Forbidden
const BLOCKED_PATTERNS = [
    /\/\.env(\.|$)/i,
    /\/\.git(\/|$)/i,
    /\/\.aws(\/|$)/i,
    /\/\.ssh(\/|$)/i,
    /\/\.htaccess/i,
    /\/\.htpasswd/i,
    /\/wp-(admin|login|content|includes)/i,
    /\/xmlrpc\.php/i,
    /\/phpmyadmin/i,
    /\/pma/i,
    /\/eval-stdin/i,
    /\/actuator/i,
    /\/telescope/i,
    /\/webconsole/i,
    /\/etc\/(passwd|shadow|hosts)/i,
    /\.(php|asp|aspx|jsp|cgi|sql|bak|tar|gz|zip|sh|bash)$/i,
];

// Standard security headers applied across all responses
const SECURITY_HEADERS: Record<string, string> = {
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-DNS-Prefetch-Control": "on",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
};

export function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // 1. URI Length Check (prevents buffer overflow/DDoS probes)
    if (pathname.length + search.length > 2048) {
        return new NextResponse("URI Too Long", { status: 414 });
    }

    // 2. Path Traversal & Suspicious Probe Blocking
    if (
        pathname.includes("..") ||
        search.includes("..") ||
        request.url.toLowerCase().includes("%2e%2e")
    ) {
        return new NextResponse("Bad Request", { status: 400 });
    }

    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(pathname)) {
            return new NextResponse("Forbidden", {
                status: 403,
                headers: { "Content-Type": "text/plain" },
            });
        }
    }

    // 3. Rate Limiting for API routes
    if (pathname.startsWith("/api/")) {
        const clientIp = getClientIp(request.headers);
        const isAuthAttempt =
            pathname === "/api/auth/login" || pathname === "/api/auth/register";
        const isMutation =
            (request.method !== "GET" && request.method !== "HEAD") ||
            pathname.includes("/like") ||
            pathname.includes("/views");

        // Strictest limit for auth brute-force defense (10/min), mutation/tracking (30/min), general API (120/min)
        const limit = isAuthAttempt ? 10 : isMutation ? 30 : 120;
        const windowMs = 60_000;
        const bucket = isAuthAttempt ? "auth" : isMutation ? "mutation" : "api";
        const key = `${bucket}:${clientIp}`;

        const rateLimitResult = rateLimiter.check(key, limit, windowMs);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    error: "Too many requests. Please slow down and try again later.",
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(rateLimitResult.reset),
                        "X-RateLimit-Limit": String(rateLimitResult.limit),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": String(rateLimitResult.reset),
                        ...SECURITY_HEADERS,
                    },
                }
            );
        }

        // Attach rate-limit and security headers to response
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
        response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
        response.headers.set("X-RateLimit-Reset", String(rateLimitResult.reset));

        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
            response.headers.set(key, value);
        }

        return response;
    }

    // 4. Default: Attach security headers to normal page requests
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - icon.png, image assets
         */
        "/((?!_next/static|_next/image|favicon.ico|icon.png|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
