import metaBuildsData from "@/game/meta-builds-indexed.json";

export interface IndexedMetaBuild {
    buildId: string;
    title: string;
    category: string;
    vsElement: string | null;
    subcategory: string | null;
    weaponType: string;
    weaponName: string;
    weaponIcon: string;
    weaponElement: string;
    bondName?: string | null;
    bondIcon?: string | null;
    omnicellName: string | null;
    omnicellIcon: string | null;
    lanternName: string;
    lanternIcon: string;
    head: { name: string; icon: string };
    torso: { name: string; icon: string };
    arms: { name: string; icon: string };
    legs: { name: string; icon: string };
    perks: { name: string; value: number }[];
    cells: { slot: string; cellName: string }[];
}

export const META_COMMENT_PREFIX = "meta:";

const ALL_META_BUILDS = metaBuildsData.builds as IndexedMetaBuild[];
const META_BY_ID = new Map<string, IndexedMetaBuild>(
    ALL_META_BUILDS.map((b) => [b.buildId, b])
);

export function getAllMetaBuilds(): IndexedMetaBuild[] {
    return ALL_META_BUILDS;
}

export function findMetaBuildById(buildId: string): IndexedMetaBuild | null {
    return META_BY_ID.get(buildId) ?? null;
}

export function isMetaBuildId(buildId: string): boolean {
    return META_BY_ID.has(buildId);
}

export function metaCommentTargetId(buildId: string): string {
    return `${META_COMMENT_PREFIX}${buildId}`;
}

export function extractMetaBuildId(targetId: string): string | null {
    if (!targetId.startsWith(META_COMMENT_PREFIX)) return null;
    return targetId.slice(META_COMMENT_PREFIX.length);
}
