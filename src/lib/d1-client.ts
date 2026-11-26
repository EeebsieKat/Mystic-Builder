/**
 * Cloudflare D1 Worker client & database mode selector.
 * Supports switching between Cloudflare D1 ("d1") and Local Prisma SQLite ("local")
 * via DB_PROVIDER in .env.
 */

export type DbMode = "d1" | "local";

export function getDbMode(): DbMode {
    const provider = process.env.DB_PROVIDER?.trim().toLowerCase();
    if (provider === "local" || provider === "sqlite" || provider === "prisma") {
        return "local";
    }
    if (provider === "d1") {
        if (!process.env.D1_WORKER_URL?.trim()) {
            console.warn("[DB] DB_PROVIDER=d1 is set, but D1_WORKER_URL is missing. Falling back to local DB.");
            return "local";
        }
        return "d1";
    }
    // Auto-select D1 if D1_WORKER_URL is present and DB_PROVIDER is not "local"
    return process.env.D1_WORKER_URL?.trim() ? "d1" : "local";
}

export function isD1Mode(): boolean {
    return getDbMode() === "d1";
}

export function allowLocalFallback(): boolean {
    return process.env.D1_FALLBACK_LOCAL?.trim().toLowerCase() === "true";
}

export async function d1Request<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = process.env.D1_WORKER_URL?.trim().replace(/\/$/, "");
    if (!baseUrl) {
        throw new Error("D1_WORKER_URL is not configured");
    }

    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type") && init?.body) {
        headers.set("Content-Type", "application/json");
    }

    const secret = process.env.D1_API_SECRET?.trim();
    if (secret) {
        headers.set("Authorization", `Bearer ${secret}`);
    }

    const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers,
        cache: "no-store",
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`D1 worker error (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
}
