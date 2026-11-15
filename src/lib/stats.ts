/**
 * Build view counters.
 *
 * On Netlify this uses Netlify Blobs (built-in storage, zero setup, no external
 * database needed). Anywhere else (local dev, other hosts) it falls back to an
 * in-memory store, which is fine for development and resets on restart.
 */

interface StatsStore {
    getViews(key: string): Promise<number>;
    incrementViews(key: string): Promise<number>;
}

const memoryStore = (): StatsStore => {
    const counts = new Map<string, number>();
    return {
        async getViews(key) {
            return counts.get(key) ?? 0;
        },
        async incrementViews(key) {
            const next = (counts.get(key) ?? 0) + 1;
            counts.set(key, next);
            return next;
        },
    };
};

const netlifyBlobsStore = async (): Promise<StatsStore | null> => {
    try {
        // Only available/resolvable on Netlify with Blobs enabled.
        const { getStore } = await import("@netlify/blobs");
        const store = getStore({ name: "build-stats", consistency: "strong" });

        return {
            async getViews(key) {
                const raw = await store.get(key);
                return raw === null || raw === undefined ? 0 : Number(raw) || 0;
            },
            async incrementViews(key) {
                const current = await store.get(key);
                const next = (current === null || current === undefined ? 0 : Number(current) || 0) + 1;
                await store.set(key, String(next));
                return next;
            },
        };
    } catch {
        return null;
    }
};

let cached: StatsStore | null = null;

const getStoreSafe = async (): Promise<StatsStore> => {
    if (cached) {
        return cached;
    }
    cached = (await netlifyBlobsStore()) ?? memoryStore();
    return cached;
};

const normalizeKey = (buildId: string): string =>
    buildId.replace(/[^A-Za-z0-9_.\-~]/g, "").slice(0, 200);

export const getBuildViews = async (buildId: string): Promise<number> => {
    const store = await getStoreSafe();
    return store.getViews(normalizeKey(buildId));
};

export const incrementBuildViews = async (buildId: string): Promise<number> => {
    const store = await getStoreSafe();
    return store.incrementViews(normalizeKey(buildId));
};
