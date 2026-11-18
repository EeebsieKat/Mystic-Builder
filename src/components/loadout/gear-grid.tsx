"use client";

/**
 * Left panel of the Awakening loadout screen: the 2x3 gear grid (weapon,
 * lantern+omnicell split card, four armour cards) and the four consumable
 * slots beneath it. Layout mirrors the in-game reference pixel-for-pixel on
 * the 1920x1080 stage.
 */

import type { Armour, Consumable, Lantern, Omnicell, Weapon } from "@/game/types";
import { elementColor } from "@/lib/site";

import { ConsumableGlyph, DiamondPip, ItemIcon } from "./decor";
import type { ArmourSlotId, GearSlotId, SelectionId } from "./loadout-types";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const ELEMENT_ICON = (element: string | null | undefined): string | null =>
    element ? `/assets/icons/elements/${element}.png` : null;

const TypeGlyph = ({ weaponType, size = 20 }: { weaponType: string; size?: number }) => {
    const map: Record<string, string> = {
        "Aether Strikers": "AetherStrikers",
        "Chain Blades": "ChainBlades",
        "War Pike": "WarPike",
        Axe: "Axe",
        Hammer: "Hammer",
        Repeater: "Repeater",
        Sword: "Sword",
    };
    const file = map[weaponType];
    if (!file) {
        return null;
    }
    return <ItemIcon icon={`/assets/icons/generic/${file}.png`} alt={weaponType} size={size} />;
};

const ElementColumnIcons = ({ entries }: { entries: { element: string | null; sign?: "+" | "-" }[] }) => (
    <div className="flex flex-col gap-1.5">
        {entries.map((entry, index) =>
            entry.element ? (
                <span key={index} className="relative inline-flex" title={entry.element}>
                    <ItemIcon icon={ELEMENT_ICON(entry.element)} alt={entry.element} size={22} />
                    {entry.sign && (
                        <span
                            className="absolute -bottom-[3px] -right-[5px] text-[12px] font-bold leading-none"
                            style={{ color: entry.sign === "+" ? "#7ec86a" : "#b06a5a", textShadow: "0 1px 2px #000" }}
                        >
                            {entry.sign}
                        </span>
                    )}
                </span>
            ) : null,
        )}
    </div>
);

const Gauge = ({ fill, max, label, maxed }: { fill: number; max: number; label: string; maxed?: boolean }) => (
    <div className="flex items-center gap-2">
        <div className="lo-gauge flex-1">
            <div className="lo-gauge-fill" style={{ width: `${Math.min(100, Math.max(2, (fill / max) * 100))}%` }} />
        </div>
        {maxed ? (
            <span className="text-[11px] font-semibold tracking-[0.14em] text-[#8b8b85]">MAX</span>
        ) : (
            <span className="lo-serif text-[13px] leading-none text-[#f2efe7]">{label}</span>
        )}
    </div>
);

const CardShell = ({
    selected,
    variant = "gold",
    onClick,
    onDoubleClick,
    ariaLabel,
    children,
  }: {
    selected?: boolean;
    variant?: "gold" | "teal";
    onClick?: () => void;
    onDoubleClick?: () => void;
    ariaLabel: string;
    children: React.ReactNode;
}) => (
    <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={event => {
            if (event.key === "Enter") {
                onClick?.();
            }
        }}
        className={`lo-card relative h-[200px] w-[208px] cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#e0a33e] ${
            selected ? (variant === "gold" ? "lo-card-selected" : "lo-card-selected-teal") : ""
        }`}
    >
        {children}
        {selected && (
            <span className="lo-selected-frame" aria-hidden>
                <span
                    className="absolute bottom-[-5px] left-1/2 h-[9px] w-[9px] -translate-x-1/2 rotate-45"
                    style={{
                        background: variant === "gold" ? "var(--lo-gold)" : "var(--lo-teal)",
                        boxShadow: `0 0 8px ${variant === "gold" ? "rgba(224,163,62,0.6)" : "rgba(63,216,200,0.5)"}`,
                    }}
                />
            </span>
        )}
    </div>
);

/* ------------------------------------------------------------------ */
/* Weapon card                                                         */
/* ------------------------------------------------------------------ */

export const WeaponCard = ({
    weapon,
    surged,
    selected,
    onSelect,
    onOpenPicker,
}: {
    weapon: Weapon | null;
    surged: boolean;
    selected: boolean;
    onSelect: () => void;
    onOpenPicker: () => void;
}) => {
    const power = weapon
        ? surged
            ? weapon.power.powerSurged ?? weapon.power.base
            : weapon.power.base
        : 0;
    const maxPower = weapon ? Math.max(weapon.power.powerSurged ?? 0, weapon.power.base, 1) : 1;

    return (
        <CardShell
            selected={selected}
            ariaLabel={weapon ? `Weapon: ${weapon.name}` : "Choose weapon"}
            onClick={() => (weapon ? onSelect() : onOpenPicker())}
            onDoubleClick={onOpenPicker}
        >
            <span className="lo-level-chip absolute left-[10px] top-[10px]">{power || "—"}</span>
            {weapon && (
                <span className="absolute left-[10px] top-[46px]">
                    <ElementColumnIcons entries={[{ element: weapon.elemental }]} />
                </span>
            )}
            {weapon && (
                <span className="absolute bottom-[52px] left-[10px]">
                    <TypeGlyph weaponType={weapon.type} />
                </span>
            )}
            <div className="flex h-full items-center justify-center pt-3">
                {weapon ? (
                    <ItemIcon icon={weapon.icon} alt={weapon.name} size={128} />
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-50">
                        <ItemIcon icon="/assets/icons/generic/Weapon.png" alt="No weapon" size={92} />
                        <span className="lo-sublabel !text-[11px]">No weapon</span>
                    </div>
                )}
            </div>
            {weapon && (
                <div className="absolute inset-x-[12px] bottom-[12px]">
                    <Gauge fill={power} max={maxPower} label={String(power)} maxed={surged} />
                </div>
            )}
        </CardShell>
    );
};

/* ------------------------------------------------------------------ */
/* Lantern + omnicell split card                                       */
/* ------------------------------------------------------------------ */

const SplitHalf = ({
    selected,
    onClick,
    onDoubleClick,
    ariaLabel,
    icon,
    fallback,
    label,
}: {
    selected: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
    ariaLabel: string;
    icon: string | null;
    fallback?: React.ReactNode;
    label: string;
}) => (
    <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={event => {
            if (event.key === "Enter") {
                onClick();
            }
        }}
        className={`relative flex flex-1 cursor-pointer items-center gap-3 px-4 outline-none transition-colors ${
            selected
                ? "bg-[rgba(224,163,62,0.08)] shadow-[inset_0_0_0_1px_#e0a33e,0_0_12px_rgba(224,163,62,0.35)]"
                : "hover:bg-[rgba(255,255,255,0.03)] focus-visible:shadow-[inset_0_0_0_1px_#e0a33e]"
        }`}
    >
        <ItemIcon icon={icon} alt={ariaLabel} size={62} fallback={fallback} />
        <div className="flex min-w-0 flex-col gap-1">
            <span className="lo-sublabel !text-[10.5px]">{label}</span>
        </div>
    </div>
);

export const LanternOmnicellCard = ({
    lantern,
    omnicell,
    selectedSlot,
    onSelect,
    onOpenPicker,
}: {
    lantern: Lantern | null;
    omnicell: Omnicell | null;
    selectedSlot: SelectionId;
    onSelect: (slot: GearSlotId) => void;
    onOpenPicker: (target: "lantern" | "omnicell") => void;
}) => (
    <div className="lo-card relative flex h-[200px] w-[208px] flex-col">
        <SplitHalf
            selected={selectedSlot === "lantern"}
            onClick={() => (lantern ? onSelect("lantern") : onOpenPicker("lantern"))}
            onDoubleClick={() => onOpenPicker("lantern")}
            ariaLabel={lantern ? `Lantern: ${lantern.name}` : "Choose lantern"}
            icon={lantern?.icon ?? "/assets/icons/generic/Lantern.png"}
            label={lantern ? "LANTERN" : "NO LANTERN"}
        />
        <div className="mx-3 h-px bg-[#3a3f47]" />
        <SplitHalf
            selected={selectedSlot === "omnicell"}
            onClick={() => (omnicell ? onSelect("omnicell") : onOpenPicker("omnicell"))}
            onDoubleClick={() => onOpenPicker("omnicell")}
            ariaLabel={omnicell ? `Omnicell: ${omnicell.name}` : "Choose omnicell"}
            icon={omnicell?.icon ?? "/assets/icons/generic/Omnicell.png"}
            label={omnicell ? "OMNICELL" : "NO OMNICELL"}
        />
    </div>
);

/* ------------------------------------------------------------------ */
/* Armour card                                                         */
/* ------------------------------------------------------------------ */

const ARMOUR_LABEL: Record<ArmourSlotId, string> = {
    head: "Head",
    torso: "Torso",
    arms: "Arms",
    legs: "Legs",
};

const ARMOUR_GENERIC_ICON: Record<ArmourSlotId, string> = {
    head: "/assets/icons/generic/Head.png",
    torso: "/assets/icons/generic/Torso.png",
    arms: "/assets/icons/generic/Arms.png",
    legs: "/assets/icons/generic/Legs.png",
};

export const ArmourCard = ({
    slot,
    armour,
    surged,
    selected,
    onSelect,
    onOpenPicker,
}: {
    slot: ArmourSlotId;
    armour: Armour | null;
    surged: boolean;
    selected: boolean;
    onSelect: () => void;
    onOpenPicker: () => void;
}) => {
    const resistance = armour
        ? surged
            ? armour.resistance.powerSurged ?? armour.resistance.base
            : armour.resistance.base
        : 0;
    const maxRes = armour ? Math.max(armour.resistance.powerSurged ?? 0, armour.resistance.base, 1) : 1;

    return (
        <CardShell
            selected={selected}
            variant="teal"
            ariaLabel={armour ? `${ARMOUR_LABEL[slot]} armour: ${armour.name}` : `Choose ${ARMOUR_LABEL[slot]} armour`}
            onClick={() => (armour ? onSelect() : onOpenPicker())}
            onDoubleClick={onOpenPicker}
        >
            <span className="lo-level-chip absolute left-[10px] top-[10px]">{resistance || "—"}</span>
            {armour && (
                <span className="absolute left-[10px] top-[46px]">
                    <ElementColumnIcons
                        entries={[
                            { element: armour.strength, sign: "+" },
                            { element: armour.weakness, sign: "-" },
                        ]}
                    />
                </span>
            )}
            {armour && armour.cells ? (
                <span className="absolute bottom-[46px] left-[12px] flex items-center gap-1" aria-hidden>
                    <span className="h-[7px] w-[7px] rounded-full border border-[#7a828e] bg-[#3a3f47]" />
                </span>
            ) : null}
            <div className="flex h-full items-center justify-center pt-3">
                {armour ? (
                    <ItemIcon icon={armour.icon} alt={armour.name} size={120} />
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-50">
                        <ItemIcon icon={ARMOUR_GENERIC_ICON[slot]} alt={`No ${ARMOUR_LABEL[slot]} armour`} size={84} />
                        <span className="lo-sublabel !text-[11px]">No {ARMOUR_LABEL[slot].toLowerCase()}</span>
                    </div>
                )}
            </div>
            {armour && (
                <div className="absolute inset-x-[12px] bottom-[12px]">
                    <Gauge fill={resistance} max={maxRes} label={String(resistance)} maxed={surged} />
                </div>
            )}
        </CardShell>
    );
};

/* ------------------------------------------------------------------ */
/* Consumable row                                                      */
/* ------------------------------------------------------------------ */

const LockGlyph = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="#c8cdd6" strokeWidth="1.8" />
        <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" fill="none" stroke="#c8cdd6" strokeWidth="1.8" />
        <circle cx="12" cy="15" r="1.6" fill="#c8cdd6" />
    </svg>
);

export const ConsumableRow = ({
    consumableNames,
    selectedSlot,
    onSelect,
    onOpenPicker,
    findConsumable,
}: {
    consumableNames: [string, string | null, string | null, string | null];
    selectedSlot: SelectionId;
    onSelect: (slot: "consumable1" | "consumable2" | "consumable3") => void;
    onOpenPicker: (index: 1 | 2 | 3) => void;
    findConsumable: (name: string | null) => Consumable | null;
}) => (
    <div className="flex gap-[10px]" role="group" aria-label="Consumables">
        {consumableNames.map((name, index) => {
            const consumable = findConsumable(name);
            const locked = index === 0;
            const slotId = (["consumable1", "consumable2", "consumable3"] as const)[index - 1];
            const selected = !locked && selectedSlot === slotId;
            return (
                <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    aria-label={
                        locked
                            ? "Healing Flask - always equipped"
                            : consumable
                              ? `Consumable: ${consumable.name}`
                              : `Choose tonic or pylon ${index + 1}`
                    }
                    aria-pressed={selected || undefined}
                    onClick={() => {
                        if (locked) {
                            return;
                        }
                        if (consumable) {
                            onSelect(slotId);
                        } else {
                            onOpenPicker(index as 1 | 2 | 3);
                        }
                    }}
                    onDoubleClick={() => {
                        if (!locked) {
                            onOpenPicker(index as 1 | 2 | 3);
                        }
                    }}
                    onKeyDown={event => {
                        if (event.key === "Enter" && !locked) {
                            onOpenPicker(index as 1 | 2 | 3);
                        }
                    }}
                    title={consumable ? consumable.name : locked ? "Healing Flask (locked)" : "Choose tonic or pylon"}
                    className={`lo-consumable relative flex h-[100px] w-[100px] items-center justify-center outline-none focus-visible:shadow-[0_0_0_1px_#e0a33e] ${
                        locked ? "lo-consumable-locked" : "cursor-pointer"
                    } ${selected ? "!border-[#e0a33e] shadow-[0_0_12px_rgba(224,163,62,0.4)]" : ""}`}
                >
                    {consumable ? (
                        consumable.icon ? (
                            <ItemIcon icon={consumable.icon} alt={consumable.name} size={58} />
                        ) : (
                            <ConsumableGlyph type={consumable.type} size={56} />
                        )
                    ) : (
                        <span className="opacity-30">
                            <DiamondPip size={14} color="#7a828e" />
                        </span>
                    )}
                    {locked && (
                        <span className="absolute right-[5px] top-[5px] opacity-70">
                            <LockGlyph size={14} />
                        </span>
                    )}
                    {consumable && (
                        <span className="lo-level-chip absolute left-[5px] top-[5px] !px-0 !py-0 !text-[15px]">
                            {consumable.capacity}
                        </span>
                    )}
                    {consumable && (
                        <span className="lo-serif absolute bottom-[4px] right-[7px] text-[15px] leading-none text-[#f0e6c8]">
                            x1
                        </span>
                    )}
                </div>
            );
        })}
    </div>
);

/* ------------------------------------------------------------------ */
/* Reserved loadout tabs strip                                         */
/* ------------------------------------------------------------------ */

export const LoadoutTabsStub = () => (
    <div
        className="flex h-[80px] items-center gap-4 rounded-[4px] border border-[#3a3f47]/70 bg-[rgba(10,12,16,0.45)] px-4"
        aria-hidden
        title="Loadouts arrive together with accounts."
    >
        <span className="flex items-center gap-2 opacity-70">
            <LockGlyph size={16} />
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#8b909a]">LOADOUTS</span>
        </span>
        <div className="flex items-center gap-[10px]">
            {[0, 1, 2].map(index => (
                <div
                    key={index}
                    className="h-[52px] w-[52px] rounded-[3px] border border-[#3a3f47]/80 bg-[rgba(14,17,22,0.6)]"
                    style={{ boxShadow: "inset 0 2px 6px rgba(0,0,0,0.45)" }}
                />
            ))}
        </div>
        <span className="text-[11px] leading-tight tracking-[0.06em] text-[#6f7783]">
            COMING WITH
            <br />
            ACCOUNTS
        </span>
    </div>
);

/* ------------------------------------------------------------------ */
/* Left panel                                                          */
/* ------------------------------------------------------------------ */

export const GearGrid = {
    WeaponCard,
    LanternOmnicellCard,
    ArmourCard,
    ConsumableRow,
    LoadoutTabsStub,
};

export { elementColor };
