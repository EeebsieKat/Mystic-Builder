/**
 * In-memory sliding-window rate limiter for protecting endpoints against abuse and DDoS.
 * Compatible with Edge and Node.js runtimes.
 */

interface RateLimitRecord {
    count: number;
    resetAt: number; // timestamp in ms
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number; // seconds until reset
}

class MemoryRateLimiter {
    private store: Map<string, RateLimitRecord>;

    constructor() {
        this.store = new Map();
    }

    private cleanup(now: number) {
        for (const [key, record] of this.store.entries()) {
            if (record.resetAt <= now) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Check if a key has exceeded its rate limit.
     * @param key Unique key (e.g., "ip:endpoint")
     * @param limit Max requests allowed in the window
     * @param windowMs Window duration in milliseconds (default: 60_000ms = 1 min)
     */
    check(key: string, limit: number, windowMs: number = 60_000): RateLimitResult {
        const now = Date.now();

        // Evict expired keys when store gets sufficiently populated
        if (this.store.size > 2000) {
            this.cleanup(now);
        }

        const record = this.store.get(key);

        if (!record || record.resetAt <= now) {
            const resetAt = now + windowMs;
            this.store.set(key, { count: 1, resetAt });
            return {
                success: true,
                limit,
                remaining: limit - 1,
                reset: Math.ceil(windowMs / 1000),
            };
        }

        record.count += 1;
        const remaining = Math.max(0, limit - record.count);
        const reset = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

        if (record.count > limit) {
            return {
                success: false,
                limit,
                remaining: 0,
                reset,
            };
        }

        return {
            success: true,
            limit,
            remaining,
            reset,
        };
    }
}

export const rateLimiter = new MemoryRateLimiter();

/**
 * Extract client IP from standard proxy and request headers.
 */
export function getClientIp(headers: Headers): string {
    const cfConnectingIp = headers.get("cf-connecting-ip");
    if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

    const xRealIp = headers.get("x-real-ip");
    if (xRealIp?.trim()) return xRealIp.trim();

    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
        const firstIp = xForwardedFor.split(",")[0].trim();
        if (firstIp) return firstIp;
    }

    return "127.0.0.1";
}
