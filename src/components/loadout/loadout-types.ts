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
