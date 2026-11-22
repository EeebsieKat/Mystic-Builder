/**
 * Build view counters backed by SQLite via Prisma.
 */
import { db } from "@/lib/db";

const normalizeKey = (buildId: string): string =>
    buildId.replace(/[^A-Za-z0-9_.\-~]/g, "").slice(0, 200);

export const getBuildViews = async (buildId: string): Promise<number> => {
    try {
        const key = normalizeKey(buildId);
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
    try {
        const key = normalizeKey(buildId);
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
