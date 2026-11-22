"use client";

/**
 * The Awakening loadout screen - full replacement for the old card-based
 * build editor. Renders the pixel-faithful 1920x1080 in-game loadout stage
 * with the complete 1.14.7 item database wired in.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Dices, Eraser, Link2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { gameData } from "@/game/data";
import {
    BuildModel,
    dedicatedCellType,
    doesCellFitIntoSlot,
    doesCellFitIntoDedicatedSlot,
    findArmourByName,
    findCellByVariantName,
    findLanternByName,
    findOmnicellByName,
    findWeaponByName,
} from "@/game/build-model";
import { buildBuildView, tryDeserialize } from "@/game/build-view";
import { consumableOptions, consumables, findConsumableByName, HEALING_FLASK } from "@/game/consumables";
import type {
    Armour,
    CellType,
    Consumable,
    Lantern,
    Omnicell,
    Part,
    PerkValue,
    WeaponType,
} from "@/game/types";
import { cellTypeColor, cellTypeLabel, elementColor, extractBuildId, localBuildPath } from "@/lib/site";

import { LoadoutStage } from "./loadout-stage";
import {
    ArmourCard,
    ConsumableRow,
    LanternOmnicellCard,
    WeaponCard,
} from "./gear-grid";
import { CrestHeader, ItemDetailPanel, PerkSummaryPanel } from "./right-panel";
import { DetailCard, type DetailCardData } from "./detail-card";
import { ItemPickerOverlay, type PickerItem } from "./item-picker";
import { DiamondPip, FlourishHeader, ItemIcon } from "./decor";
import type {
    ArmourSlotId,
    CellSlotKey,
    LoadoutDraft,
    PartSlotKey,
    PickerTarget,
    SelectionId,
} from "./loadout-types";
import { interpolate, type PerkRow } from "./loadout-types";

/* ------------------------------------------------------------------ */
/* Draft                                                               */
/* ------------------------------------------------------------------ */

const EMPTY_DRAFT: LoadoutDraft = {
    weaponName: null,
    weaponSurged: true,
    weaponPart1: null,
    weaponPart2: null,
    weaponPart3: null,
    bondWeapon: null,
    weaponCell1: null,
    weaponCell2: null,
    headName: null,
    headSurged: true,
    headCell: null,
    torsoName: null,
    torsoSurged: true,
    torsoCell: null,
    armsName: null,
    armsSurged: true,
    armsCell: null,
    legsName: null,
    legsSurged: true,
    legsCell: null,
    lantern: null,
    lanternCell: null,
    omnicell: null,
    consumable1: null,
    consumable2: null,
    consumable3: null,
    buildName: "SLAYER",
};

const draftFromModel = (model: BuildModel): LoadoutDraft => ({
    ...EMPTY_DRAFT,
    ...Object.fromEntries(
        Object.entries({
            weaponName: model.weaponName,
            weaponSurged: model.weaponSurged,
            weaponPart1: model.weaponPart1,
            weaponPart2: model.weaponPart2,
            weaponPart3: model.weaponPart3,
            bondWeapon: model.bondWeapon,
            weaponCell1: model.weaponCell1,
            weaponCell2: model.weaponCell2,
            headName: model.headName,
            headSurged: model.headSurged,
            headCell: model.headCell,
            torsoName: model.torsoName,
            torsoSurged: model.torsoSurged,
            torsoCell: model.torsoCell,
            armsName: model.armsName,
            armsSurged: model.armsSurged,
            armsCell: model.armsCell,
            legsName: model.legsName,
            legsSurged: model.legsSurged,
            legsCell: model.legsCell,
            lantern: model.lantern,
            lanternCell: model.lanternCell,
            omnicell: model.omnicell,
            consumable1: model.consumable1,
            consumable2: model.consumable2,
            consumable3: model.consumable3,
        }).filter(([, value]) => value !== undefined),
    ),
});

const draftToModel = (draft: LoadoutDraft): BuildModel => {
    const model = new BuildModel();
    const { buildName: _buildName, ...rest } = draft;
    Object.assign(model, rest);
    return model;
};

const hasAnyItem = (draft: LoadoutDraft): boolean =>
    Boolean(
        draft.weaponName ||
        draft.headName ||
        draft.torsoName ||
        draft.armsName ||
        draft.legsName ||
        draft.lantern ||
        draft.omnicell ||
        draft.consumable1 ||
        draft.consumable2 ||
        draft.consumable3,
    );

const randomOf = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/* ------------------------------------------------------------------ */
/* Perk helpers                                                        */
/* ------------------------------------------------------------------ */

interface PerkEffects {
    description: string;
    effects?: Record<string, { description: string; values?: Record<string, string | number> }>;
}

const perkEffectAt = (name: string, rank: number): string => {
    const perk = gameData.perks[name] as (PerkEffects & { name: string; type: CellType }) | undefined;
    if (!perk) {
        return "";
    }
    if (perk.effects) {
        const ranks = Object.keys(perk.effects)
            .map(Number)
            .sort((a, b) => a - b);
        const clamped = Math.min(ranks[ranks.length - 1] ?? 6, Math.max(ranks[0] ?? 1, rank));
        const effect = perk.effects[String(clamped)];
        if (effect) {
            return interpolate(effect.description, effect.values);
        }
    }
    return perk.description ?? "";
};

const perkRowsFromGear = (perks: PerkValue[] | undefined, surged: boolean): PerkRow[] =>
    (perks ?? [])
        .filter(perk => (perk.powerSurged ?? false) === surged)
        .map(perk => ({
            name: perk.name,
            points: perk.value,
            description: perkEffectAt(perk.name, perk.value),
            activatesAt: perk.value,
            fromCell: false,
            cellSlot: gameData.perks[perk.name]?.type ?? null,
        }));

const cellRow = (variantName: string | null): PerkRow | null => {
    if (!variantName) {
        return null;
    }
    const cell = findCellByVariantName(variantName);
    if (!cell) {
        return null;
    }
    const variant = cell.variants[variantName];
    const entry = Object.entries(variant?.perks ?? {})[0];
    if (!entry) {
        return null;
    }
    const [perkName, value] = entry;
    return {
        name: perkName,
        points: value,
        description: perkEffectAt(perkName, value),
        activatesAt: value,
        fromCell: true,
        cellSlot: cell.slot,
    };
};

/* Surge-aware unique effect text shared by weapons and armour so both gear
   kinds render their legendary effects in the detail card alike. */
const surgeMatchingEffects = (
    effects:
        | { description?: string; values?: Record<string, string | number>; powerSurged?: boolean }[]
        | undefined,
    surged: boolean,
): string[] => {
    const list = effects ?? [];
    const matching = list.filter(effect => (effect.powerSurged ?? false) === surged);
    const chosen = matching.length > 0 ? matching : list.filter(effect => !effect.powerSurged);
    return chosen.map(effect => interpolate(effect.description, effect.values));
};

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

const ARMOUR_SLOTS: { id: ArmourSlotId; nameKey: "headName" | "torsoName" | "armsName" | "legsName"; surgedKey: "headSurged" | "torsoSurged" | "armsSurged" | "legsSurged"; cellKey: CellSlotKey; label: string }[] = [
    { id: "head", nameKey: "headName", surgedKey: "headSurged", cellKey: "headCell", label: "Head" },
    { id: "torso", nameKey: "torsoName", surgedKey: "torsoSurged", cellKey: "torsoCell", label: "Torso" },
    { id: "arms", nameKey: "armsName", surgedKey: "armsSurged", cellKey: "armsCell", label: "Arms" },
    { id: "legs", nameKey: "legsName", surgedKey: "legsSurged", cellKey: "legsCell", label: "Legs" },
];

export interface LoadoutScreenProps {
    initialBuildId?: string;
}

export const LoadoutScreen = ({ initialBuildId }: LoadoutScreenProps = {}) => {
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [draft, setDraft] = useState<LoadoutDraft>(() => {
        const id = initialBuildId || searchParams.get("b");
        if (id) {
            const parsed = tryDeserialize(id);
            if (parsed) {
                return draftFromModel(parsed);
            }
        }
        return EMPTY_DRAFT;
    });

    useEffect(() => {
        if (initialBuildId) {
            const parsed = tryDeserialize(initialBuildId);
            if (parsed) {
                setDraft(draftFromModel(parsed));
            }
        }
    }, [initialBuildId]);

    const [selectedSlot, setSelectedSlot] = useState<SelectionId>("weapon");
    /* The center detail card always shows the last inspected gear slot, even
       while the right panel is switched to the perk summary (game behaviour). */
    const [detailSlot, setDetailSlot] = useState<SelectionId>("weapon");
    const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importValue, setImportValue] = useState("");
    const [copied, setCopied] = useState(false);

    const model = useMemo(() => draftToModel(draft), [draft]);
    const buildId = useMemo(() => {
        try {
            return model.serialize();
        } catch {
            return null;
        }
    }, [model]);
    const view = useMemo(() => (buildId ? buildBuildView(model, buildId) : null), [model, buildId]);

    /* URL sync so the editor state is always shareable. */
    useEffect(() => {
        if (!buildId) {
            return;
        }
        const isBRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/b/");
        const url = hasAnyItem(draft) ? (isBRoute ? `/b/${buildId}` : `/?b=${buildId}`) : "/";
        window.history.replaceState(null, "", url);
    }, [buildId, draft]);

    /* Esc deselects back to the perk summary (and closes overlays). */
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !pickerTarget && !importOpen) {
                setSelectedSlot("summary");
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [pickerTarget, importOpen]);

    const set = useCallback(<K extends keyof LoadoutDraft>(key: K, value: LoadoutDraft[K]) => {
        setDraft(previous => {
            const next = { ...previous, [key]: value };

            if (key === "weaponName") {
                const previousWeapon = findWeaponByName(previous.weaponName ?? "");
                const nextWeapon = findWeaponByName((value as string | null) ?? "");
                if (previousWeapon?.type !== nextWeapon?.type) {
                    next.weaponPart1 = null;
                    next.weaponPart2 = null;
                    next.weaponPart3 = null;
                    next.bondWeapon = null;
                }
                if (!nextWeapon?.bond) {
                    next.bondWeapon = null;
                }
                if (next.bondWeapon !== null) {
                    const bondWeapon = findWeaponByName(next.bondWeapon);
                    const bondStillValid =
                        nextWeapon !== null &&
                        nextWeapon.bond !== undefined &&
                        bondWeapon !== null &&
                        bondWeapon.elemental === nextWeapon.elemental &&
                        bondWeapon.type === nextWeapon.type &&
                        bondWeapon.name !== nextWeapon.name;
                    if (!bondStillValid) {
                        next.bondWeapon = null;
                    }
                }
                const allowed = nextWeapon?.cells ?? null;
                // Each weapon socket is dedicated to one cell type.
                if (!doesCellFitIntoDedicatedSlot(allowed, 0, next.weaponCell1)) {
                    next.weaponCell1 = null;
                }
                if (!doesCellFitIntoDedicatedSlot(allowed, 1, next.weaponCell2)) {
                    next.weaponCell2 = null;
                }
            }

            const armourCheck: [keyof LoadoutDraft, keyof LoadoutDraft][] = [
                ["headName", "headCell"],
                ["torsoName", "torsoCell"],
                ["armsName", "armsCell"],
                ["legsName", "legsCell"],
            ];
            for (const [nameKey, cellKey] of armourCheck) {
                if (key === nameKey) {
                    const piece = findArmourByName((next[nameKey] as string | null) ?? "");
                    if (!doesCellFitIntoSlot(piece?.cells ?? null, next[cellKey] as string | null)) {
                        (next as Record<string, unknown>)[cellKey] = null;
                    }
                }
            }
            if (key === "lantern") {
                const lantern = findLanternByName(next.lantern ?? "");
                if (!doesCellFitIntoSlot(lantern?.cells ?? null, next.lanternCell)) {
                    next.lanternCell = null;
                }
            }

            return next;
        });
    }, []);

    /* --------------------------- actions --------------------------- */

    const randomize = useCallback(() => {
        const weaponsWithCells = Object.values(gameData.weapons).filter(weapon => weapon.cells !== null);
        const weapon = randomOf(weaponsWithCells);
        const partsKey = ({
            "Aether Strikers": "aetherstrikers",
            Axe: "axe",
            "Chain Blades": "chainblades",
            Hammer: "hammer",
            Repeater: "repeater",
            Sword: "sword",
            "War Pike": "warpike",
        } as const)[weapon.type];
        const category = gameData.parts[partsKey] as unknown as Record<string, Record<string, Part>>;

        const pickFittingCell = (allowed: CellType | CellType[] | null, socketIndex = 0): string | null => {
            if (allowed === null) {
                return null;
            }
            const fitting: string[] = [];
            for (const cell of Object.values(gameData.cells)) {
                for (const variantName of Object.keys(cell.variants)) {
                    if (doesCellFitIntoDedicatedSlot(allowed, socketIndex, variantName)) {
                        fitting.push(variantName);
                    }
                }
            }
            return fitting.length > 0 ? randomOf(fitting) : null;
        };

        const randomArmour = (type: string) =>
            randomOf(Object.values(gameData.armours).filter(armour => armour.type === type));

        const head = randomArmour("Head");
        const torso = randomArmour("Torso");
        const arms = randomArmour("Arms");
        const legs = randomArmour("Legs");
        const lantern = randomOf(Object.values(gameData.lanterns));
        const omnicell = randomOf(Object.values(gameData.omnicells));

        const bondPool = Object.values(gameData.weapons).filter(
            candidate =>
                candidate.elemental === weapon.elemental &&
                candidate.type === weapon.type &&
                candidate.name !== weapon.name,
        );

        const options = consumableOptions();
        const pickConsumable = () => (Math.random() < 0.75 ? randomOf(options).name : null);

        setDraft({
            ...EMPTY_DRAFT,
            buildName: draft.buildName,
            weaponName: weapon.name,
            weaponSurged: Math.random() >= 0.5,
            weaponPart1:
                weapon.type === "Repeater"
                    ? category?.chambers
                        ? randomOf(Object.keys(category.chambers))
                        : null
                    : category?.specials
                        ? randomOf(Object.keys(category.specials))
                        : null,
            weaponPart2:
                weapon.type === "Repeater"
                    ? category?.grips
                        ? randomOf(Object.keys(category.grips))
                        : null
                    : category?.mods
                        ? randomOf(Object.keys(category.mods))
                        : null,
            weaponPart3: weapon.type === "Repeater" && category?.mods ? randomOf(Object.keys(category.mods)) : null,
            bondWeapon: bondPool.length > 0 && Math.random() < 0.3 ? randomOf(bondPool).name : null,
            weaponCell1: pickFittingCell(weapon.cells, 0),
            weaponCell2: pickFittingCell(weapon.cells, 1),
            headName: head.name,
            headSurged: Math.random() >= 0.5,
            headCell: pickFittingCell(head.cells),
            torsoName: torso.name,
            torsoSurged: Math.random() >= 0.5,
            torsoCell: pickFittingCell(torso.cells),
            armsName: arms.name,
            armsSurged: Math.random() >= 0.5,
            armsCell: pickFittingCell(arms.cells),
            legsName: legs.name,
            legsSurged: Math.random() >= 0.5,
            legsCell: pickFittingCell(legs.cells),
            lantern: lantern.name,
            lanternCell: pickFittingCell(lantern.cells),
            omnicell: omnicell.name,
            consumable1: pickConsumable(),
            consumable2: pickConsumable(),
            consumable3: pickConsumable(),
        });
    }, [draft.buildName]);

    const importBuild = useCallback(() => {
        const id = extractBuildId(importValue);
        if (!id) {
            toast({
                title: "Not a build link",
                description: "Paste a full /b/ link or a raw build id.",
                variant: "destructive",
            });
            return;
        }
        const parsed = tryDeserialize(id);
        if (!parsed) {
            toast({
                title: "Could not decode that build",
                description: "The link may be corrupted or use an unsupported format.",
                variant: "destructive",
            });
            return;
        }
        setDraft(draftFromModel(parsed));
        setImportValue("");
        setImportOpen(false);
        toast({ title: "Build loaded into the loadout" });
    }, [importValue, toast]);

    const copyShareLink = useCallback(async () => {
        if (!buildId) {
            return;
        }
        const url = `${window.location.origin}${localBuildPath(buildId)}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast({ title: "Build link copied", description: url });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: "Could not copy", description: url, variant: "destructive" });
        }
    }, [buildId, toast]);

    const selectSlot = useCallback((slot: SelectionId) => {
        setSelectedSlot(slot);
        if (slot !== "summary") {
            setDetailSlot(slot);
        }
    }, []);

    /* --------------------------- derived --------------------------- */

    const weapon = draft.weaponName ? findWeaponByName(draft.weaponName) : null;
    const lantern = draft.lantern ? findLanternByName(draft.lantern) : null;
    const omnicell = draft.omnicell ? findOmnicellByName(draft.omnicell) : null;

    const armourPieces = ARMOUR_SLOTS.map(slot => ({
        ...slot,
        data: draft[slot.nameKey] ? findArmourByName(draft[slot.nameKey]!) : null,
    }));

    const totalPower = weapon
        ? draft.weaponSurged
            ? weapon.power.powerSurged ?? weapon.power.base
            : weapon.power.base
        : 0;
    const totalResistance = armourPieces.reduce(
        (sum, piece) =>
            sum +
            (piece.data
                ? draft[piece.surgedKey]
                    ? piece.data.resistance.powerSurged ?? piece.data.resistance.base
                    : piece.data.resistance.base
                : 0),
        0,
    );

    const consumableNames: [string, string | null, string | null, string | null] = [
        HEALING_FLASK,
        draft.consumable1,
        draft.consumable2,
        draft.consumable3,
    ];

    /* ---------------------- detail card data ----------------------- */

    const detailData: DetailCardData = useMemo(() => {
        const emptyFor = (title: string, hint: string) => ({ emptyTitle: title, emptyHint: hint });

        if (detailSlot === "summary") {
            return { item: null, appearance: "", statValue: null, statLabel: "", perks: [], uniqueEffects: [] };
        }

        if (detailSlot === "weapon") {
            const perks: PerkRow[] = [
                ...perkRowsFromGear(weapon?.perks, draft.weaponSurged),
                ...perkRowsFromGear(model.bondWeaponData?.perks, draft.weaponSurged),
            ];
            const cells = [cellRow(draft.weaponCell1), cellRow(draft.weaponCell2)].filter(
                (row): row is PerkRow => row !== null,
            );
            /* Bonding a weapon to a legendary adds that weapon's innate perk and
               unique effect, so render the bond partner's effects right below the
               legendary ability (falls back to non-surged text like the build page). */
            const bondWeaponData = model.bondWeaponData;
            const uniqueEffects = [
                ...surgeMatchingEffects(weapon?.unique_effects, draft.weaponSurged),
                ...(bondWeaponData !== null
                    ? surgeMatchingEffects(bondWeaponData.unique_effects, draft.weaponSurged).map(
                        effect => `${bondWeaponData.name} (bonded): ${effect}`,
                    )
                    : []),
            ];
            return {
                item: weapon ? { name: weapon.name } : null,
                ...emptyFor("No weapon equipped", "Double-click the weapon card to open the armoury and pick a weapon."),
                appearance: "Default",
                statValue: weapon ? totalPower : null,
                statLabel: "POWER",
                weapon,
                perks: [...perks, ...cells],
                uniqueEffects,
            };
        }

        if (detailSlot === "lantern") {
            const cells = cellRow(draft.lanternCell);
            const ability = (lantern as any)?.lantern_ability;
            const effects: string[] = [];
            if (ability?.hold) {
                effects.push(interpolate(ability.hold, (lantern as any)?.values));
            }
            if (ability?.instant) {
                effects.push(interpolate(ability.instant, (lantern as any)?.values));
            }
            if (lantern?.unique_effects) {
                for (const ue of lantern.unique_effects) {
                    effects.push(ue.description);
                }
            }
            return {
                item: lantern ? { name: lantern.name } : null,
                ...emptyFor("No lantern equipped", "Double-click the lantern half of the second card to choose a lantern."),
                appearance: "Default",
                statValue: null,
                statLabel: "",
                perks: cells ? [cells] : [],
                uniqueEffects: effects,
            };
        }

        if (detailSlot === "omnicell") {
            const effects: string[] = [];
            if (omnicell?.passive) {
                effects.push(interpolate(omnicell.passive, (omnicell as any)?.passive_values));
            }
            if (omnicell?.active) {
                effects.push(interpolate(omnicell.active, (omnicell as any)?.active_values));
            }
            return {
                item: omnicell ? { name: omnicell.name } : null,
                ...emptyFor("No omnicell equipped", "Double-click the omnicell half of the second card to choose an omnicell."),
                appearance: "Default",
                statValue: null,
                statLabel: "",
                perks: [],
                uniqueEffects: effects,
            };
        }

        const consumableIndex: Record<string, 1 | 2 | 3> = {
            consumable1: 1,
            consumable2: 2,
            consumable3: 3,
        };
        if (detailSlot in consumableIndex) {
            const name = consumableNames[consumableIndex[selectedSlot]];
            const consumable = name ? findConsumableByName(name) : null;
            return {
                item: consumable ? { name: consumable.name } : null,
                ...emptyFor("Empty tonic slot", "Double-click this slot to pick a tonic or pylon. The first slot is always the healing flask."),
                appearance: "Default",
                statValue: null,
                statLabel: "",
                perks: [],
                uniqueEffects: consumable ? [consumable.description] : [],
            };
        }

        /* ARMOUR_SLOTS entries carry slot metadata only - resolve the equipped
           piece from the draft so the bottom box lists the armour's perks and
           stats the same way it does for weapons. */
        const slot = ARMOUR_SLOTS.find(entry => entry.id === detailSlot);
        const armour = slot ? findArmourByName(draft[slot.nameKey] ?? "") : null;
        const surged = slot ? draft[slot.surgedKey] : true;
        const perks = perkRowsFromGear(armour?.perks, surged);
        const cells = cellRow(slot ? draft[slot.cellKey] : null);
        return {
            item: armour ? { name: armour.name } : null,
            ...emptyFor(
                `No ${slot?.label?.toLowerCase() ?? "armour"} armour equipped`,
                "Double-click an armour card to browse every piece in the game.",
            ),
            appearance: armour ? "Default" : "",
            statValue: armour
                ? surged
                    ? armour.resistance.powerSurged ?? armour.resistance.base
                    : armour.resistance.base
                : null,
            statLabel: "RESIST",
            armour,
            perks: cells ? [...perks, cells] : perks,
            uniqueEffects: armour ? surgeMatchingEffects(armour.unique_effects, surged) : [],
        };
    }, [detailSlot, weapon, lantern, omnicell, draft, model.bondWeaponData, totalPower, consumableNames]);

    /* ---------------------- right panel data ----------------------- */

    const rightPanel = useMemo(() => {
        if (selectedSlot === "summary" || !detailData.item) {
            return null;
        }

        if (selectedSlot === "weapon") {
            const parts = model.parts;
            const partRows: {
                label: string;
                part: Part | null;
                partKey: "weaponPart1" | "weaponPart2" | "weaponPart3";
            }[] = [];
            if (weapon) {
                if (weapon.type === "Repeater") {
                    partRows.push({ label: "Chamber", part: parts?.chamber ?? null, partKey: "weaponPart1" });
                    partRows.push({ label: "Grip", part: parts?.grip ?? null, partKey: "weaponPart2" });
                    partRows.push({ label: "Mod", part: parts?.mod ?? null, partKey: "weaponPart3" });
                } else {
                    partRows.push({ label: "Special", part: parts?.special ?? null, partKey: "weaponPart1" });
                    partRows.push({ label: "Mod", part: parts?.mod ?? null, partKey: "weaponPart2" });
                }
            }
            const cellSlots = weapon?.cells
                ? Array.isArray(weapon.cells)
                    ? [
                        { key: "weaponCell1" as CellSlotKey, variantName: draft.weaponCell1, allowed: weapon.cells[0] as CellType },
                        { key: "weaponCell2" as CellSlotKey, variantName: draft.weaponCell2, allowed: (weapon.cells[1] ?? weapon.cells[0]) as CellType },
                    ]
                    : [{ key: "weaponCell1" as CellSlotKey, variantName: draft.weaponCell1, allowed: weapon.cells }]
                : [];
            return {
                slotLabel: "Weapon",
                name: weapon?.name ?? "",
                icon: weapon?.icon ?? "",
                item: weapon,
                weapon,
                parts: partRows,
                bond: model.bondWeaponData ? { name: model.bondWeaponData.name, icon: model.bondWeaponData.icon } : null,
                cellSlots,
            };
        }

        if (selectedSlot === "lantern") {
            return {
                slotLabel: "Lantern",
                name: lantern?.name ?? "",
                icon: lantern?.icon ?? "",
                item: lantern,
                lantern,
                parts: [],
                bond: null,
                cellSlots: lantern?.cells
                    ? [{ key: "lanternCell" as CellSlotKey, variantName: draft.lanternCell, allowed: lantern.cells }]
                    : [],
            };
        }

        if (selectedSlot === "omnicell") {
            return {
                slotLabel: "Omnicell",
                name: omnicell?.name ?? "",
                icon: omnicell?.icon ?? "",
                item: omnicell,
                omnicell,
                parts: [],
                bond: null,
                cellSlots: [],
            };
        }

        const consumableIndex: Record<string, 1 | 2 | 3> = { consumable1: 1, consumable2: 2, consumable3: 3 };
        if (selectedSlot in consumableIndex) {
            const name = consumableNames[consumableIndex[selectedSlot]];
            const consumable = name ? findConsumableByName(name) : null;
            return {
                slotLabel: consumable?.type === "pylon" ? "Pylon" : "Tonic",
                name: consumable?.name ?? "",
                icon: consumable?.icon ?? "",
                item: consumable,
                consumable,
                parts: [],
                bond: null,
                cellSlots: [],
            };
        }

        /* Same resolution fix as the detail card: without the equipped piece the
           armour panel could never render its cell slot. */
        const slot = ARMOUR_SLOTS.find(entry => entry.id === selectedSlot);
        const armour = slot ? findArmourByName(draft[slot.nameKey] ?? "") : null;
        return {
            slotLabel: slot?.label ?? "Armour",
            name: armour?.name ?? "",
            icon: armour?.icon ?? "",
            item: armour,
            armour,
            parts: [],
            bond: null,
            cellSlots: slot && armour?.cells
                ? [{ key: slot.cellKey, variantName: draft[slot.cellKey], allowed: armour.cells }]
                : [],
        };
    }, [selectedSlot, detailData.item, weapon, lantern, omnicell, draft, model, consumableNames]);

    /* ---------------------- picker items --------------------------- */

    const picker = useMemo(() => {
        const target = pickerTarget;
        if (!target) {
            return null;
        }

        if (target.kind === "weapon") {
            const items: PickerItem[] = Object.values(gameData.weapons)
                .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
                .map(entry => ({
                    value: entry.name,
                    label: entry.name,
                    icon: entry.icon,
                    group: entry.type,
                    behemoth: entry.behemoth ?? null,
                    hint: entry.elemental ?? undefined,
                    meta: `Power ${entry.power.base}${entry.power.powerSurged ? ` (${entry.power.powerSurged})` : ""}`,
                    color: entry.elemental ? elementColor(entry.elemental) : undefined,
                }));
            return {
                title: "Weapons",
                items,
                selected: draft.weaponName,
                filterLabel: "Element",
                filterValues: ["Blaze", "Frost", "Shock", "Terra", "Radiant", "Umbral"],
                filterOf: (item: PickerItem) => item.hint ?? "",
                apply: (value: string | null) => set("weaponName", value),
            };
        }

        if (target.kind === "armour") {
            const slotName = target.slot[0].toUpperCase() + target.slot.slice(1);
            const items: PickerItem[] = Object.values(gameData.armours)
                .filter(entry => entry.type === slotName)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(entry => ({
                    value: entry.name,
                    label: entry.name,
                    icon: entry.icon,
                    group: `${slotName} Armour`,
                    behemoth: entry.behemoth ?? null,
                    strength: entry.strength ?? null,
                    hint: (entry.perks ?? []).map(perk => `${perk.name} +${perk.value}`).join(", "),
                    meta: `Res ${entry.resistance.base}${entry.resistance.powerSurged ? ` (${entry.resistance.powerSurged})` : ""}`,
                    color: entry.strength ? elementColor(entry.strength) : undefined,
                }));
            return {
                title: `${slotName} Armour`,
                items,
                selected: draft[`${target.slot}Name` as "headName"],
                filterLabel: "Strength",
                filterValues: ["Blaze", "Frost", "Shock", "Terra", "Radiant", "Umbral"],
                filterOf: (item: PickerItem) => item.strength ?? "",
                apply: (value: string | null) => set(`${target.slot}Name` as "headName", value),
            };
        }

        if (target.kind === "lantern") {
            const items: PickerItem[] = Object.values(gameData.lanterns)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(entry => ({
                    value: entry.name,
                    label: entry.name,
                    icon: entry.icon,
                    group: "Lanterns",
                    hint: entry.cells ? `${cellTypeLabel(entry.cells)} cell` : undefined,
                    color: "#e0a33e",
                }));
            return {
                title: "Lanterns",
                items,
                selected: draft.lantern,
                apply: (value: string | null) => set("lantern", value),
            };
        }

        if (target.kind === "omnicell") {
            const items: PickerItem[] = Object.values(gameData.omnicells)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(entry => ({
                    value: entry.name,
                    label: entry.name,
                    icon: entry.icon,
                    group: "Omnicells",
                    color: "#c58bea",
                }));
            return {
                title: "Omnicells",
                items,
                selected: draft.omnicell,
                apply: (value: string | null) => set("omnicell", value),
            };
        }

        if (target.kind === "cell") {
            const allowed = (() => {
                switch (target.cellKey) {
                    case "weaponCell1":
                    case "weaponCell2":
                        return weapon?.cells ?? null;
                    case "headCell":
                        return findArmourByName(draft.headName ?? "")?.cells ?? null;
                    case "torsoCell":
                        return findArmourByName(draft.torsoName ?? "")?.cells ?? null;
                    case "armsCell":
                        return findArmourByName(draft.armsName ?? "")?.cells ?? null;
                    case "legsCell":
                        return findArmourByName(draft.legsName ?? "")?.cells ?? null;
                    case "lanternCell":
                        return lantern?.cells ?? null;
                }
            })();
            /* Sockets are dedicated: socket 1 -> first cell type, socket 2 -> second. */
            const socketIndex = target.cellKey === "weaponCell2" ? 1 : 0;
            const dedicated = dedicatedCellType(allowed, socketIndex);
            const items: PickerItem[] = [];
            for (const cell of Object.values(gameData.cells)) {
                for (const variantName of Object.keys(cell.variants)) {
                    if (!doesCellFitIntoDedicatedSlot(allowed, socketIndex, variantName)) {
                        continue;
                    }
                    const perks = Object.entries(cell.variants[variantName].perks);
                    items.push({
                        value: variantName,
                        label: variantName,
                        icon: `/assets/icons/perks/${cell.slot}.png`,
                        group: cellTypeLabel(cell.slot),
                        hint: perks.map(([name, value]) => `${name} +${value}`).join(", "),
                        color: cellTypeColor(cell.slot),
                    });
                }
            }
            items.sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
            return {
                title: dedicated ? `${dedicated} Cell` : "Cells",
                items,
                selected: draft[target.cellKey],
                apply: (value: string | null) => set(target.cellKey, value),
            };
        }

        if (target.kind === "part") {
            const weaponType = weapon?.type;
            if (!weaponType) {
                return null;
            }
            const partsKey = ({
                "Aether Strikers": "aetherstrikers",
                Axe: "axe",
                "Chain Blades": "chainblades",
                Hammer: "hammer",
                Repeater: "repeater",
                Sword: "sword",
                "War Pike": "warpike",
            } as const)[weaponType];
            const category = gameData.parts[partsKey] as unknown as Record<string, Record<string, Part>>;
            const bucket = category?.[target.bucket] ?? {};
            const items: PickerItem[] = Object.values(bucket)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(part => {
                    const desc =
                        part.description ??
                        (Array.isArray(part.part_effect)
                            ? part.part_effect
                                .map((effect: string) => interpolate(effect, part.values))
                                .join(" ")
                            : "");
                    return {
                        value: part.name,
                        label: part.name,
                        icon: part.icon,
                        group: target.bucket[0].toUpperCase() + target.bucket.slice(1),
                        hint: (part.perks ?? []).map(perk => `${perk.name} +${perk.value}`).join(", "),
                        description: desc,
                        kind: "part",
                    };
                });
            const labelByBucket: Record<string, string> = {
                specials: "Weapon Special",
                mods: "Weapon Mod",
                chambers: "Chamber",
                grips: "Grip",
            };
            return {
                title: labelByBucket[target.bucket] ?? "Weapon Part",
                items,
                selected: draft[target.partKey],
                apply: (value: string | null) => set(target.partKey, value),
            };
        }

        if (target.kind === "bond") {
            const items: PickerItem[] = Object.values(gameData.weapons)
                .filter(
                    candidate =>
                        candidate.elemental === weapon?.elemental &&
                        candidate.type === weapon?.type &&
                        candidate.name !== weapon?.name,
                )
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(candidate => ({
                    value: candidate.name,
                    label: candidate.name,
                    icon: candidate.icon,
                    group: "Bondable Weapons",
                    behemoth: candidate.behemoth ?? null,
                    hint:
                        candidate.perks
                            ?.filter(perk => !(perk.powerSurged ?? false))
                            .map(perk => `${perk.name} +${perk.value}`)
                            .join(", ") || undefined,
                }));
            return {
                title: "Bonded Weapon",
                items,
                selected: draft.bondWeapon,
                apply: (value: string | null) => set("bondWeapon", value),
            };
        }

        /* consumable */
        const items: PickerItem[] = consumableOptions().map(entry => ({
            value: entry.name,
            label: entry.name,
            icon: entry.icon,
            group: entry.type === "tonic" ? "Tonics" : "Pylons",
            hint: entry.description,
            consumableType: entry.type,
            meta: `x${entry.capacity}`,
        }));
        const consumableKey = (`consumable${target.index}` as "consumable1");
        return {
            title: "Tonics & Pylons",
            items,
            selected: draft[consumableKey],
            apply: (value: string | null) => set(consumableKey, value),
        };
    }, [pickerTarget, draft, weapon, lantern, set]);

    /* --------------------------- render ---------------------------- */

    return (
        <LoadoutStage>
            {/* backdrop */}
            <span className="lo-light-shaft" style={{ left: "calc(50% - 260px)" }} aria-hidden />
            <span className="lo-light-shaft" style={{ left: "calc(50% + 90px)" }} aria-hidden />
            <span className="lo-pedestal absolute left-1/2 -translate-x-1/2" style={{ top: 540, width: 540, height: 190 }} aria-hidden />
            <span
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(130% 100% at 50% 40%, transparent 55%, rgba(4,5,7,0.55) 100%)" }}
                aria-hidden
            />

            {/* reserved slayer slot hook - intentionally empty for now */}
            <span data-slayer-slot="" className="absolute left-1/2 -translate-x-1/2" aria-hidden />

            {/* nameplate */}
            <div className="absolute left-1/2 top-[46px] -translate-x-1/2 text-center">
                <input
                    type="text"
                    value={draft.buildName}
                    onChange={event => setDraft(previous => ({ ...previous, buildName: event.target.value.slice(0, 24) }))}
                    aria-label="Build name"
                    className="lo-serif w-[420px] bg-transparent text-center text-[40px] font-semibold tracking-[0.14em] text-[#e8e4da] outline-none transition-colors focus:text-white/95 hover:text-[#f5f1e8] focus-visible:text-[#e0a33e]"
                    style={{ textShadow: "0 2px 14px rgba(0,0,0,0.8)" }}
                    spellCheck={false}
                />
                <p className="mt-[6px] text-[13px] font-semibold normal-case tracking-[0.28em] text-[var(--lo-gold)]">
                    MYSTIC PARADOX
                </p>
            </div>

            {/* left column */}
            <div className="absolute left-[40px] top-[128px] grid grid-cols-2 gap-[14px]">
                <WeaponCard
                    weapon={weapon}
                    surged={draft.weaponSurged}
                    selected={selectedSlot === "weapon"}
                    onSelect={() => selectSlot("weapon")}
                    onOpenPicker={() => setPickerTarget({ kind: "weapon" })}
                />
                <LanternOmnicellCard
                    lantern={lantern}
                    omnicell={omnicell}
                    selectedSlot={selectedSlot}
                    onSelect={slot => selectSlot(slot)}
                    onOpenPicker={target => setPickerTarget({ kind: target })}
                />
                {ARMOUR_SLOTS.slice(0, 2).map(slot => (
                    <ArmourCard
                        key={slot.id}
                        slot={slot.id}
                        armour={draft[slot.nameKey] ? findArmourByName(draft[slot.nameKey]!) : null}
                        surged={draft[slot.surgedKey]}
                        selected={selectedSlot === slot.id}
                        onSelect={() => selectSlot(slot.id)}
                        onOpenPicker={() => setPickerTarget({ kind: "armour", slot: slot.id })}
                    />
                ))}
                {ARMOUR_SLOTS.slice(2).map(slot => (
                    <ArmourCard
                        key={slot.id}
                        slot={slot.id}
                        armour={draft[slot.nameKey] ? findArmourByName(draft[slot.nameKey]!) : null}
                        surged={draft[slot.surgedKey]}
                        selected={selectedSlot === slot.id}
                        onSelect={() => selectSlot(slot.id)}
                        onOpenPicker={() => setPickerTarget({ kind: "armour", slot: slot.id })}
                    />
                ))}
            </div>

            <div className="absolute left-[40px] top-[782px]">
                <ConsumableRow
                    consumableNames={consumableNames}
                    selectedSlot={selectedSlot}
                    onSelect={slot => selectSlot(slot)}
                    onOpenPicker={index => setPickerTarget({ kind: "consumable", index })}
                    findConsumable={name => (name ? findConsumableByName(name) : null)}
                />
            </div>

            {/* center detail card */}
            {(
                <div className="absolute left-1/2 top-[610px] -translate-x-1/2 h-[395px] w-[710px] border border-[#3a3f47]/70 bg-[rgba(13,16,20,0.72)] p-[20px] backdrop-blur-[2px]">
                    <DetailCard data={detailData} />
                </div>
            )}

            {/* right panel */}
            <div className="absolute right-[40px] top-[64px] w-[440px]">
                <CrestHeader power={totalPower} resistance={totalResistance} />
                <FlourishHeader
                    title={rightPanel ? rightPanel.slotLabel : "Perk Summary"}
                    className="mt-[18px]"
                />
                <div className="mt-[14px]">
                    {rightPanel ? (
                        <ItemDetailPanel
                            data={rightPanel}
                            cellSlots={rightPanel.cellSlots}
                            selectedCellKey={null}
                            onCellClick={key => setPickerTarget({ kind: "cell", cellKey: key })}
                            onPartClick={partKey => {
                                const weaponType = weapon?.type;
                                if (!weaponType) {
                                    return;
                                }
                                const bucket =
                                    weaponType === "Repeater"
                                        ? partKey === "weaponPart1"
                                            ? "chambers"
                                            : partKey === "weaponPart2"
                                                ? "grips"
                                                : "mods"
                                        : partKey === "weaponPart1"
                                            ? "specials"
                                            : "mods";
                                setPickerTarget({ kind: "part", partKey, bucket });
                            }}
                            onBondClick={() => setPickerTarget({ kind: "bond" })}
                        />
                    ) : (
                        <PerkSummaryPanel perkTotals={view?.perkTotals ?? []} />
                    )}
                </div>
            </div>

            {/* bottom bar */}
            <div className="absolute inset-x-0 bottom-0 flex h-[75px] items-center border-t border-[#3a3f47]/60 bg-gradient-to-t from-[rgba(6,7,8,0.9)] to-transparent px-[60px]">
                <div className="flex items-center gap-[56px]">
                    <button
                        type="button"
                        onClick={copyShareLink}
                        disabled={!buildId || !hasAnyItem(draft)}
                        className="lo-button-text flex items-center gap-2"
                    >
                        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                        COPY
                    </button>
                    <button type="button" onClick={randomize} className="lo-button-text flex items-center gap-2">
                        <Dices className="h-4 w-4" aria-hidden />
                        RANDOMIZE
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setDraft(previous => ({ ...EMPTY_DRAFT, buildName: previous.buildName }));
                            selectSlot("weapon");
                        }}
                        disabled={!hasAnyItem(draft)}
                        className="lo-button-text flex items-center gap-2"
                    >
                        <Eraser className="h-4 w-4" aria-hidden />
                        RESET
                    </button>
                    <button
                        type="button"
                        onClick={() => setImportOpen(true)}
                        className="lo-button-text flex items-center gap-2"
                    >
                        <Link2 className="h-4 w-4" aria-hidden />
                        IMPORT
                    </button>
                </div>
            </div>

            {/* picker overlay */}
            {picker && pickerTarget && (
                <ItemPickerOverlay
                    title={picker.title}
                    items={picker.items}
                    selectedValue={picker.selected}
                    onSelect={picker.apply}
                    onClose={() => setPickerTarget(null)}
                    filterLabel={picker.filterLabel}
                    filterValues={picker.filterValues}
                    filterOf={picker.filterOf}
                    armourSlot={pickerTarget.kind === "armour" ? pickerTarget.slot : undefined}
                    onSwitchArmourSlot={(slot) => {
                        setSelectedSlot(slot);
                        setPickerTarget({ kind: "armour", slot });
                    }}
                    pickerKind={pickerTarget.kind}
                />
            )}

            {/* import overlay */}
            {importOpen && (
                <div
                    className="lo-picker-backdrop lo-overlay-in absolute inset-0 z-50 flex items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Import a build"
                >
                    <div className="lo-panel lo-fade-in w-[640px] p-[28px]">
                        <FlourishHeader title="Import Build" />
                        <p className="mt-4 text-[14px] leading-relaxed text-[#9a9a94]">
                            Paste a Mystic Builder link ({"« /b/… »"}) or a raw build id. Links from the original
                            Dauntless Builder are upgraded automatically.
                        </p>
                        <input
                            type="text"
                            autoFocus
                            value={importValue}
                            onChange={event => setImportValue(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === "Enter") {
                                    importBuild();
                                }
                                if (event.key === "Escape") {
                                    setImportOpen(false);
                                }
                            }}
                            placeholder="https://builder.mysticparadox.com/b/…"
                            className="lo-card mt-5 h-[46px] w-full px-4 text-[15px] text-[#e8e4da] placeholder:text-[#7c828c] focus:outline-none focus-visible:shadow-[0_0_0_1px_#e0a33e]"
                            aria-label="Build link or id"
                        />
                        <div className="mt-6 flex items-center justify-between">
                            <DiamondPip size={9} color="#6f7783" />
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setImportOpen(false)}
                                    className="lo-button-text !text-[15px]"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="button"
                                    onClick={importBuild}
                                    className="lo-button-text !text-[15px] !text-[#e0a33e]"
                                >
                                    LOAD BUILD
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </LoadoutStage>
    );
};

export default LoadoutScreen;
