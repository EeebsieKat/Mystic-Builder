/** Shared site config and Dauntless color mappings. */

export const SITE_NAME = "mystic Builder";

export const SITE_TAGLINE = "A dark-mode Dauntless build planner - plan builds, share them, and get rich Discord link previews.";

/** Displayed game version. The revive project runs 1.14.7 "Mystic Paradox". */
export const GAME_VERSION = "1.14.7";

export const GAME_EDITION = "Mystic Paradox";

export const BUILDER_ORIGIN = "https://reforged.dauntless-builder.com";

export const getSiteUrl = (): string => {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    }
    if (process.env.SITE_URL) {
        return process.env.SITE_URL.replace(/\/$/, "");
    }
    if (process.env.APP_URL) {
        return process.env.APP_URL.replace(/\/$/, "");
    }
    const port = process.env.PORT || process.env.SERVER_PORT || "3000";
    return `http://localhost:${port}`;
};

/** Extract a raw build id from a pasted URL or a raw id. */
export const extractBuildId = (input: string): string | null => {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
        return null;
    }

    // full URL form: https://some.host/b/<id> (extra query/hash tolerated)
    const match = trimmed.match(/\/b\/([A-Za-z0-9_.\-~]{40,})/);
    if (match) {
        return match[1];
    }

    // raw id form
    if (/^[A-Za-z0-9_.\-~]{40,}$/.test(trimmed)) {
        return trimmed;
    }

    return null;
};

export const builderLinkFor = (buildId: string): string => `${BUILDER_ORIGIN}/b/${buildId}`;

/** Local build page for a build id (used for sharing + Discord embeds). */
export const localBuildPath = (buildId: string, name?: string | null): string => {
    const hasName = Boolean(name && name.trim() !== "");
    return `/b/${buildId}${hasName ? `?name=${encodeURIComponent(name!.trim())}` : ""}`;
};

/** Local editor link that opens a build in the Mystic Builder editor. */
export const localEditPath = (buildId: string, name?: string | null): string => {
    const isDefault = buildId === "mczaOqYl60ZdgmRXePKDiMBgFnyuRcVwGsq085AktuUg7jUAO84NyPqlw19n9k-TC";
    const isDefaultName = !name || name.trim() === "" || name.trim() === "Nacroleps";
    if (isDefault && isDefaultName) {
        return "/builder";
    }
    const nameParam = name && name.trim() !== "" ? `name=${encodeURIComponent(name.trim())}` : "";
    if (isDefault) {
        return `/builder?${nameParam}`;
    }
    return `/builder?b=${buildId}${nameParam ? `&${nameParam}` : ""}`;
};

export const elementColor = (elemental: string | null | undefined): string =>
    ({
        Blaze: "#E25822",
        Frost: "#6EC6E8",
        Shock: "#F3C13A",
        Terra: "#6FBF4B",
        Radiant: "#EFD97F",
        Umbral: "#8A5FE8",
    })[elemental ?? ""] ?? "#8E8E93";

export const cellTypeColor = (slot: string | string[] | null | undefined): string => {
    const s = Array.isArray(slot) ? slot[0] : slot;
    return (
        ({
            Fortitude: "#E2574C",
            Insight: "#EFC94C",
            Finesse: "#4FCE8B",
            Alacrity: "#C58BEA",
            Brutality: "#E88C3A",
            Prismatic: "#9FD8CB",
            Defense: "#E2574C",
            Utility: "#EFC94C",
            Technique: "#4FCE8B",
            Mobility: "#C58BEA",
            Power: "#E88C3A",
        })[s ?? ""] ?? "#8E8E93"
    );
};

export const cellTypeLabel = (slot: string | string[] | null | undefined): string => {
    if (Array.isArray(slot)) return slot.join(" / ");
    return slot ?? "None";
};

export const cellTypeIcon = (slot: string | string[] | null | undefined): string => {
    const s = Array.isArray(slot) ? slot[0] : slot;
    if (!s) return "/assets/icons/perks/NoCell.png";
    const normalized =
        ({
            Power: "Brutality",
            Technique: "Finesse",
            Defense: "Fortitude",
            Mobility: "Alacrity",
            Utility: "Insight",
        })[s] ?? s;
    return `/assets/icons/perks/${normalized}.png`;
};

/**
 * Returns style attributes to render a luminous neon text glow on an item's title,
 * matching the game's elemental or cell type aura on dark backgrounds.
 * Uses a smooth 3-stage Gaussian falloff with zero clipping or harsh edges.
 */
export const getTextGlowStyle = (
    color?: string | null,
): { color?: string; textShadow?: string } => {
    if (!color) return {};
    const hex = color.startsWith("#") && color.length === 7 ? color : null;
    if (hex) {
        return {
            color: hex,
            textShadow: `0 0 6px ${hex}99, 0 0 12px ${hex}40, 0 0 20px ${hex}18`,
        };
    }
    return {
        color,
        textShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
    };
};

