/**
 * Build model: decodes a Dauntless Builder build id into resolved game items.
 *
 * Ported from dauntless-builder-reforged (https://github.com/atomicptr/dauntless-builder-reforged)
 * which is licensed under AGPL-3.0. This file is therefore also AGPL-3.0.
 */

import { buildIdsEncode, buildIdsProgressiveDecode } from "./build-id";
import { gameData, namesMap } from "./data";
import type { CellType, Lantern, Armour, Omnicell, Part, Weapon, WeaponType, NamesMapType } from "./types";

export const CURRENT_BUILD_ID = 9;

export enum BuildFlags {
    UpgradedBuild = 0b0001,
    InvalidBuild = 0b0010,
}

enum BuildFields {
    Version,
    Flags,
    WeaponName,
    WeaponSurged,
    WeaponCell1,
    WeaponCell2,
    WeaponPart1,
    WeaponPart2,
    WeaponPart3,
    BondWeapon,
    HeadName,
    HeadSurged,
    HeadCell,
    TorsoName,
    TorsoSurged,
    TorsoCell,
    ArmsName,
    ArmsSurged,
    ArmsCell,
    LegsName,
    LegsSurged,
    LegsCell,
    Lantern,
    LanternCell,
    Omnicell,
    Consumable1,
    Consumable2,
    Consumable3,
}

export class BuildModel {
    version: number = CURRENT_BUILD_ID;
    flags = 0;
    weaponName: string | null = null;
    weaponSurged = true;
    weaponPart1: string | null = null;
    weaponPart2: string | null = null;
    weaponPart3: string | null = null;
    bondWeapon: string | null = null;
    weaponCell1: string | null = null;
    weaponCell2: string | null = null;
    headName: string | null = null;
    headSurged = true;
    headCell: string | null = null;
    torsoName: string | null = null;
    torsoSurged = true;
    torsoCell: string | null = null;
    armsName: string | null = null;
    armsSurged = true;
    armsCell: string | null = null;
    legsName: string | null = null;
    legsSurged = true;
    legsCell: string | null = null;
    lantern: string | null = null;
    lanternCell: string | null = null;
    omnicell: string | null = null;
    /** Awakening loadout consumable slots 2-4 (slot 1 is always the Healing Flask). */
    consumable1: string | null = null;
    consumable2: string | null = null;
    consumable3: string | null = null;

    hasFlag(flag: BuildFlags): boolean {
        return (this.flags & flag) >= 1;
    }

    serialize(): string {
        const weapon = this.weapon;
        const weaponPartType = weapon !== null ? partTypeByWeaponType(weapon.type) : null;

        const params = [
            this.version,
            this.flags,
            weapon !== null ? mapIdByName("Weapons", weapon.name) : 0,
            weapon !== null && this.weaponSurged ? 1 : 0,
            weapon !== null && this.weaponCell1 !== null ? mapIdByName("Cells", this.weaponCell1) : 0,
            weapon !== null && this.weaponCell2 !== null ? mapIdByName("Cells", this.weaponCell2) : 0,
            weaponPartType !== null && this.weaponPart1 !== null ? mapIdByName(weaponPartType, this.weaponPart1) : 0,
            weaponPartType !== null && this.weaponPart2 !== null ? mapIdByName(weaponPartType, this.weaponPart2) : 0,
            weaponPartType !== null && this.weaponPart3 !== null ? mapIdByName(weaponPartType, this.weaponPart3) : 0,
            this.bondWeapon !== null ? mapIdByName("Weapons", this.bondWeapon) : 0,
            this.headName !== null ? mapIdByName("Armours", this.headName) : 0,
            this.headSurged ? 1 : 0,
            this.headCell !== null ? mapIdByName("Cells", this.headCell) : 0,
            this.torsoName !== null ? mapIdByName("Armours", this.torsoName) : 0,
            this.torsoSurged ? 1 : 0,
            this.torsoCell !== null ? mapIdByName("Cells", this.torsoCell) : 0,
            this.armsName !== null ? mapIdByName("Armours", this.armsName) : 0,
            this.armsSurged ? 1 : 0,
            this.armsCell !== null ? mapIdByName("Cells", this.armsCell) : 0,
            this.legsName !== null ? mapIdByName("Armours", this.legsName) : 0,
            this.legsSurged ? 1 : 0,
            this.legsCell !== null ? mapIdByName("Cells", this.legsCell) : 0,
            this.lantern !== null ? mapIdByName("Lanterns", this.lantern) : 0,
            this.lanternCell !== null ? mapIdByName("Cells", this.lanternCell) : 0,
            this.omnicell !== null ? mapIdByName("Omnicells", this.omnicell) : 0,
            this.consumable1 !== null ? mapIdByName("Consumables", this.consumable1) : 0,
            this.consumable2 !== null ? mapIdByName("Consumables", this.consumable2) : 0,
            this.consumable3 !== null ? mapIdByName("Consumables", this.consumable3) : 0,
        ];

        return buildIdsEncode([...params]);
    }


    addFlag(flag: BuildFlags) {
        this.flags |= flag;
    }

    removeFlag(flag: BuildFlags) {
        if (!this.hasFlag(flag)) {
            return;
        }
        this.flags ^= flag;
    }

    get weapon(): Weapon | null {
        return this.weaponName !== null ? findWeaponByName(this.weaponName) : null;
    }

    get bondWeaponData(): Weapon | null {
        return this.bondWeapon !== null ? findWeaponByName(this.bondWeapon) : null;
    }

    get head(): Armour | null {
        return this.headName !== null ? findArmourByName(this.headName) : null;
    }

    get torso(): Armour | null {
        return this.torsoName !== null ? findArmourByName(this.torsoName) : null;
    }

    get arms(): Armour | null {
        return this.armsName !== null ? findArmourByName(this.armsName) : null;
    }

    get legs(): Armour | null {
        return this.legsName !== null ? findArmourByName(this.legsName) : null;
    }

    get lanternData(): Lantern | null {
        return this.lantern !== null ? findLanternByName(this.lantern) : null;
    }

    get omnicellData(): Omnicell | null {
        return this.omnicell !== null ? findOmnicellByName(this.omnicell) : null;
    }

    private findPart(partType: PartType, slot: "weaponPart1" | "weaponPart2" | "weaponPart3"): Part | null {
        const weapon = this.weapon;
        if (weapon === null) {
            return null;
        }
        const name = this[slot];
        if (name === null) {
            return null;
        }
        return findPartByName(weapon.type, partType, name);
    }

    /** For non-repeater weapons: part1 = special, part2 = mod. For repeaters: chamber/grip/mod. */
    get parts(): { special: Part | null; mod: Part | null; chamber: Part | null; grip: Part | null } | null {
        const weapon = this.weapon;
        if (weapon === null) {
            return null;
        }
        if (weapon.type === "Repeater") {
            return {
                chamber: this.findPart(PartType.Chamber, "weaponPart1"),
                grip: this.findPart(PartType.Grip, "weaponPart2"),
                mod: this.findPart(PartType.Mod, "weaponPart3"),
                special: null,
            };
        }
        return {
            special: this.findPart(PartType.Special, "weaponPart1"),
            mod: this.findPart(PartType.Mod, "weaponPart2"),
            chamber: null,
            grip: null,
        };
    }

    static deserialize(buildId: string): BuildModel {
        const data = buildIdsProgressiveDecode(buildId) as number[];

        const nameById = (type: NamesMapType, id: number): string | null => {
            if (id === 0) {
                return null;
            }
            if (!(type in namesMap)) {
                return null;
            }
            return namesMap[type][id] ?? null;
        };

        const build = new BuildModel();

        build.version = data[BuildFields.Version];
        build.flags = data[BuildFields.Flags];
        build.weaponName = nameById("Weapons", data[BuildFields.WeaponName]);

        if (build.weaponName !== null) {
            const weapon = findWeaponByName(build.weaponName);
            const weaponPartType = weapon ? partTypeByWeaponType(weapon.type) : null;

            build.weaponSurged = data[BuildFields.WeaponSurged] >= 1;
            build.weaponPart1 = weaponPartType ? nameById(weaponPartType, data[BuildFields.WeaponPart1]) : null;
            build.weaponPart2 = weaponPartType ? nameById(weaponPartType, data[BuildFields.WeaponPart2]) : null;
            build.weaponPart3 = weaponPartType ? nameById(weaponPartType, data[BuildFields.WeaponPart3]) : null;
            build.bondWeapon = nameById("Weapons", data[BuildFields.BondWeapon]);
            build.weaponCell1 = nameById("Cells", data[BuildFields.WeaponCell1]);
            build.weaponCell2 = nameById("Cells", data[BuildFields.WeaponCell2]);
        }

        build.headName = nameById("Armours", data[BuildFields.HeadName]);
        build.headSurged = data[BuildFields.HeadSurged] >= 1;
        build.headCell = nameById("Cells", data[BuildFields.HeadCell]);
        build.torsoName = nameById("Armours", data[BuildFields.TorsoName]);
        build.torsoSurged = data[BuildFields.TorsoSurged] >= 1;
        build.torsoCell = nameById("Cells", data[BuildFields.TorsoCell]);
        build.armsName = nameById("Armours", data[BuildFields.ArmsName]);
        build.armsSurged = data[BuildFields.ArmsSurged] >= 1;
        build.armsCell = nameById("Cells", data[BuildFields.ArmsCell]);
        build.legsName = nameById("Armours", data[BuildFields.LegsName]);
        build.legsSurged = data[BuildFields.LegsSurged] >= 1;
        build.legsCell = nameById("Cells", data[BuildFields.LegsCell]);
        build.lantern = nameById("Lanterns", data[BuildFields.Lantern]);
        build.lanternCell = nameById("Cells", data[BuildFields.LanternCell]);
        build.omnicell = nameById("Omnicells", data[BuildFields.Omnicell]);

        if (data.length > BuildFields.Consumable1) {
            build.consumable1 = nameById("Consumables", data[BuildFields.Consumable1]);
            build.consumable2 = nameById("Consumables", data[BuildFields.Consumable2]);
            build.consumable3 = nameById("Consumables", data[BuildFields.Consumable3]);
        }

        return build;
    }

    static isValid(buildId: string): boolean {
        const data = buildIdsProgressiveDecode(buildId);
        if (!data || data.length === 0) {
            return false;
        }
        switch (data[BuildFields.Version]) {
            case 1:
                return false; // v1 is invalid by definition
            case 2:
                return data.length === 31;
            case 3:
                return data.length >= 25 && data.length <= 26;
            case 4:
                return data.length === 26 || data.length === 24; // Patch 1.7.0
            case 5:
                return data.length === 24; // Patch 1.7.3
            case 6:
                return data.length === 25;
            case 7:
                return data.length === 25;
            case 8:
                return data.length === 25;
            case 9:
                return data.length === 28;
            default:
                return false;
        }
    }
}

export const mapIdByName = (type: NamesMapType, name: string): number => {
    if (!(type in namesMap)) {
        return 0;
    }
    const id = Object.keys(namesMap[type]).find(key => namesMap[type][key] === name);
    return id ? Number(id) : 0;
};

export const findWeaponByName = (name: string): Weapon | null =>
    name in gameData.weapons ? gameData.weapons[name] : null;

export const findArmourByName = (name: string): Armour | null =>
    name in gameData.armours ? gameData.armours[name] : null;

export const findLanternByName = (name: string): Lantern | null =>
    name in gameData.lanterns ? gameData.lanterns[name] : null;

export const findOmnicellByName = (name: string): Omnicell | null =>
    name in gameData.omnicells ? gameData.omnicells[name] : null;

export const findPerkByName = (name: string) =>
    name in gameData.perks ? gameData.perks[name] : null;

export const findCellByVariantName = (name: string) => {
    const cellName = Object.keys(gameData.cells).find(
        cellName => name in gameData.cells[cellName].variants,
    );
    if (!cellName) {
        return null;
    }
    return gameData.cells[cellName];
};

export enum PartType {
    Mod = "Mod",
    Special = "Special",
    Chamber = "Chamber",
    Grip = "Grip",
}

export const findPartByName = (
    weaponType: WeaponType,
    partType: PartType,
    name: string,
): Part | null => {
    const parts = gameData.parts;
    const key = ({
        "Aether Strikers": "aetherstrikers",
        "Axe": "axe",
        "Chain Blades": "chainblades",
        "Hammer": "hammer",
        "Repeater": "repeater",
        "Sword": "sword",
        "War Pike": "warpike",
    } as const)[weaponType];

    if (!key) {
        return null;
    }

    const category = parts[key] as unknown as Record<string, Record<string, Part>>;
    const buckets: string[] =
        weaponType === "Repeater"
            ? ([PartType.Mod, PartType.Chamber, PartType.Grip].includes(partType)
                ? [partType === PartType.Mod ? "mods" : partType === PartType.Chamber ? "chambers" : "grips"]
                : [])
            : [partType === PartType.Mod ? "mods" : "specials"];

    for (const bucket of buckets) {
        if (category[bucket] && name in category[bucket]) {
            return category[bucket][name];
        }
    }

    return null;
};

const weaponTypeToNamesMap: Record<WeaponType, NamesMapType> = {
    "Aether Strikers": "Parts:Aetherstrikers",
    "Axe": "Parts:Axe",
    "Chain Blades": "Parts:Chainblades",
    "Hammer": "Parts:Hammer",
    "Repeater": "Parts:Repeater",
    "Sword": "Parts:Sword",
    "War Pike": "Parts:Warpike",
};

export const partTypeByWeaponType = (weaponType: WeaponType): NamesMapType => weaponTypeToNamesMap[weaponType];

export const doesCellFitIntoSlot = (
    cellSlot: CellType | CellType[] | null,
    variantName: string | null,
): boolean => {
    if (cellSlot === null) {
        return variantName === null;
    }

    const slots = Array.isArray(cellSlot) ? cellSlot : [cellSlot];

    if (slots.includes("Prismatic")) {
        return true;
    }

    if (variantName === null) {
        return true;
    }

    const cell = findCellByVariantName(variantName);
    return cell !== null && slots.includes(cell.slot);
};
