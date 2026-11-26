"use client";

/**
 * Center-bottom detail card of the Awakening loadout screen: the contextual
 * perk / skill list for whichever gear slot is selected, styled after the
 * in-game reference (appearance line, item name over a gold rule, stat box
 * with elemental strengths, perk rows with point counters and activation
 * thresholds).
 */

import type { Armour, Weapon } from "@/game/types";
import { elementColor, getTextGlowStyle } from "@/lib/site";

import { DiamondPip, ItemIcon } from "./decor";
import { interpolate, type PerkRow } from "./loadout-types";
import { highlightGameText } from "@/lib/game-text-highlighter";

/* ------------------------------------------------------------------ */
/* Perk row                                                            */
/* ------------------------------------------------------------------ */

const PERK_ICON = (perkRow: PerkRow): string =>
    perkRow.cellSlot ? `/assets/icons/perks/${perkRow.cellSlot}.png` : "/assets/icons/perks/Prismatic.png";

const DetailPerkRow = ({ perk }: { perk: PerkRow }) => (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 py-[9px] sm:py-[7px]">
        <div className="flex items-start gap-3 sm:contents">
            <ItemIcon icon={PERK_ICON(perk)} alt="" size={40} className="mt-[2px] sm:mt-[3px] shrink-0" />
            <div className="flex min-w-0 flex-1 sm:flex-none sm:w-[210px] sm:shrink-0 flex-col gap-[2px] pt-[2px]">
                <span className="text-[15.5px] sm:text-[16.5px] font-bold leading-tight text-[#e8e4da]">
                    {perk.name}
                    {perk.fromCell ? " Cell" : ""}
                </span>
                <span className="text-[12px] tracking-[0.05em] text-[#9a9a94]">PERK POINTS: {perk.points}</span>
            </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px] pt-[2px]">
            <p className="text-[13.5px] sm:text-[14.5px] leading-[1.38] text-[#cfcfc9]">{highlightGameText(perk.description)}</p>
            <span className="text-[11.5px] sm:text-[12px] tracking-[0.05em] text-[#84888f]">
                ACTIVATES AT: {perk.activatesAt} PERK POINT{perk.activatesAt === 1 ? "" : "S"}
            </span>
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

const ElementLine = ({ label, element, value }: { label: string; element: string; value: number }) => (
    <span className="flex items-center gap-1.5 text-[13.5px] leading-[1.5]">
        <ItemIcon icon={`/assets/icons/elements/${element}.png`} alt={element} size={17} />
        <span style={{ color: value >= 0 ? "var(--lo-pos)" : "var(--lo-neg)" }}>
            {value >= 0 ? "+" : ""}
            {value}
        </span>
        <span className="text-[#9a9a94]">{label}</span>
    </span>
);

const DetailHeader = ({
    item,
    statValue,
    statLabel,
    weapon,
    armour,
    appearance,
}: {
    item: { name: string };
    statValue: number | null;
    statLabel: string;
    weapon?: Weapon | null;
    armour?: Armour | null;
    appearance: string;
}) => (
    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-6 border-b border-[#3a3f47]/70 pb-[12px]">
        <div className="flex min-w-0 w-full sm:w-auto flex-col gap-[6px]">
            <span className="flex items-center gap-2">
                {weapon?.elemental && (
                    <ItemIcon icon={`/assets/icons/elements/${weapon.elemental}.png`} alt={weapon.elemental} size={22} />
                )}
                {armour?.strength && (
                    <ItemIcon icon={`/assets/icons/elements/${armour.strength}.png`} alt={armour.strength} size={22} />
                )}
                <span className="text-[14px] sm:text-[15px] italic text-[#9a9a94]">Appearance: {appearance}</span>
            </span>
            <span
                className="lo-serif text-[22px] sm:text-[27px] font-semibold leading-tight sm:leading-none tracking-[0.03em] break-words"
                style={getTextGlowStyle(
                    weapon?.elemental
                        ? elementColor(weapon.elemental)
                        : armour?.strength
                          ? elementColor(armour.strength)
                          : "#f5f1e8",
                )}
            >
                {item.name}
            </span>
            <span className="lo-gold-rule mt-[3px] block w-full max-w-[290px]" aria-hidden />
        </div>
        {statValue !== null && (
            <div className="flex shrink-0 items-stretch gap-[10px]">
                <div className="lo-card flex w-[86px] flex-col items-center justify-center">
                    <span className="lo-serif text-[36px] font-semibold leading-none text-[#f5f1e8]">{statValue}</span>
                </div>
                {armour && (
                    <div className="flex flex-col justify-center gap-[3px]">
                        {armour.strength && <ElementLine label="vs attacks" element={armour.strength} value={25} />}
                        {armour.weakness && <ElementLine label="vs attacks" element={armour.weakness} value={-25} />}
                    </div>
                )}
                {weapon && weapon.elemental && (
                    <div className="flex flex-col justify-center gap-[3px]">
                        <span className="flex items-center gap-1.5 text-[13.5px]">
                            <ItemIcon icon={`/assets/icons/elements/${weapon.elemental}.png`} alt={weapon.elemental} size={17} />
                            <span style={{ color: elementColor(weapon.elemental) }}>{weapon.elemental}</span>
                            <span className="text-[#9a9a94]">damage</span>
                        </span>
                        <span className="text-[12.5px] text-[#9a9a94]">{weapon.damage}</span>
                    </div>
                )}
            </div>
        )}
    </div>
);

/* ------------------------------------------------------------------ */
/* Detail card                                                         */
/* ------------------------------------------------------------------ */

export interface DetailCardData {
    item: { name: string } | null;
    appearance: string;
    statValue: number | null;
    statLabel: string;
    weapon?: Weapon | null;
    armour?: Armour | null;
    perks: PerkRow[];
    uniqueEffects: string[];
    extra?: React.ReactNode;
    emptyTitle?: string;
    emptyHint?: string;
}

export const DetailCard = ({ data }: { data: DetailCardData }) => {
    if (!data.item) {
        return (
            <div className="lo-fade-in flex h-full flex-col items-center justify-center gap-4 text-center" role="region" aria-label="Empty slot">
                <DiamondPip size={11} color="#6f7783" />
                <p className="lo-serif text-[23px] font-semibold tracking-[0.16em] text-[#84888f]">
                    {(data.emptyTitle ?? "NOTHING EQUIPPED").toUpperCase()}
                </p>
                <p className="max-w-[420px] text-[14.5px] leading-relaxed text-[#6f7783]">
                    {data.emptyHint ?? "Double-click a slot on the left to open the armoury and choose a piece of gear."}
                </p>
            </div>
        );
    }

    return (
        <div
            className="lo-fade-in pointer-events-auto flex h-full flex-col"
            role="region"
            aria-label={`${data.item.name} details`}
        >
            <DetailHeader
                item={data.item}
                statValue={data.statValue}
                statLabel={data.statLabel}
                weapon={data.weapon}
                armour={data.armour}
                appearance={data.appearance}
            />
            <div className="mt-[6px] flex-1 divide-y divide-[#3a3f47]/40 overflow-y-auto pr-2">
                {data.perks.map((perk, index) => (
                    <DetailPerkRow key={`${perk.name}-${index}`} perk={perk} />
                ))}
                {data.uniqueEffects.map((effect, index) => (
                    <div key={index} className="flex gap-4 py-[9px]">
                        <ItemIcon icon="/assets/icons/perks/Prismatic.png" alt="" size={40} className="mt-[3px] shrink-0" />
                        <div className="flex min-w-0 flex-1 flex-col gap-[3px] pt-[2px]">
                            <p className="text-[14.5px] leading-[1.38] text-[#cfcfc9]">{highlightGameText(effect)}</p>
                        </div>
                    </div>
                ))}
                {data.perks.length === 0 && data.uniqueEffects.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-[14px] text-[#84888f]">No perks on this piece yet.</p>
                    </div>
                )}
                {data.extra}
            </div>
        </div>
    );
};

export { interpolate };
