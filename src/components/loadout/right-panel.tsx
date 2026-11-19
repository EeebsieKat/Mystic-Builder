"use client";

/**
 * Right panel of the Awakening loadout screen: the winged crest header with
 * power/resistance plaques, plus the contextual panel - PERK SUMMARY when
 * nothing is selected, or the item showcase + cell slots + dye & transmog
 * chrome when a gear card is selected.
 */

import type { Armour, Cell, CellType, Consumable, Lantern, Omnicell, Part, Weapon } from "@/game/types";
import { cellTypeColor, cellTypeLabel } from "@/lib/site";
import { findCellByVariantName } from "@/game/build-model";

import { CellHexIcon, CrestEmblem, DiamondPip, ItemIcon, ShowcaseCorners, ShieldGlyph, SwordGlyph, ConsumableGlyph } from "./decor";
import type { CellSlotKey } from "./loadout-types";
import type { PerkTotal as ViewPerkTotal } from "@/game/build-view";

/* ------------------------------------------------------------------ */
/* Crest header                                                        */
/* ------------------------------------------------------------------ */

export const CrestHeader = ({ power, resistance }: { power: number; resistance: number }) => (
    <div className="relative flex h-[152px] items-center justify-between" aria-label="Loadout ratings">
        {/* Power / Weapon Section (Left) */}
        <div className="relative flex h-[133px] w-[214px] items-center justify-center">
            <img alt="Power Plaque - Weapon" className="w-full h-full object-contain" src="assets/awakening-ui/loadout/PowerPlaque.png" />
            <span className="absolute -left-[8px] -top-[4px] flex h-[40px] w-[40px] items-center justify-center rounded-[5px] border border-[#e0a33e]/60 bg-[#101318]">
                <SwordGlyph size={26} />
            </span>
            <span 
                className="absolute inset-0 flex items-center justify-center -translate-x-4 -translate-y-2 lo-serif text-[40px] font-semibold leading-none bg-clip-text text-transparent bg-cover bg-center"
                style={{ backgroundImage: `url(assets/awakening-ui/text-gradients/damage_wound.png)` }}
            >
                {power}
            </span>
        </div>

        {/* Armor / Resistance Section (Right) */}
        <div className="relative flex h-[133px] w-[214px] items-center justify-center">
            <img alt="Power Plaque - Armor" className="w-full h-full object-contain scale-x-[-1]" src="assets/awakening-ui/loadout/PowerPlaque.png" />
            <span className="absolute -right-[8px] -top-[4px] flex h-[40px] w-[40px] items-center justify-center rounded-[5px] border border-[#e0a33e]/60 bg-[#101318]">
                <ShieldGlyph size={26} />
            </span>
            <span 
                className="absolute inset-0 flex items-center justify-center translate-x-4 -translate-y-2 lo-serif text-[40px] font-semibold leading-none bg-clip-text text-transparent bg-cover bg-center"
                style={{ backgroundImage: `url(assets/awakening-ui/text-gradients/damage_stagger.png)` }}
            >
                {resistance}
            </span>
        </div>

        {/* Center Emblem */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <CrestEmblem size={148} />
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/* Perk summary                                                        */
/* ------------------------------------------------------------------ */

const PERK_TYPE_ICON = (type: CellType | null): string =>
    type ? `/assets/icons/perks/${type}.png` : "/assets/icons/perks/Prismatic.png";

export const PerkSummaryPanel = ({ perkTotals }: { perkTotals: ViewPerkTotal[] }) => {
    if (perkTotals.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 pt-16 text-center">
                <DiamondPip size={12} color="#6f7783" />
                <p className="max-w-[300px] text-[15px] leading-relaxed text-[#9a9a94]">
                    Equip gear and cells to see your perk point totals here.
                </p>
            </div>
        );
    }

    return (
        <div
            className="lo-panel relative flex max-h-[688px] flex-col gap-[8px] overflow-y-auto p-[14px] pt-[12px]"
            role="list"
            aria-label="Perk summary"
        >
            {/* ornamental side rods */}
            <span className="absolute bottom-[18px] left-[4px] top-[18px] w-px bg-gradient-to-b from-transparent via-[#c8955a]/45 to-transparent" aria-hidden />
            <span className="absolute bottom-[18px] right-[4px] top-[18px] w-px bg-gradient-to-b from-transparent via-[#c8955a]/45 to-transparent" aria-hidden />

            {perkTotals.map(perk => {
                const maxed = perk.value >= 6;
                return (
                    <div
                        key={perk.name}
                        role="listitem"
                        className={`lo-perk-row flex items-center gap-3 px-[12px] py-[9px] ${maxed ? "" : "lo-perk-row-inactive"}`}
                    >
                        <ItemIcon icon={PERK_TYPE_ICON(perk.type)} alt="" size={34} className="shrink-0" />
                        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                            <span
                                className={`truncate text-[16px] font-bold uppercase tracking-[0.04em] ${
                                    maxed ? "text-[#e8e4da]" : "text-[#8f949c]"
                                }`}
                            >
                                {perk.name}
                            </span>
                            {maxed ? (
                                <span className="text-[11.5px] font-semibold tracking-[0.08em] text-[#9a9a94]">
                                    PERK POINTS {perk.value}/6
                                </span>
                            ) : (
                                <span className="text-[11.5px] font-semibold tracking-[0.08em] text-[var(--lo-perk-red)]">
                                    PERK POINTS REQUIRED {perk.value}/6
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Cell slots                                                          */
/* ------------------------------------------------------------------ */

export const CellSlotBox = ({
    variantName,
    allowed,
    selected,
    onClick,
}: {
    variantName: string | null;
    allowed: CellType | CellType[] | null;
    selected: boolean;
    onClick: () => void;
}) => {
    const cell: Cell | null = variantName ? findCellByVariantName(variantName) : null;
    const slotLabel = Array.isArray(allowed) ? allowed.join(" / ") : allowed;
    const tint = cell ? cellTypeColor(cell.slot) : cellTypeColor(Array.isArray(allowed) ? allowed[0] : allowed);

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={
                variantName
                    ? `Cell: ${variantName}. Click to change.`
                    : slotLabel
                      ? `Empty ${slotLabel} cell slot. Click to choose a cell.`
                      : "No cell slot"
            }
            className={`lo-card group flex h-[118px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 outline-none focus-visible:shadow-[0_0_0_1px_#e0a33e] ${
                selected ? "lo-card-selected" : ""
            } ${allowed === null ? "cursor-default opacity-50" : ""}`}
            style={variantName && !selected ? { boxShadow: `inset 0 0 0 1px ${tint}33` } : undefined}
        >
            <CellHexIcon size={46} dim={!variantName} />
            <span
                className={`max-w-[85%] truncate text-center text-[13px] font-semibold tracking-[0.02em] ${
                    variantName ? "text-[#e8e4da]" : "text-[#7c828c]"
                }`}
            >
                {variantName ?? (slotLabel ? `Empty ${cellTypeLabel(slotLabel)} Slot` : "No Cell Slot")}
            </span>
            {variantName && cell && (
                <span className="text-[11px] tracking-[0.06em]" style={{ color: tint }}>
                    {Object.entries(cell.variants[variantName]?.perks ?? {})
                        .map(([perk, value]) => `+${value} ${perk}`)
                        .join(" · ")}
                </span>
            )}
        </button>
    );
};

/* ------------------------------------------------------------------ */
/* Item detail panel                                                   */
/* ------------------------------------------------------------------ */

export interface ItemDetailData {
    slotLabel: string;
    name: string;
    icon: string;
    item: Weapon | Armour | Lantern | Omnicell | Consumable | Part | null;
    weapon?: Weapon | null;
    armour?: Armour | null;
    lantern?: Lantern | null;
    omnicell?: Omnicell | null;
    consumable?: Consumable | null;
    parts?: { label: string; part: Part | null }[];
    bond?: { name: string; icon: string } | null;
}

const DyeTransmogChrome = () => (
    <div className="flex flex-col gap-[10px]" aria-hidden>
        <button
            type="button"
            disabled
            title="Dye & transmog arrive in a later update."
            className="lo-card flex h-[46px] w-full cursor-not-allowed items-center justify-center gap-2 opacity-60"
        >
            <span className="lo-serif text-[15px] tracking-[0.22em] text-[#dcd8cc]">DYE &amp; TRANSMOG</span>
        </button>
        <label className="flex h-[38px] w-full cursor-not-allowed items-center justify-center gap-2 opacity-60" title="Coming later.">
            <span className="flex h-[17px] w-[17px] items-center justify-center border border-[#c8cdd6]">
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path d="M2 6 L5 9 L10 3" fill="none" stroke="#9fd8cb" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </span>
            <span className="lo-serif text-[13px] tracking-[0.18em] text-[#dcd8cc]">ENABLE TRANSMOG</span>
        </label>
    </div>
);

const PartSlotRow = ({
    label,
    part,
    onClick,
}: {
    label: string;
    part: Part | null;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={part ? `${label}: ${part.name}. Click to change.` : `Choose ${label}`}
        className="lo-card flex h-[58px] w-full cursor-pointer items-center gap-3 px-[14px] text-left outline-none focus-visible:shadow-[0_0_0_1px_#e0a33e]"
    >
        <span className="lo-sublabel !text-[10.5px] w-[74px] shrink-0">{label.toUpperCase()}</span>
        {part ? (
            <>
                <ItemIcon icon={part.icon} alt={part.name} size={38} />
                <span className="truncate text-[14px] font-semibold text-[#e8e4da]">{part.name}</span>
            </>
        ) : (
            <span className="text-[13px] text-[#7c828c]">None equipped</span>
        )}
    </button>
);

export const ItemDetailPanel = ({
    data,
    cellSlots,
    selectedCellKey,
    onCellClick,
    onPartClick,
    onBondClick,
}: {
    data: ItemDetailData;
    cellSlots: { key: CellSlotKey; variantName: string | null; allowed: CellType | CellType[] | null }[];
    selectedCellKey: CellSlotKey | null;
    onCellClick: (key: CellSlotKey) => void;
    onPartClick: (partKey: "weaponPart1" | "weaponPart2" | "weaponPart3") => void;
    onBondClick: () => void;
}) => {
    const showCells = cellSlots.length > 0;
    const showDye = Boolean(data.armour || data.weapon);
    const consumable = data.consumable;

    return (
        <div className="flex max-h-[688px] flex-col gap-[14px] overflow-y-auto pr-1">
            {/* item showcase */}
            <div className="lo-showcase relative flex h-[218px] flex-col items-center justify-center gap-2 px-6">
                <ShowcaseCorners />
                <ItemIcon
                    icon={consumable && !consumable.icon ? null : data.icon}
                    alt={data.name}
                    size={124}
                    fallback={consumable ? <ConsumableGlyph type={consumable.type} size={104} /> : undefined}
                    className="max-h-[130px]"
                />
                <span className="lo-serif text-center text-[20px] font-semibold tracking-[0.06em] text-[#f2efe7]">
                    {data.name}
                </span>
                <DiamondPip size={7} color="#c8955a" />
            </div>

            {/* weapon parts + bond */}
            {data.parts && data.parts.length > 0 && (
                <div className="flex flex-col gap-[8px]">
                    {data.parts.map(partRow =>
                        partRow.part ? (
                            <PartSlotRow
                                key={partRow.label}
                                label={partRow.label}
                                part={partRow.part}
                                onClick={() =>
                                    onPartClick(
                                        partRow.label === "Chamber"
                                            ? "weaponPart1"
                                            : partRow.label === "Grip"
                                              ? "weaponPart2"
                                              : partRow.label === "Special"
                                                ? "weaponPart1"
                                                : "weaponPart2",
                                    )
                                }
                            />
                        ) : null,
                    )}
                    {data.bond && (
                        <PartSlotRow
                            label="Bonded"
                            part={{ name: data.bond.name, icon: data.bond.icon } as Part}
                            onClick={onBondClick}
                        />
                    )}
                </div>
            )}

            {/* cell slots */}
            {showCells && (
                <div className={`flex gap-[10px] ${cellSlots.length === 1 ? "" : ""}`}>
                    {cellSlots.map(slot => (
                        <CellSlotBox
                            key={slot.key}
                            variantName={slot.variantName}
                            allowed={slot.allowed}
                            selected={selectedCellKey === slot.key}
                            onClick={() => onCellClick(slot.key)}
                        />
                    ))}
                </div>
            )}

            {/* consumable description */}
            {consumable && (
                <div className="lo-panel p-[16px]">
                    <p className="lo-sublabel mb-2">Capacity {consumable.capacity}</p>
                    <p className="text-[14.5px] leading-relaxed text-[#cfcfc9]">{consumable.description}</p>
                </div>
            )}

            {showDye && <DyeTransmogChrome />}
        </div>
    );
};

/* ------------------------------------------------------------------ */
