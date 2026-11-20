import crypto from "crypto";
import { db } from "@/lib/db";

export interface LikeResult {
    liked: boolean;
    count: number;
}

export function computeServerFingerprint(
    clientFp: string | null | undefined,
    ip: string | null | undefined,
    userAgent: string | null | undefined,
    acceptLanguage: string | null | undefined,
): string {
    const payload = [
        clientFp?.trim() || "unknown_client_fp",
        userAgent?.trim() || "",
        acceptLanguage?.trim() || "",
        ip?.trim() || "",
    ].join(":::");

    return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function toggleBuildLike(
    buildId: string,
    clientId: string,
    fingerprint: string,
    ip?: string | null,
    userAgent?: string | null,
): Promise<LikeResult> {
    // Check if a like already exists by fingerprint, clientId, or (ip + userAgent)
    const existing = await db.buildLike.findFirst({
        where: {
            buildId,
            OR: [
                { fingerprint },
                { clientId },
                ...(ip && userAgent ? [{ ip, userAgent }] : []),
            ],
        },
    });

    if (existing) {
        // User already liked, toggle to unlike
        await db.buildLike.delete({
            where: {
                id: existing.id,
            },
        });
        const count = await db.buildLike.count({
            where: { buildId },
        });
        await db.buildStat.upsert({
            where: { buildId },
            create: { buildId, likes: count },
            update: { likes: count },
        });
        return { liked: false, count };
    } else {
        // User liking
        try {
            await db.buildLike.create({
                data: {
                    buildId,
                    clientId,
                    fingerprint,
                    ip: ip ?? null,
                    userAgent: userAgent ?? null,
                },
            });
        } catch {
            // Already created or duplicate fingerprint blocked by @@unique([buildId, fingerprint])
        }

        const count = await db.buildLike.count({
            where: { buildId },
        });
        await db.buildStat.upsert({
            where: { buildId },
            create: { buildId, likes: count },
            update: { likes: count },
        });
        return { liked: true, count };
    }
}

export async function getBuildLikeStatus(
    buildId: string,
    clientId?: string | null,
    fingerprint?: string | null,
    ip?: string | null,
    userAgent?: string | null,
): Promise<LikeResult> {
    const orConditions: { clientId?: string; fingerprint?: string; ip?: string; userAgent?: string }[] = [];
    if (clientId) orConditions.push({ clientId });
    if (fingerprint) orConditions.push({ fingerprint });
    if (ip && userAgent) orConditions.push({ ip, userAgent });

    const [count, userLike] = await Promise.all([
        db.buildLike.count({ where: { buildId } }),
        orConditions.length > 0
            ? db.buildLike.findFirst({
                  where: {
                      buildId,
                      OR: orConditions,
                  },
              })
            : null,
    ]);

    return {
        liked: Boolean(userLike),
        count,
    };
}

export async function getAllBuildLikes(
    clientId?: string | null,
    fingerprint?: string | null,
    ip?: string | null,
    userAgent?: string | null,
) {
    const stats = await db.buildStat.findMany({
        select: { buildId: true, likes: true },
    });

    const likesMap: Record<string, number> = {};
    for (const stat of stats) {
        if (stat.likes > 0) {
            likesMap[stat.buildId] = stat.likes;
        }
    }

    let userLikes: string[] = [];
    const orConditions: { clientId?: string; fingerprint?: string; ip?: string; userAgent?: string }[] = [];
    if (clientId) orConditions.push({ clientId });
    if (fingerprint) orConditions.push({ fingerprint });
    if (ip && userAgent) orConditions.push({ ip, userAgent });

    if (orConditions.length > 0) {
        const userLikeRecords = await db.buildLike.findMany({
            where: {
                OR: orConditions,
            },
            select: { buildId: true },
        });
        userLikes = Array.from(new Set(userLikeRecords.map(r => r.buildId)));
    }

    return {
        likes: likesMap,
        userLikes,
    };
}
