/**
 * Consumables (tonics & pylons) for the Awakening loadout UI.
 *
 * Data compiled from the official Dauntless wiki (Supplies page, 1.14.7-era):
 * https://dauntless.fandom.com/wiki/Supplies
 * Stats may differ in the Mystic Paradox revival - flagged for player review.
 */

import consumablesJson from "./consumables.json";

import type { Consumable } from "./types";

export const HEALING_FLASK = "Healing Flask";

export const consumables = consumablesJson as unknown as Record<string, Consumable>;

export const findConsumableByName = (name: string): Consumable | null =>
    name in consumables ? consumables[name] : null;

/** The four loadout consumable slots: flask (locked) + three tonic/pylon picks. */
export const consumableSlots = (): (string | null)[] => [HEALING_FLASK, null, null, null];

export const consumableOptions = (): Consumable[] =>
    Object.values(consumables).filter(item => item.name !== HEALING_FLASK);
