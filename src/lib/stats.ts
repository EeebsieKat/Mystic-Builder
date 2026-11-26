/**
 * Build view counters backed by Cloudflare D1 Worker or local SQLite via Prisma.
 */
import { db } from "@/lib/db";
import { allowLocalFallback, d1Request, isD1Mode } from "@/lib/d1-client";

const normalizeKey = (buildId: string): string =>
    buildId.replace(/[^A-Za-z0-9_.\-~]/g, "").slice(0, 200);

export const getBuildViews = async (buildId: string): Promise<number> => {
    const key = normalizeKey(buildId);

    if (isD1Mode()) {
        try {
            const data = await d1Request<{ views: number }>(`/views/${encodeURIComponent(key)}`);
            return data.views ?? 0;
        } catch (err) {
            if (!allowLocalFallback()) {
                console.error("[D1] getBuildViews failed:", err);
                return 0;
            }
            console.warn("[D1] Falling back to local DB for getBuildViews:", err);
        }
    }

    try {
        const stat = await db.buildStat.findUnique({
            where: { buildId: key },
            select: { views: true },
        });
        return stat?.views ?? 0;
    } catch {
        return 0;
    }
};

export const incrementBuildViews = async (buildId: string): Promise<number> => {
    const key = normalizeKey(buildId);

    if (isD1Mode()) {
        try {
            const data = await d1Request<{ views: number }>(`/views/${encodeURIComponent(key)}`, {
                method: "POST",
            });
            return data.views ?? 0;
        } catch (err) {
            if (!allowLocalFallback()) {
                console.error("[D1] incrementBuildViews failed:", err);
                return 0;
            }
            console.warn("[D1] Falling back to local DB for incrementBuildViews:", err);
        }
    }

    try {
        const stat = await db.buildStat.upsert({
            where: { buildId: key },
            create: { buildId: key, views: 1, likes: 0 },
            update: { views: { increment: 1 } },
            select: { views: true },
        });
        return stat.views;
    } catch {
        return 0;
    }
};
