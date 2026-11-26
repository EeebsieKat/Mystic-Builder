import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "mystic_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

export interface SessionUser {
    id: string;
    username: string;
    displayName?: string | null;
}

interface SessionPayload {
    sub: string;
    username: string;
    displayName?: string | null;
    iat: number;
    exp: number;
}

const JWT_HEADER_B64 = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
    "utf8"
).toString("base64url");

function getAuthSecret(): string {
    if (process.env.AUTH_SECRET?.trim()) {
        return process.env.AUTH_SECRET.trim();
    }
    // Fallback derived key for local development when AUTH_SECRET is omitted
    return crypto
        .createHash("sha256")
        .update(`mystic-builder-fallback-secret:${process.cwd()}`)
        .digest("hex");
}

/**
 * Validate Discord-style username (2-32 chars, letters/numbers/dots/underscores/hyphens).
 */
export function validateUsername(raw: string): { valid: boolean; username: string; usernameLower: string; error?: string } {
    const trimmed = raw.trim().replace(/^@/, "");
    if (trimmed.length < 2 || trimmed.length > 32) {
        return {
            valid: false,
            username: trimmed,
            usernameLower: trimmed.toLowerCase(),
            error: "Username must be between 2 and 32 characters.",
        };
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
        return {
            valid: false,
            username: trimmed,
            usernameLower: trimmed.toLowerCase(),
            error: "Username may only contain letters, numbers, dots (.), underscores (_), and hyphens (-).",
        };
    }
    return {
        valid: true,
        username: trimmed,
        usernameLower: trimmed.toLowerCase(),
    };
}

export function validatePassword(raw: string): { valid: boolean; error?: string } {
    if (typeof raw !== "string" || raw.length < 6) {
        return { valid: false, error: "Password must be at least 6 characters long." };
    }
    if (raw.length > 128) {
        return { valid: false, error: "Password must be 128 characters or fewer." };
    }
    return { valid: true };
}

/**
 * Hash a password using scrypt with a unique random 16-byte salt per password.
 * Stored format: scrypt$<saltHex>$<derivedKeyHex>
 */
export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const derived = crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS).toString("hex");
    return `scrypt$${salt}$${derived}`;
}

/**
 * Verify a candidate password against a stored salted scrypt hash in constant time.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
        return false;
    }

    const [, salt, expectedHex] = parts;
    if (!salt || !expectedHex) {
        return false;
    }

    try {
        const expectedBuf = Buffer.from(expectedHex, "hex");
        const derivedBuf = crypto.scryptSync(password, salt, expectedBuf.length, SCRYPT_PARAMS);
        if (derivedBuf.length !== expectedBuf.length) {
            return false;
        }
        return crypto.timingSafeEqual(derivedBuf, expectedBuf);
    } catch {
        return false;
    }
}

export function signSessionToken(user: SessionUser): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
        sub: user.id,
        username: user.username,
        displayName: user.displayName ?? null,
        iat: now,
        exp: now + SESSION_TTL_SECONDS,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const signingInput = `${JWT_HEADER_B64}.${payloadB64}`;
    const sig = crypto
        .createHmac("sha256", getAuthSecret())
        .update(signingInput)
        .digest("base64url");
    return `${signingInput}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionUser | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    if (!headerB64 || !payloadB64 || !sigB64) return null;

    try {
        // Verify JWT header explicitly (reject alg:none or non-HS256 tokens)
        const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8")) as {
            alg?: string;
            typ?: string;
        };
        if (header?.alg !== "HS256" || header?.typ !== "JWT") {
            return null;
        }

        const signingInput = `${headerB64}.${payloadB64}`;
        const expectedSig = crypto
            .createHmac("sha256", getAuthSecret())
            .update(signingInput)
            .digest("base64url");

        const sigBuf = Buffer.from(sigB64, "utf8");
        const expectedBuf = Buffer.from(expectedSig, "utf8");
        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
            return null;
        }

        const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SessionPayload;
        if (!payload?.sub || !payload?.username || !payload?.exp) {
            return null;
        }
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return {
            id: payload.sub,
            username: payload.username,
            displayName: payload.displayName ?? null,
        };
    } catch {
        return null;
    }
}

export async function getCurrentSession(): Promise<SessionUser | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        return verifySessionToken(token);
    } catch {
        return null;
    }
}

export function shouldUseSecureCookie(request: Request): boolean {
    const proto = request.headers.get("x-forwarded-proto");
    if (proto) {
        return proto.split(",")[0].trim().toLowerCase() === "https";
    }
    return request.url.startsWith("https://");
}
