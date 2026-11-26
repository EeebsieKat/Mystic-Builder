"use client";

/**
 * Full-screen game-style inventory overlay used to pick weapons, armour,
 * lanterns, omnicells, cells, parts and consumables. Big icon grid grouped by
 * category with search, an optional facet filter rail, and keyboard
 * navigation (arrows / Enter / Escape).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { ConsumableGlyph, DiamondPip, ItemIcon } from "./decor";
import type { ArmourSlotId } from "./loadout-types";
import { interpolate } from "./loadout-types";
import { elementColor, getTextGlowStyle } from "@/lib/site";
import { highlightGameText } from "@/lib/game-text-highlighter";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { gameData } from "@/game/data";
import type { Armour, CellType, Lantern, Omnicell, Weapon } from "@/game/types";

export interface PickerItem {
    value: string;
    label: string;
    icon: string | null;
    group: string;
    hint?: string;
    meta?: string;
    description?: string;
    consumableType?: "flask" | "tonic" | "pylon";
    color?: string;
    behemoth?: string | null;
    strength?: string | null;
    elemental?: string | null;
    kind?: "weapon" | "armour" | "lantern" | "omnicell" | "cell" | "part" | "bond" | "consumable";
}

export const ARMOUR_SLOT_TABS: { id: ArmourSlotId; label: string; icon: string }[] = [
    { id: "head", label: "Head", icon: "/assets/icons/generic/Head.png" },
    { id: "torso", label: "Torso", icon: "/assets/icons/generic/Torso.png" },
    { id: "arms", label: "Arms (Hands)", icon: "/assets/icons/generic/Arms.png" },
    { id: "legs", label: "Legs", icon: "/assets/icons/generic/Legs.png" },
];

export const WEAPON_CLASS_TABS: { id: string; label: string; icon: string }[] = [
    { id: "all", label: "All Weapons", icon: "/assets/icons/generic/Weapon.png" },
    { id: "Aether Strikers", label: "Aether Strikers", icon: "/assets/icons/generic/AetherStrikers.png" },
    { id: "Axe", label: "Axe", icon: "/assets/icons/generic/Axe.png" },
    { id: "Chain Blades", label: "Chain Blades", icon: "/assets/icons/generic/ChainBlades.png" },
    { id: "Hammer", label: "Hammer", icon: "/assets/icons/generic/Hammer.png" },
    { id: "Repeater", label: "Repeaters", icon: "/assets/icons/generic/Repeater.png" },
    { id: "Sword", label: "Sword", icon: "/assets/icons/generic/Sword.png" },
    { id: "War Pike", label: "War Pike", icon: "/assets/icons/generic/WarPike.png" },
];

export interface ItemPickerProps {
    title: string;
    items: PickerItem[];
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
    onClose: () => void;
    allowClear?: boolean;
    filterLabel?: string;
    filterValues?: string[];
    filterOf?: (item: PickerItem) => string;
    armourSlot?: ArmourSlotId;
    onSwitchArmourSlot?: (slot: ArmourSlotId) => void;
    pickerKind?: "weapon" | "armour" | "lantern" | "omnicell" | "cell" | "part" | "bond" | "consumable";
}

/* ------------------------------------------------------------------ */
/* Rich Hover Card / Tooltip Content Component                        */
/* ------------------------------------------------------------------ */

const ItemPickerTooltipContent = ({
    item,
    pickerKind,
}: {
    item: PickerItem;
    pickerKind?: "weapon" | "armour" | "lantern" | "omnicell" | "cell" | "part" | "bond" | "consumable";
}) => {
    // 1. Omnicell (Matches Image 3)
    const isOmnicell =
        pickerKind === "omnicell" ||
        item.group === "Omnicells" ||
        Boolean((gameData.omnicells as Record<string, Omnicell>)[item.value]);

    if (isOmnicell) {
        const omnicell =
            (gameData.omnicells as Record<string, Omnicell>)[item.value] ||
            Object.values(gameData.omnicells as Record<string, Omnicell>).find(
                o => o.name.toLowerCase() === item.value.toLowerCase(),
            );
        if (omnicell) {
            const passiveText = interpolate(omnicell.passive, omnicell.passive_values);
            const activeText = interpolate(omnicell.active, omnicell.active_values);

            return (
                <div className="flex flex-col gap-3.5 text-left">
                    {/* Passive Ability */}
                    <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 shrink-0 rounded-lg border border-[#3a3f47]/70 bg-[#0d121d] p-1 flex items-center justify-center shadow-inner">
                            <ItemIcon icon={omnicell.icon} alt={omnicell.name} size={30} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-bold text-[#f5f1e8] leading-tight">{omnicell.name}</h4>
                            <p className="text-[12px] text-[#cfcfc9] mt-1 leading-relaxed">
                                <strong className="text-[#f5f1e8] font-semibold">Passive: </strong>
                                {highlightGameText(passiveText)}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-[#3a3f47]/50" />

                    {/* Active Ability */}
                    <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 shrink-0 rounded-lg border border-[#e0a33e]/30 bg-[#e0a33e]/10 p-1 flex items-center justify-center shadow-inner">
                            <ItemIcon
                                icon={omnicell.ability_icon || omnicell.icon}
                                alt={`${omnicell.name} Active`}
                                size={30}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-bold text-[#f5f1e8] leading-tight">
                                {omnicell.name} Active Ability
                            </h4>
                            <p className="text-[12px] text-[#cfcfc9] mt-1 leading-relaxed">
                                <strong className="text-[#f5f1e8] font-semibold">Active: </strong>
                                {highlightGameText(activeText)}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // 2. Armour
    const isArmour =
        pickerKind === "armour" ||
        item.group.includes("Armour") ||
        Boolean((gameData.armours as Record<string, Armour>)[item.value]);

    if (isArmour) {
        const armour =
            (gameData.armours as Record<string, Armour>)[item.value] ||
            Object.values(gameData.armours as Record<string, Armour>).find(
                a => a.name.toLowerCase() === item.value.toLowerCase(),
            );
        if (armour) {
            const surgedPerk = armour.perks?.find(p => p.powerSurged) || armour.perks?.[0];
            const perkDef = surgedPerk ? (gameData.perks as Record<string, any>)[surgedPerk.name] : null;
            const perkTier = surgedPerk ? Math.min(6, Math.max(1, surgedPerk.value)) : null;
            const perkEffect =
                perkTier && perkDef?.effects?.[String(perkTier)]
                    ? interpolate(perkDef.effects[String(perkTier)].description, perkDef.effects[String(perkTier)].values)
                    : perkDef?.description;

            const cellSlot = armour.cells ? (Array.isArray(armour.cells) ? armour.cells[0] : armour.cells) : null;
            const uniqueEffect = armour.unique_effects?.find(e => e.powerSurged) || armour.unique_effects?.[0];
            const uniqueEffectText = uniqueEffect ? interpolate(uniqueEffect.description, uniqueEffect.values) : null;

            return (
                <div className="flex flex-col gap-3 text-left">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                        <div className="relative h-11 w-11 shrink-0 rounded-lg border border-[#3a3f47]/70 bg-[#0d121d] p-1 flex items-center justify-center">
                            <ItemIcon icon={armour.icon} alt={armour.name} size={36} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h4
                                    className="text-[14px] font-bold leading-tight"
                                    style={getTextGlowStyle(armour.strength ? elementColor(armour.strength) : "#f5f1e8")}
                                >
                                    {armour.name}
                                </h4>
                                <span className="rounded-[3px] border border-[#3a3f47] bg-[#141a24] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[#dcd8cc]">
                                    {armour.type}
                                </span>
                            </div>
                            {armour.behemoth ? (
                                <p className="text-[11.5px] text-[#9a9a94] mt-0.5">
                                    Crafted from <span className="font-semibold text-[#e0c287]">{armour.behemoth}</span>
                                </p>
                            ) : (
                                <p className="text-[11.5px] text-[#9a9a94] mt-0.5">{armour.type} Armour</p>
                            )}
                        </div>
                    </div>

                    {/* Lore quote if present */}
                    {armour.description && (
                        <p className="text-[11.5px] italic text-[#9a9a94] border-l-2 border-[#e0a33e]/50 pl-2 leading-snug">
                            {interpolate(armour.description, {
                                typeAlt: armour.type.toLowerCase(),
                                behemoth: armour.behemoth ?? "",
                                name: armour.name,
                            })}
                        </p>
                    )}

                    {/* Stats row: Defence, Strength, Weakness, Cell Socket */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="rounded-[4px] border border-[#3a3f47] bg-[#141a24] px-2 py-0.5 text-[11px] font-bold text-[#e8e4da]">
                            +{armour.resistance?.base ?? 25} Defence{armour.resistance?.powerSurged ? ` (${armour.resistance.powerSurged} Surged)` : ""}
                        </span>

                        {armour.strength && (
                            <div
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold border"
                                style={{
                                    borderColor: `${elementColor(armour.strength)}70`,
                                    backgroundColor: `${elementColor(armour.strength)}18`,
                                    color: elementColor(armour.strength),
                                }}
                            >
                                <ItemIcon icon={`/assets/icons/elements/${armour.strength}.png`} alt="" size={13} />
                                <span>+{armour.strength}</span>
                            </div>
                        )}

                        {armour.weakness && (
                            <div
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold border"
                                style={{
                                    borderColor: `${elementColor(armour.weakness)}40`,
                                    backgroundColor: `${elementColor(armour.weakness)}10`,
                                    color: elementColor(armour.weakness),
                                }}
                            >
                                <ItemIcon icon={`/assets/icons/elements/${armour.weakness}.png`} alt="" size={13} />
                                <span className="opacity-80">-{armour.weakness}</span>
                            </div>
                        )}

                        {cellSlot && (
                            <div className="flex items-center gap-1.5 ml-auto">
                                <ItemIcon icon={`/assets/icons/perks/${cellSlot}.png`} alt="" size={15} />
                                <span className="text-[11px] text-[#b9bcc2] font-semibold">{cellSlot} Slot</span>
                            </div>
                        )}
                    </div>

                    {/* Inherent Perk */}
                    {surgedPerk && (
                        <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.07] p-2.5 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1 tracking-wider">
                                    <DiamondPip size={6} color="#fbbf24" />
                                    Inherent Perk
                                </span>
                                <span className="rounded-full border border-amber-400/50 bg-amber-400/20 px-2 py-0 text-[10.5px] font-bold text-amber-300">
                                    +{surgedPerk.value} {surgedPerk.name}
                                </span>
                            </div>
                            {perkEffect && (
                                <p className="text-[12px] text-[#cfcfc9] leading-relaxed mt-0.5">
                                    {highlightGameText(perkEffect)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Unique Effect */}
                    {uniqueEffectText && (
                        <div className="rounded-lg border border-[#e0a33e]/30 bg-[#e0a33e]/[0.08] p-2.5 flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-[#e0a33e] flex items-center gap-1 tracking-wider">
                                <DiamondPip size={6} color="#e0a33e" />
                                Unique Effect
                            </span>
                            <p className="text-[12px] text-[#e8e4da] leading-relaxed">
                                {highlightGameText(uniqueEffectText)}
                            </p>
                        </div>
                    )}
                </div>
            );
        }
    }

    // 3. Weapon
    const isWeapon =
        pickerKind === "weapon" ||
        Boolean((gameData.weapons as Record<string, Weapon>)[item.value]);

    if (isWeapon) {
        const weapon =
            (gameData.weapons as Record<string, Weapon>)[item.value] ||
            Object.values(gameData.weapons as Record<string, Weapon>).find(
                w => w.name.toLowerCase() === item.value.toLowerCase(),
            );
        if (weapon) {
            const surgedPerk = weapon.perks?.find(p => p.powerSurged) || weapon.perks?.[0];
            const perkDef = surgedPerk ? (gameData.perks as Record<string, any>)[surgedPerk.name] : null;
            const perkTier = surgedPerk ? Math.min(6, Math.max(1, surgedPerk.value)) : null;
            const perkEffect =
                perkTier && perkDef?.effects?.[String(perkTier)]
                    ? interpolate(perkDef.effects[String(perkTier)].description, perkDef.effects[String(perkTier)].values)
                    : perkDef?.description;

            const cellsList: CellType[] = Array.isArray(weapon.cells)
                ? (weapon.cells.filter(Boolean) as CellType[])
                : weapon.cells
                    ? [weapon.cells]
                    : [];

            return (
                <div className="flex flex-col gap-3 text-left">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                        <div
                            className="relative h-11 w-11 shrink-0 rounded-lg border bg-[#0d121d] p-1 flex items-center justify-center"
                            style={{
                                borderColor: weapon.elemental ? `${elementColor(weapon.elemental)}60` : "#3a3f47",
                            }}
                        >
                            <ItemIcon icon={weapon.icon} alt={weapon.name} size={36} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h4
                                    className="text-[14px] font-bold leading-tight"
                                    style={getTextGlowStyle(weapon.elemental ? elementColor(weapon.elemental) : "#f5f1e8")}
                                >
                                    {weapon.name}
                                </h4>
                                <span className="rounded-md border border-[#e0a33e]/50 bg-[#e0a33e]/15 px-1.5 py-0.2 text-[9.5px] font-bold text-[#e0a33e]">
                                    Power {weapon.power?.base ?? 100}{weapon.power?.powerSurged ? ` (${weapon.power.powerSurged} Surged)` : ""}
                                </span>
                            </div>
                            <p className="text-[11.5px] text-[#9a9a94] mt-0.5">
                                {weapon.type}{" "}
                                {weapon.behemoth ? (
                                    <>
                                        • Crafted from <span className="font-semibold text-[#e0c287]">{weapon.behemoth}</span>
                                    </>
                                ) : (
                                    ""
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Lore quote if present */}
                    {weapon.description && (
                        <p className="text-[11.5px] italic text-[#9a9a94] border-l-2 border-[#e0a33e]/50 pl-2 leading-snug">
                            {interpolate(weapon.description, {
                                typeAlt: weapon.type.toLowerCase(),
                                behemoth: weapon.behemoth ?? "",
                                name: weapon.name,
                            })}
                        </p>
                    )}

                    {/* Stats row: Element, Power, Damage class, Cell Sockets */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        {weapon.elemental ? (
                            <div
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold border"
                                style={{
                                    borderColor: `${elementColor(weapon.elemental)}70`,
                                    backgroundColor: `${elementColor(weapon.elemental)}18`,
                                    color: elementColor(weapon.elemental),
                                }}
                            >
                                <ItemIcon icon={`/assets/icons/elements/${weapon.elemental}.png`} alt="" size={13} />
                                <span>{weapon.elemental}</span>
                            </div>
                        ) : (
                            <span className="rounded-[4px] border border-[#3a3f47] bg-[#141a24] px-1.5 py-0.5 text-[10.5px] font-bold text-[#9a9a94]">
                                Neutral
                            </span>
                        )}

                        {weapon.damage && (
                            <span className="rounded-[4px] border border-[#3a3f47] bg-[#141a24] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#b9bcc2]">
                                {weapon.damage}
                            </span>
                        )}

                        {cellsList.length > 0 && (
                            <div className="flex items-center gap-1 ml-auto">
                                <span className="text-[10px] text-[#84888f] font-medium">Slots:</span>
                                {cellsList.map((slot, idx) => (
                                    <ItemIcon key={idx} icon={`/assets/icons/perks/${slot}.png`} alt={slot} size={15} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Inherent Perk */}
                    {surgedPerk && (
                        <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.07] p-2.5 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1 tracking-wider">
                                    <DiamondPip size={6} color="#fbbf24" />
                                    Inherent Perk
                                </span>
                                <span className="rounded-full border border-amber-400/50 bg-amber-400/20 px-2 py-0 text-[10.5px] font-bold text-amber-300">
                                    +{surgedPerk.value} {surgedPerk.name}
                                </span>
                            </div>
                            {perkEffect && (
                                <p className="text-[12px] text-[#cfcfc9] leading-relaxed mt-0.5">
                                    {highlightGameText(perkEffect)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Unique Effects */}
                    {weapon.unique_effects?.map((effect, idx) => {
                        const effectText = interpolate(effect.description, effect.values);
                        return (
                            <div
                                key={idx}
                                className="rounded-lg border border-[#e0a33e]/30 bg-[#e0a33e]/[0.08] p-2.5 flex flex-col gap-1"
                            >
                                <span className="text-[10px] uppercase font-bold text-[#e0a33e] flex items-center gap-1 tracking-wider">
                                    <DiamondPip size={6} color="#e0a33e" />
                                    {effect.name || "Unique Weapon Effect"}
                                </span>
                                <p className="text-[12px] text-[#e8e4da] leading-relaxed">
                                    {highlightGameText(effectText)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            );
        }
    }

    // 4. Lantern
    const isLantern =
        pickerKind === "lantern" ||
        item.group === "Lanterns" ||
        Boolean((gameData.lanterns as Record<string, Lantern>)[item.value]);

    if (isLantern) {
        const lantern =
            (gameData.lanterns as Record<string, Lantern>)[item.value] ||
            Object.values(gameData.lanterns as Record<string, Lantern>).find(
                l => l.name.toLowerCase() === item.value.toLowerCase(),
            );
        if (lantern) {
            const instantText = lantern.lantern_ability?.instant
                ? interpolate(lantern.lantern_ability.instant, lantern.values)
                : null;
            const holdText = lantern.lantern_ability?.hold
                ? interpolate(lantern.lantern_ability.hold, lantern.values)
                : null;

            return (
                <div className="flex flex-col gap-2.5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 shrink-0 rounded-lg border border-[#3a3f47]/70 bg-[#0d121d] p-1 flex items-center justify-center">
                            <ItemIcon icon={lantern.icon} alt={lantern.name} size={30} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-bold text-[#f5f1e8] leading-tight">{lantern.name}</h4>
                            <span className="text-[10.5px] uppercase font-bold text-[#e0a33e] tracking-wider">
                                Lantern Ability
                            </span>
                        </div>
                    </div>

                    {instantText && (
                        <p className="text-[12px] text-[#cfcfc9] leading-relaxed">
                            <strong className="text-[#f5f1e8] font-semibold">Instant (Tap): </strong>
                            {highlightGameText(instantText)}
                        </p>
                    )}

                    {holdText && (
                        <p className="text-[12px] text-[#cfcfc9] leading-relaxed">
                            <strong className="text-[#f5f1e8] font-semibold">Hold: </strong>
                            {highlightGameText(holdText)}
                        </p>
                    )}
                </div>
            );
        }
    }

    // 5. Default Fallback (Cells, Consumables, Parts)
    return (
        <div className="flex flex-col gap-2 text-left">
            <div className="flex items-start gap-3">
                <div className="relative h-9 w-9 shrink-0 rounded-lg border border-[#3a3f47]/70 bg-[#0d121d] p-1 flex items-center justify-center">
                    {item.icon ? (
                        <ItemIcon icon={item.icon} alt={item.label} size={28} />
                    ) : item.consumableType ? (
                        <ConsumableGlyph type={item.consumableType} size={28} />
                    ) : null}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-[#f5f1e8] leading-tight">{item.label}</h4>
                    <span className="text-[10.5px] uppercase font-bold text-[#b9bcc2] tracking-wider">
                        {item.group}
                    </span>
                </div>
            </div>
            {item.behemoth && (
                <p className="text-[11.5px] text-[#9a9a94]">
                    Crafted from <span className="font-semibold text-[#e0c287]">{item.behemoth}</span>
                </p>
            )}
            {item.description && (
                <p className="text-[12px] text-[#cfcfc9] leading-relaxed">
                    {highlightGameText(item.description)}
                </p>
            )}
            {item.hint && !item.description && (
                <p className="text-[12px] text-[#cfcfc9] leading-relaxed">
                    {highlightGameText(item.hint)}
                </p>
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Item Picker Overlay                                                */
/* ------------------------------------------------------------------ */

const NORMALIZE = (text: string): string => text.toLowerCase();

export const ItemPickerOverlay = ({
    title,
    items,
    selectedValue,
    onSelect,
    onClose,
    allowClear = true,
    filterLabel,
    filterValues,
    filterOf,
    armourSlot,
    onSwitchArmourSlot,
    pickerKind,
}: ItemPickerProps) => {
    const isWeaponPicker = pickerKind === "weapon" || (!pickerKind && title.toLowerCase() === "weapon");
    const [weaponClass, setWeaponClass] = useState<string>("all");
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<string | null>(null);
    const [navIndex, setNavIndex] = useState<number | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        const needle = NORMALIZE(query.trim());
        return items.filter(item => {
            // Weapon class filter
            if (isWeaponPicker && weaponClass !== "all") {
                const matchesClass =
                    item.group === weaponClass ||
                    (weaponClass === "Repeater" && (item.group === "Repeater" || item.group === "Repeaters"));
                if (!matchesClass) {
                    return false;
                }
            }
            if (filter && filterOf && filterOf(item) !== filter) {
                return false;
            }
            if (needle === "") {
                return true;
            }
            return (
                NORMALIZE(item.label).includes(needle) ||
                NORMALIZE(item.group).includes(needle) ||
                (item.behemoth ? NORMALIZE(item.behemoth).includes(needle) : false) ||
                (item.hint ? NORMALIZE(item.hint).includes(needle) : false)
            );
        });
    }, [items, query, filter, filterOf, isWeaponPicker, weaponClass]);

    const grouped = useMemo(() => {
        const map = new Map<string, PickerItem[]>();
        for (const item of filtered) {
            const list = map.get(item.group) ?? [];
            list.push(item);
            map.set(item.group, list);
        }
        return [...map.entries()];
    }, [filtered]);

    const flat = useMemo(() => grouped.flatMap(([, list]) => list), [grouped]);

    /* Derived active index: user navigation wins, otherwise the selected item. */
    const selectedIndex = useMemo(
        () => flat.findIndex(item => item.value === selectedValue),
        [flat, selectedValue],
    );
    const activeIndex = navIndex ?? (selectedIndex >= 0 ? selectedIndex : 0);

    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    useEffect(() => {
        const node = gridRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
        node?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    const commit = (value: string | null) => {
        onSelect(value);
        onClose();
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Escape") {
            event.preventDefault();
            onClose();
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            setNavIndex(index => Math.min(flat.length - 1, (index ?? activeIndex) + 1));
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            setNavIndex(index => Math.max(0, (index ?? activeIndex) - 1));
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setNavIndex(index => Math.min(flat.length - 1, (index ?? activeIndex) + 3));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setNavIndex(index => Math.max(0, (index ?? activeIndex) - 3));
        } else if (event.key === "Enter") {
            event.preventDefault();
            const item = flat[activeIndex];
            if (item) {
                commit(item.value);
            }
        }
    };

    let runningIndex = -1;

    return (
        <div
            className="lo-picker-backdrop lo-overlay-in fixed inset-0 z-50 lg:top-14 flex flex-col outline-none"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} picker`}
            onKeyDown={onKeyDown}
            tabIndex={-1}
        >
            {/* header: cleaned up without upper slot switcher */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 lg:gap-6 border-b border-[#3a3f47] bg-[rgba(10,12,16,0.92)] px-3.5 py-3 sm:px-6 lg:px-[56px] lg:py-[16px]">
                <span className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
                    <DiamondPip size={8} color="#bfae85" />
                    <span className="lo-serif text-base sm:text-[22px] lg:text-[24px] font-semibold tracking-[0.14em] sm:tracking-[0.16em] text-[#dcd8cc] truncate">
                        {title.toUpperCase()}
                    </span>
                </span>

                <div className="relative order-last w-full sm:order-none sm:ml-auto sm:w-[260px] lg:w-[380px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c828c]" aria-hidden />
                    <input
                        ref={searchRef}
                        type="text"
                        value={query}
                        onChange={event => {
                            setQuery(event.target.value);
                            setNavIndex(null);
                        }}
                        placeholder={`Search ${title.toLowerCase()}…`}
                        aria-label={`Search ${title}`}
                        className="lo-card h-[40px] sm:h-[42px] w-full rounded-[4px] pl-10 pr-4 text-[14px] sm:text-[15px] text-[#e8e4da] placeholder:text-[#7c828c] focus:outline-none focus-visible:shadow-[0_0_0_1px_#e0a33e]"
                    />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close picker (Escape)"
                    className="lo-card ml-auto sm:ml-0 flex h-[38px] w-[38px] sm:h-[42px] sm:w-[42px] shrink-0 items-center justify-center text-[#9a9a94] transition-colors hover:text-[#e0a33e]"
                >
                    <X className="h-5 w-5" aria-hidden />
                </button>
            </div>

            {/* body */}
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                {/* filter rail */}
                {((filterValues && filterValues.length > 0) || (armourSlot && onSwitchArmourSlot) || isWeaponPicker) && (
                    <nav className="flex shrink-0 flex-row items-center gap-2 overflow-x-auto border-b border-[#3a3f47] bg-[rgba(8,10,13,0.85)] px-3 py-2 lg:w-[200px] lg:flex-col lg:items-stretch lg:gap-[6px] lg:overflow-x-visible lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-[16px]" aria-label={filterLabel}>
                        {/* Armour slot switcher in rail */}
                        {armourSlot && onSwitchArmourSlot && (
                            <div className="flex shrink-0 flex-row items-center gap-1.5 lg:mb-4 lg:flex-col lg:items-stretch lg:gap-[4px] lg:border-b lg:border-[#3a3f47]/70 lg:pb-3">
                                <span className="lo-sublabel hidden lg:block lg:mb-1">ARMOUR PIECE</span>
                                {ARMOUR_SLOT_TABS.map(slot => {
                                    const isActive = armourSlot === slot.id;
                                    return (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            onClick={() => {
                                                setQuery("");
                                                setNavIndex(null);
                                                onSwitchArmourSlot(slot.id);
                                            }}
                                            aria-pressed={isActive}
                                            className={`lo-perk-row flex shrink-0 items-center gap-2 whitespace-nowrap px-2.5 py-1.5 lg:px-[12px] lg:py-[8px] text-left text-xs lg:text-[13px] font-semibold tracking-[0.04em] cursor-pointer transition-all ${
                                                isActive
                                                    ? "!border-[#e0a33e] text-[#e0a33e] bg-[#e0a33e]/15 shadow-[0_0_8px_rgba(224,163,62,0.25)]"
                                                    : "text-[#b9bcc2] hover:text-white hover:bg-white/[0.03]"
                                            }`}
                                        >
                                            <ItemIcon icon={slot.icon} alt="" size={18} />
                                            <span>{slot.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Weapon class switcher in rail */}
                        {isWeaponPicker && (
                            <div className="flex shrink-0 flex-row items-center gap-1.5 border-r border-[#3a3f47]/70 pr-2.5 lg:mb-4 lg:flex-col lg:items-stretch lg:gap-[4px] lg:border-b lg:border-r-0 lg:border-[#3a3f47]/70 lg:pb-3 lg:pr-0">
                                <span className="lo-sublabel hidden lg:block lg:mb-1">WEAPON CLASS</span>
                                {WEAPON_CLASS_TABS.map(tab => {
                                    const isActive = weaponClass === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => {
                                                setWeaponClass(tab.id);
                                                setNavIndex(null);
                                            }}
                                            aria-pressed={isActive}
                                            className={`lo-perk-row flex shrink-0 items-center gap-2 whitespace-nowrap px-2.5 py-1.5 lg:px-[12px] lg:py-[8px] text-left text-xs lg:text-[13px] font-semibold tracking-[0.04em] cursor-pointer transition-all ${
                                                isActive
                                                    ? "!border-[#e0a33e] text-[#e0a33e] bg-[#e0a33e]/15 shadow-[0_0_8px_rgba(224,163,62,0.25)]"
                                                    : "text-[#b9bcc2] hover:text-white hover:bg-white/[0.03]"
                                            }`}
                                        >
                                            <ItemIcon icon={tab.icon} alt="" size={18} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {filterValues && filterValues.length > 0 && (
                            <div className="flex shrink-0 flex-row items-center gap-1.5 lg:flex-col lg:items-stretch lg:gap-[6px]">
                                <span className="lo-sublabel hidden lg:block lg:mb-1">{(filterLabel ?? "Filter").toUpperCase()}</span>
                                <button
                                    type="button"
                                    onClick={() => setFilter(null)}
                                    aria-pressed={filter === null}
                                    className={`lo-perk-row shrink-0 whitespace-nowrap px-2.5 py-1.5 lg:px-[12px] lg:py-[8px] text-left text-xs lg:text-[13.5px] font-semibold tracking-[0.04em] ${
                                        filter === null ? "!border-[#e0a33e] text-[#e0a33e]" : "text-[#b9bcc2]"
                                    }`}
                                >
                                    All
                                </button>
                                {filterValues.map(value => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setFilter(current => (current === value ? null : value))}
                                        aria-pressed={filter === value}
                                        className={`lo-perk-row flex shrink-0 items-center gap-2 whitespace-nowrap px-2.5 py-1.5 lg:px-[12px] lg:py-[8px] text-left text-xs lg:text-[13.5px] font-semibold tracking-[0.04em] ${
                                            filter === value ? "!border-[#e0a33e] text-[#e0a33e]" : "text-[#b9bcc2]"
                                        }`}
                                    >
                                        <ItemIcon icon={`/assets/icons/elements/${value}.png`} alt="" size={17} />
                                        {value}
                                    </button>
                                ))}
                            </div>
                        )}
                    </nav>
                )}

                {/* grid */}
                <div ref={gridRef} className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-[28px]">
                    {flat.length === 0 && (
                        <p className="pt-16 text-center text-[15px] text-[#84888f]">Nothing matches your search.</p>
                    )}
                    {grouped.map(([group, list]) => (
                        <section key={group} className="mb-[26px]">
                            {(grouped.length > 1 || isWeaponPicker) && (
                                <div className="mb-[12px] flex items-center gap-3">
                                    <span className="lo-serif text-[16px] font-semibold tracking-[0.14em] text-[#c8cbcf]">
                                        {group.toUpperCase()}
                                    </span>
                                    <span className="lo-flourish" aria-hidden />
                                </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(158px,1fr))] gap-2.5 sm:gap-[12px]">
                                {list.map(item => {
                                    runningIndex += 1;
                                    const index = runningIndex;
                                    const isSelected = item.value === selectedValue;
                                    return (
                                        <HoverCard key={item.value} openDelay={80} closeDelay={80}>
                                            <HoverCardTrigger asChild>
                                                <button
                                                    type="button"
                                                    data-index={index}
                                                    data-active={index === activeIndex}
                                                    onClick={() => commit(item.value)}
                                                    onMouseEnter={() => setNavIndex(index)}
                                                    aria-label={`${item.label}${item.hint ? ` - ${item.hint}` : ""}${item.behemoth ? ` (Crafted from ${item.behemoth})` : ""}`}
                                                    aria-pressed={isSelected}
                                                    className={`lo-picker-card group relative flex h-[178px] flex-col items-center justify-between p-[12px] text-center overflow-hidden transition-all duration-150 cursor-pointer ${isSelected ? "!border-[#e0a33e] shadow-[0_0_12px_rgba(224,163,62,0.4)]" : ""
                                                        }`}
                                                >
                                                    {/* Top bar: Level/stat chip + Behemoth tag */}
                                                    <div className="flex w-full items-center justify-between min-h-[20px]">
                                                        <span className="lo-level-chip !text-[12px]">{item.meta ?? ""}</span>
                                                        {item.behemoth && (
                                                            <span
                                                                className="rounded-[4px] border border-[#e0c287]/35 bg-[#050a12]/85 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#e0c287] shadow-xs"
                                                            >
                                                                {item.behemoth}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {item.icon ? (
                                                        <ItemIcon icon={item.icon} alt={item.label} size={78} />
                                                    ) : item.consumableType ? (
                                                        <ConsumableGlyph type={item.consumableType} size={72} />
                                                    ) : (
                                                        <ItemIcon icon={item.icon} alt={item.label} size={78} />
                                                    )}

                                                    <span className="flex w-full flex-col gap-[2px] overflow-visible">
                                                        <span
                                                            className="text-[13.5px] font-semibold overflow-visible"
                                                            style={item.color ? getTextGlowStyle(item.color) : { color: "#e8e4da" }}
                                                        >
                                                            {item.label}
                                                        </span>
                                                        {item.hint && (
                                                            <span className="truncate text-[11.5px] text-[#9a9a94]">
                                                                {item.hint}
                                                            </span>
                                                        )}
                                                    </span>
                                                </button>
                                            </HoverCardTrigger>
                                            <HoverCardContent
                                                side="top"
                                                align="center"
                                                sideOffset={8}
                                                avoidCollisions
                                                className="pointer-events-none z-50 w-[calc(100vw-24px)] max-w-80 sm:w-96 rounded-xl border border-[var(--line-2)] bg-[#0a101c]/95 p-4 shadow-2xl backdrop-blur-xl"
                                            >
                                                <ItemPickerTooltipContent item={item} pickerKind={pickerKind} />
                                            </HoverCardContent>
                                        </HoverCard>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between border-t border-[#3a3f47] bg-[rgba(10,12,16,0.92)] px-4 py-3 lg:px-[56px] lg:py-[12px]">
                <span className="hidden sm:inline text-[12.5px] tracking-[0.06em] text-[#84888f]">
                    ARROWS to navigate · ENTER to equip · ESC to close
                </span>
                <span className="sm:hidden text-[11px] tracking-[0.06em] text-[#84888f]">
                    Tap an item to equip
                </span>
                {allowClear && (
                    <button
                        type="button"
                        onClick={() => commit(null)}
                        className="lo-button-text ml-auto !text-[14px] sm:!text-[15px] tracking-[0.16em]"
                    >
                        CLEAR SLOT
                    </button>
                )}
            </div>
        </div>
    );
};
