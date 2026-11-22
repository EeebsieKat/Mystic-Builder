"use client";

import Image from "next/image";
import { HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { gameData } from "@/game/data";
import type { CellType } from "@/game/types";
import type { PerkTotal as ViewPerkTotal } from "@/game/build-view";
import { cellTypeColor, cellTypeLabel } from "@/lib/site";
import { highlightGameText } from "@/lib/game-text-highlighter";
import { formatPerkEffect, getTierBreakdown } from "./loadout-types";
import { ItemIcon } from "./decor";

/* ------------------------------------------------------------------ */
/* Perk icon helper                                                    */
/* ------------------------------------------------------------------ */

export const PERK_TYPE_ICON = (type: CellType | null): string =>
    type ? `/assets/icons/perks/${type}.png` : "/assets/icons/perks/Prismatic.png";

/* ------------------------------------------------------------------ */
/* Hover card displaying all +1 to +6 tiers                           */
/* ------------------------------------------------------------------ */

interface PerkTierHoverTooltipProps {
    name: string;
    value: number;
    type?: CellType | null;
    children: React.ReactNode;
}

export const PerkTierHoverTooltip = ({
    name,
    value,
    type,
    children,
}: PerkTierHoverTooltipProps) => {
    const perk = (gameData.perks as Record<string, any>)[name];
    if (!perk) return <>{children}</>;

    const slotType = type || perk.type || "Prismatic";
    const slotColor = cellTypeColor(slotType);
    const activeRank = Math.min(6, Math.max(1, value));
    const ranks = [1, 2, 3, 4, 5, 6];
    const breakdown = getTierBreakdown(perk, ranks, name);

    return (
        <HoverCard openDelay={60} closeDelay={80}>
            <HoverCardTrigger asChild onClick={e => e.stopPropagation()}>
                <div className="cursor-help w-full">{children}</div>
            </HoverCardTrigger>
            <HoverCardContent
                side="left"
                align="center"
                sideOffset={14}
                className="z-[100] w-[340px] sm:w-[400px] max-h-[82vh] overflow-y-auto rounded-xl border border-border/80 bg-[#070c14]/98 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            >
                <div className="flex flex-col gap-3 text-left">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div
                                className="relative h-9 w-9 shrink-0 rounded-lg border bg-muted/30 p-1 flex items-center justify-center"
                                style={{
                                    borderColor: `${slotColor}60`,
                                    backgroundColor: `${slotColor}18`,
                                }}
                            >
                                <Image
                                    src={PERK_TYPE_ICON(slotType)}
                                    alt={perk.name}
                                    width={26}
                                    height={26}
                                    className="object-contain"
                                />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <h4 className="text-base font-bold text-foreground leading-tight truncate">
                                    {perk.name}
                                </h4>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {cellTypeLabel(slotType)} Perk
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <span
                                className="rounded-full px-2.5 py-0.5 text-xs font-bold border"
                                style={{
                                    borderColor: value >= 6 ? "rgba(251, 191, 36, 0.6)" : "rgba(91, 163, 255, 0.6)",
                                    backgroundColor: value >= 6 ? "rgba(251, 191, 36, 0.15)" : "rgba(91, 163, 255, 0.15)",
                                    color: value >= 6 ? "#fbbf24" : "#5ba3ff",
                                }}
                            >
                                +{value} {value >= 6 ? "MAX" : "POINTS"}
                            </span>
                        </div>
                    </div>

                    {/* Overview description */}
                    {perk.description && (
                        <p className="text-xs leading-relaxed text-muted-foreground italic">
                            {perk.description.replace(/<[^>]+>/g, "").trim()}
                        </p>
                    )}

                    {/* Base Effect (identical across all tiers) */}
                    {breakdown.commonSentences.length > 0 && (
                        <div className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-xs leading-relaxed">
                            <span className="font-semibold text-primary uppercase text-[10px] tracking-wider block mb-0.5">
                                Base Effect (All Tiers)
                            </span>
                            <span className="text-foreground/90 font-medium">
                                {highlightGameText(breakdown.commonSentences.join(" "))}
                            </span>
                        </div>
                    )}

                    {/* Tiers Breakdown (+1 to +6) showing only what changes */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span>Perk Tiers (+1 to +6)</span>
                            <span>Active Level: +{value}</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {ranks.map(r => {
                                const effDesc = breakdown.changingSentencesMap[r] || "No bonus at this tier.";
                                const isActive = r === activeRank;
                                const isUnlocked = r <= value;

                                return (
                                    <div
                                        key={r}
                                        className={`flex items-start gap-2.5 rounded-lg border p-2 text-xs transition-colors ${
                                            isActive
                                                ? "border-amber-400/70 bg-amber-400/15 shadow-[0_0_12px_rgba(251,191,36,0.18)]"
                                                : isUnlocked
                                                  ? "border-border/60 bg-muted/20 text-foreground/90"
                                                  : "border-border/25 bg-muted/5 text-muted-foreground/50 opacity-60"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                            <span
                                                className={`flex h-5 w-6 items-center justify-center rounded font-bold text-[11px] ${
                                                    isActive
                                                        ? "bg-amber-400 text-black font-extrabold shadow-xs"
                                                        : isUnlocked
                                                          ? "bg-primary/20 text-primary border border-primary/30"
                                                          : "bg-muted/30 text-muted-foreground border border-border/30"
                                                }`}
                                            >
                                                +{r}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-[12px] leading-relaxed ${
                                                    isActive
                                                        ? "font-semibold text-amber-200"
                                                        : isUnlocked
                                                          ? "text-foreground/90"
                                                          : "text-muted-foreground/60"
                                                }`}
                                            >
                                                {highlightGameText(effDesc)}
                                            </p>
                                        </div>

                                        {isActive && (
                                            <span className="shrink-0 rounded-sm bg-amber-400/25 border border-amber-400/50 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 uppercase tracking-wider">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

/* ------------------------------------------------------------------ */
/* Perk Summary Modal Dialog (Matching Image 1)                       */
/* ------------------------------------------------------------------ */

interface PerkSummaryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    perkTotals: ViewPerkTotal[];
}

export const PerkSummaryDialog = ({
    open,
    onOpenChange,
    perkTotals,
}: PerkSummaryDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto border-border/80 bg-card/95 backdrop-blur-xl p-6 shadow-2xl">
                {/* Dialog Header matching other site modals */}
                <DialogHeader className="gap-1 border-b border-border/40 pb-4 text-left pr-8">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                            <HelpCircle className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground font-display">
                                Perk Summary
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Active build perk point totals across equipped gear and slotted cells
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Subtitle / Tip */}
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-1">
                    <span>Equipped Perks ({perkTotals.length})</span>
                    <span className="text-primary font-semibold">Hover perk to view +1 to +6 tiers</span>
                </div>

                {/* List of Perk Rows */}
                <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
                    {perkTotals.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            No perks active. Equip gear or socket cells into your build.
                        </div>
                    ) : (
                        perkTotals.map(perk => {
                            const isMax = perk.value >= 6;
                            return (
                                <PerkTierHoverTooltip
                                    key={perk.name}
                                    name={perk.name}
                                    value={perk.value}
                                    type={perk.type}
                                >
                                    <div className="relative group rounded-none border border-border/60 bg-muted/20 px-4 py-3 hover:border-primary/80 hover:bg-muted/30 hover:shadow-[0_0_15px_rgba(91,163,255,0.15)] transition-all cursor-pointer">
                                        {/* Corner bracket marks */}
                                        <span className="pointer-events-none absolute left-1 top-1 h-2 w-2 border-l border-t border-primary/40 group-hover:border-primary/80 transition-colors" />
                                        <span className="pointer-events-none absolute right-1 top-1 h-2 w-2 border-r border-t border-primary/40 group-hover:border-primary/80 transition-colors" />
                                        <span className="pointer-events-none absolute bottom-1 left-1 h-2 w-2 border-b border-l border-primary/40 group-hover:border-primary/80 transition-colors" />
                                        <span className="pointer-events-none absolute bottom-1 right-1 h-2 w-2 border-b border-r border-primary/40 group-hover:border-primary/80 transition-colors" />

                                        {/* Card content */}
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <ItemIcon
                                                    icon={PERK_TYPE_ICON(perk.type)}
                                                    alt=""
                                                    size={30}
                                                    className="shrink-0 drop-shadow"
                                                />
                                                <span className="text-[15.5px] font-bold text-foreground tracking-[0.02em] truncate group-hover:text-primary transition-colors">
                                                    +{perk.value} {perk.name}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {isMax ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] font-bold border-amber-400/50 bg-amber-400/15 text-amber-300 py-0.5 rounded-none"
                                                    >
                                                        MAXED
                                                    </Badge>
                                                ) : (
                                                    <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                                        {perk.value}/6
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </PerkTierHoverTooltip>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
