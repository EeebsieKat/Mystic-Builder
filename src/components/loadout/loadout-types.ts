/**
 * Shared types for the Awakening loadout UI.
 */

import type { CellType } from "@/game/types";

export interface LoadoutDraft {
    weaponName: string | null;
    weaponSurged: boolean;
    weaponPart1: string | null;
    weaponPart2: string | null;
    weaponPart3: string | null;
    bondWeapon: string | null;
    weaponCell1: string | null;
    weaponCell2: string | null;
    headName: string | null;
    headSurged: boolean;
    headCell: string | null;
    torsoName: string | null;
    torsoSurged: boolean;
    torsoCell: string | null;
    armsName: string | null;
    armsSurged: boolean;
    armsCell: string | null;
    legsName: string | null;
    legsSurged: boolean;
    legsCell: string | null;
    lantern: string | null;
    lanternCell: string | null;
    omnicell: string | null;
    consumable1: string | null;
    consumable2: string | null;
    consumable3: string | null;
    buildName: string;
}

export type GearSlotId = "weapon" | "lantern" | "omnicell" | "head" | "torso" | "arms" | "legs";
export type ConsumableSlotId = "consumable1" | "consumable2" | "consumable3";
export type SelectionId = GearSlotId | ConsumableSlotId | "summary";

export type CellSlotKey =
    | "weaponCell1"
    | "weaponCell2"
    | "headCell"
    | "torsoCell"
    | "armsCell"
    | "legsCell"
    | "lanternCell";

export type PartSlotKey = "weaponPart1" | "weaponPart2" | "weaponPart3";

export type ArmourSlotId = "head" | "torso" | "arms" | "legs";

export type PickerTarget =
    | { kind: "weapon" }
    | { kind: "lantern" }
    | { kind: "omnicell" }
    | { kind: "armour"; slot: ArmourSlotId }
    | { kind: "cell"; cellKey: CellSlotKey }
    | { kind: "part"; partKey: PartSlotKey; bucket: "specials" | "mods" | "chambers" | "grips" }
    | { kind: "bond" }
    | { kind: "consumable"; index: 1 | 2 | 3 };

/** A perk/cell row as rendered in the center detail card. */
export interface PerkRow {
    name: string;
    points: number;
    description: string;
    activatesAt: number;
    fromCell: boolean;
    cellSlot: CellType | null;
}

/** Interpolates {{placeholders}} in game data strings. */
export const interpolate = (text: string | null | undefined, values?: Record<string, string | number> | null): string =>
    String(text ?? "")
        .replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
            values && key in values ? String(values[key]) : "",
        )
        .replace(/\{\{NL\}\}/g, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/\s*\n\s*/g, " ")
        .trim();

/** Formats perk effect descriptions, supporting both single strings and string arrays. */
export const formatPerkEffect = (eff?: { description: string | (string | null)[]; values?: Record<string, string | number> } | null): string => {
    if (!eff) return "";
    const descs = Array.isArray(eff.description) ? eff.description.filter(Boolean) : [eff.description];
    return descs
        .map(str => interpolate(str as string, eff.values))
        .filter(Boolean)
        .join(", ");
};

/** Splits text into individual sentences by punctuation (. or ! or ?) followed by whitespace. */
export const splitIntoSentences = (text: string): string[] =>
    text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);

export interface TierBreakdown {
    commonSentences: string[];
    changingSentencesMap: Record<number, string>;
    rankFullTextMap: Record<number, string>;
}

export const CURATED_PERK_TIERS: Record<string, { baseEffect: string; tiers: Record<number, string> }> = {
    Impulse: {
        baseEffect:
            "Gain 10% increased Movement Speed. Critical hit damage is increased for every 5% increased Movement Speed (benefiting up to 50% Movement Speed).",
        tiers: {
            1: "+1% Critical Hit Damage",
            2: "+2.5% Critical Hit Damage",
            3: "+4% Critical Hit Damage",
            4: "+6% Critical Hit Damage",
            5: "+8% Critical Hit Damage",
            6: "+10% Critical Hit Damage",
        },
    },
    Reuse: {
        baseEffect:
            "Breaking or assisting in breaking a part has a chance to grant nearby allies 20% increased attack speed for 30s. Else gain 10% attack speed for self.",
        tiers: {
            1: "5% Part Break chance",
            2: "15% Part Break chance",
            3: "30% Part Break chance",
            4: "50% Part Break chance",
            5: "75% Part Break chance",
            6: "90% Part Break chance",
        },
    },
    Recycle: {
        baseEffect:
            "Dealing damage to the same part consecutively grants 10% increased damage per stack.",
        tiers: {
            1: "Stacks up to 1 time",
            2: "Stacks up to 2 times",
            3: "Stacks up to 3 times",
            4: "Stacks up to 4 times",
            5: "Stacks up to 5 times",
            6: "Stacks up to 6 times",
        },
    },
    Inertia: {
        baseEffect:
            "While Sprinting, build up critical strike chance over 4 seconds. Lasts for 2 seconds or until critical damage is dealt.",
        tiers: {
            1: "Build up to +10% Critical Chance",
            2: "Build up to +20% Critical Chance",
            3: "Build up to +30% Critical Chance",
            4: "Build up to +50% Critical Chance",
            5: "Build up to +76% Critical Chance",
            6: "Build up to +100% Critical Chance",
        },
    },
    Parasitic: {
        baseEffect:
            "A portion of incoming damage is delayed over 10 seconds. While taking delayed damage, gain 5% lifesteal (does not apply to hits under 10% max HP).",
        tiers: {
            1: "10% of damage delayed over 10s",
            2: "15% of damage delayed over 10s",
            3: "20% of damage delayed over 10s",
            4: "25% of damage delayed over 10s",
            5: "30% of damage delayed over 10s",
            6: "35% of damage delayed over 10s",
        },
    },
    Conservation: {
        baseEffect:
            "Losing Bonus Movement Speed grants shields. (Cooldown: 2 seconds)",
        tiers: {
            1: "20 shields per 5% Movement Speed lost",
            2: "30 shields per 5% Movement Speed lost",
            3: "40 shields per 5% Movement Speed lost",
            4: "60 shields per 5% Movement Speed lost",
            5: "80 shields per 5% Movement Speed lost",
            6: "100 shields per 5% Movement Speed lost",
        },
    },
    Lucent: {
        baseEffect:
            "Flask heals over 20s for 20% more healing. While active, increases Lantern ability recharge rate.",
        tiers: {
            1: "+15% Lantern recharge rate",
            2: "+25% Lantern recharge rate",
            3: "+35% Lantern recharge rate",
            4: "+40% Lantern recharge rate",
            5: "+45% Lantern recharge rate",
            6: "+50% Lantern recharge rate",
        },
    },
    Nimble: {
        baseEffect:
            "Stamina gained above Max Stamina becomes a stamina shield (max 50).",
        tiers: {
            1: "+10 Stamina after dodging",
            2: "+15 Stamina after dodging",
            3: "+20 Stamina after dodging",
            4: "+25 Stamina after dodging",
            5: "+30 Stamina after dodging",
            6: "+35 Stamina after dodging",
        },
    },
    Fortress: {
        baseEffect:
            "After not taking hostile damage for 10 seconds, gain a health shield. Stacks 3 times.",
        tiers: {
            1: "65 health shield per stack",
            2: "75 health shield per stack",
            3: "90 health shield per stack",
            4: "105 health shield per stack",
            5: "120 health shield per stack",
            6: "135 health shield per stack",
        },
    },
    "Pack Hunter": {
        baseEffect:
            "Gain bonus damage for 20 seconds after killing Fauna. Stacks up to 5 times.",
        tiers: {
            1: "+1% bonus damage per stack",
            2: "+2% bonus damage per stack",
            3: "+4% bonus damage per stack",
            4: "+6% bonus damage per stack",
            5: "+8% bonus damage per stack",
            6: "+10% bonus damage per stack",
        },
    },
    Berserker: {
        baseEffect:
            "After dealing damage, gain bonus damage for 3 seconds. Stacks 10 times.",
        tiers: {
            1: "-50 max health, +1% damage per stack",
            2: "-100 max health, +1.5% damage per stack",
            3: "-150 max health, +2% damage per stack",
            4: "-200 max health, +2.5% damage per stack",
            5: "-250 max health, +3% damage per stack",
            6: "-300 max health, +3.5% damage per stack",
        },
    },
};

/**
 * Extracts static sentence(s) that appear identically across all available tiers (1..6),
 * and separates each tier's description into only the sentence(s) / attributes that differ/change.
 */
export const getTierBreakdown = (
    perk: { name?: string; effects?: Record<string, { description: string | (string | null)[]; values?: Record<string, string | number> }> },
    ranks: number[] = [1, 2, 3, 4, 5, 6],
    perkName?: string,
): TierBreakdown => {
    const lookupName = perkName || perk.name || "";
    if (lookupName && CURATED_PERK_TIERS[lookupName]) {
        const curated = CURATED_PERK_TIERS[lookupName];
        const rankFullTextMap: Record<number, string> = {};
        for (const r of ranks) {
            const eff = perk.effects?.[String(r)];
            rankFullTextMap[r] = formatPerkEffect(eff);
        }
        return {
            commonSentences: [curated.baseEffect],
            changingSentencesMap: curated.tiers,
            rankFullTextMap,
        };
    }

    const rankSentencesMap: Record<number, string[]> = {};
    const rankFullTextMap: Record<number, string> = {};

    for (const r of ranks) {
        const eff = perk.effects?.[String(r)];
        if (!eff) {
            rankSentencesMap[r] = [];
            rankFullTextMap[r] = "No bonus at this tier.";
            continue;
        }

        const descs = Array.isArray(eff.description) ? eff.description.filter(Boolean) : [eff.description];
        const sentences: string[] = [];
        for (const item of descs) {
            if (!item) continue;
            const interp = interpolate(item as string, eff.values);
            if (interp) {
                sentences.push(...splitIntoSentences(interp));
            }
        }

        rankSentencesMap[r] = sentences;
        rankFullTextMap[r] = formatPerkEffect(eff);
    }

    const validRanks = ranks.filter(r => rankSentencesMap[r] && rankSentencesMap[r].length > 0);
    let commonSentences: string[] = [];

    if (validRanks.length > 1) {
        const firstList = rankSentencesMap[validRanks[0]];
        commonSentences = firstList.filter(s =>
            validRanks.every(r => rankSentencesMap[r].includes(s)),
        );
    }

    const changingSentencesMap: Record<number, string> = {};
    for (const r of ranks) {
        if (!rankSentencesMap[r] || rankSentencesMap[r].length === 0) {
            changingSentencesMap[r] = rankFullTextMap[r];
            continue;
        }

        const diff = rankSentencesMap[r].filter(s => !commonSentences.includes(s));
        if (diff.length > 0) {
            changingSentencesMap[r] = diff.join(" ");
        } else {
            changingSentencesMap[r] = rankFullTextMap[r];
        }
    }

    return {
        commonSentences,
        changingSentencesMap,
        rankFullTextMap,
    };
};
