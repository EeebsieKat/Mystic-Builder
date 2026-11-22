"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    Compass,
    Copy,
    ExternalLink,
    Eye,
    Heart,
    Plus,
    RotateCcw,
    Search,
    Sparkles,
    Zap,
    X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import metaBuildsData from "@/game/meta-builds-indexed.json";
import { gameData } from "@/game/data";
import { parseBuildId } from "@/game/build-view";
import type { CellType } from "@/game/types";
import { cellTypeColor, cellTypeIcon, cellTypeLabel, elementColor, getTextGlowStyle } from "@/lib/site";
import { highlightGameText } from "@/lib/game-text-highlighter";
import { getClientId, getClientFingerprint } from "@/lib/client-id";
import { PerkTierHoverTooltip } from "@/components/loadout/perk-summary-dialog";

/* ------------------------------------------------------------------ */
/* Types & Configurations                                             */
/* ------------------------------------------------------------------ */

interface IndexedMetaBuild {
    buildId: string;
    title: string;
    category: string;
    vsElement: string | null;
    subcategory: string | null;
    weaponType: string;
    weaponName: string;
    weaponIcon: string;
    weaponElement: string;
    bondName?: string | null;
    bondIcon?: string | null;
    omnicellName: string | null;
    omnicellIcon: string | null;
    lanternName: string;
    lanternIcon: string;
    head: { name: string; icon: string };
    torso: { name: string; icon: string };
    arms: { name: string; icon: string };
    legs: { name: string; icon: string };
    perks: { name: string; value: number }[];
    cells: { slot: string; cellName: string }[];
}

const WEAPON_CONFIGS: { type: string; label: string; icon: string }[] = [
    { type: "Aether Strikers", label: "Aether Strikers", icon: "/assets/icons/generic/AetherStrikers.png" },
    { type: "Axe", label: "Axe", icon: "/assets/icons/generic/Axe.png" },
    { type: "Chain Blades", label: "Chain Blades", icon: "/assets/icons/generic/ChainBlades.png" },
    { type: "Hammer", label: "Hammer", icon: "/assets/icons/generic/Hammer.png" },
    { type: "Repeater", label: "Repeaters", icon: "/assets/icons/generic/Repeater.png" },
    { type: "Sword", label: "Sword", icon: "/assets/icons/generic/Sword.png" },
    { type: "War Pike", label: "War Pike", icon: "/assets/icons/generic/WarPike.png" },
];

const CATEGORY_ORDER = [
    "Revenant",
    "Tempest",
    "Discipline",
    "Bastion",
    "Artificer",
    "Iceborne",
];

const CATEGORY_ICONS: Record<string, string> = {
    Revenant: "/assets/icons/omnicells/Revenant.png",
    Tempest: "/assets/icons/omnicells/Tempest.png",
    Discipline: "/assets/icons/omnicells/Discipline.png",
    Bastion: "/assets/icons/omnicells/Bastion.png",
    Artificer: "/assets/icons/omnicells/Artificer.png",
    Iceborne: "/assets/icons/omnicells/Iceborne.png",
};

const ELEMENT_CONFIGS: { element: string; label: string; icon: string; color: string }[] = [
    { element: "Blaze", label: "vs Blaze", icon: "/assets/icons/elements/Blaze.png", color: "#E25822" },
    { element: "Frost", label: "vs Frost", icon: "/assets/icons/elements/Frost.png", color: "#6EC6E8" },
    { element: "Shock", label: "vs Shock", icon: "/assets/icons/elements/Shock.png", color: "#F3C13A" },
    { element: "Terra", label: "vs Terra", icon: "/assets/icons/elements/Terra.png", color: "#6FBF4B" },
    { element: "Radiant", label: "vs Radiant", icon: "/assets/icons/elements/Radiant.png", color: "#EFD97F" },
    { element: "Umbral", label: "vs Umbral", icon: "/assets/icons/elements/Umbral.png", color: "#8A5FE8" },
];

const POPULAR_PERK_FILTERS = [
    "Predator",
    "Overpower",
    "Pulse",
    "Cunning",
    "Adrenaline",
    "Galvanized",
    "Impulse",
    "Catalyst",
    "Reuse",
];

/* ------------------------------------------------------------------ */
/* Hover Tooltip Helpers (Omnicells, Lanterns, Perks)                 */
/* ------------------------------------------------------------------ */

const interpolate = (
    text: string | null | undefined,
    values?: Record<string, string | number> | null,
): string =>
    String(text ?? "")
        .replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
            values && key in values ? String(values[key]) : "",
        )
        .replace(/\{\{NL\}\}/g, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/\s*\n\s*/g, " ")
        .trim();

const formatPerkEffect = (eff?: { description: string | (string | null)[]; values?: Record<string, string | number> }): string => {
    if (!eff) return "";
    const descs = Array.isArray(eff.description) ? eff.description.filter(Boolean) : [eff.description];
    return descs
        .map(str => interpolate(str as string, eff.values))
        .filter(Boolean)
        .join(", ");
};

interface OmnicellHoverTooltipProps {
    name?: string | null;
    children: React.ReactNode;
}

const OmnicellHoverTooltip = ({ name, children }: OmnicellHoverTooltipProps) => {
    if (!name) return <>{children}</>;
    const omnicell = gameData.omnicells[name];
    if (!omnicell) return <>{children}</>;

    const passiveText = interpolate(omnicell.passive, omnicell.passive_values);
    const activeText = interpolate(omnicell.active, omnicell.active_values);

    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild onClick={e => e.stopPropagation()}>
                <div className="cursor-help w-full">{children}</div>
            </HoverCardTrigger>
            <HoverCardContent
                side="top"
                align="center"
                className="z-50 w-80 sm:w-96 rounded-xl border border-border/80 bg-card/98 p-4 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex flex-col gap-3.5 text-left">
                    {/* Passive Ability */}
                    <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 flex-shrink-0 rounded-lg border border-border/60 bg-muted/30 p-1">
                            <Image
                                src={omnicell.icon}
                                alt={omnicell.name}
                                fill
                                sizes="36px"
                                className="object-contain"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground">{omnicell.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                <strong className="text-foreground font-semibold">Passive: </strong>
                                {highlightGameText(passiveText)}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-border/40" />

                    {/* Active Ability */}
                    <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 flex-shrink-0 rounded-lg border border-primary/30 bg-primary/10 p-1">
                            <Image
                                src={omnicell.ability_icon || omnicell.icon}
                                alt={`${omnicell.name} Active`}
                                fill
                                sizes="36px"
                                className="object-contain"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground">
                                {omnicell.name} Active Ability
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                <strong className="text-foreground font-semibold">Active: </strong>
                                {highlightGameText(activeText)}
                            </p>
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

interface LanternHoverTooltipProps {
    name?: string | null;
    children: React.ReactNode;
}

const LanternHoverTooltip = ({ name, children }: LanternHoverTooltipProps) => {
    if (!name) return <>{children}</>;
    const lantern = gameData.lanterns[name];
    if (!lantern) return <>{children}</>;

    const instantText = lantern.lantern_ability?.instant
        ? interpolate(lantern.lantern_ability.instant, lantern.values)
        : null;
    const holdText = lantern.lantern_ability?.hold
        ? interpolate(lantern.lantern_ability.hold, lantern.values)
        : null;

    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild onClick={e => e.stopPropagation()}>
                <div className="cursor-help w-full">{children}</div>
            </HoverCardTrigger>
            <HoverCardContent
                side="top"
                align="center"
                className="z-50 w-80 sm:w-96 rounded-xl border border-border/80 bg-card/98 p-4 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex flex-col gap-2.5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 flex-shrink-0 rounded-lg border border-border/60 bg-muted/30 p-1">
                            <Image
                                src={lantern.icon}
                                alt={lantern.name}
                                fill
                                sizes="36px"
                                className="object-contain"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground">{lantern.name}</h4>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                Lantern Ability
                            </span>
                        </div>
                    </div>

                    {instantText && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong className="text-foreground font-semibold">Instant (Tap): </strong>
                            {highlightGameText(instantText)}
                        </p>
                    )}

                    {holdText && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong className="text-foreground font-semibold">Hold: </strong>
                            {highlightGameText(holdText)}
                        </p>
                    )}
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

interface PerkHoverTooltipProps {
    name: string;
    rank?: number;
    children: React.ReactNode;
}

const PerkHoverTooltip = ({ name, rank = 6, children }: PerkHoverTooltipProps) => {
    const perk = gameData.perks[name];
    if (!perk) return <>{children}</>;

    const clampedRank = Math.max(1, Math.min(6, rank));
    const effect = perk.effects?.[String(clampedRank)];
    const effectDesc = effect
        ? interpolate(effect.description, effect.values)
        : perk.description;

    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild onClick={e => e.stopPropagation()}>
                <div className="cursor-help inline-flex">{children}</div>
            </HoverCardTrigger>
            <HoverCardContent
                side="top"
                align="center"
                className="z-50 w-72 rounded-xl border border-border/80 bg-card/98 p-3 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{perk.name}</span>
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                            +{clampedRank} ({perk.type})
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {highlightGameText(effectDesc)}
                    </p>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

interface WeaponHoverTooltipProps {
    name?: string | null;
    isBond?: boolean;
    slottedCells?: { cellName?: string | null; slot?: string | null }[] | null;
    children: React.ReactNode;
}

const WeaponHoverTooltip = ({ name, isBond = false, slottedCells, children }: WeaponHoverTooltipProps) => {
    if (!name) return <>{children}</>;

    const weapon =
        gameData.weapons[name] ||
        Object.values(gameData.weapons).find(w => w.name.toLowerCase() === name.toLowerCase());

    if (!weapon) return <>{children}</>;

    const surgedPerk = weapon.perks?.find(p => p.powerSurged) || weapon.perks?.[0];
    const perkDef = surgedPerk ? gameData.perks[surgedPerk.name] : null;
    const perkTier = surgedPerk ? Math.min(6, Math.max(1, surgedPerk.value)) : null;
    const perkEffect = perkTier && perkDef?.effects?.[String(perkTier)]
        ? interpolate(perkDef.effects[String(perkTier)].description, perkDef.effects[String(perkTier)].values)
        : perkDef?.description;

    const surgedEffect = weapon.unique_effects?.find(e => e.powerSurged) || weapon.unique_effects?.[0];
    const uniqueEffectText = surgedEffect
        ? interpolate(surgedEffect.description, surgedEffect.values)
        : null;

    const cellsList: CellType[] = Array.isArray(weapon.cells)
        ? (weapon.cells.filter(Boolean) as CellType[])
        : weapon.cells
            ? [weapon.cells]
            : [];

    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild onClick={e => e.stopPropagation()}>
                <div className="cursor-help inline-flex w-full">{children}</div>
            </HoverCardTrigger>
            <HoverCardContent
                side="top"
                align="center"
                className="z-50 w-80 sm:w-96 rounded-xl border border-border/80 bg-card/98 p-4 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex flex-col gap-3 text-left">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                        <div
                            className="relative h-11 w-11 flex-shrink-0 rounded-lg border bg-muted/30 p-1"
                            style={{
                                borderColor: weapon.elemental ? `${elementColor(weapon.elemental)}60` : undefined,
                            }}
                        >
                            <Image
                                src={weapon.icon}
                                alt={weapon.name}
                                fill
                                sizes="44px"
                                className="object-contain"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-bold text-foreground leading-tight">{weapon.name}</h4>
                                {isBond && (
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] border-primary/50 bg-primary/15 text-primary uppercase font-bold py-0 h-4"
                                    >
                                        Bond
                                    </Badge>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {weapon.type} {weapon.behemoth ? `• Forged from ${weapon.behemoth}` : ""}
                            </p>
                        </div>
                    </div>

                    {/* Meta row: Element, Power, Sockets */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        {weapon.elemental ? (
                            <div
                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border"
                                style={{
                                    borderColor: `${elementColor(weapon.elemental)}70`,
                                    backgroundColor: `${elementColor(weapon.elemental)}18`,
                                    color: elementColor(weapon.elemental),
                                }}
                            >
                                <div className="relative h-3 w-3 flex-shrink-0">
                                    <Image
                                        src={`/assets/icons/elements/${weapon.elemental}.png`}
                                        alt={weapon.elemental}
                                        fill
                                        sizes="12px"
                                        className="object-contain"
                                    />
                                </div>
                                <span>{weapon.elemental}</span>
                            </div>
                        ) : (
                            <Badge variant="secondary" className="text-[10px]">
                                Neutral
                            </Badge>
                        )}

                        <Badge variant="outline" className="text-[10px] border-border/60 text-muted-foreground">
                            Power {weapon.power?.base ?? 100}{weapon.power?.powerSurged ? ` (${weapon.power.powerSurged} Surged)` : ""}
                        </Badge>

                        {cellsList.length > 0 && (
                            <div className="flex items-center gap-1 ml-auto">
                                <span className="text-[10px] text-muted-foreground font-medium">Slots:</span>
                                {cellsList.map((slot, idx) => (
                                    <div
                                        key={idx}
                                        className="relative h-4 w-4 flex-shrink-0"
                                        title={`${slot} slot`}
                                    >
                                        <Image
                                            src={cellTypeIcon(slot)}
                                            alt={slot}
                                            fill
                                            sizes="16px"
                                            className="object-contain"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Inherent Perk */}
                    {surgedPerk && (
                        <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.07] p-2.5 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-amber-400" />
                                    Inherent Perk
                                </span>
                                <Badge
                                    variant="outline"
                                    className="border-amber-400/50 bg-amber-400/20 text-amber-300 text-[10px] font-bold py-0 h-4"
                                >
                                    +{surgedPerk.value} {surgedPerk.name}
                                </Badge>
                            </div>
                            {perkEffect && (
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                                    {highlightGameText(perkEffect)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Slotted Cells info if present */}
                    {slottedCells && slottedCells.length > 0 && (
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 flex flex-col gap-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                Slotted Cells
                            </span>
                            <div className="flex flex-col gap-2">
                                {slottedCells.map((sc, idx) => {
                                    if (!sc.cellName) return null;
                                    const pName = sc.cellName.replace(/\s+Cell$/i, "");
                                    const pDef = (gameData.perks as Record<string, any>)[pName];
                                    const cellEff = pDef?.effects?.["3"];
                                    const cellDesc = cellEff ? formatPerkEffect(cellEff) : pDef?.description;

                                    return (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {sc.slot ? (
                                                        <div className="relative h-4 w-4 flex-shrink-0">
                                                            <Image
                                                                src={cellTypeIcon(sc.slot)}
                                                                alt={sc.slot}
                                                                fill
                                                                sizes="16px"
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                    ) : null}
                                                    <span className="text-xs font-semibold text-foreground truncate">
                                                        {sc.cellName}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] text-muted-foreground border-border/50">
                                                    {sc.slot} (+3)
                                                </Badge>
                                            </div>
                                            {cellDesc && (
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {highlightGameText(cellDesc)}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Unique Effect */}
                    {uniqueEffectText && (
                        <div className="rounded-lg border border-primary/30 bg-primary/[0.07] p-2.5 flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-primary flex items-center gap-1">
                                <Zap className="h-3 w-3 text-primary" />
                                Unique Effect
                            </span>
                            <p className="text-xs text-foreground/90 leading-relaxed">
                                {highlightGameText(uniqueEffectText)}
                            </p>
                        </div>
                    )}
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

interface ArmourHoverTooltipProps {
    name: string;
    piece: "Head" | "Torso" | "Arms" | "Legs" | string;
    slottedCell?: { cellName: string; slot: string } | null;
    children: React.ReactNode;
}

const ArmourHoverTooltip = ({ name, piece, slottedCell, children }: ArmourHoverTooltipProps) => {
    const armour = gameData.armours[name];
    if (!armour) return <>{children}</>;

    const surgedPerk = armour.perks?.find(p => p.powerSurged) || armour.perks?.[0];
    const perkDef = surgedPerk ? gameData.perks[surgedPerk.name] : null;
    const perkTier = surgedPerk ? Math.min(6, Math.max(1, surgedPerk.value)) : null;
    const perkEffect = perkTier && perkDef?.effects?.[String(perkTier)]
        ? interpolate(perkDef.effects[String(perkTier)].description, perkDef.effects[String(perkTier)].values)
        : perkDef?.description;

    const cellSlot = armour.cells ? (Array.isArray(armour.cells) ? armour.cells[0] : armour.cells) : null;

    const uniqueEffect = armour.unique_effects?.find(e => e.powerSurged) || armour.unique_effects?.[0];
    const uniqueEffectText = uniqueEffect
        ? interpolate(uniqueEffect.description, uniqueEffect.values)
        : null;

    return (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild onClick={e => e.stopPropagation()}>
                <div className="cursor-help w-full">{children}</div>
            </HoverCardTrigger>
            <HoverCardContent
                side="top"
                align="center"
                className="z-50 w-80 sm:w-96 rounded-xl border border-border/80 bg-card/98 p-4 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex flex-col gap-3 text-left">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                        <div className="relative h-11 w-11 flex-shrink-0 rounded-lg border border-border/60 bg-muted/30 p-1">
                            <Image
                                src={armour.icon}
                                alt={armour.name}
                                fill
                                sizes="44px"
                                className="object-contain"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-bold text-foreground leading-tight">{armour.name}</h4>
                                <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0 h-4">
                                    {piece}
                                </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {armour.behemoth ? `Forged from ${armour.behemoth}` : `${piece} Armour`}
                            </p>
                        </div>
                    </div>

                    {/* Stats Row: Defence & Elemental Affinities */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="outline" className="text-[10px] border-border/60 text-muted-foreground">
                            +{armour.resistance?.base ?? 25} Defence{armour.resistance?.powerSurged ? ` (+${armour.resistance.powerSurged} Surged)` : ""}
                        </Badge>

                        {armour.strength && (
                            <div
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border"
                                style={{
                                    borderColor: `${elementColor(armour.strength)}70`,
                                    backgroundColor: `${elementColor(armour.strength)}18`,
                                    color: elementColor(armour.strength),
                                }}
                            >
                                <span>+{armour.strength}</span>
                            </div>
                        )}

                        {armour.weakness && (
                            <div
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border"
                                style={{
                                    borderColor: `${elementColor(armour.weakness)}40`,
                                    backgroundColor: `${elementColor(armour.weakness)}10`,
                                    color: elementColor(armour.weakness),
                                }}
                            >
                                <span className="opacity-80">-{armour.weakness}</span>
                            </div>
                        )}

                        {cellSlot && (
                            <div className="flex items-center gap-1 ml-auto">
                                <div className="relative h-3.5 w-3.5 flex-shrink-0">
                                    <Image
                                        src={cellTypeIcon(cellSlot)}
                                        alt={cellSlot}
                                        fill
                                        sizes="14px"
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                    {cellSlot} Slot
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Inherent Perk */}
                    {surgedPerk && (
                        <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.07] p-2.5 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-amber-400" />
                                    Inherent Perk
                                </span>
                                <Badge
                                    variant="outline"
                                    className="border-amber-400/50 bg-amber-400/20 text-amber-300 text-[10px] font-bold py-0 h-4"
                                >
                                    +{surgedPerk.value} {surgedPerk.name}
                                </Badge>
                            </div>
                            {perkEffect && (
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                                    {highlightGameText(perkEffect)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Slotted Cell info if present */}
                    {slottedCell && (() => {
                        const pName = slottedCell.cellName.replace(/\s+Cell$/i, "");
                        const pDef = (gameData.perks as Record<string, any>)[pName];
                        const cellEff = pDef?.effects?.["3"];
                        const cellDesc = cellEff ? formatPerkEffect(cellEff) : pDef?.description;

                        return (
                            <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="relative h-4 w-4 flex-shrink-0">
                                            <Image
                                                src={cellTypeIcon(slottedCell.slot)}
                                                alt={slottedCell.slot}
                                                fill
                                                sizes="16px"
                                                className="object-contain"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-tight">
                                                Slotted Cell
                                            </span>
                                            <span className="text-xs font-semibold text-foreground truncate block">
                                                {slottedCell.cellName}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] text-muted-foreground border-border/50">
                                        {slottedCell.slot} (+3)
                                    </Badge>
                                </div>
                                {cellDesc && (
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                                        {highlightGameText(cellDesc)}
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    {/* Unique Effect if present (Exotic gear) */}
                    {uniqueEffectText && (
                        <div className="rounded-lg border border-primary/30 bg-primary/[0.07] p-2.5 flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-primary flex items-center gap-1">
                                <Zap className="h-3 w-3 text-primary" />
                                Unique Effect
                            </span>
                            <p className="text-xs text-foreground/90 leading-relaxed">
                                {highlightGameText(uniqueEffectText)}
                            </p>
                        </div>
                    )}
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */

interface BuildSuggestionsProps {
    defaultLikedOnly?: boolean;
}

const BuildSuggestions = ({ defaultLikedOnly = false }: BuildSuggestionsProps) => {
    const searchParams = useSearchParams();

    /* -------------------------------------------------------------- */
    /* State: Meta Builds Browser                                     */
    /* -------------------------------------------------------------- */
    const [showLikedOnly, setShowLikedOnly] = useState<boolean>(() => {
        if (defaultLikedOnly) return true;
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get("tab") === "liked";
        }
        return false;
    });
    const [selectedWeapon, setSelectedWeapon] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("tab") === "liked") return "all";
            const w = urlParams.get("weapon");
            if (w) return w;
        }
        if (defaultLikedOnly) return "all";
        return "Aether Strikers";
    });
    const [selectedCategory, setSelectedCategory] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("tab") === "liked") return "all";
            const cat = urlParams.get("category");
            if (cat) return cat;
            if (urlParams.get("q") || urlParams.get("search")) return "all";
        }
        if (defaultLikedOnly) return "all";
        return "Revenant";
    });
    const [selectedElement, setSelectedElement] = useState<string>("all");
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get("q") || urlParams.get("search") || "";
        }
        return "";
    });
    const [selectedPerkFilters, setSelectedPerkFilters] = useState<string[]>(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const perksParam = urlParams.get("perks");
            if (perksParam) {
                return perksParam.split(",").map(p => p.trim()).filter(Boolean);
            }
        }
        return [];
    });
    const [perkDropdownSearch, setPerkDropdownSearch] = useState<string>("");
    const [copiedBuildId, setCopiedBuildId] = useState<string | null>(null);
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
    const [likedBuilds, setLikedBuilds] = useState<Set<string>>(new Set());
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

    // Fetch real like counts and user's liked status from database
    useEffect(() => {
        const clientId = getClientId();
        const fingerprint = getClientFingerprint();
        fetch(
            `/api/builds/likes?clientId=${encodeURIComponent(clientId)}&fingerprint=${encodeURIComponent(fingerprint)}`,
        )
            .then(res => res.json())
            .then(data => {
                if (data && typeof data === "object") {
                    if (data.likes && typeof data.likes === "object") {
                        setLikeCounts(data.likes);
                    }
                    if (Array.isArray(data.userLikes)) {
                        setLikedBuilds(new Set(data.userLikes));
                    }
                }
            })
            .catch(err => {
                console.error("Failed to load likes from database:", err);
            });
    }, []);

    const toggleLike = useCallback(async (buildId: string) => {
        const clientId = getClientId();
        const fingerprint = getClientFingerprint();
        const currentlyLiked = likedBuilds.has(buildId);
        const nextLiked = !currentlyLiked;

        // Optimistic UI update
        setLikedBuilds(prev => {
            const next = new Set(prev);
            if (nextLiked) next.add(buildId);
            else next.delete(buildId);
            return next;
        });

        setLikeCounts(prev => {
            const currentCount = prev[buildId] ?? 0;
            const updatedCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
            return { ...prev, [buildId]: updatedCount };
        });

        try {
            const res = await fetch(`/api/builds/${encodeURIComponent(buildId)}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId, fingerprint }),
            });

            if (res.ok) {
                const data = (await res.json()) as { liked: boolean; count: number };
                setLikedBuilds(prev => {
                    const next = new Set(prev);
                    if (data.liked) next.add(buildId);
                    else next.delete(buildId);
                    return next;
                });
                setLikeCounts(prev => ({ ...prev, [buildId]: data.count }));
            }
        } catch (err) {
            console.error("Failed to toggle like on server:", err);
            // Revert on error
            setLikedBuilds(prev => {
                const next = new Set(prev);
                if (currentlyLiked) next.add(buildId);
                else next.delete(buildId);
                return next;
            });
            setLikeCounts(prev => {
                const currentCount = prev[buildId] ?? 0;
                const revertedCount = currentlyLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
                return { ...prev, [buildId]: revertedCount };
            });
        }
    }, [likedBuilds]);
    const allBuilds = useMemo(() => {
        return (metaBuildsData.builds as IndexedMetaBuild[]).filter(
            b => CATEGORY_ORDER.includes(b.category) && Boolean(b.weaponName),
        );
    }, []);
    const categoryDescriptions = metaBuildsData.categories as { name: string; description: string }[];

    const [inspectingBuild, setInspectingBuild] = useState<IndexedMetaBuild | null>(null);

    const inspectingParsedBuild = useMemo(() => {
        if (!inspectingBuild) return null;
        return parseBuildId(inspectingBuild.buildId);
    }, [inspectingBuild]);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "liked") {
            setShowLikedOnly(true);
            setSelectedWeapon("all");
            setSelectedCategory("all");
        } else if (tab === "suggestions") {
            setShowLikedOnly(false);
        }

        const weaponParam = searchParams.get("weapon");
        if (weaponParam) setSelectedWeapon(weaponParam);

        const categoryParam = searchParams.get("category");
        if (categoryParam) setSelectedCategory(categoryParam);

        const qParam = searchParams.get("q") || searchParams.get("search");
        if (qParam !== null) {
            setSearchQuery(qParam);
            if (!categoryParam) setSelectedCategory("all");
        }

        const viewId = searchParams.get("view");
        if (viewId) {
            const found = allBuilds.find(b => b.buildId === viewId);
            if (found) setInspectingBuild(found);
        }
    }, [searchParams, allBuilds]);

    const baseBuilds = useMemo(() => {
        if (!showLikedOnly) return allBuilds;
        return allBuilds.filter(b => likedBuilds.has(b.buildId));
    }, [allBuilds, showLikedOnly, likedBuilds]);

    // Current category description
    const currentCategoryInfo = useMemo(() => {
        if (selectedCategory === "all") {
            return {
                name: "All Omnicells",
                description: "Displaying top meta builds across all omnicell archetypes.",
            };
        }
        return (
            categoryDescriptions.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase()) ?? {
                name: selectedCategory,
                description: "Optimized meta loadout designed for high-tier Dauntless combat.",
            }
        );
    }, [selectedCategory, categoryDescriptions]);

    // Available subcategories for Escalations or Exotics in selected weapon
    const availableSubcategories = useMemo(() => {
        const set = new Set<string>();
        for (const b of baseBuilds) {
            if (
                (selectedWeapon === "all" || b.weaponType === selectedWeapon) &&
                (selectedCategory === "all" || b.category === selectedCategory) &&
                b.subcategory
            ) {
                set.add(b.subcategory);
            }
        }
        return Array.from(set);
    }, [baseBuilds, selectedWeapon, selectedCategory]);

    // Build counts per category for selected weapon
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const b of baseBuilds) {
            if (selectedWeapon === "all" || b.weaponType === selectedWeapon) {
                counts[b.category] = (counts[b.category] || 0) + 1;
            }
        }
        return counts;
    }, [baseBuilds, selectedWeapon]);

    // Build counts per weapon
    const weaponCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const b of baseBuilds) {
            counts[b.weaponType] = (counts[b.weaponType] || 0) + 1;
        }
        return counts;
    }, [baseBuilds]);

    // Filtered builds for the Meta tab
    const filteredMetaBuilds = useMemo(() => {
        return baseBuilds.filter(b => {
            // Weapon filter
            if (selectedWeapon !== "all" && b.weaponType !== selectedWeapon) return false;

            // Category filter
            if (selectedCategory !== "all" && b.category !== selectedCategory) return false;

            // Subcategory filter (for Escalations or Exotics)
            if (selectedSubcategory !== "all" && b.subcategory !== selectedSubcategory) {
                return false;
            }

            // Element filter (vs Element)
            if (selectedElement !== "all" && b.vsElement !== selectedElement) {
                return false;
            }

            // Multi-perk selector filter (matches ALL selected perks)
            if (selectedPerkFilters.length > 0) {
                const buildPerkNames = new Set(
                    (b.perks || []).filter(p => p?.name).map(p => p.name.toLowerCase()),
                );
                const hasAllPerks = selectedPerkFilters.every(p => buildPerkNames.has(p.toLowerCase()));
                if (!hasAllPerks) return false;
            }

            // Search query filter (matches title, weaponName, bondName, perks, armor, cells)
            if (searchQuery.trim().length > 0) {
                const q = searchQuery.toLowerCase().trim();
                const titleMatch = Boolean(b.title?.toLowerCase().includes(q));
                const weaponMatch = Boolean(b.weaponName?.toLowerCase().includes(q));
                const bondMatch = Boolean(b.bondName?.toLowerCase().includes(q));
                const omnicellMatch = Boolean(b.omnicellName?.toLowerCase().includes(q));
                const lanternMatch = Boolean(b.lanternName?.toLowerCase().includes(q));
                const gearMatch =
                    Boolean(b.head?.name?.toLowerCase().includes(q)) ||
                    Boolean(b.torso?.name?.toLowerCase().includes(q)) ||
                    Boolean(b.arms?.name?.toLowerCase().includes(q)) ||
                    Boolean(b.legs?.name?.toLowerCase().includes(q));
                const perkMatch =
                    Array.isArray(b.perks) &&
                    b.perks.some(p => p?.name && p.name.toLowerCase().includes(q));
                const cellMatch =
                    Array.isArray(b.cells) &&
                    b.cells.some(c => c?.cellName && c.cellName.toLowerCase().includes(q));

                if (
                    !titleMatch &&
                    !weaponMatch &&
                    !bondMatch &&
                    !omnicellMatch &&
                    !lanternMatch &&
                    !gearMatch &&
                    !perkMatch &&
                    !cellMatch
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [
        baseBuilds,
        selectedWeapon,
        selectedCategory,
        selectedSubcategory,
        selectedElement,
        selectedPerkFilters,
        searchQuery,
    ]);

    const togglePerkFilter = (perk: string) => {
        setSelectedPerkFilters(prev =>
            prev.includes(perk) ? prev.filter(p => p !== perk) : [...prev, perk],
        );
    };

    const handleCopyLink = async (buildId: string) => {
        try {
            const url = typeof window !== "undefined" ? `${window.location.origin}/b/${buildId}` : `/b/${buildId}`;
            await navigator.clipboard.writeText(url);
            setCopiedBuildId(buildId);
            setTimeout(() => setCopiedBuildId(null), 2200);
        } catch {
            setCopiedBuildId(buildId);
            setTimeout(() => setCopiedBuildId(null), 2200);
        }
    };

    const resetFilters = () => {
        setSelectedElement("all");
        setSelectedSubcategory("all");
        setSelectedPerkFilters([]);
        setSearchQuery("");
    };

    const allPerkNames = useMemo(() => {
        return Object.keys(gameData.perks).sort();
    }, []);

    return (
        <section className="mystic-glow w-full flex-1 px-4 sm:px-8 md:px-[100px] py-10">
            {/* Header */}
            <div className="flex flex-col items-center gap-4 text-center">
                <p className="panel-label">
                    {showLikedOnly
                        ? "Dauntless 1.14.7 - Your Saved Builds"
                        : "Dauntless 1.14.7 - Official Meta Builds & Suggestions"}
                </p>
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl flex items-center justify-center gap-3">
                    {showLikedOnly ? (
                        <>
                            <span>Liked Builds</span>
                            <Heart className="h-7 w-7 sm:h-8 sm:w-8 fill-rose-500 text-rose-500 inline-block drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
                        </>
                    ) : (
                        "Builds & Loadout Suggestions"
                    )}
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-[#c2d0e2] sm:text-base">
                    {showLikedOnly
                        ? `Viewing your personal collection of liked loadouts (${likedBuilds.size} saved). Filter by weapon, omnicell, or perks, or 1-click open any build in the planner.`
                        : "Explore all 517 curated Dauntless meta loadouts from the official Reforged meta index. Filter by weapon, omnicell, and elemental matchup, or 1-click open any build in the planner."}
                </p>
            </div>

            <div className="mt-8">
                <div className="gold-rule mb-8" aria-hidden />

                {/* Official Reforged Meta Builds Browser */}
                {showLikedOnly && likedBuilds.size === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line-2)] bg-[rgba(10,19,32,0.7)] py-20 px-6 text-center shadow-lg backdrop-blur-sm max-w-2xl mx-auto my-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] mb-5">
                            <Heart className="h-10 w-10 text-rose-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Liked Builds Yet</h3>
                        <p className="max-w-md text-sm text-[#b8c7db] leading-relaxed mb-6">
                            You haven't liked any builds yet. Click the heart icon on any build card while exploring to save it to your personal liked collection.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setShowLikedOnly(false);
                                window.history.replaceState(null, "", "/?tab=suggestions");
                            }}
                            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                        >
                            <span>Browse Suggestions</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* 1. Weapon Selector Bar */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#d6e0ee]">
                                    Select Weapon Class
                                </span>
                                {selectedWeapon !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedWeapon("all");
                                            setSelectedSubcategory("all");
                                        }}
                                        className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/20 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                                        title="Deselect weapon to view builds across all weapon classes"
                                    >
                                        <X className="h-3 w-3" />
                                        <span>Remove weapon filter</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* All Weapons option */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedWeapon("all");
                                        setSelectedSubcategory("all");
                                    }}
                                    className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 border cursor-pointer ${selectedWeapon === "all"
                                            ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(91,163,255,0.25)]"
                                            : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:border-primary/60 hover:text-white hover:bg-[rgba(15,26,44,0.85)] shadow-xs"
                                        }`}
                                >
                                    <span>All Weapons</span>
                                    <span
                                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedWeapon === "all"
                                                ? "bg-primary/30 text-primary font-bold"
                                                : "bg-white/10 text-[#cbd5e1] font-semibold"
                                            }`}
                                    >
                                        {baseBuilds.length}
                                    </span>
                                </button>

                                {WEAPON_CONFIGS.map(w => {
                                    const isSelected = selectedWeapon === w.type;
                                    const count = weaponCounts[w.type] || 0;
                                    return (
                                        <button
                                            key={w.type}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedWeapon("all");
                                                } else {
                                                    setSelectedWeapon(w.type);
                                                }
                                                setSelectedSubcategory("all");
                                            }}
                                            title={isSelected ? `Click to remove ${w.label} filter` : `Filter by ${w.label}`}
                                            className={`group flex items-center gap-2.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 border cursor-pointer ${isSelected
                                                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(91,163,255,0.25)]"
                                                    : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:border-primary/60 hover:text-white hover:bg-[rgba(15,26,44,0.85)] shadow-xs"
                                                }`}
                                        >
                                            <div className="relative h-5 w-5 flex-shrink-0">
                                                <Image
                                                    src={w.icon}
                                                    alt={w.label}
                                                    fill
                                                    sizes="20px"
                                                    className={`object-contain transition-transform group-hover:scale-110 ${isSelected ? "brightness-125" : "brightness-105 opacity-95"
                                                        }`}
                                                />
                                            </div>
                                            <span>{w.label}</span>
                                            <span
                                                className={`rounded-full px-1.5 py-0.2 text-[10px] ${isSelected
                                                        ? "bg-primary/30 text-primary font-bold"
                                                        : "bg-white/10 text-[#cbd5e1] font-semibold"
                                                    }`}
                                            >
                                                {count}
                                            </span>
                                            {isSelected && (
                                                <span
                                                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/30 transition-colors"
                                                    title="Remove selection"
                                                >
                                                    <X className="h-3 w-3" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Omnicell Navigation */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#d6e0ee]">
                                Omnicell
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory("all");
                                        setSelectedSubcategory("all");
                                    }}
                                    className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border cursor-pointer ${selectedCategory === "all"
                                            ? "border-primary/80 bg-primary/20 text-primary font-semibold shadow-[0_0_10px_rgba(91,163,255,0.2)]"
                                            : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:border-primary/60 hover:text-white hover:bg-[rgba(15,26,44,0.85)] shadow-xs"
                                        }`}
                                >
                                    <span>All Omnicells</span>
                                    <span
                                        className={`rounded-full px-1.5 py-0.1 text-[10px] ${selectedCategory === "all"
                                                ? "bg-primary/30 text-primary font-bold"
                                                : "bg-white/10 text-[#cbd5e1] font-semibold"
                                            }`}
                                    >
                                        {baseBuilds.filter(b => selectedWeapon === "all" || b.weaponType === selectedWeapon).length}
                                    </span>
                                </button>
                                {CATEGORY_ORDER.map(cat => {
                                    const isSelected = selectedCategory === cat;
                                    const count = categoryCounts[cat] || 0;
                                    const icon = CATEGORY_ICONS[cat];
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setSelectedSubcategory("all");
                                            }}
                                            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border cursor-pointer ${isSelected
                                                ? "border-primary/80 bg-primary/20 text-primary font-semibold shadow-[0_0_10px_rgba(91,163,255,0.2)]"
                                                : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:border-primary/60 hover:text-white hover:bg-[rgba(15,26,44,0.85)] shadow-xs"
                                                }`}
                                        >
                                            {icon && (
                                                <div className="relative h-4 w-4 flex-shrink-0">
                                                    <Image
                                                        src={icon}
                                                        alt={cat}
                                                        fill
                                                        sizes="16px"
                                                        className="object-contain"
                                                    />
                                                </div>
                                            )}
                                            <span>{cat}</span>
                                            <span
                                                className={`rounded-full px-1.5 py-0.1 text-[10px] ${isSelected
                                                    ? "bg-primary/30 text-primary font-bold"
                                                    : "bg-white/10 text-[#cbd5e1] font-semibold"
                                                    }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Category Mechanics Banner */}
                        <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-card/95 via-card/85 to-card/75 p-5 shadow-sm backdrop-blur-sm">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                {CATEGORY_ICONS[selectedCategory] && (
                                    <div className="relative h-12 w-12 flex-shrink-0 rounded-xl border border-primary/30 bg-primary/10 p-2 shadow-inner">
                                        <Image
                                            src={CATEGORY_ICONS[selectedCategory]}
                                            alt={selectedCategory}
                                            fill
                                            sizes="48px"
                                            className="object-contain p-1"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-foreground">
                                            {currentCategoryInfo.name} Archetype Guide
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                                            {selectedWeapon === "all" ? "All Weapons" : selectedWeapon}
                                        </Badge>
                                    </div>
                                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                        {currentCategoryInfo.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 4. Matchup Element & Subcategory & Search Filter Bar */}
                        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/15 p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Elemental Matchup Filter */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-[#d6e0ee] mr-1">
                                        Matchup:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedElement("all")}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border cursor-pointer ${selectedElement === "all"
                                            ? "border-primary/80 bg-primary/20 text-primary font-semibold"
                                            : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:text-white hover:bg-[rgba(15,26,44,0.85)]"
                                            }`}
                                    >
                                        All Elements
                                    </button>
                                    {ELEMENT_CONFIGS.map(elem => {
                                        const isSelected = selectedElement === elem.element;
                                        return (
                                            <button
                                                key={elem.element}
                                                type="button"
                                                onClick={() => setSelectedElement(elem.element)}
                                                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 border cursor-pointer ${isSelected
                                                    ? "border-current bg-white/10 font-bold shadow-xs"
                                                    : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:text-white hover:bg-[rgba(15,26,44,0.85)]"
                                                    }`}
                                                style={{ color: isSelected ? elem.color : undefined }}
                                            >
                                                <div className="relative h-3.5 w-3.5 flex-shrink-0">
                                                    <Image
                                                        src={elem.icon}
                                                        alt={elem.label}
                                                        fill
                                                        sizes="14px"
                                                        className="object-contain"
                                                    />
                                                </div>
                                                <span>{elem.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Live Search Input */}
                                <div className="relative w-full lg:w-72">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8ba0bc]" />
                                    <Input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search build, perk, bond, weapon…"
                                        className="h-9 rounded-full pl-9 pr-8 text-xs bg-muted/30 border-border/60 text-[#eef3fb] placeholder:text-[#8ba0bc]"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba0bc] hover:text-foreground cursor-pointer"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Subcategories (if Escalations or Exotics) */}
                            {availableSubcategories.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
                                    <span className="text-xs font-bold text-[#d6e0ee] mr-1">
                                        Tier / Variant:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSubcategory("all")}
                                        className={`rounded-full px-2.5 py-0.5 text-xs transition-colors border cursor-pointer ${selectedSubcategory === "all"
                                            ? "border-primary bg-primary/20 text-primary font-semibold"
                                            : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:text-white"
                                            }`}
                                    >
                                        All Variants
                                    </button>
                                    {availableSubcategories.map(sub => {
                                        const label =
                                            sub === "preEsca"
                                                ? "Pre-Escalation"
                                                : sub === "legendaries"
                                                    ? "Legendaries"
                                                    : sub === "heroics"
                                                        ? "Heroic Escalation"
                                                        : sub;
                                        return (
                                            <button
                                                key={sub}
                                                type="button"
                                                onClick={() => setSelectedSubcategory(sub)}
                                                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors border cursor-pointer ${selectedSubcategory === sub
                                                    ? "border-primary bg-primary/20 text-primary font-semibold"
                                                    : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:text-white"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Multi-Perk Filter Chips & Selector */}
                            <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-[#d6e0ee]">
                                            Filter by Perks (Multi-Select):
                                        </span>
                                        {selectedPerkFilters.length > 0 && (
                                            <Badge
                                                variant="outline"
                                                className="border-primary/50 bg-primary/15 text-primary text-[10px] font-bold"
                                            >
                                                {selectedPerkFilters.length} Selected (Match All)
                                            </Badge>
                                        )}
                                    </div>
                                    {selectedPerkFilters.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPerkFilters([])}
                                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                            <span>Clear perks</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    {POPULAR_PERK_FILTERS.map(perk => {
                                        const isSelected = selectedPerkFilters.includes(perk);
                                        return (
                                            <button
                                                key={perk}
                                                type="button"
                                                onClick={() => togglePerkFilter(perk)}
                                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all duration-150 border cursor-pointer ${isSelected
                                                    ? "border-primary bg-primary/25 text-primary font-bold shadow-[0_0_8px_rgba(91,163,255,0.25)]"
                                                    : "border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-border"
                                                    }`}
                                            >
                                                {isSelected && <Check className="h-3 w-3 text-primary" />}
                                                <span>{perk}</span>
                                            </button>
                                        );
                                    })}

                                    {/* Any selected perks outside the popular set */}
                                    {selectedPerkFilters
                                        .filter(p => !POPULAR_PERK_FILTERS.includes(p))
                                        .map(perk => (
                                            <button
                                                key={perk}
                                                type="button"
                                                onClick={() => togglePerkFilter(perk)}
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border border-primary bg-primary/25 text-primary shadow-[0_0_8px_rgba(91,163,255,0.25)] cursor-pointer"
                                            >
                                                <Check className="h-3 w-3 text-primary" />
                                                <span>{perk}</span>
                                                <X className="h-3 w-3 ml-0.5 opacity-70 hover:opacity-100" />
                                            </button>
                                        ))}

                                    {/* Quick "+ Add Perk" Dropdown Search */}
                                    <div className="relative">
                                        <Input
                                            value={perkDropdownSearch}
                                            onChange={e => setPerkDropdownSearch(e.target.value)}
                                            placeholder="+ Add perk…"
                                            className="h-7 w-28 rounded-md text-[11px] bg-muted/20 border-border/50 focus:w-40 transition-all"
                                        />
                                        {perkDropdownSearch && (
                                            <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-52 overflow-y-auto rounded-lg border border-border/80 bg-popover/95 p-1 shadow-xl backdrop-blur-md">
                                                {allPerkNames
                                                    .filter(
                                                        p =>
                                                            p.toLowerCase().includes(perkDropdownSearch.toLowerCase()) &&
                                                            !selectedPerkFilters.includes(p),
                                                    )
                                                    .slice(0, 8)
                                                    .map(perk => (
                                                        <button
                                                            key={perk}
                                                            type="button"
                                                            onClick={() => {
                                                                togglePerkFilter(perk);
                                                                setPerkDropdownSearch("");
                                                            }}
                                                            className="flex w-full items-center justify-between rounded px-2 py-1 text-xs text-foreground hover:bg-primary/20 hover:text-primary transition-colors text-left cursor-pointer"
                                                        >
                                                            <span>{perk}</span>
                                                            <Plus className="h-3 w-3 text-muted-foreground" />
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    {(selectedElement !== "all" ||
                                        selectedSubcategory !== "all" ||
                                        selectedPerkFilters.length > 0 ||
                                        searchQuery) && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                                <span>Reset all filters</span>
                                            </button>
                                        )}
                                </div>
                            </div>
                        </div>

                        {/* 5. Results Counter */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                            <span>
                                Showing <strong className="text-foreground">{filteredMetaBuilds.length}</strong>{" "}
                                {filteredMetaBuilds.length === 1 ? "build" : "builds"}
                                {showLikedOnly ? " (from your liked collection)" : ""} for{" "}
                                <strong className="text-foreground">{selectedWeapon === "all" ? "All Weapons" : selectedWeapon}</strong> ({selectedCategory === "all" ? "All Archetypes" : selectedCategory})
                                {selectedPerkFilters.length > 0 && (
                                    <span className="text-primary font-medium ml-1">
                                        • Matching: {selectedPerkFilters.join(" + ")}
                                    </span>
                                )}
                            </span>
                        </div>

                        {/* 6. Clean, Minimal Meta Build Cards Grid */}
                        {filteredMetaBuilds.length === 0 ? (
                            showLikedOnly ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line-2)] bg-[rgba(10,19,32,0.7)] py-16 px-6 text-center shadow-lg backdrop-blur-sm">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-400 mb-4">
                                        <Search className="h-7 w-7 text-amber-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">No Liked Builds Match Your Filters</h3>
                                    <p className="max-w-md text-sm text-[#b8c7db] leading-relaxed mb-6">
                                        None of your {likedBuilds.size} liked build{likedBuilds.size === 1 ? "" : "s"} match the selected weapon, archetype, or perk filters.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            resetFilters();
                                            setSelectedWeapon("all");
                                            setSelectedCategory("all");
                                        }}
                                        className="text-xs gap-1.5"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Reset Active Filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center">
                                    <Compass className="h-10 w-10 text-muted-foreground/60 mb-3" />
                                    <h4 className="text-base font-semibold text-foreground">No matching meta builds found</h4>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-md">
                                        No loadouts match your current combination of weapon, category, and filters.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={resetFilters}
                                        className="mt-4 text-xs gap-1.5"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Clear Active Filters
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredMetaBuilds.map(build => {
                                    const isHovered = hoveredCardId === build.buildId;
                                    const hasAnyHovered = hoveredCardId !== null;
                                    const isDimmed = hasAnyHovered && !isHovered;

                                    return (
                                        <div
                                            key={build.buildId}
                                            onClick={() => setInspectingBuild(build)}
                                            onMouseEnter={() => setHoveredCardId(build.buildId)}
                                            onMouseLeave={() => setHoveredCardId(null)}
                                            className={`group relative flex flex-col justify-between rounded-xl border border-border/70 bg-gradient-to-b from-card/95 via-card/85 to-card/75 p-4 shadow-sm transition-all duration-300 cursor-pointer ${isDimmed
                                                ? "opacity-35 scale-[0.985] filter blur-[0.2px]"
                                                : "opacity-100 hover:scale-[1.015] hover:border-primary/80 hover:shadow-xl hover:shadow-primary/10"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-3">
                                                {/* Header: Matchup Badge & Weapon Type */}
                                                <div className="flex items-center justify-between gap-2">
                                                    {build.vsElement ? (
                                                        <div
                                                            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border"
                                                            style={{
                                                                borderColor: `${elementColor(build.vsElement)}80`,
                                                                backgroundColor: `${elementColor(build.vsElement)}18`,
                                                                color: elementColor(build.vsElement),
                                                                textShadow: `0 0 8px ${elementColor(build.vsElement)}60`,
                                                            }}
                                                        >
                                                            <div className="relative h-3 w-3 flex-shrink-0">
                                                                <Image
                                                                    src={`/assets/icons/elements/${build.vsElement}.png`}
                                                                    alt={build.vsElement}
                                                                    fill
                                                                    sizes="12px"
                                                                    className="object-contain"
                                                                />
                                                            </div>
                                                            <span>VS {build.vsElement.toUpperCase()}</span>
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-primary/40 bg-primary/10 text-primary text-[10px] font-bold uppercase"
                                                        >
                                                            {build.subcategory === "heroics"
                                                                ? "Heroic Escalation"
                                                                : build.subcategory === "preEsca"
                                                                    ? "Pre-Escalation"
                                                                    : build.subcategory === "legendaries"
                                                                        ? "Legendary Esca"
                                                                        : build.category}
                                                        </Badge>
                                                    )}

                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] font-medium text-muted-foreground"
                                                    >
                                                        {build.weaponType}
                                                    </Badge>
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                    {build.title}
                                                </h4>

                                                {/* Weapon & Bond Line (Compact) */}
                                                <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2">
                                                    <div className="relative h-7 w-7 flex-shrink-0 rounded border border-border/60 bg-muted/40 p-0.5">
                                                        <Image
                                                            src={build.weaponIcon}
                                                            alt={build.weaponName}
                                                            fill
                                                            sizes="28px"
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1 text-xs">
                                                        <p className="font-semibold text-foreground truncate">{build.weaponName}</p>
                                                        {build.bondName ? (
                                                            <p className="text-[10px] text-muted-foreground truncate">
                                                                Bond: <span className="text-foreground/90 font-medium">{build.bondName}</span>
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] text-muted-foreground truncate">
                                                                Element: {build.weaponElement}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Omnicell & Lantern Pills */}
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border/40 bg-muted/15 px-2 py-1 min-w-0">
                                                        <div className="relative h-4 w-4 flex-shrink-0">
                                                            {build.omnicellIcon ? (
                                                                <Image
                                                                    src={build.omnicellIcon}
                                                                    alt={build.omnicellName || "Omnicell"}
                                                                    fill
                                                                    sizes="16px"
                                                                    className="object-contain"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full rounded-full bg-muted/40" />
                                                            )}
                                                        </div>
                                                        <span className="truncate text-[11px] font-medium text-foreground/90">
                                                            {build.omnicellName || "No Omnicell"}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border/40 bg-muted/15 px-2 py-1 min-w-0">
                                                        <div className="relative h-4 w-4 flex-shrink-0">
                                                            <Image
                                                                src={build.lanternIcon}
                                                                alt={build.lanternName}
                                                                fill
                                                                sizes="16px"
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        <span className="truncate text-[11px] font-medium text-foreground/90">
                                                            {build.lanternName}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Top 3 Core Perks Preview */}
                                                <div className="flex flex-wrap items-center gap-1">
                                                    {build.perks.slice(0, 3).map(perk => {
                                                        const rank = Math.min(6, perk.value);
                                                        return (
                                                            <span
                                                                key={perk.name}
                                                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${rank >= 6
                                                                    ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
                                                                    : "border-primary/40 bg-primary/10 text-primary"
                                                                    }`}
                                                            >
                                                                +{rank} {perk.name}
                                                            </span>
                                                        );
                                                    })}
                                                    {build.perks.length > 3 && (
                                                        <span className="rounded bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                            +{build.perks.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons Footer */}
                                            <div className="mt-3.5 pt-2.5 border-t border-border/40 flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyLink(build.buildId);
                                                        }}
                                                        className="p-1 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                                                        title="Copy share link"
                                                    >
                                                        {copiedBuildId === build.buildId ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>

                                                    <Link
                                                        href={`/b/${build.buildId}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                                                    >
                                                        <span>Builder</span>
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </div>

                                                {(() => {
                                                    const isLiked = likedBuilds.has(build.buildId);
                                                    const likeCount = likeCounts[build.buildId] ?? 0;

                                                    return (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleLike(build.buildId);
                                                            }}
                                                            className={cn(
                                                                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 cursor-pointer",
                                                                isLiked
                                                                    ? "border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                                                                    : "border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-border/80"
                                                            )}
                                                            title={isLiked ? "Unlike build" : "Like build"}
                                                            aria-label={`${likeCount} likes`}
                                                        >
                                                            <Heart
                                                                className={cn(
                                                                    "h-3.5 w-3.5 transition-transform duration-200",
                                                                    isLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground"
                                                                )}
                                                            />
                                                            <span className="font-semibold tabular-nums text-xs">{likeCount}</span>
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 7. Detailed Build Breakdown Dialog */}
                <Dialog
                    open={!!inspectingBuild}
                    onOpenChange={open => {
                        if (!open) setInspectingBuild(null);
                    }}
                >
                    <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[88vh] overflow-y-auto border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl">
                        {inspectingBuild && (
                            <div className="flex flex-col gap-5">
                                {/* Dialog Header */}
                                <DialogHeader className="gap-1 border-b border-border/40 pb-4 text-left">
                                    <div className="flex items-center gap-2">
                                        {inspectingBuild.vsElement ? (
                                            <div
                                                className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border"
                                                style={{
                                                    borderColor: `${elementColor(inspectingBuild.vsElement)}80`,
                                                    backgroundColor: `${elementColor(inspectingBuild.vsElement)}18`,
                                                    color: elementColor(inspectingBuild.vsElement),
                                                }}
                                            >
                                                <div className="relative h-3.5 w-3.5 flex-shrink-0">
                                                    <Image
                                                        src={`/assets/icons/elements/${inspectingBuild.vsElement}.png`}
                                                        alt={inspectingBuild.vsElement}
                                                        fill
                                                        sizes="14px"
                                                        className="object-contain"
                                                    />
                                                </div>
                                                <span>VS {inspectingBuild.vsElement.toUpperCase()}</span>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs">
                                                {inspectingBuild.category}
                                            </Badge>
                                        )}
                                        <Badge variant="secondary" className="text-xs">
                                            {inspectingBuild.weaponType}
                                        </Badge>
                                    </div>
                                    <DialogTitle className="text-xl font-bold text-foreground mt-1">
                                        {inspectingBuild.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        {inspectingBuild.category} Meta Loadout • Dauntless 1.14.7 Mystic Paradox
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Weapon & Bond Setup */}
                                <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                                            Weapon & Legendary Bond (Hover for details)
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <WeaponHoverTooltip
                                            name={inspectingBuild.weaponName}
                                            slottedCells={inspectingParsedBuild?.view.weapon?.cells}
                                        >
                                            <div className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/30 transition-colors">
                                                <div className="relative h-11 w-11 flex-shrink-0 rounded-lg border border-border/60 bg-muted/40 p-1">
                                                    <Image
                                                        src={inspectingBuild.weaponIcon}
                                                        alt={inspectingBuild.weaponName}
                                                        fill
                                                        sizes="44px"
                                                        className="object-contain"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                                                        {inspectingBuild.weaponName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Element: <span className="text-foreground/90 font-medium">{inspectingBuild.weaponElement}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </WeaponHoverTooltip>

                                        {inspectingBuild.bondName && (
                                            <WeaponHoverTooltip name={inspectingBuild.bondName} isBond>
                                                <div className="flex items-center gap-2.5 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-2 hover:border-primary/80 hover:bg-primary/20 hover:shadow-[0_0_12px_rgba(234,179,8,0.2)] transition-all cursor-help">
                                                    {inspectingBuild.bondIcon && (
                                                        <div className="relative h-7 w-7 flex-shrink-0">
                                                            <Image
                                                                src={inspectingBuild.bondIcon}
                                                                alt={inspectingBuild.bondName}
                                                                fill
                                                                sizes="28px"
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] uppercase font-bold text-primary block leading-none">
                                                                Bonded Weapon
                                                            </span>
                                                            <span className="text-[9px] text-muted-foreground leading-none">
                                                                (Hover)
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-foreground">
                                                            {inspectingBuild.bondName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </WeaponHoverTooltip>
                                        )}
                                    </div>
                                </div>

                                {/* Omnicell & Lantern with Hover Tooltips */}
                                <div className="grid grid-cols-2 gap-3">
                                    {inspectingBuild.omnicellName ? (
                                        <OmnicellHoverTooltip name={inspectingBuild.omnicellName}>
                                            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 hover:border-primary/50 transition-colors">
                                                <div className="relative h-8 w-8 flex-shrink-0">
                                                    {inspectingBuild.omnicellIcon ? (
                                                        <Image
                                                            src={inspectingBuild.omnicellIcon}
                                                            alt={inspectingBuild.omnicellName}
                                                            fill
                                                            sizes="32px"
                                                            className="object-contain"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full rounded-full bg-muted/40" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                                        Omnicell (Hover for details)
                                                    </span>
                                                    <p className="font-bold text-sm text-foreground truncate">
                                                        {inspectingBuild.omnicellName}
                                                    </p>
                                                </div>
                                            </div>
                                        </OmnicellHoverTooltip>
                                    ) : (
                                        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                                    Omnicell
                                                </span>
                                                <p className="font-bold text-sm text-muted-foreground truncate">
                                                    None Equipped
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <LanternHoverTooltip name={inspectingBuild.lanternName}>
                                        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 hover:border-primary/50 transition-colors">
                                            <div className="relative h-8 w-8 flex-shrink-0">
                                                <Image
                                                    src={inspectingBuild.lanternIcon}
                                                    alt={inspectingBuild.lanternName}
                                                    fill
                                                    sizes="32px"
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                                    Lantern (Hover for details)
                                                </span>
                                                <p className="font-bold text-sm text-foreground truncate">
                                                    {inspectingBuild.lanternName}
                                                </p>
                                            </div>
                                        </div>
                                    </LanternHoverTooltip>
                                </div>

                                {/* Armour Pieces Grid (Head, Torso, Arms, Legs) */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                            Armour Loadout & Inherent Perks (Hover for details)
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                        {[
                                            { piece: "Head", data: inspectingBuild.head, buildPiece: inspectingParsedBuild?.view.armour.head },
                                            { piece: "Torso", data: inspectingBuild.torso, buildPiece: inspectingParsedBuild?.view.armour.torso },
                                            { piece: "Arms", data: inspectingBuild.arms, buildPiece: inspectingParsedBuild?.view.armour.arms },
                                            { piece: "Legs", data: inspectingBuild.legs, buildPiece: inspectingParsedBuild?.view.armour.legs },
                                        ].map(({ piece, data, buildPiece }) => {
                                            const armourData = gameData.armours[data.name];
                                            const inherentPerk =
                                                buildPiece?.perks?.[0] ||
                                                armourData?.perks?.find(p => p.powerSurged) ||
                                                armourData?.perks?.[0];
                                            const slottedCell = buildPiece?.cells?.[0] || null;
                                            const slotType =
                                                slottedCell?.slot ||
                                                (armourData?.cells
                                                    ? Array.isArray(armourData.cells)
                                                        ? armourData.cells[0]
                                                        : armourData.cells
                                                    : null);

                                            return (
                                                <ArmourHoverTooltip
                                                    key={piece}
                                                    name={data.name}
                                                    piece={piece}
                                                    slottedCell={
                                                        slottedCell
                                                            ? {
                                                                cellName: slottedCell.cellName || "",
                                                                slot: slottedCell.slot || "",
                                                            }
                                                            : null
                                                    }
                                                >
                                                    <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/15 p-2.5 hover:border-primary/60 hover:bg-muted/25 transition-all h-full gap-2.5">
                                                        {/* Top: Piece icon & name */}
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="relative h-8 w-8 flex-shrink-0 rounded-md border border-border/50 bg-muted/30 p-0.5">
                                                                <Image
                                                                    src={data.icon}
                                                                    alt={data.name}
                                                                    fill
                                                                    sizes="32px"
                                                                    className="object-contain"
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-none">
                                                                    {piece}
                                                                </span>
                                                                <p className="text-xs font-bold text-foreground leading-tight truncate mt-0.5">
                                                                    {data.name}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* What it is giving: Inherent perk + Slotted cell */}
                                                        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-border/30">
                                                            {inherentPerk && (
                                                                <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded px-2 py-0.5">
                                                                    <span className="text-[9px] uppercase font-bold text-amber-400/80">Inherent</span>
                                                                    <span className="truncate font-bold">+{inherentPerk.value} {inherentPerk.name}</span>
                                                                </div>
                                                            )}

                                                            {slottedCell ? (
                                                                <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-foreground/90 bg-muted/30 border border-border/40 rounded px-2 py-0.5">
                                                                    <div className="flex items-center gap-1 min-w-0">
                                                                        {slottedCell.slot && (
                                                                            <div className="relative h-3 w-3 flex-shrink-0">
                                                                                <Image
                                                                                    src={cellTypeIcon(slottedCell.slot)}
                                                                                    alt={slottedCell.slot}
                                                                                    fill
                                                                                    sizes="12px"
                                                                                    className="object-contain"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        <span className="truncate">{slottedCell.cellName}</span>
                                                                    </div>
                                                                    {slottedCell.perks?.[0] && (
                                                                        <span className="text-[10px] text-primary font-bold shrink-0">
                                                                            +{slottedCell.perks[0].value}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : slotType ? (
                                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/20 border border-border/30 rounded px-2 py-0.5">
                                                                    <div className="relative h-3 w-3 flex-shrink-0">
                                                                        <Image
                                                                            src={cellTypeIcon(slotType)}
                                                                            alt={slotType}
                                                                            fill
                                                                            sizes="12px"
                                                                            className="object-contain"
                                                                        />
                                                                    </div>
                                                                    <span>{slotType} Slot</span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </ArmourHoverTooltip>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Active Perks Breakdown with Hover Tooltips */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                        Active Perks Breakdown (Hover for tier stats)
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {inspectingBuild.perks.map(perk => {
                                            const rank = Math.min(6, perk.value);
                                            const isMax = rank >= 6;
                                            return (
                                                <PerkTierHoverTooltip key={perk.name} name={perk.name} value={rank}>
                                                    <div
                                                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold hover:scale-105 transition-transform ${isMax
                                                            ? "border-amber-400/50 bg-amber-400/15 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.15)]"
                                                            : "border-primary/40 bg-primary/10 text-primary"
                                                            }`}
                                                    >
                                                        <span>+{rank}</span>
                                                        <span>{perk.name}</span>
                                                    </div>
                                                </PerkTierHoverTooltip>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slotted Cells */}
                                {inspectingBuild.cells && inspectingBuild.cells.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                Slotted Cells & Perk Stats
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {inspectingBuild.cells.length} cells slotted (+3 each)
                                            </span>
                                        </div>
                                        <div className="flex flex-col divide-y divide-border/30 rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                                            {inspectingBuild.cells.map((cell, idx) => {
                                                const perkName = cell.cellName.replace(/\s+Cell$/i, "");
                                                const perkDef = (gameData.perks as Record<string, any>)[perkName];
                                                const eff = perkDef?.effects?.["3"];
                                                const effDesc = eff ? formatPerkEffect(eff) : perkDef?.description || "Empowers your Slayer with specialized combat abilities.";
                                                const slotColor = cellTypeColor(cell.slot);

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 hover:bg-muted/30 transition-colors"
                                                    >
                                                        <div className="flex items-start sm:items-center gap-3 min-w-0 sm:w-[220px] shrink-0">
                                                            <div
                                                                className="relative h-9 w-9 shrink-0 rounded-lg border bg-muted/40 p-1 flex items-center justify-center"
                                                                style={{
                                                                    borderColor: `${slotColor}60`,
                                                                    backgroundColor: `${slotColor}15`,
                                                                }}
                                                            >
                                                                <Image
                                                                    src={`/assets/icons/perks/${cell.slot}.png`}
                                                                    alt={cell.slot}
                                                                    width={24}
                                                                    height={24}
                                                                    className="object-contain"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-bold text-foreground truncate">
                                                                    {cell.cellName}
                                                                </span>
                                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                                    PERK POINTS: 3
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-1 flex-col gap-0.5 min-w-0 sm:pl-2">
                                                            <p className="text-xs sm:text-[13px] leading-relaxed text-foreground/90 font-medium">
                                                                {highlightGameText(effDesc)}
                                                            </p>
                                                            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                                                ACTIVATES AT: 3 PERK POINTS
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Dialog Footer Actions */}
                                <DialogFooter className="mt-3 pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyLink(inspectingBuild.buildId)}
                                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                            {copiedBuildId === inspectingBuild.buildId ? (
                                                <>
                                                    <Check className="h-4 w-4 text-emerald-400" />
                                                    <span className="text-emerald-400">Link Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4 text-muted-foreground" />
                                                    <span>Copy Share Link</span>
                                                </>
                                            )}
                                        </button>

                                        {(() => {
                                            const isLiked = likedBuilds.has(inspectingBuild.buildId);
                                            const likeCount = likeCounts[inspectingBuild.buildId] ?? 0;

                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleLike(inspectingBuild.buildId)}
                                                    className={cn(
                                                        "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all duration-200 cursor-pointer",
                                                        isLiked
                                                            ? "border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                                                            : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                    )}
                                                    title={isLiked ? "Unlike build" : "Like build"}
                                                >
                                                    <Heart
                                                        className={cn(
                                                            "h-4 w-4 transition-transform duration-200",
                                                            isLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
                                                        )}
                                                    />
                                                    <span className="font-semibold tabular-nums text-xs">{likeCount}</span>
                                                </button>
                                            );
                                        })()}
                                    </div>

                                    <Link
                                        href={`/b/${inspectingBuild.buildId}`}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(91,163,255,0.3)] cursor-pointer"
                                    >
                                        <span>Open in Loadout Builder</span>
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
};

export default BuildSuggestions;
