/** Minimal typed views over the builder's data.json (see dauntless-builder-reforged data docs). */

export type CellType =
    | "Prismatic"
    | "Alacrity"
    | "Brutality"
    | "Finesse"
    | "Fortitude"
    | "Insight";

export type ElementalType =
    | "Blaze"
    | "Frost"
    | "Shock"
    | "Terra"
    | "Radiant"
    | "Umbral"
    | null;

export type WeaponType =
    | "Aether Strikers"
    | "Axe"
    | "Chain Blades"
    | "Hammer"
    | "Repeater"
    | "Sword"
    | "War Pike";

export interface PerkValue {
    name: string;
    value: number;
    powerSurged?: boolean;
}

export interface PowerLevel {
    base: number;
    powerSurged?: number;
}

export interface ResistanceLevel {
    base: number;
    powerSurged?: number;
}

export interface Weapon {
    name: string;
    description: string;
    behemoth: string | null;
    icon: string;
    type: WeaponType;
    damage: string;
    elemental: ElementalType;
    cells: CellType | CellType[] | null;
    power: PowerLevel;
    bond?: { elemental: ElementalType };
    perks?: PerkValue[];
    unique_effects?: { name?: string; description: string; values?: Record<string, string | number>; powerSurged?: boolean }[];
}

export interface Armour {
    name: string;
    description: string;
    behemoth: string | null;
    icon: string;
    type: "Head" | "Torso" | "Arms" | "Legs";
    strength: ElementalType;
    weakness: ElementalType;
    cells: CellType | CellType[] | null;
    resistance: ResistanceLevel;
    perks?: PerkValue[];
    unique_effects?: { name?: string; description: string; values?: Record<string, string | number>; powerSurged?: boolean }[];
}

export interface Cell {
    name: string;
    slot: CellType;
    variants: {
        [variantName: string]: {
            rarity: string;
            perks: { [perkName: string]: number };
        };
    };
}

export interface Lantern {
    name: string;
    description: string;
    icon: string;
    cells: CellType | CellType[] | null;
    perks?: PerkValue[];
    unique_effects?: { name?: string; description: string }[];
}

export interface Omnicell {
    name: string;
    description: string;
    icon: string;
    ability_icon?: string;
    active?: string;
    passive?: string;
    unique_effects?: { name?: string; description: string; values?: Record<string, string | number>; powerSurged?: boolean }[];
}

export interface Consumable {
    name: string;
    type: "flask" | "tonic" | "pylon";
    icon: string | null;
    capacity: number;
    description: string;
}

export interface Part {
    name: string;
    description: string;
    icon: string;
    type: string;
    perks?: PerkValue[];
    unique_effects?: { name?: string; description: string }[];
}

export interface RegularWeaponParts {
    mods: { [name: string]: Part };
    specials: { [name: string]: Part };
}

export interface RepeaterParts {
    chambers: { [name: string]: Part };
    grips: { [name: string]: Part };
    mods: { [name: string]: Part };
}

export interface GameData {
    armours: { [name: string]: Armour };
    cells: { [name: string]: Cell };
    consumables: { [name: string]: Consumable };
    lanterns: { [name: string]: Lantern };
    misc: {
        dauntless_version: string;
        patchnotes_version_string: string;
    };
    omnicells: { [name: string]: Omnicell };
    parts: {
        aetherstrikers: RegularWeaponParts;
        axe: RegularWeaponParts;
        chainblades: RegularWeaponParts;
        hammer: RegularWeaponParts;
        sword: RegularWeaponParts;
        repeater: RepeaterParts;
        warpike: RegularWeaponParts;
    };
    perks: { [name: string]: { name: string; description: string; type: CellType } };
    weapons: { [name: string]: Weapon };
}

export type NamesMapType =
    | "Weapons"
    | "Cells"
    | "Armours"
    | "Lanterns"
    | "Omnicells"
    | "Consumables"
    | "Parts:Aetherstrikers"
    | "Parts:Axe"
    | "Parts:Chainblades"
    | "Parts:Hammer"
    | "Parts:Repeater"
    | "Parts:Sword"
    | "Parts:Warpike"
    | "Perks";

export type NamesMap = {
    [type in NamesMapType]: { [id: string]: string };
};
