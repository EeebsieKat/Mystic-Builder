import rawAds from "./ads.json";

/**
 * Tiny data-driven promo framework.
 *
 * Ads live in `src/ads/ads.json` (see `src/ads/README.md` for the full
 * guide). The popup UI itself is `src/components/ad-popups.tsx`; this file
 * only holds the behaviour knobs, the ad type, and the selection logic.
 */

export type AdAccent = "aether" | "gold";

export interface AdItem {
    id: string;
    enabled: boolean;
    title: string;
    message: string;
    ctaLabel: string | null;
    href: string | null;
    icon: string | null;
    image: string | null;
    accent: AdAccent;
    weight: number;
    startsAt: string | null;
    endsAt: string | null;
}

/** Tune the popup behaviour here — everything else is per-ad in ads.json. */
export const AD_CONFIG = {
    /** Delay after page load before the first popup slides in. */
    firstDelayMs: 2000,
    /** How long a popup stays on screen before sliding away. */
    visibleMs: 14000,
    /** Quiet time between one popup sliding away and the next sliding in. */
    gapMs: 30000,
    /** After someone closes a popup, hide all promos for this long. */
    suppressHoursAfterClose: 1,
    /** localStorage key for the dismissal memory. */
    storageKey: "mystic-builder-ads-suppressed-v2",
    /** Paths where popups never show (e.g. ["/about"]). */
    disabledOnPaths: [] as string[],
};

const DEFAULT_ICON = "/assets/awakening-ui/logo/icon.png";
const ACCENTS: AdAccent[] = ["aether", "gold"];

function normalize(raw: unknown, index: number): AdItem | null {
    if (typeof raw !== "object" || raw === null) return null;
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const title = typeof r.title === "string" ? r.title.trim() : "";
    const message = typeof r.message === "string" ? r.message.trim() : "";
    if (!id || !title || !message) {
        console.warn(`[ads] entry #${index} is missing id/title/message — skipped`);
        return null;
    }
    const str = (v: unknown): string | null =>
        typeof v === "string" && v.trim() ? v.trim() : null;
    const accent = ACCENTS.includes(r.accent as AdAccent) ? (r.accent as AdAccent) : "aether";
    const weightRaw = typeof r.weight === "number" ? r.weight : 1;
    return {
        id,
        enabled: r.enabled !== false,
        title,
        message,
        ctaLabel: str(r.ctaLabel),
        href: str(r.href),
        icon: str(r.icon) ?? DEFAULT_ICON,
        image: str(r.image),
        accent,
        weight: Math.max(1, Math.min(5, Math.round(weightRaw))),
        startsAt: str(r.startsAt),
        endsAt: str(r.endsAt),
    };
}

function inWindow(ad: AdItem, now: number): boolean {
    const starts = ad.startsAt ? Date.parse(ad.startsAt) : null;
    const ends = ad.endsAt ? Date.parse(ad.endsAt) : null;
    if (starts !== null && !Number.isNaN(starts) && now < starts) return false;
    if (ends !== null && !Number.isNaN(ends) && now >= ends) return false;
    return true;
}

/** Ads that are enabled and inside their schedule window, in file order. */
export function getActiveAds(now: number = Date.now()): AdItem[] {
    if (!Array.isArray(rawAds)) return [];
    return rawAds
        .map((raw, i) => normalize(raw, i))
        .filter((ad): ad is AdItem => ad !== null && inWindow(ad, now));
}

/**
 * Weighted random pick that avoids showing the same ad twice in a row.
 * `weight` 1-5 acts as relative frequency (3 shows ~3x as often as 1).
 */
export function pickNextAd(pool: AdItem[], lastId?: string | null): AdItem | null {
    if (pool.length === 0) return null;
    const candidates =
        pool.length > 1 && lastId ? pool.filter((ad) => ad.id !== lastId) : pool;
    if (candidates.length === 0) return null;
    const total = candidates.reduce((sum, ad) => sum + ad.weight, 0);
    let roll = Math.random() * total;
    for (const ad of candidates) {
        roll -= ad.weight;
        if (roll <= 0) return ad;
    }
    return candidates[candidates.length - 1];
}

export function isExternalHref(href: string): boolean {
    return !href.startsWith("/");
}
