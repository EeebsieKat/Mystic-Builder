"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    ExternalLink,
    Heart,
    Lightbulb,
    RotateCcw,
    Search,
    Shield,
    SlidersHorizontal,
    Swords,
    X,
} from "lucide-react";

import {
    CellChip,
    CellSlotChips,
    ElementChip,
    NoSlotsChip,
    PerkChip,
    PerkList,
    StatChip,
    TypeChip,
    WeaknessChip,
} from "@/components/chips";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { gameData } from "@/game/data";
import metaBuildsData from "@/game/meta-builds-indexed.json";
import type { Armour, Cell, Lantern, Omnicell, PerkValue, Weapon } from "@/game/types";
import { cellTypeColor, cellTypeIcon, cellTypeLabel, elementColor, getTextGlowStyle } from "@/lib/site";
import { getClientId, getClientFingerprint } from "@/lib/client-id";
import { highlightGameText } from "@/lib/game-text-highlighter";
import { cn } from "@/lib/utils";

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
    bondName: string | null;
    bondIcon: string | null;
    specialName: string | null;
    modName: string | null;
    omnicellName: string | null;
    omnicellIcon: string | null;
    lanternName: string;
    lanternIcon: string;
    perks: { name: string; value: number }[];
    cells: { slot: string; cellName: string }[];
    head: { name: string; icon: string };
    torso: { name: string; icon: string };
    arms: { name: string; icon: string };
    legs: { name: string; icon: string };
}

const interpolate = (
    text: string | null | undefined,
    values?: Record<string, string | number | null | undefined>,
): string => {
    if (!text) return "";
    return text
        .replace(/\{\{NL\}\}/g, "\n")
        .replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
            const value = values?.[key];
            return value !== undefined && value !== null ? String(value) : "?";
        });
};

const cleanText = (text: string | null | undefined): string => {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, "").trim();
};

const itemTemplateValues = (item: object): Record<string, string | null> => {
    const record = item as Record<string, unknown>;
    const element = (record.elemental ?? record.strength) as string | undefined;
    return {
        type: typeof record.type === "string" ? record.type.toLowerCase() : null,
        typeAlt: typeof record.type === "string" ? record.type : null,
        behemoth: typeof record.behemoth === "string" ? record.behemoth : null,
        element: element ?? null,
        elemental: element ?? null,
    };
};

const normalize = (value: string): string => value.toLowerCase().trim();

/* ------------------------------------------------------------------ */
/* Shared Types                                                        */
/* ------------------------------------------------------------------ */

interface PerkData {
    name: string;
    description: string;
    type: string;
    effects?: Record<string, { description: string | (string | null)[]; values?: Record<string, string | number> }>;
}

interface LanternItem extends Lantern {
    lantern_ability?: { hold?: string | null; instant?: string | null };
    values?: Record<string, string | number>;
}

interface OmnicellItem extends Omnicell {
    active_values?: Record<string, string | number>;
    passive_values?: Record<string, string | number>;
}

type SelectedItem =
    | { kind: "weapon"; data: Weapon }
    | { kind: "armour"; data: Armour }
    | { kind: "perk"; data: PerkData }
    | { kind: "cell"; data: Cell }
    | { kind: "lantern"; data: LanternItem }
    | { kind: "omnicell"; data: OmnicellItem };

const formatPerkEffect = (eff?: { description: string | (string | null)[]; values?: Record<string, string | number> }): string => {
    if (!eff) return "";
    const descs = Array.isArray(eff.description) ? eff.description.filter(Boolean) : [eff.description];
    return descs
        .map(str => interpolate(str as string, eff.values))
        .join(", ");
};

/* ------------------------------------------------------------------ */
/* Shared item card skeleton & visuals                                 */
/* ------------------------------------------------------------------ */

const IconBox = ({
    src,
    name,
    element,
    cellType,
    size = "sm",
}: {
    src: string;
    name: string;
    element?: string | null;
    cellType?: string | null;
    size?: "sm" | "lg";
}) => {
    const accent = element ? elementColor(element) : cellType ? cellTypeColor(cellType) : null;
    const boxClasses = size === "lg" ? "h-20 w-20 p-2.5 rounded-2xl" : cellType ? "h-14 w-14 p-1 rounded-xl" : "h-14 w-14 p-1.5 rounded-xl";
    const imgSize = size === "lg" ? 64 : 46;

    return (
        <div
            className={`relative flex ${boxClasses} shrink-0 items-center justify-center border border-border/70 bg-gradient-to-b from-muted/50 to-muted/20 shadow-inner transition-all duration-300 group-hover:scale-105`}
            style={{
                borderColor: accent ? `${accent}40` : undefined,
                boxShadow: accent ? `0 0 14px ${accent}15, inset 0 1px 2px rgba(255,255,255,0.08)` : undefined,
            }}
        >
            <Image
                src={src}
                alt={name}
                width={imgSize}
                height={imgSize}
                className="h-auto w-auto max-h-full max-w-full object-contain drop-shadow transition-transform duration-300 group-hover:scale-110"
            />
        </div>
    );
};

const EffectList = ({
    effects,
}: {
    effects: { name?: string; description: string; icon?: string; values?: Record<string, string | number> }[];
}) => {
    if (effects.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            {effects.map((effect, index) => {
                const text = effect.description.replace(/\{\{(\w+)\}\}/g, (_m, key: string) =>
                    effect.values && key in effect.values ? String(effect.values[key]) : "?",
                );

                return (
                    <div
                        key={index}
                        className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.04] p-3 text-xs text-muted-foreground leading-relaxed shadow-xs"
                    >
                        {effect.icon ? (
                            <Image
                                src={effect.icon}
                                alt=""
                                width={24}
                                height={24}
                                className="h-6 w-6 shrink-0 object-contain drop-shadow"
                            />
                        ) : (
                            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <span className="min-w-0 flex-1 whitespace-pre-line text-foreground/90 leading-relaxed">
                            {highlightGameText(cleanText(text))}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const ChipRow = ({ children }: { children: React.ReactNode }) => {
    const items = Array.isArray(children) ? children : [children];
    if (items.filter(Boolean).length === 0) {
        return null;
    }
    return <div className="flex flex-wrap items-center gap-1.5">{children}</div>;
};

const MetaRow = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-wrap items-center gap-1.5">{children}</div>
);

const ItemCard = ({
    icon,
    name,
    titleColor,
    subtitle,
    element,
    cellType,
    badge,
    footerNotice,
    onClick,
    children,
}: {
    icon?: string | null;
    name: string;
    titleColor?: string | null;
    subtitle?: string | null;
    element?: string | null;
    cellType?: string | null;
    badge?: React.ReactNode;
    footerNotice?: React.ReactNode;
    onClick?: () => void;
    children: React.ReactNode;
}) => {
    const accent = element ? elementColor(element) : cellType ? cellTypeColor(cellType) : (titleColor || "#ffffff");
    const glowColor = titleColor || accent || "#e2e8f0";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-gradient-to-b from-card/95 via-card/85 to-card/70 p-3.5 shadow-xs backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:border-primary/70 hover:shadow-xl hover:shadow-black/60 hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary select-none will-change-[transform,opacity]"
        >
            {/* Top glowing accent rule */}
            <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
                }}
                aria-hidden
            />

            <div className="flex min-h-0 flex-1 flex-col justify-between gap-2.5">
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                        {icon ? (
                            <IconBox src={icon} name={name} element={element} cellType={cellType} />
                        ) : null}
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 overflow-visible">
                            <div className="flex items-start justify-between gap-1.5 overflow-visible">
                                <h3
                                    className="font-semibold text-[14px] leading-snug overflow-visible transition-all group-hover:brightness-110"
                                    style={getTextGlowStyle(glowColor)}
                                >
                                    {name}
                                </h3>
                                {badge}
                            </div>
                            {subtitle ? (
                                <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground">
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-0.5">
                        {children}
                    </div>
                </div>

                {footerNotice !== undefined ? (
                    <div className="mt-auto min-h-[18px] pt-1">
                        {footerNotice}
                    </div>
                ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-primary">
                <span>View details</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Compact Row Renderers for the 10-item Paginated Grid                */
/* ------------------------------------------------------------------ */

const WeaponRow = ({ weapon, onSelect }: { weapon: Weapon; onSelect: () => void }) => {
    const hasUnique = Boolean(weapon.unique_effects && weapon.unique_effects.length > 0);
    const power = weapon.power.powerSurged ?? weapon.power.base;
    const glowColor = weapon.elemental ? elementColor(weapon.elemental) : "#e2e8f0";

    return (
        <ItemCard
            icon={weapon.icon}
            name={weapon.name}
            titleColor={glowColor}
            subtitle={weapon.type}
            element={weapon.elemental}
            onClick={onSelect}
            badge={
                <span className="rounded-md border border-primary/45 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Power {power}
                </span>
            }
            footerNotice={
                hasUnique ? (
                    <div className="text-[11px] font-medium text-amber-400/90">
                        <span>Unique Effect Included</span>
                    </div>
                ) : null
            }
        >
            <ChipRow>
                <CellSlotChips cells={weapon.cells} />
            </ChipRow>
            <PerkList perks={weapon.perks} />
        </ItemCard>
    );
};

const ArmourRow = ({ armour, onSelect }: { armour: Armour; onSelect: () => void }) => {
    const hasUnique = Boolean(armour.unique_effects && armour.unique_effects.length > 0);
    const res = armour.resistance.powerSurged ?? armour.resistance.base;
    const glowColor = armour.strength ? elementColor(armour.strength) : "#e2e8f0";

    return (
        <ItemCard
            icon={armour.icon}
            name={armour.name}
            titleColor={glowColor}
            subtitle={armour.type}
            element={armour.strength}
            onClick={onSelect}
            badge={
                <span className="rounded-md border border-primary/45 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Res {res}
                </span>
            }
            footerNotice={
                hasUnique ? (
                    <div className="text-[11px] font-medium text-amber-400/90">
                        <span>Unique Effect Included</span>
                    </div>
                ) : null
            }
        >
            <ChipRow>
                <CellSlotChips cells={armour.cells} />
            </ChipRow>
            <PerkList perks={armour.perks} />
        </ItemCard>
    );
};

const PerkRow = ({ perk, onSelect }: { perk: PerkData; onSelect: () => void }) => (
    <ItemCard
        icon={`/assets/icons/perks/${perk.type}.png`}
        name={perk.name}
        titleColor={cellTypeColor(perk.type)}
        subtitle={`${cellTypeLabel(perk.type)} Perk`}
        cellType={perk.type}
        onClick={onSelect}
        badge={
            <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                style={{
                    borderColor: `${cellTypeColor(perk.type)}40`,
                    backgroundColor: `${cellTypeColor(perk.type)}15`,
                    color: cellTypeColor(perk.type),
                }}
            >
                <Image
                    src={cellTypeIcon(perk.type)}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 shrink-0 object-contain"
                    aria-hidden
                />
                <span className="leading-none">{cellTypeLabel(perk.type)}</span>
            </span>
        }
    >
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {perk.description}
        </p>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
            <span>Ranks +1 to +6 progression</span>
        </div>
    </ItemCard>
);

const CellRow = ({ cell, onSelect }: { cell: Cell; onSelect: () => void }) => (
    <ItemCard
        icon={`/assets/icons/perks/${cell.slot}.png`}
        name={cell.name}
        titleColor={cellTypeColor(cell.slot)}
        subtitle={`${cellTypeLabel(cell.slot)} Cell`}
        cellType={cell.slot}
        onClick={onSelect}
        badge={
            <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                style={{
                    borderColor: `${cellTypeColor(cell.slot)}40`,
                    backgroundColor: `${cellTypeColor(cell.slot)}15`,
                    color: cellTypeColor(cell.slot),
                }}
            >
                <Image
                    src={cellTypeIcon(cell.slot)}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 shrink-0 object-contain"
                    aria-hidden
                />
                <span className="leading-none">{cellTypeLabel(cell.slot)}</span>
            </span>
        }
    >
        <p className="text-xs text-muted-foreground">
            Fits {cellTypeLabel(cell.slot)} sockets
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">+1</span>
            <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-300 font-medium">+2 Rare</span>
            <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-300 font-medium">+3 Epic</span>
        </div>
    </ItemCard>
);

const LanternRow = ({ lantern, onSelect }: { lantern: LanternItem; onSelect: () => void }) => (
    <ItemCard
        icon={lantern.icon}
        name={lantern.name}
        titleColor="#e0a33e"
        subtitle="Lantern Gear"
        cellType={typeof lantern.cells === "string" ? lantern.cells : Array.isArray(lantern.cells) ? lantern.cells[0] : null}
        onClick={onSelect}
        badge={
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Lantern
            </span>
        }
    >
        <ChipRow>
            <CellSlotChips cells={lantern.cells} />
        </ChipRow>
        <PerkList perks={lantern.perks} />
        <div className="text-[11px] text-muted-foreground">
            <span>Hold & Instant abilities</span>
        </div>
    </ItemCard>
);

const OmnicellRow = ({ omnicell, onSelect }: { omnicell: OmnicellItem; onSelect: () => void }) => (
    <ItemCard
        icon={omnicell.icon}
        name={omnicell.name}
        titleColor="#c58bea"
        subtitle="Combat Archetype"
        onClick={onSelect}
        badge={
            <span className="rounded-md border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                Omnicell
            </span>
        }
    >
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {omnicell.description}
        </p>
        <div className="text-[11px] text-purple-300">
            <span>Passive & Active Command</span>
        </div>
    </ItemCard>
);

/* ------------------------------------------------------------------ */
/* Weapon Suggested Meta Builds Option                                */
/* ------------------------------------------------------------------ */

const WeaponSuggestedBuilds = ({
    weaponName,
    weaponType,
}: {
    weaponName: string;
    weaponType: string;
}) => {
    const matchingBuilds = useMemo(() => {
        const lower = weaponName.toLowerCase();
        return (metaBuildsData.builds as IndexedMetaBuild[]).filter(
            b => b.weaponName.toLowerCase() === lower || (b.bondName && b.bondName.toLowerCase() === lower),
        );
    }, [weaponName]);

    // Don't show the builds in the dialog; if it has any, provide an option to open in the suggestion tab
    if (matchingBuilds.length === 0) return null;

    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent p-3.5 mt-2">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/45 bg-primary/20 text-primary shadow-xs">
                    <Lightbulb className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">Suggested Builds Available</span>
                        <span className="rounded-full bg-primary/25 border border-primary/40 px-2 py-0.5 text-[10px] font-bold text-primary">
                            {matchingBuilds.length} {matchingBuilds.length === 1 ? "build" : "builds"}
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        This weapon has {matchingBuilds.length} community meta loadout {matchingBuilds.length === 1 ? "guide" : "guides"}
                    </p>
                </div>
            </div>

            <Link
                href={`/?tab=suggestions&weapon=${encodeURIComponent(weaponType)}&q=${encodeURIComponent(weaponName)}&category=all`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(91,163,255,0.25)] cursor-pointer shrink-0"
            >
                <span>Open in Suggestions</span>
                <ExternalLink className="h-3.5 w-3.5" />
            </Link>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Item Detail Dialog (Modal on Click)                                 */
/* ------------------------------------------------------------------ */

const ItemDetailDialog = ({
    item,
    onClose,
}: {
    item: SelectedItem | null;
    onClose: () => void;
}) => {
    if (!item) return null;

    const renderDialogContent = () => {
        switch (item.kind) {
            case "weapon": {
                const weapon = item.data;
                const desc = cleanText(interpolate(weapon.description, itemTemplateValues(weapon)));
                const hasEffects = Boolean(weapon.unique_effects && weapon.unique_effects.length > 0);

                return (
                    <>
                        <DialogHeader className="gap-2 border-b border-border/50 pb-4 pr-12 text-left">
                            <div className="flex items-start gap-4">
                                <IconBox
                                    src={weapon.icon}
                                    name={weapon.name}
                                    element={weapon.elemental}
                                    size="lg"
                                />
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DialogTitle
                                            className="text-xl font-bold tracking-tight"
                                            style={getTextGlowStyle(weapon.elemental ? elementColor(weapon.elemental) : "#e2e8f0")}
                                        >
                                            {weapon.name}
                                        </DialogTitle>
                                        <span className="rounded-md border border-primary/45 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                            Power {weapon.power.powerSurged ?? weapon.power.base}
                                        </span>
                                    </div>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        {weapon.behemoth ? `Crafted from ${weapon.behemoth}` : `${weapon.type} Weapon`}
                                    </DialogDescription>
                                    <MetaRow>
                                        <TypeChip label={weapon.type} />
                                        <ElementChip element={weapon.elemental} />
                                    </MetaRow>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
                            {desc ? (
                                <p className="text-xs leading-relaxed text-muted-foreground italic border-l-2 border-primary/50 pl-3">
                                    {desc}
                                </p>
                            ) : null}

                            {/* Combat Statistics */}
                            <div className="flex flex-col gap-2">
                                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                                    <Swords className="h-3.5 w-3.5" />
                                    Combat Specifications
                                </h4>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Weapon Type</span>
                                        <p className="mt-0.5 font-semibold text-foreground">{weapon.type}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Base Power</span>
                                        <p className="mt-0.5 font-semibold text-foreground">{weapon.power.base}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Power Surged</span>
                                        <p className="mt-0.5 font-semibold text-primary">{weapon.power.powerSurged ?? "—"}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Element</span>
                                        <p className="mt-0.5 font-semibold text-foreground">{weapon.elemental ?? "Neutral"}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Damage Class</span>
                                        <p className="mt-0.5 font-semibold text-foreground">{weapon.damage ?? "Standard"}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Behemoth</span>
                                        <p className="mt-0.5 truncate font-semibold text-foreground">{weapon.behemoth ?? "Base Gear"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cell Sockets & Inherent Perks */}
                            <div className="flex flex-col gap-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Cell Sockets & Inherent Perks
                                </h4>
                                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                    <div className="flex flex-col gap-2">
                                        <div>
                                            <span className="text-[10.5px] font-semibold uppercase text-muted-foreground block mb-1">Cell Slots</span>
                                            <ChipRow>
                                                <CellSlotChips cells={weapon.cells} />
                                            </ChipRow>
                                        </div>
                                        {(weapon.perks && weapon.perks.length > 0) ? (
                                            <div className="border-t border-border/40 pt-2">
                                                <span className="text-[10.5px] font-semibold uppercase text-muted-foreground block mb-1">Inherent Perks</span>
                                                <PerkList perks={weapon.perks} className="text-xs" />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            {/* Unique Effects */}
                            {hasEffects ? (
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                        Unique Weapon Effects & Abilities
                                    </h4>
                                    <EffectList effects={weapon.unique_effects ?? []} />
                                </div>
                            ) : null}

                            {/* Suggested Meta Builds from Suggestions */}
                            <WeaponSuggestedBuilds weaponName={weapon.name} weaponType={weapon.type} />
                        </div>
                    </>
                );
            }

            case "armour": {
                const armour = item.data;
                const desc = cleanText(interpolate(armour.description, itemTemplateValues(armour)));
                const hasEffects = Boolean(armour.unique_effects && armour.unique_effects.length > 0);

                return (
                    <>
                        <DialogHeader className="gap-2 border-b border-border/50 pb-4 pr-12 text-left">
                            <div className="flex items-start gap-4">
                                <IconBox
                                    src={armour.icon}
                                    name={armour.name}
                                    element={armour.strength}
                                    size="lg"
                                />
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DialogTitle
                                            className="text-xl font-bold tracking-tight text-foreground"
                                            style={getTextGlowStyle(armour.strength ? elementColor(armour.strength) : "#e2e8f0")}
                                        >
                                            {armour.name}
                                        </DialogTitle>
                                        <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-semibold text-muted-foreground uppercase">
                                            {armour.type}
                                        </span>
                                    </div>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        {armour.behemoth ? `Crafted from ${armour.behemoth}` : `${armour.type} Armour`}
                                    </DialogDescription>
                                    <MetaRow>
                                        <TypeChip label={armour.type} />
                                        <ElementChip element={armour.strength} />
                                        {armour.weakness ? <WeaknessChip element={armour.weakness} /> : null}
                                    </MetaRow>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
                            {desc ? (
                                <p className="text-xs leading-relaxed text-muted-foreground italic border-l-2 border-primary/50 pl-3">
                                    {desc}
                                </p>
                            ) : null}

                            {/* Defensive Statistics */}
                            <div className="flex flex-col gap-2">
                                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                                    <Shield className="h-3.5 w-3.5" />
                                    Defensive Attributes
                                </h4>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Armour Slot</span>
                                        <p className="mt-0.5 font-semibold text-foreground">{armour.type}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Base Resistance</span>
                                        <p className="mt-0.5 font-semibold text-foreground">{armour.resistance.base}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Power Surged</span>
                                        <p className="mt-0.5 font-semibold text-primary">{armour.resistance.powerSurged ?? "—"}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Elemental Strength</span>
                                        <p className="mt-0.5 font-semibold text-foreground">{armour.strength ?? "Neutral"}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Elemental Weakness</span>
                                        <p className="mt-0.5 font-semibold text-foreground">{armour.weakness ?? "None"}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">Behemoth</span>
                                        <p className="mt-0.5 truncate font-semibold text-foreground">{armour.behemoth ?? "Base Gear"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cell Sockets & Inherent Perks */}
                            <div className="flex flex-col gap-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Cell Sockets & Inherent Perks
                                </h4>
                                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                    <div className="flex flex-col gap-2">
                                        <div>
                                            <span className="text-[10.5px] font-semibold uppercase text-muted-foreground block mb-1">Cell Slot</span>
                                            <ChipRow>
                                                <CellSlotChips cells={armour.cells} />
                                            </ChipRow>
                                        </div>
                                        {(armour.perks && armour.perks.length > 0) ? (
                                            <div className="border-t border-border/40 pt-2">
                                                <span className="text-[10.5px] font-semibold uppercase text-muted-foreground block mb-1">Inherent Perks</span>
                                                <PerkList perks={armour.perks} className="text-xs" />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            {hasEffects ? (
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                        Unique Armour Effects
                                    </h4>
                                    <EffectList effects={armour.unique_effects ?? []} />
                                </div>
                            ) : null}
                        </div>
                    </>
                );
            }

            case "perk": {
                const perk = item.data;
                const ranks = [1, 2, 3, 4, 5, 6];

                return (
                    <>
                        <DialogHeader className="gap-2 border-b border-border/50 pb-4 pr-12 text-left">
                            <div className="flex items-start gap-4">
                                <IconBox
                                    src={`/assets/icons/perks/${perk.type}.png`}
                                    name={perk.name}
                                    cellType={perk.type}
                                    size="lg"
                                />
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DialogTitle
                                            className="text-xl font-bold tracking-tight text-foreground"
                                            style={getTextGlowStyle(cellTypeColor(perk.type))}
                                        >
                                            {perk.name}
                                        </DialogTitle>
                                        <span
                                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                                            style={{
                                                borderColor: `${cellTypeColor(perk.type)}40`,
                                                backgroundColor: `${cellTypeColor(perk.type)}15`,
                                                color: cellTypeColor(perk.type),
                                            }}
                                        >
                                            <Image
                                                src={cellTypeIcon(perk.type)}
                                                alt=""
                                                width={18}
                                                height={18}
                                                className="h-4.5 w-4.5 shrink-0 object-contain"
                                                aria-hidden
                                            />
                                            <span className="leading-none">{cellTypeLabel(perk.type)}</span>
                                        </span>
                                    </div>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        {cellTypeLabel(perk.type)} Perk Progression
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
                            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-foreground/90">
                                <span className="font-semibold text-primary block mb-0.5">Overview</span>
                                {perk.description}
                            </div>

                            <div className="flex flex-col gap-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Rank Progression (+1 to +6)
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {ranks.map(rank => {
                                        const eff = perk.effects?.[String(rank)];
                                        const formatted = eff ? formatPerkEffect(eff) : null;
                                        const isMax = rank === 6;

                                        return (
                                            <div
                                                key={rank}
                                                className={`flex items-start gap-3 rounded-lg border p-2.5 text-xs transition-colors ${
                                                    isMax
                                                        ? "border-primary/50 bg-primary/[0.07] shadow-xs"
                                                        : "border-border/60 bg-muted/15"
                                                }`}
                                            >
                                                <div className="flex shrink-0 items-center gap-1.5">
                                                    <span
                                                        className={`flex h-6 min-w-8 items-center justify-center rounded-md font-bold px-1.5 ${
                                                            isMax
                                                                ? "bg-primary text-primary-foreground"
                                                                : "border border-border/70 bg-card text-foreground"
                                                        }`}
                                                    >
                                                        +{rank}
                                                    </span>
                                                    {isMax ? (
                                                        <span className="rounded-sm bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                                                            Max
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="min-w-0 flex-1 leading-relaxed text-foreground/90 pt-0.5">
                                                    {formatted ? cleanText(formatted) : perk.description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                );
            }

            case "cell": {
                const cell = item.data;

                return (
                    <>
                        <DialogHeader className="gap-2 border-b border-border/50 pb-4 pr-12 text-left">
                            <div className="flex items-start gap-4">
                                <IconBox
                                    src={`/assets/icons/perks/${cell.slot}.png`}
                                    name={cell.name}
                                    cellType={cell.slot}
                                    size="lg"
                                />
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DialogTitle
                                            className="text-xl font-bold tracking-tight text-foreground"
                                            style={getTextGlowStyle(cellTypeColor(cell.slot))}
                                        >
                                            {cell.name}
                                        </DialogTitle>
                                        <span
                                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                                            style={{
                                                borderColor: `${cellTypeColor(cell.slot)}40`,
                                                backgroundColor: `${cellTypeColor(cell.slot)}15`,
                                                color: cellTypeColor(cell.slot),
                                            }}
                                        >
                                            <Image
                                                src={cellTypeIcon(cell.slot)}
                                                alt=""
                                                width={18}
                                                height={18}
                                                className="h-4.5 w-4.5 shrink-0 object-contain"
                                                aria-hidden
                                            />
                                            <span className="leading-none">{cellTypeLabel(cell.slot)}</span>
                                        </span>
                                    </div>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        Socketable {cellTypeLabel(cell.slot)} Power Core
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
                            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                                Fits into any equipment with a{" "}
                                <span className="font-semibold text-foreground">{cellTypeLabel(cell.slot)}</span> or{" "}
                                <span className="font-semibold text-foreground">Prismatic</span> cell socket.
                            </div>

                            <div className="flex flex-col gap-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Available Cell Tiers
                                </h4>
                                <div className="flex flex-col gap-2.5">
                                    {Object.entries(cell.variants).map(([variantName, variant]) => {
                                        const perkText = Object.entries(variant.perks)
                                            .map(([perk, value]) => `${perk} +${value}`)
                                            .join(", ");
                                        const tier = variantName.startsWith("+1") ? "+1" : variantName.startsWith("+2") ? "+2" : "+3";
                                        const isEpic = tier === "+3";
                                        const isRare = tier === "+2";

                                        return (
                                            <div
                                                key={variantName}
                                                className={`flex items-center justify-between rounded-lg border p-3 text-xs ${
                                                    isEpic
                                                        ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
                                                        : isRare
                                                          ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                                                          : "border-border/60 bg-muted/20 text-muted-foreground"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-base font-bold">{tier}</span>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">{variantName}</span>
                                                        <span className="text-[11px] capitalize opacity-80">{variant.rarity} Rarity</span>
                                                    </div>
                                                </div>
                                                <div className="rounded-md border border-border/50 bg-background/50 px-3 py-1 font-semibold text-foreground">
                                                    {perkText}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                );
            }

            case "lantern": {
                const lantern = item.data;
                const hold = lantern.lantern_ability?.hold ? cleanText(interpolate(lantern.lantern_ability.hold, lantern.values)) : null;
                const instant = lantern.lantern_ability?.instant ? cleanText(interpolate(lantern.lantern_ability.instant, lantern.values)) : null;

                return (
                    <>
                        <DialogHeader className="gap-2 border-b border-border/50 pb-4 pr-12 text-left">
                            <div className="flex items-start gap-4">
                                <IconBox
                                    src={lantern.icon}
                                    name={lantern.name}
                                    size="lg"
                                />
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DialogTitle
                                            className="text-xl font-bold tracking-tight text-foreground"
                                            style={getTextGlowStyle("#e0a33e")}
                                        >
                                            {lantern.name}
                                        </DialogTitle>
                                        <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                            Lantern
                                        </span>
                                    </div>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        Lantern Equipment
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
                            <div className="flex flex-col gap-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Cell Sockets & Inherent Perks
                                </h4>
                                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                    <ChipRow>
                                        <CellSlotChips cells={lantern.cells} />
                                    </ChipRow>
                                    <PerkList perks={lantern.perks} className="mt-2 text-xs" />
                                </div>
                            </div>

                            {hold ? (
                                <div className="flex flex-col gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.04] p-3 text-xs leading-relaxed">
                                    <span className="font-bold tracking-wide text-primary uppercase text-[11px]">
                                        Hold Ability
                                    </span>
                                    <span className="text-foreground/90 whitespace-pre-line">{hold}</span>
                                </div>
                            ) : null}

                            {instant ? (
                                <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-3 text-xs leading-relaxed">
                                    <span className="font-bold tracking-wide text-muted-foreground uppercase text-[11px]">
                                        Instant Ability
                                    </span>
                                    <span className="text-foreground/90 whitespace-pre-line">{instant}</span>
                                </div>
                            ) : null}
                        </div>
                    </>
                );
            }

            case "omnicell": {
                const omnicell = item.data;
                const passive = omnicell.passive ? cleanText(interpolate(omnicell.passive, omnicell.passive_values)) : null;
                const active = omnicell.active ? cleanText(interpolate(omnicell.active, omnicell.active_values)) : null;

                return (
                    <>
                        <DialogHeader className="gap-2 border-b border-border/50 pb-4 pr-12 text-left">
                            <div className="flex items-start gap-4">
                                <IconBox
                                    src={omnicell.icon}
                                    name={omnicell.name}
                                    size="lg"
                                />
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DialogTitle
                                            className="text-xl font-bold tracking-tight text-foreground"
                                            style={getTextGlowStyle("#c58bea")}
                                        >
                                            {omnicell.name}
                                        </DialogTitle>
                                        <span className="rounded-md border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 text-xs font-semibold text-purple-300">
                                            Omnicell
                                        </span>
                                    </div>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        Core Combat Archetype
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
                            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                                {omnicell.description}
                            </div>

                            {passive ? (
                                <div className="flex flex-col gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.04] p-3 text-xs leading-relaxed">
                                    <span className="font-bold tracking-wider text-primary uppercase text-[11px]">
                                        Passive Ability
                                    </span>
                                    <span className="text-foreground/90 whitespace-pre-line">{passive}</span>
                                </div>
                            ) : null}

                            {active ? (
                                <div className="flex flex-col gap-2 rounded-lg border border-sky-500/25 bg-sky-500/[0.05] p-3 text-xs leading-relaxed">
                                    <div className="flex items-center gap-2">
                                        {omnicell.ability_icon ? (
                                            <Image
                                                src={omnicell.ability_icon}
                                                alt=""
                                                width={24}
                                                height={24}
                                                className="h-6 w-6 object-contain"
                                            />
                                        ) : null}
                                        <span className="font-bold tracking-wider text-sky-400 uppercase text-[11px]">
                                            Active Command
                                        </span>
                                    </div>
                                    <span className="text-foreground/90 whitespace-pre-line">{active}</span>
                                </div>
                            ) : null}
                        </div>
                    </>
                );
            }
        }
    };

    return (
        <Dialog open={item !== null} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-card border-border/80 shadow-2xl p-6">
                {renderDialogContent()}
            </DialogContent>
        </Dialog>
    );
};

/* ------------------------------------------------------------------ */
/* Filter & Pagination Constants                                       */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 12;

const ELEMENTS = [
    { label: "Neutral", value: "Neutral", color: "#8E8E93" },
    { label: "Blaze", value: "Blaze", color: "#E25822", icon: "/assets/icons/elements/Blaze.png" },
    { label: "Frost", value: "Frost", color: "#6EC6E8", icon: "/assets/icons/elements/Frost.png" },
    { label: "Shock", value: "Shock", color: "#F3C13A", icon: "/assets/icons/elements/Shock.png" },
    { label: "Terra", value: "Terra", color: "#6FBF4B", icon: "/assets/icons/elements/Terra.png" },
    { label: "Radiant", value: "Radiant", color: "#EFD97F", icon: "/assets/icons/elements/Radiant.png" },
    { label: "Umbral", value: "Umbral", color: "#8A5FE8", icon: "/assets/icons/elements/Umbral.png" },
];

const WEAPON_TYPES = [
    "Aether Strikers",
    "Axe",
    "Chain Blades",
    "Hammer",
    "Repeater",
    "Sword",
    "War Pike",
];

const ARMOUR_SLOTS = ["Head", "Torso", "Arms", "Legs"];

const CELL_SLOTS = [
    { label: "Alacrity", value: "Alacrity", color: "#C58BEA", icon: "/assets/icons/perks/Alacrity.png" },
    { label: "Brutality", value: "Brutality", color: "#E88C3A", icon: "/assets/icons/perks/Brutality.png" },
    { label: "Finesse", value: "Finesse", color: "#4FCE8B", icon: "/assets/icons/perks/Finesse.png" },
    { label: "Fortitude", value: "Fortitude", color: "#E2574C", icon: "/assets/icons/perks/Fortitude.png" },
    { label: "Insight", value: "Insight", color: "#EFC94C", icon: "/assets/icons/perks/Insight.png" },
    { label: "Prismatic", value: "Prismatic", color: "#9FD8CB", icon: "/assets/icons/perks/Prismatic.png" },
];

const MISC_KINDS = [
    { label: "All", value: "all" },
    { label: "Lanterns", value: "lantern" },
    { label: "Omnicells", value: "omnicell" },
];

/* ------------------------------------------------------------------ */
/* Search with Filter Drawer                                           */
/* ------------------------------------------------------------------ */

interface FilterOption {
    label: string;
    value: string;
    color?: string;
    icon?: string;
}

interface FilterGroup {
    title: string;
    options: FilterOption[];
    selected: string | null;
    onChange: (val: string | null) => void;
}

const SearchWithFilters = ({
    value,
    onChange,
    placeholder,
    filters,
    isOpen,
    onOpen,
    onToggle,
    onClearAll,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    filters: FilterGroup[];
    isOpen: boolean;
    onOpen: () => void;
    onToggle: () => void;
    onClearAll: () => void;
}) => {
    const activeCount = filters.filter(f => f.selected !== null).length;

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                        value={value}
                        onChange={event => onChange(event.target.value)}
                        onClick={onOpen}
                        onFocus={onOpen}
                        placeholder={placeholder}
                        className="pl-9 pr-8"
                        aria-label={placeholder}
                    />
                    {value ? (
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label="Clear search text"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
                <Button
                    type="button"
                    variant={isOpen || activeCount > 0 ? "default" : "outline"}
                    size="sm"
                    onClick={onToggle}
                    className="flex h-9 items-center gap-1.5 px-3"
                    title={isOpen ? "Hide filters" : "Show filters"}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Filters</span>
                    {activeCount > 0 ? (
                        <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-background/90 px-1 text-[10px] font-bold text-foreground">
                            {activeCount}
                        </span>
                    ) : null}
                </Button>
            </div>

            {/* Collapsible filters panel - only visible when input is clicked or toggled */}
            {isOpen ? (
                <div className="rounded-lg border border-border/70 bg-card/75 p-3.5 shadow-sm backdrop-blur-sm transition-all duration-200">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Filter Options
                        </span>
                        <div className="flex items-center gap-2">
                            {activeCount > 0 ? (
                                <button
                                    type="button"
                                    onClick={onClearAll}
                                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    Reset filters
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={onToggle}
                                className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {filters.map(group => (
                            <div key={group.title} className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                                <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
                                    {group.title}:
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => group.onChange(null)}
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                                            group.selected === null
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "border border-border/60 bg-muted/30 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                                        }`}
                                    >
                                        All
                                    </button>
                                    {group.options.map(opt => {
                                        const isSelected = group.selected === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => group.onChange(isSelected ? null : opt.value)}
                                                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground shadow-xs"
                                                        : "border border-border/60 bg-muted/30 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                                                }`}
                                            >
                                                {opt.icon ? (
                                                    <Image
                                                        src={opt.icon}
                                                        alt=""
                                                        width={14}
                                                        height={14}
                                                        className="h-3.5 w-3.5 object-contain"
                                                    />
                                                ) : opt.color ? (
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: opt.color }}
                                                    />
                                                ) : null}
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Pagination Component                                                */
/* ------------------------------------------------------------------ */

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize = 12,
    position = "bottom",
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize?: number;
    position?: "top" | "bottom";
    onPageChange: (page: number) => void;
}) => {
    if (totalItems === 0) return null;

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    const wrapperClasses =
        position === "top"
            ? "mt-4 mb-3 flex flex-col items-center justify-between gap-4 border-b border-border/50 pb-4 sm:flex-row"
            : "mt-6 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-4 sm:flex-row";

    return (
        <div className={wrapperClasses}>
            <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{start}–{end}</span> of{" "}
                <span className="font-semibold text-foreground">{totalItems}</span> items
            </p>
            {totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 px-2.5 text-xs"
                    >
                        <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                        Previous
                    </Button>
                    {getPageNumbers().map((p, idx) =>
                        p === "..." ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                                …
                            </span>
                        ) : (
                            <Button
                                key={`page-${p}`}
                                variant={currentPage === p ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPageChange(Number(p))}
                                className={`h-8 min-w-8 px-2 text-xs ${
                                    currentPage === p
                                        ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                                }`}
                            >
                                {p}
                            </Button>
                        ),
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 px-2.5 text-xs"
                    >
                        Next
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                </div>
            ) : null}
        </div>
    );
};

const Grid = ({ children }: { children: React.ReactNode }) => (
    <div className="card-focus-grid mt-4 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
    </div>
);

const EmptyState = ({ onReset }: { onReset: () => void }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <p className="text-sm font-medium text-foreground">No items match your search and filter criteria</p>
        <p className="mt-1 text-xs">Try adjusting your keywords or clearing the active filters.</p>
        <Button variant="outline" size="sm" onClick={onReset} className="mt-4">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset search & filters
        </Button>
    </div>
);

/* ------------------------------------------------------------------ */
/* Main Database Browser Component                                     */
/* ------------------------------------------------------------------ */

const DatabaseBrowser = () => {
    // Modal dialog state
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

    // Search queries
    const [weaponQuery, setWeaponQuery] = useState("");
    const [armourQuery, setArmourQuery] = useState("");
    const [perkQuery, setPerkQuery] = useState("");
    const [cellQuery, setCellQuery] = useState("");
    const [miscQuery, setMiscQuery] = useState("");

    // Filter states
    const [weaponElement, setWeaponElement] = useState<string | null>(null);
    const [weaponType, setWeaponType] = useState<string | null>(null);

    const [armourSlot, setArmourSlot] = useState<string | null>(null);
    const [armourElement, setArmourElement] = useState<string | null>(null);

    const [perkSlot, setPerkSlot] = useState<string | null>(null);
    const [cellSlot, setCellSlot] = useState<string | null>(null);

    const [miscKind, setMiscKind] = useState<string | null>(null);

    // Collapsible drawer toggle states
    const [weaponFiltersOpen, setWeaponFiltersOpen] = useState(false);
    const [armourFiltersOpen, setArmourFiltersOpen] = useState(false);
    const [perkFiltersOpen, setPerkFiltersOpen] = useState(false);
    const [cellFiltersOpen, setCellFiltersOpen] = useState(false);
    const [miscFiltersOpen, setMiscFiltersOpen] = useState(false);

    // Pagination states (1-based index)
    const [weaponPage, setWeaponPage] = useState(1);
    const [armourPage, setArmourPage] = useState(1);
    const [perkPage, setPerkPage] = useState(1);
    const [cellPage, setCellPage] = useState(1);
    const [miscPage, setMiscPage] = useState(1);

    // Reset pagination to 1 whenever search query or filters change
    useEffect(() => { setWeaponPage(1); }, [weaponQuery, weaponElement, weaponType]);
    useEffect(() => { setArmourPage(1); }, [armourQuery, armourSlot, armourElement]);
    useEffect(() => { setPerkPage(1); }, [perkQuery, perkSlot]);
    useEffect(() => { setCellPage(1); }, [cellQuery, cellSlot]);
    useEffect(() => { setMiscPage(1); }, [miscQuery, miscKind]);

    // Filtered collections
    const weapons = useMemo(() => {
        return Object.values(gameData.weapons)
            .filter(weapon => {
                if (weaponQuery) {
                    const q = normalize(weaponQuery);
                    const text = normalize(`${weapon.name} ${weapon.behemoth ?? ""} ${weapon.type} ${weapon.elemental ?? "Neutral"}`);
                    if (!text.includes(q)) return false;
                }
                if (weaponElement) {
                    if (weaponElement === "Neutral") {
                        if (weapon.elemental !== null) return false;
                    } else if (weapon.elemental !== weaponElement) {
                        return false;
                    }
                }
                if (weaponType && weapon.type !== weaponType) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    }, [weaponQuery, weaponElement, weaponType]);

    const armours = useMemo(() => {
        return Object.values(gameData.armours)
            .filter(armour => {
                if (armourQuery) {
                    const q = normalize(armourQuery);
                    const text = normalize(`${armour.name} ${armour.behemoth ?? ""} ${armour.type} ${armour.strength ?? "Neutral"}`);
                    if (!text.includes(q)) return false;
                }
                if (armourSlot && armour.type !== armourSlot) {
                    return false;
                }
                if (armourElement) {
                    if (armourElement === "Neutral") {
                        if (armour.strength !== null) return false;
                    } else if (armour.strength !== armourElement) {
                        return false;
                    }
                }
                return true;
            })
            .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    }, [armourQuery, armourSlot, armourElement]);

    const perks = useMemo(() => {
        return Object.values(gameData.perks)
            .filter(perk => {
                if (perkQuery) {
                    const q = normalize(perkQuery);
                    const text = normalize(`${perk.name} ${perk.type} ${perk.description}`);
                    if (!text.includes(q)) return false;
                }
                if (perkSlot && perk.type !== perkSlot) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    }, [perkQuery, perkSlot]);

    const cells = useMemo(() => {
        return Object.values(gameData.cells)
            .filter(cell => {
                if (cellQuery) {
                    const q = normalize(cellQuery);
                    const text = normalize(`${cell.name} ${cell.slot}`);
                    if (!text.includes(q)) return false;
                }
                if (cellSlot && cell.slot !== cellSlot) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => a.slot.localeCompare(b.slot) || a.name.localeCompare(b.name));
    }, [cellQuery, cellSlot]);

    const miscItems = useMemo(() => {
        const q = normalize(miscQuery);
        const lList = (miscKind === null || miscKind === "all" || miscKind === "lantern")
            ? (Object.values(gameData.lanterns) as LanternItem[])
                .filter(lantern => {
                    if (!q) return true;
                    const text = `${lantern.name} ${lantern.lantern_ability?.hold ?? ""}`;
                    return normalize(text).includes(q);
                })
                .map(item => ({ kind: "lantern" as const, item }))
            : [];
        const oList = (miscKind === null || miscKind === "all" || miscKind === "omnicell")
            ? (Object.values(gameData.omnicells) as OmnicellItem[])
                .filter(omnicell => {
                    if (!q) return true;
                    const text = `${omnicell.name} ${omnicell.active ?? ""} ${omnicell.passive ?? ""}`;
                    return normalize(text).includes(q);
                })
                .map(item => ({ kind: "omnicell" as const, item }))
            : [];
        return [...lList, ...oList].sort((a, b) => a.item.name.localeCompare(b.item.name));
    }, [miscQuery, miscKind]);

    // Paginated slices (10 items per page)
    const paginatedWeapons = useMemo(() => {
        const start = (weaponPage - 1) * PAGE_SIZE;
        return weapons.slice(start, start + PAGE_SIZE);
    }, [weapons, weaponPage]);

    const paginatedArmours = useMemo(() => {
        const start = (armourPage - 1) * PAGE_SIZE;
        return armours.slice(start, start + PAGE_SIZE);
    }, [armours, armourPage]);

    const paginatedPerks = useMemo(() => {
        const start = (perkPage - 1) * PAGE_SIZE;
        return perks.slice(start, start + PAGE_SIZE);
    }, [perks, perkPage]);

    const paginatedCells = useMemo(() => {
        const start = (cellPage - 1) * PAGE_SIZE;
        return cells.slice(start, start + PAGE_SIZE);
    }, [cells, cellPage]);

    const paginatedMisc = useMemo(() => {
        const start = (miscPage - 1) * PAGE_SIZE;
        return miscItems.slice(start, start + PAGE_SIZE);
    }, [miscItems, miscPage]);

    // Total page counts
    const totalWeaponPages = Math.max(1, Math.ceil(weapons.length / PAGE_SIZE));
    const totalArmourPages = Math.max(1, Math.ceil(armours.length / PAGE_SIZE));
    const totalPerkPages = Math.max(1, Math.ceil(perks.length / PAGE_SIZE));
    const totalCellPages = Math.max(1, Math.ceil(cells.length / PAGE_SIZE));
    const totalMiscPages = Math.max(1, Math.ceil(miscItems.length / PAGE_SIZE));

    const [activeTab, setActiveTab] = useState("weapons");

    const databaseTabs = [
        { value: "weapons", label: `Weapons (${weapons.length})` },
        { value: "armour", label: `Armour (${armours.length})` },
        { value: "perks", label: `Perks (${perks.length})` },
        { value: "cells", label: `Cells (${cells.length})` },
        { value: "misc", label: `Lanterns & Omnicells (${miscItems.length})` },
    ];

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="relative flex w-full flex-wrap justify-center items-center gap-2 bg-transparent border-none shadow-none p-0">
                {databaseTabs.map(tab => {
                    const isActive = activeTab === tab.value;
                    return (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                                isActive
                                    ? "text-primary font-semibold drop-shadow-[0_0_8px_rgba(91,163,255,0.4)]"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span>{tab.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="databaseTabUnderline"
                                    className="absolute bottom-0 inset-x-0 mx-auto h-[2.5px] w-8 rounded-full bg-primary shadow-[0_0_8px_rgba(91,163,255,0.8),0_0_14px_rgba(91,163,255,0.4)]"
                                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                />
                            )}
                        </TabsTrigger>
                    );
                })}
            </TabsList>

            {/* Item Detail Modal Dialog */}
            <ItemDetailDialog
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />

            {/* Weapons Tab */}
            <TabsContent value="weapons" className="mt-4">
                <SearchWithFilters
                    value={weaponQuery}
                    onChange={setWeaponQuery}
                    placeholder="Search weapons by name, behemoth, element or type…"
                    isOpen={weaponFiltersOpen}
                    onOpen={() => setWeaponFiltersOpen(true)}
                    onToggle={() => setWeaponFiltersOpen(prev => !prev)}
                    onClearAll={() => {
                        setWeaponElement(null);
                        setWeaponType(null);
                    }}
                    filters={[
                        {
                            title: "Element",
                            options: ELEMENTS,
                            selected: weaponElement,
                            onChange: setWeaponElement,
                        },
                        {
                            title: "Type",
                            options: WEAPON_TYPES.map(t => ({ label: t, value: t })),
                            selected: weaponType,
                            onChange: setWeaponType,
                        },
                    ]}
                />

                {paginatedWeapons.length === 0 ? (
                    <EmptyState
                        onReset={() => {
                            setWeaponQuery("");
                            setWeaponElement(null);
                            setWeaponType(null);
                        }}
                    />
                ) : (
                    <>
                        <Pagination
                            position="top"
                            currentPage={weaponPage}
                            totalPages={totalWeaponPages}
                            totalItems={weapons.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setWeaponPage}
                        />
                        <Grid>
                            {paginatedWeapons.map(weapon => (
                                <WeaponRow
                                    key={weapon.name}
                                    weapon={weapon}
                                    onSelect={() => setSelectedItem({ kind: "weapon", data: weapon })}
                                />
                            ))}
                        </Grid>
                        <Pagination
                            position="bottom"
                            currentPage={weaponPage}
                            totalPages={totalWeaponPages}
                            totalItems={weapons.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setWeaponPage}
                        />
                    </>
                )}
            </TabsContent>

            {/* Armour Tab */}
            <TabsContent value="armour" className="mt-4">
                <SearchWithFilters
                    value={armourQuery}
                    onChange={setArmourQuery}
                    placeholder="Search armour by name, behemoth, slot or element…"
                    isOpen={armourFiltersOpen}
                    onOpen={() => setArmourFiltersOpen(true)}
                    onToggle={() => setArmourFiltersOpen(prev => !prev)}
                    onClearAll={() => {
                        setArmourSlot(null);
                        setArmourElement(null);
                    }}
                    filters={[
                        {
                            title: "Slot",
                            options: ARMOUR_SLOTS.map(slot => ({ label: slot, value: slot })),
                            selected: armourSlot,
                            onChange: setArmourSlot,
                        },
                        {
                            title: "Element",
                            options: ELEMENTS,
                            selected: armourElement,
                            onChange: setArmourElement,
                        },
                    ]}
                />

                {paginatedArmours.length === 0 ? (
                    <EmptyState
                        onReset={() => {
                            setArmourQuery("");
                            setArmourSlot(null);
                            setArmourElement(null);
                        }}
                    />
                ) : (
                    <>
                        <Pagination
                            position="top"
                            currentPage={armourPage}
                            totalPages={totalArmourPages}
                            totalItems={armours.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setArmourPage}
                        />
                        <Grid>
                            {paginatedArmours.map(armour => (
                                <ArmourRow
                                    key={armour.name}
                                    armour={armour}
                                    onSelect={() => setSelectedItem({ kind: "armour", data: armour })}
                                />
                            ))}
                        </Grid>
                        <Pagination
                            position="bottom"
                            currentPage={armourPage}
                            totalPages={totalArmourPages}
                            totalItems={armours.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setArmourPage}
                        />
                    </>
                )}
            </TabsContent>

            {/* Perks Tab */}
            <TabsContent value="perks" className="mt-4">
                <SearchWithFilters
                    value={perkQuery}
                    onChange={setPerkQuery}
                    placeholder="Search perks by name, category or description…"
                    isOpen={perkFiltersOpen}
                    onOpen={() => setPerkFiltersOpen(true)}
                    onToggle={() => setPerkFiltersOpen(prev => !prev)}
                    onClearAll={() => setPerkSlot(null)}
                    filters={[
                        {
                            title: "Category",
                            options: CELL_SLOTS,
                            selected: perkSlot,
                            onChange: setPerkSlot,
                        },
                    ]}
                />

                {paginatedPerks.length === 0 ? (
                    <EmptyState
                        onReset={() => {
                            setPerkQuery("");
                            setPerkSlot(null);
                        }}
                    />
                ) : (
                    <>
                        <Pagination
                            position="top"
                            currentPage={perkPage}
                            totalPages={totalPerkPages}
                            totalItems={perks.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setPerkPage}
                        />
                        <Grid>
                            {paginatedPerks.map(perk => (
                                <PerkRow
                                    key={perk.name}
                                    perk={perk}
                                    onSelect={() => setSelectedItem({ kind: "perk", data: perk })}
                                />
                            ))}
                        </Grid>
                        <Pagination
                            position="bottom"
                            currentPage={perkPage}
                            totalPages={totalPerkPages}
                            totalItems={perks.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setPerkPage}
                        />
                    </>
                )}
            </TabsContent>

            {/* Cells Tab */}
            <TabsContent value="cells" className="mt-4">
                <SearchWithFilters
                    value={cellQuery}
                    onChange={setCellQuery}
                    placeholder="Search cells by name or slot…"
                    isOpen={cellFiltersOpen}
                    onOpen={() => setCellFiltersOpen(true)}
                    onToggle={() => setCellFiltersOpen(prev => !prev)}
                    onClearAll={() => setCellSlot(null)}
                    filters={[
                        {
                            title: "Slot",
                            options: CELL_SLOTS,
                            selected: cellSlot,
                            onChange: setCellSlot,
                        },
                    ]}
                />

                {paginatedCells.length === 0 ? (
                    <EmptyState
                        onReset={() => {
                            setCellQuery("");
                            setCellSlot(null);
                        }}
                    />
                ) : (
                    <>
                        <Pagination
                            position="top"
                            currentPage={cellPage}
                            totalPages={totalCellPages}
                            totalItems={cells.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setCellPage}
                        />
                        <Grid>
                            {paginatedCells.map(cell => (
                                <CellRow
                                    key={cell.name}
                                    cell={cell}
                                    onSelect={() => setSelectedItem({ kind: "cell", data: cell })}
                                />
                            ))}
                        </Grid>
                        <Pagination
                            position="bottom"
                            currentPage={cellPage}
                            totalPages={totalCellPages}
                            totalItems={cells.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setCellPage}
                        />
                    </>
                )}
            </TabsContent>

            {/* Lanterns & Omnicells Tab */}
            <TabsContent value="misc" className="mt-4">
                <SearchWithFilters
                    value={miscQuery}
                    onChange={setMiscQuery}
                    placeholder="Search lanterns & omnicells…"
                    isOpen={miscFiltersOpen}
                    onOpen={() => setMiscFiltersOpen(true)}
                    onToggle={() => setMiscFiltersOpen(prev => !prev)}
                    onClearAll={() => setMiscKind(null)}
                    filters={[
                        {
                            title: "Type",
                            options: MISC_KINDS.filter(k => k.value !== "all"),
                            selected: miscKind,
                            onChange: setMiscKind,
                        },
                    ]}
                />

                {paginatedMisc.length === 0 ? (
                    <EmptyState
                        onReset={() => {
                            setMiscQuery("");
                            setMiscKind(null);
                        }}
                    />
                ) : (
                    <>
                        <Pagination
                            position="top"
                            currentPage={miscPage}
                            totalPages={totalMiscPages}
                            totalItems={miscItems.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setMiscPage}
                        />
                        <Grid>
                            {paginatedMisc.map(({ kind, item }) =>
                                kind === "lantern" ? (
                                    <LanternRow
                                        key={item.name}
                                        lantern={item as LanternItem}
                                        onSelect={() => setSelectedItem({ kind: "lantern", data: item as LanternItem })}
                                    />
                                ) : (
                                    <OmnicellRow
                                        key={item.name}
                                        omnicell={item as OmnicellItem}
                                        onSelect={() => setSelectedItem({ kind: "omnicell", data: item as OmnicellItem })}
                                    />
                                ),
                            )}
                        </Grid>
                        <Pagination
                            position="bottom"
                            currentPage={miscPage}
                            totalPages={totalMiscPages}
                            totalItems={miscItems.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setMiscPage}
                        />
                    </>
                )}
            </TabsContent>
        </Tabs>
    );
};

export default DatabaseBrowser;
