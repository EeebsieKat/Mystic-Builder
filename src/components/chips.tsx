import Image from "next/image";
import { Badge } from "@/components/ui/badge";

import { cellTypeColor, cellTypeIcon, cellTypeLabel, elementColor } from "@/lib/site";

/*
 * Shared, site-wide chip components.
 * Every screen (builder, database, shared build page) renders item metadata
 * through these so spacing, typography and colors stay identical everywhere.
 *
 * Chip order convention:
 *   1. type chip (navy)  2. element chip (colored)  3. stat chip (gold outline)
 *   4. perk chips (gold outline)  5. cell chips (colored dot outline)
 */

const CHIP_BASE =
    "h-6 rounded-full px-2.5 py-0 text-[11.5px] font-semibold gap-1.5 shadow-xs border border-[var(--line)] bg-white/[0.055] text-[var(--ink-2)]";

export const TypeChip = ({ label }: { label: string }) => (
    <Badge variant="secondary" className={CHIP_BASE}>
        {label}
    </Badge>
);

export const ElementChip = ({ element }: { element: string | null | undefined }) =>
    element ? (
        <Badge
            className={CHIP_BASE}
            style={{ backgroundColor: elementColor(element), color: "#131720" }}
        >
            {element}
        </Badge>
    ) : null;

export const StatChip = ({ label, value }: { label: string; value: string | number }) => (
    <Badge variant="outline" className={`${CHIP_BASE} border-primary/45 bg-primary/10 text-primary`}>
        {label} {value}
    </Badge>
);

export const PerkChip = ({
    name,
    value,
    surged,
}: {
    name: string;
    value: number;
    surged?: boolean;
}) => (
    <span className="inline-flex items-center text-[11px] font-medium text-primary">
        {name} {value > 0 ? `+${value}` : value}
        {surged ? " (surged)" : ""}
    </span>
);

export const PerkList = ({
    perks,
    className = "",
}: {
    perks: { name: string; value: number; powerSurged?: boolean }[] | null | undefined;
    className?: string;
}) => {
    if (!perks || perks.length === 0) return null;
    return (
        <div className={`flex flex-col gap-1 text-[11px] font-medium text-primary ${className}`}>
            {perks.map((perk, index) => (
                <div key={`p${index}`} className="flex items-center gap-1.5 leading-none">
                    <span className="text-primary/70 select-none text-[10px] leading-none" aria-hidden>
                        •
                    </span>
                    <PerkChip name={perk.name} value={perk.value} surged={perk.powerSurged} />
                </div>
            ))}
        </div>
    );
};

export const CellChip = ({
    slot,
    cellName,
    count = 1,
}: {
    slot: string | null;
    cellName?: string | null;
    count?: number;
}) => (
    <Badge
        variant="outline"
        className={`${CHIP_BASE} inline-flex items-center gap-1.5`}
        style={{ borderColor: cellTypeColor(slot) }}
    >
        <Image
            src={cellTypeIcon(slot)}
            alt=""
            width={18}
            height={18}
            className="h-4.5 w-4.5 shrink-0 object-contain"
            aria-hidden
        />
        <span className="leading-none">
            {count > 1 ? `${count}x ` : ""}
            {cellName ? cellName : `${cellTypeLabel(slot)} cell`}
        </span>
    </Badge>
);

export const groupCellSlots = (
    cells: string | string[] | null | undefined,
): { slot: string; count: number }[] => {
    if (!cells) return [];
    const list = Array.isArray(cells) ? cells : [cells];
    const map = new Map<string, number>();
    for (const slot of list) {
        if (!slot) continue;
        map.set(slot, (map.get(slot) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([slot, count]) => ({ slot, count }));
};

export const CellSlotChips = ({
    cells,
}: {
    cells: string | string[] | null | undefined;
}) => {
    if (cells === null || cells === undefined) return <NoSlotsChip />;
    const grouped = groupCellSlots(cells);
    if (grouped.length === 0) return <NoSlotsChip />;
    return (
        <>
            {grouped.map(({ slot, count }, index) => (
                <CellChip key={`c${index}`} slot={slot} count={count} />
            ))}
        </>
    );
};

export const NoSlotsChip = () => (
    <Badge variant="outline" className={`${CHIP_BASE} text-muted-foreground inline-flex items-center gap-1.5`}>
        <Image
            src={cellTypeIcon(null)}
            alt=""
            width={18}
            height={18}
            className="h-4.5 w-4.5 shrink-0 object-contain opacity-60"
            aria-hidden
        />
        <span className="leading-none">No cell slots</span>
    </Badge>
);

export const WeaknessChip = ({ element }: { element: string }) => (
    <Badge variant="outline" className={`${CHIP_BASE} text-muted-foreground`}>
        weak to {element}
    </Badge>
);

export const CellDot = ({ slot }: { slot: string | null | undefined }) => (
    <Image
        src={cellTypeIcon(slot)}
        alt=""
        width={18}
        height={18}
        className="inline-block h-4.5 w-4.5 shrink-0 object-contain align-middle"
        aria-hidden
    />
);
