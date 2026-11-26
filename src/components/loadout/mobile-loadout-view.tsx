"use client";

import type { ComponentProps } from "react";
import {
    Check,
    Dices,
    Eraser,
    ExternalLink,
    Globe,
    Link2,
    Lock,
    Pencil,
    Save,
    Share2,
    Sparkles,
    Users,
} from "lucide-react";

import type { CommunityBuildRecord } from "@/lib/community-types";

import { findArmourByName } from "@/game/build-model";
import { findConsumableByName } from "@/game/consumables";
import type { Armour, Lantern, Omnicell, Weapon } from "@/game/types";
import { elementColor, getTextGlowStyle } from "@/lib/site";

import { ConsumableGlyph, FlourishHeader, ItemIcon, ShieldGlyph, SwordGlyph } from "./decor";
import { DetailCard, type DetailCardData } from "./detail-card";
import type {
    ArmourSlotId,
    CellSlotKey,
    LoadoutDraft,
    PartSlotKey,
    PickerTarget,
    SelectionId,
} from "./loadout-types";
import { ItemDetailPanel, PerkSummaryPanel } from "./right-panel";

interface ArmourPieceEntry {
    id: ArmourSlotId;
    label: string;
    nameKey: "headName" | "torsoName" | "armsName" | "legsName";
    surgedKey: "headSurged" | "torsoSurged" | "armsSurged" | "legsSurged";
    data: Armour | null;
}

export interface MobileLoadoutViewProps {
    draft: LoadoutDraft;
    onBuildNameChange: (name: string) => void;
    selectedSlot: SelectionId;
    onSelectSlot: (slot: SelectionId) => void;
    onOpenPicker: (target: PickerTarget) => void;
    weapon: Weapon | null;
    lantern: Lantern | null;
    omnicell: Omnicell | null;
    bondWeaponName: string | null;
    armourPieces: ArmourPieceEntry[];
    consumableNames: [string, string | null, string | null, string | null];
    totalPower: number;
    totalResistance: number;
    detailData: DetailCardData;
    rightPanel: ComponentProps<typeof ItemDetailPanel>["data"] & {
        cellSlots: ComponentProps<typeof ItemDetailPanel>["cellSlots"];
    } | null;
    perkTotals: ComponentProps<typeof PerkSummaryPanel>["perkTotals"];
    onCellClick: (key: CellSlotKey) => void;
    onPartClick: (partKey: PartSlotKey) => void;
    onBondClick: () => void;
    onOpenPerkSummary: () => void;
    onShare: () => void;
    copied: boolean;
    canShareOrPublish: boolean;
    onPublish: () => void;
    onRandomize: () => void;
    onReset: () => void;
    canReset: boolean;
    onOpenImport: () => void;
    liveBuild?: CommunityBuildRecord | null;
    currentBuildId?: string | null;
    updatingLive?: boolean;
    onOpenEditLive?: () => void;
    onToggleLiveVisibility?: () => void;
    onSaveLiveLoadout?: () => void;
}

function pickerForSelection(slot: SelectionId): PickerTarget | null {
    if (slot === "weapon") return { kind: "weapon" };
    if (slot === "lantern") return { kind: "lantern" };
    if (slot === "omnicell") return { kind: "omnicell" };
    if (slot === "head" || slot === "torso" || slot === "arms" || slot === "legs") {
        return { kind: "armour", slot };
    }
    if (slot === "consumable1") return { kind: "consumable", index: 1 };
    if (slot === "consumable2") return { kind: "consumable", index: 2 };
    if (slot === "consumable3") return { kind: "consumable", index: 3 };
    return null;
}

export function MobileLoadoutView({
    draft,
    onBuildNameChange,
    selectedSlot,
    onSelectSlot,
    onOpenPicker,
    weapon,
    lantern,
    omnicell,
    bondWeaponName,
    armourPieces,
    consumableNames,
    totalPower,
    totalResistance,
    detailData,
    rightPanel,
    perkTotals,
    onCellClick,
    onPartClick,
    onBondClick,
    onOpenPerkSummary,
    onShare,
    copied,
    canShareOrPublish,
    onPublish,
    onRandomize,
    onReset,
    canReset,
    onOpenImport,
    liveBuild = null,
    currentBuildId = null,
    updatingLive = false,
    onOpenEditLive,
    onToggleLiveVisibility,
    onSaveLiveLoadout,
}: MobileLoadoutViewProps) {
    const activePickerTarget = pickerForSelection(selectedSlot);

    return (
        <div
            className="min-h-[calc(100vh-56px)] w-full overflow-x-clip px-3 py-4 pb-10 sm:px-6"
            style={{
                background:
                    "radial-gradient(120% 70% at 50% 0%, rgba(28,36,52,0.45) 0%, rgba(6,7,9,0.98) 70%)",
            }}
        >
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                {/* Nameplate + Crest Power/Resistance */}
                <section className="lo-panel p-3.5 sm:p-4 text-center">
                    <input
                        type="text"
                        value={draft.buildName}
                        onChange={(e) => onBuildNameChange(e.target.value.slice(0, 24))}
                        aria-label="Build name"
                        className="lo-serif w-full bg-transparent text-center text-2xl sm:text-3xl font-semibold tracking-[0.12em] text-[#e8e4da] outline-none transition-colors focus:text-[#e0a33e]"
                        spellCheck={false}
                    />
                    <p className="mt-0.5 text-[11px] font-semibold tracking-[0.26em] text-[var(--lo-gold)]">
                        MYSTIC PARADOX
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                        <div className="lo-card flex items-center justify-center gap-2 px-3 py-2">
                            <SwordGlyph size={18} />
                            <div className="flex flex-col text-left leading-tight">
                                <span className="text-[10px] tracking-[0.14em] text-[#9a9a94]">POWER</span>
                                <span className="lo-serif text-lg font-bold text-[#f2efe7]">{totalPower}</span>
                            </div>
                        </div>
                        <div className="lo-card flex items-center justify-center gap-2 px-3 py-2">
                            <ShieldGlyph size={18} />
                            <div className="flex flex-col text-left leading-tight">
                                <span className="text-[10px] tracking-[0.14em] text-[#9a9a94]">RESISTANCE</span>
                                <span className="lo-serif text-lg font-bold text-[#f2efe7]">{totalResistance}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Primary Actions */}
                <section className="grid grid-cols-3 sm:grid-cols-5 gap-2" aria-label="Build actions">
                    <button
                        type="button"
                        onClick={onShare}
                        disabled={!canShareOrPublish}
                        className="lo-card flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-xs font-semibold tracking-wider text-[#e8e4da] disabled:opacity-40 cursor-pointer"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                        <span>{copied ? "COPIED" : "SHARE"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onPublish}
                        disabled={!canShareOrPublish}
                        className="lo-card flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-xs font-semibold tracking-wider text-[#e0c287] disabled:opacity-40 cursor-pointer"
                    >
                        <Users className="h-3.5 w-3.5" />
                        <span>PUBLISH</span>
                    </button>
                    <button
                        type="button"
                        onClick={onOpenImport}
                        className="lo-card flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-xs font-semibold tracking-wider text-[#e8e4da] cursor-pointer"
                    >
                        <Link2 className="h-3.5 w-3.5" />
                        <span>IMPORT</span>
                    </button>
                    <button
                        type="button"
                        onClick={onRandomize}
                        className="lo-card flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-xs font-semibold tracking-wider text-[#e8e4da] cursor-pointer"
                    >
                        <Dices className="h-3.5 w-3.5" />
                        <span>RANDOM</span>
                    </button>
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={!canReset}
                        className="lo-card col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-xs font-semibold tracking-wider text-[#d59a9a] disabled:opacity-40 cursor-pointer"
                    >
                        <Eraser className="h-3.5 w-3.5" />
                        <span>RESET</span>
                    </button>
                </section>

                {/* Live Build Options (visible after build goes live) */}
                {liveBuild && (
                    <section
                        aria-label="Live build controls"
                        className="lo-panel border !border-[#e0a33e]/45 p-3 flex flex-col gap-2.5"
                    >
                        <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate font-semibold text-[#f2efe7]">
                                Live: <span className="text-[#e0c287]">{liveBuild.title}</span>
                            </span>
                            <a
                                href={`/builds/${encodeURIComponent(liveBuild.id)}`}
                                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#5ba3ff] hover:text-white"
                            >
                                <span>VIEW LIVE</span>
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={onOpenEditLive}
                                className="lo-card flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold tracking-wider text-white cursor-pointer"
                            >
                                <Pencil className="h-3.5 w-3.5 text-[#5ba3ff]" />
                                <span>EDIT BUILD</span>
                            </button>
                            <button
                                type="button"
                                disabled={updatingLive}
                                onClick={onToggleLiveVisibility}
                                className={`lo-card flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold tracking-wider cursor-pointer disabled:opacity-50 ${
                                    liveBuild.visibility === "private"
                                        ? "!border-amber-500/45 text-amber-300"
                                        : "!border-emerald-500/45 text-emerald-300"
                                }`}
                            >
                                {liveBuild.visibility === "private" ? (
                                    <>
                                        <Lock className="h-3.5 w-3.5" />
                                        <span>PRIVATE</span>
                                    </>
                                ) : (
                                    <>
                                        <Globe className="h-3.5 w-3.5" />
                                        <span>PUBLIC</span>
                                    </>
                                )}
                            </button>
                            {currentBuildId && currentBuildId !== liveBuild.buildId && (
                                <button
                                    type="button"
                                    disabled={updatingLive}
                                    onClick={onSaveLiveLoadout}
                                    className="lo-card col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold tracking-wider text-[#e0a33e] cursor-pointer disabled:opacity-50"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    <span>UPDATE GEAR</span>
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* Gear Grid */}
                <section aria-label="Equipped gear">
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                        <FlourishHeader title="Loadout" className="flex-1" />
                        <button
                            type="button"
                            onClick={onOpenPerkSummary}
                            className="lo-card inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-[#e0c287] cursor-pointer"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>ALL PERKS ({perkTotals.length})</span>
                        </button>
                    </div>

                    {/* Weapon (full width featured card) */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectSlot("weapon")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onSelectSlot("weapon");
                            }
                        }}
                        className={`lo-card relative flex w-full items-center gap-3 p-3 text-left transition-all cursor-pointer ${
                            selectedSlot === "weapon"
                                ? "!border-[#e0a33e] shadow-[0_0_12px_rgba(224,163,62,0.28)]"
                                : ""
                        }`}
                    >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-[#3a3f47]/60 bg-black/30">
                            <ItemIcon icon={weapon?.icon ?? null} alt={weapon?.name ?? "Weapon"} size={48} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold tracking-[0.14em] text-[#9a9a94]">
                                    WEAPON {weapon ? `· ${weapon.type.toUpperCase()}` : ""}
                                </span>
                                {weapon && draft.weaponSurged && (
                                    <span className="rounded bg-[#e0a33e]/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#e0a33e]">
                                        SURGED
                                    </span>
                                )}
                            </div>
                            <p
                                className="truncate text-sm sm:text-base font-semibold"
                                style={
                                    weapon?.elemental
                                        ? getTextGlowStyle(elementColor(weapon.elemental))
                                        : { color: "#f2efe7" }
                                }
                            >
                                {weapon?.name ?? "Select Weapon"}
                            </p>
                            {bondWeaponName && (
                                <p className="truncate text-[11px] text-[#9a9a94]">
                                    Bond: <span className="text-[#d6dde8]">{bondWeaponName}</span>
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectSlot("weapon");
                                onOpenPicker({ kind: "weapon" });
                            }}
                            aria-label="Change weapon"
                            className="lo-card shrink-0 px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-[#e0c287] hover:text-white cursor-pointer"
                        >
                            {weapon ? "CHANGE" : "EQUIP"}
                        </button>
                    </div>

                    {/* Lantern, Omnicell & 4 Armour slots */}
                    <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                        {/* Lantern */}
                        <MobileGearCard
                            slotLabel="LANTERN"
                            name={lantern?.name ?? "Select Lantern"}
                            icon={lantern?.icon ?? null}
                            accentColor={lantern ? "#e0a33e" : undefined}
                            selected={selectedSlot === "lantern"}
                            equipped={Boolean(lantern)}
                            onSelect={() => onSelectSlot("lantern")}
                            onOpenPicker={() => {
                                onSelectSlot("lantern");
                                onOpenPicker({ kind: "lantern" });
                            }}
                        />

                        {/* Omnicell */}
                        <MobileGearCard
                            slotLabel="OMNICELL"
                            name={omnicell?.name ?? "Select Omnicell"}
                            icon={omnicell?.icon ?? null}
                            accentColor={omnicell ? "#c58bea" : undefined}
                            selected={selectedSlot === "omnicell"}
                            equipped={Boolean(omnicell)}
                            onSelect={() => onSelectSlot("omnicell")}
                            onOpenPicker={() => {
                                onSelectSlot("omnicell");
                                onOpenPicker({ kind: "omnicell" });
                            }}
                        />

                        {/* Armour pieces */}
                        {armourPieces.map((piece) => {
                            const armour = draft[piece.nameKey] ? findArmourByName(draft[piece.nameKey]!) : null;
                            return (
                                <MobileGearCard
                                    key={piece.id}
                                    slotLabel={piece.label.toUpperCase()}
                                    name={armour?.name ?? `Select ${piece.label}`}
                                    icon={armour?.icon ?? null}
                                    accentColor={armour?.strength ? elementColor(armour.strength) : undefined}
                                    badge={armour && draft[piece.surgedKey] ? "SURGED" : undefined}
                                    selected={selectedSlot === piece.id}
                                    equipped={Boolean(armour)}
                                    onSelect={() => onSelectSlot(piece.id)}
                                    onOpenPicker={() => {
                                        onSelectSlot(piece.id);
                                        onOpenPicker({ kind: "armour", slot: piece.id });
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Consumables */}
                    <div className="mt-2.5 grid grid-cols-4 gap-2">
                        {consumableNames.map((name, idx) => {
                            const consumable = name ? findConsumableByName(name) : null;
                            const isFlask = idx === 0;
                            const slotId = isFlask ? null : (`consumable${idx}` as SelectionId);
                            const isSelected = slotId !== null && selectedSlot === slotId;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        if (isFlask) return;
                                        if (slotId) onSelectSlot(slotId);
                                        onOpenPicker({ kind: "consumable", index: idx as 1 | 2 | 3 });
                                    }}
                                    disabled={isFlask}
                                    className={`lo-card flex flex-col items-center justify-center gap-1 p-2 text-center ${
                                        isSelected ? "!border-[#e0a33e]" : ""
                                    } ${isFlask ? "opacity-80 cursor-default" : "cursor-pointer"}`}
                                    aria-label={consumable?.name ?? `Select consumable ${idx}`}
                                >
                                    {consumable?.icon ? (
                                        <ItemIcon icon={consumable.icon} alt={consumable.name} size={32} />
                                    ) : (
                                        <ConsumableGlyph type={consumable?.type ?? "tonic"} size={28} />
                                    )}
                                    <span className="w-full truncate text-[10px] font-semibold text-[#cfcfc9]">
                                        {consumable?.name ?? `+ Slot ${idx}`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Inspector Tabs: Active Slot vs Perk Summary */}
                <section aria-label="Slot inspector and perks" className="mt-1">
                    <div className="mb-3 flex items-center gap-2 border-b border-[#3a3f47]/70 pb-2.5">
                        <button
                            type="button"
                            onClick={() => {
                                if (selectedSlot === "summary") onSelectSlot("weapon");
                            }}
                            className={`flex-1 rounded px-3 py-1.5 text-xs font-bold tracking-wider transition-colors cursor-pointer ${
                                selectedSlot !== "summary"
                                    ? "bg-[#e0a33e]/18 text-[#e0a33e] border border-[#e0a33e]/60"
                                    : "bg-white/[0.03] text-[#9a9a94] border border-[#3a3f47]/70"
                            }`}
                        >
                            SLOT DETAILS & CELLS
                        </button>
                        <button
                            type="button"
                            onClick={() => onSelectSlot("summary")}
                            className={`flex-1 rounded px-3 py-1.5 text-xs font-bold tracking-wider transition-colors cursor-pointer ${
                                selectedSlot === "summary"
                                    ? "bg-[#e0a33e]/18 text-[#e0a33e] border border-[#e0a33e]/60"
                                    : "bg-white/[0.03] text-[#9a9a94] border border-[#3a3f47]/70"
                            }`}
                        >
                            PERK SUMMARY
                        </button>
                    </div>

                    {selectedSlot !== "summary" && rightPanel ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="lo-serif text-base font-semibold tracking-[0.12em] text-[#dcd8cc]">
                                    {rightPanel.slotLabel.toUpperCase()}
                                </span>
                                {activePickerTarget && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenPicker(activePickerTarget)}
                                        className="lo-card inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wider text-[#e0c287] cursor-pointer"
                                    >
                                        <Pencil className="h-3 w-3" />
                                        CHANGE {rightPanel.slotLabel.toUpperCase()}
                                    </button>
                                )}
                            </div>

                            <ItemDetailPanel
                                data={rightPanel}
                                cellSlots={rightPanel.cellSlots}
                                selectedCellKey={null}
                                onCellClick={onCellClick}
                                onPartClick={onPartClick}
                                onBondClick={onBondClick}
                                onOpenPerkSummary={onOpenPerkSummary}
                            />

                            <div className="border border-[#3a3f47]/70 bg-[rgba(13,16,20,0.78)] p-3.5 sm:p-5">
                                <DetailCard data={detailData} />
                            </div>
                        </div>
                    ) : selectedSlot !== "summary" ? (
                        <div className="flex flex-col gap-3">
                            <div className="border border-[#3a3f47]/70 bg-[rgba(13,16,20,0.78)] p-5">
                                <DetailCard data={detailData} />
                                {activePickerTarget && (
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => onOpenPicker(activePickerTarget)}
                                            className="lo-card px-4 py-2 text-xs font-bold tracking-wider text-[#e0a33e] cursor-pointer"
                                        >
                                            EQUIP ITEM
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <PerkSummaryPanel perkTotals={perkTotals} />
                    )}
                </section>
            </div>
        </div>
    );
}

function MobileGearCard({
    slotLabel,
    name,
    icon,
    accentColor,
    badge,
    selected,
    equipped,
    onSelect,
    onOpenPicker,
}: {
    slotLabel: string;
    name: string;
    icon: string | null;
    accentColor?: string;
    badge?: string;
    selected: boolean;
    equipped: boolean;
    onSelect: () => void;
    onOpenPicker: () => void;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect();
                }
            }}
            className={`lo-card flex flex-col justify-between gap-2 p-2.5 text-left transition-all cursor-pointer ${
                selected ? "!border-[#e0a33e] shadow-[0_0_12px_rgba(224,163,62,0.28)]" : ""
            }`}
        >
            <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold tracking-[0.14em] text-[#9a9a94] truncate">
                    {slotLabel}
                </span>
                {badge && (
                    <span className="rounded bg-[#e0a33e]/20 px-1 py-0.5 text-[9px] font-bold tracking-wider text-[#e0a33e]">
                        {badge}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[#3a3f47]/60 bg-black/30">
                    <ItemIcon icon={icon} alt={name} size={34} />
                </div>
                <span
                    className="line-clamp-2 text-xs font-semibold leading-snug"
                    style={
                        accentColor
                            ? getTextGlowStyle(accentColor)
                            : { color: equipped ? "#f2efe7" : "#7c828c" }
                    }
                >
                    {name}
                </span>
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenPicker();
                }}
                className="w-full rounded border border-[#3a3f47]/70 bg-white/[0.03] py-1 text-center text-[10px] font-semibold tracking-wider text-[#e0c287] hover:bg-white/[0.07] cursor-pointer"
            >
                {equipped ? "CHANGE" : "EQUIP"}
            </button>
        </div>
    );
}
