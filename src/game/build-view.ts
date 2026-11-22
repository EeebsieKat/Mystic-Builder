/**
 * Turns a build id into a display-ready model used by pages and OG images.
 */

import { BuildModel, BuildFlags, doesCellFitIntoSlot, findCellByVariantName, findPerkByName } from "./build-model";
import { upgradeBuild } from "./upgrade-build";
import { gameData } from "./data";
import { HEALING_FLASK } from "./consumables";
import { GAME_VERSION } from "@/lib/site";
import type { Armour, CellType, Consumable, Lantern, Omnicell, Part, Weapon } from "./types";

export interface CellSlotView {
    variantName: string | null;
    cellName: string | null;
    slot: CellType | null;
    perks: { name: string; value: number }[];
}

export interface ArmourPieceView {
    name: string;
    icon: string;
    surged: boolean;
    cells: CellSlotView[];
    perks: { name: string; value: number }[];
}

export interface PerkTotal {
    name: string;
    value: number;
    type: CellType | null;
}

export interface BuildView {
    buildId: string;
    version: number;
    upgraded: boolean;
    invalid: boolean;
    weapon: {
        name: string;
        icon: string;
        type: string;
        elemental: string | null;
        surged: boolean;
        parts: { label: string; part: Part | null }[];
        bond: { name: string; icon: string } | null;
        cells: CellSlotView[];
        perks: { name: string; value: number }[];
        uniqueEffects: string[];
    } | null;
    armour: {
        head: ArmourPieceView | null;
        torso: ArmourPieceView | null;
        arms: ArmourPieceView | null;
        legs: ArmourPieceView | null;
    };
    lantern: {
        item: Lantern;
        cell: CellSlotView;
    } | null;
    omnicell: Omnicell | null;
    consumables: Consumable[];
    perkTotals: PerkTotal[];
    gameVersion: string;
}

export const tryDeserialize = (rawBuildId: string): BuildModel | null => {
    if (!rawBuildId || rawBuildId.length < 40 || rawBuildId.length > 200) {
        return null;
    }

    try {
        const upgraded = upgradeBuild(rawBuildId);
        if (!BuildModel.isValid(upgraded)) {
            return null;
        }
        const build = BuildModel.deserialize(upgraded);
        return validateCells(build);
    } catch {
        return null;
    }
};

/** Marks builds whose cells don't fit their slots as invalid (like the builder does). */
const validateCells = (build: BuildModel): BuildModel => {
    const checks: [string | null, CellType | CellType[] | null][] = [
        [build.weaponCell1, build.weapon?.cells ?? null],
        [build.weaponCell2, build.weapon?.cells ?? null],
        [build.headCell, build.head?.cells ?? null],
        [build.torsoCell, build.torso?.cells ?? null],
        [build.armsCell, build.arms?.cells ?? null],
        [build.legsCell, build.legs?.cells ?? null],
        [build.lanternCell, build.lanternData?.cells ?? null],
    ];

    for (const [variantName, slot] of checks) {
        if (!doesCellFitIntoSlot(slot, variantName)) {
            build.removeFlag(BuildFlags.UpgradedBuild);
            build.addFlag(BuildFlags.InvalidBuild);
            return build;
        }
    }

    return build;
};

const toCellSlotView = (variantName: string | null): CellSlotView => {
    if (variantName === null) {
        return { variantName: null, cellName: null, slot: null, perks: [] };
    }

    const cell = findCellByVariantName(variantName);
    const variant = cell?.variants[variantName];

    return {
        variantName,
        cellName: cell?.name ?? null,
        slot: cell?.slot ?? null,
        perks: variant
            ? Object.entries(variant.perks).map(([name, value]) => ({ name, value }))
            : [],
    };
};

const filterSurgedPerks = (
    perks: { name: string; value: number; powerSurged?: boolean }[] | undefined,
    surged: boolean,
): { name: string; value: number }[] =>
    (perks ?? []).filter(perk => (perk.powerSurged ?? false) === surged).map(({ name, value }) => ({ name, value }));

const armourPieceView = (name: string | null, surged: boolean, cellVariant: string | null): ArmourPieceView | null => {
    if (name === null) {
        return null;
    }
    const item = gameData.armours[name];
    if (!item) {
        return null;
    }
    return {
        name: item.name,
        icon: item.icon,
        surged,
        cells: [toCellSlotView(cellVariant)],
        perks: filterSurgedPerks(item.perks, surged),
    };
};

/** Renders unique effect descriptions, interpolating {{placeholders}} with their values. */
const renderUniqueEffects = (
    effects: { description?: string; values?: Record<string, string | number>; powerSurged?: boolean }[] | undefined,
    surged: boolean,
): string[] => {
    const list = effects ?? [];
    const matching = list.filter(effect => (effect.powerSurged ?? false) === surged);
    const chosen = matching.length > 0 ? matching : list.filter(effect => !effect.powerSurged);

    return chosen.map(effect => {
        const text = effect.description ?? "";
        return text
            .replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
                effect.values && key in effect.values ? String(effect.values[key]) : "?",
            )
            .replace(/\s*\n\s*/g, " ")
            .trim();
    });
};

export const buildBuildView = (build: BuildModel, buildId: string): BuildView => {
    const weapon = build.weapon;
    const parts = build.parts;

    const weaponParts: { label: string; part: Part | null }[] = [];
    if (weapon && parts) {
        if (weapon.type === "Repeater") {
            weaponParts.push({ label: "Chamber", part: parts.chamber });
            weaponParts.push({ label: "Grip", part: parts.grip });
            weaponParts.push({ label: "Mod", part: parts.mod });
        } else {
            weaponParts.push({ label: "Special", part: parts.special });
            weaponParts.push({ label: "Mod", part: parts.mod });
        }
    }

    const perkSources: { name: string; value: number }[] = [
        ...filterSurgedPerks(weapon?.perks, build.weaponSurged),
        ...filterSurgedPerks(build.bondWeaponData?.perks, build.weaponSurged),
        ...filterSurgedPerks(build.head?.perks, build.headSurged),
        ...filterSurgedPerks(build.torso?.perks, build.torsoSurged),
        ...filterSurgedPerks(build.arms?.perks, build.armsSurged),
        ...filterSurgedPerks(build.legs?.perks, build.legsSurged),
    ];

    const cellVariants = [
        build.weaponCell1,
        build.weaponCell2,
        build.headCell,
        build.torsoCell,
        build.armsCell,
        build.legsCell,
        build.lanternCell,
    ];

    for (const variantName of cellVariants) {
        if (variantName === null) {
            continue;
        }
        const cell = findCellByVariantName(variantName);
        const variant = cell?.variants[variantName];
        if (variant) {
            for (const [name, value] of Object.entries(variant.perks)) {
                perkSources.push({ name, value });
            }
        }
    }

    const perkMap = new Map<string, number>();
    for (const perk of perkSources) {
        if (!findPerkByName(perk.name)) {
            continue;
        }
        perkMap.set(perk.name, (perkMap.get(perk.name) ?? 0) + perk.value);
    }

    const perkTotals: PerkTotal[] = [...perkMap.entries()]
        .map(([name, value]) => ({
            name,
            value,
            type: gameData.perks[name]?.type ?? null,
        }))
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

    return {
        buildId,
        version: build.version,
        upgraded: build.hasFlag(BuildFlags.UpgradedBuild),
        invalid: build.hasFlag(BuildFlags.InvalidBuild),
        weapon: weapon
            ? {
                  name: weapon.name,
                  icon: weapon.icon,
                  type: weapon.type,
                  elemental: weapon.elemental,
                  surged: build.weaponSurged,
                  parts: weaponParts,
                  bond:
                      build.bondWeaponData !== null
                          ? { name: build.bondWeaponData.name, icon: build.bondWeaponData.icon }
                          : null,
                  cells: [toCellSlotView(build.weaponCell1), toCellSlotView(build.weaponCell2)],
                  perks: filterSurgedPerks(weapon.perks, build.weaponSurged),
                  uniqueEffects: renderUniqueEffects(weapon.unique_effects, build.weaponSurged),
              }
            : null,
        armour: {
            head: armourPieceView(build.headName, build.headSurged, build.headCell),
            torso: armourPieceView(build.torsoName, build.torsoSurged, build.torsoCell),
            arms: armourPieceView(build.armsName, build.armsSurged, build.armsCell),
            legs: armourPieceView(build.legsName, build.legsSurged, build.legsCell),
        },
        lantern:
            build.lanternData !== null
                ? {
                      item: build.lanternData,
                      cell: toCellSlotView(build.lanternCell),
                  }
                : null,
        omnicell: build.omnicellData,
        consumables: [HEALING_FLASK, build.consumable1, build.consumable2, build.consumable3]
            .map(name => (name !== null && name in gameData.consumables ? gameData.consumables[name] : null))
            .filter((item): item is Consumable => item !== null),
        perkTotals,
        gameVersion: GAME_VERSION,
    };
};

export const parseBuildId = (rawBuildId: string): { view: BuildView; model: BuildModel } | null => {
    const model = tryDeserialize(rawBuildId);
    if (model === null) {
        return null;
    }
    return { view: buildBuildView(model, rawBuildId), model };
};

/** Short human readable summary used for og:description / embed text. */
export const buildSummary = (view: BuildView): string => {
    const lines: string[] = [];

    if (view.weapon) {
        const cellText = view.weapon.cells
            .filter(cell => cell.cellName !== null)
            .map(cell => cell.perks.map(perk => `${perk.name} ${perk.value}`).join(" / "))
            .filter(Boolean)
            .join(" / ");
        lines.push(
            `${view.weapon.type}${view.weapon.elemental ? ` (${view.weapon.elemental})` : ""}: ${view.weapon.name}` +
                (cellText ? ` - ${cellText}` : ""),
        );
    }

    const armourRows: [string, ArmourPieceView | null][] = [
        ["Head", view.armour.head],
        ["Torso", view.armour.torso],
        ["Arms", view.armour.arms],
        ["Legs", view.armour.legs],
    ];

    for (const [label, piece] of armourRows) {
        if (!piece) {
            continue;
        }
        const cellText = piece.cells
            .flatMap(cell => cell.perks.map(perk => `${perk.name} ${perk.value}`))
            .join(" / ");
        const perkText = piece.perks.map(perk => `${perk.name} ${perk.value}`).join(" / ");
        lines.push(`${label}: ${piece.name}${perkText ? ` (+${perkText})` : ""}${cellText ? ` - ${cellText}` : ""}`);
    }

    if (view.lantern) {
        const cellText = view.lantern.cell.perks.map(perk => `${perk.name} ${perk.value}`).join(" / ");
        lines.push(`Lantern: ${view.lantern.item.name}${cellText ? ` - ${cellText}` : ""}`);
    }

    if (view.omnicell) {
        lines.push(`Omnicell: ${view.omnicell.name}`);
    }

    if (view.perkTotals.length > 0) {
        lines.push(`Perks: ${view.perkTotals.map(perk => `${perk.name} ${perk.value}`).join(", ")}`);
    }

    return lines.join("\n");
};

export const buildTitle = (view: BuildView): string => {
    if (view.weapon) {
        return `${view.weapon.name} ${view.weapon.type} Build`;
    }
    const anyArmour = view.armour.head ?? view.armour.torso ?? view.armour.arms ?? view.armour.legs;
    if (anyArmour) {
        return `${anyArmour.name} & more - Dauntless Build`;
    }
    return "Dauntless Build";
};

export const buildNameplate = (view: BuildView, buildId?: string): string => {
    if (buildId === "mczaOqYl60ZdgmRXePKDiMBgFnyuRcVwGsq085AktuUg7jUAO84NyPqlw19n9k-TC") {
        return "Nacroleps";
    }
    if (view.weapon) {
        const element = view.weapon.elemental ? view.weapon.elemental.toUpperCase() : "";
        const type = view.weapon.type.toUpperCase();
        const elementalTitle = element ? `${element} ${type}` : type;
        if (elementalTitle.length <= 24) {
            return elementalTitle;
        }
        return view.weapon.name.slice(0, 24);
    }
    return "SLAYER";
};
