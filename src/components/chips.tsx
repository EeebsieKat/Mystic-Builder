import { Badge } from "@/components/ui/badge";

import { cellTypeColor, cellTypeLabel, elementColor } from "@/lib/site";

/*
 * Shared, site-wide chip components.
 * Every screen (builder, database, shared build page) renders item metadata
 * through these so spacing, typography and colors stay identical everywhere.
 *
 * Chip order convention:
 *   1. type chip (navy)  2. element chip (colored)  3. stat chip (gold outline)
 *   4. perk chips (gold outline)  5. cell chips (colored dot outline)
 */

const CHIP_BASE = "h-6 px-2 py-0 text-[11px] font-medium gap-1.5";

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
    <Badge variant="outline" className={`${CHIP_BASE} border-primary/45 bg-primary/10 text-primary`}>
        {name} {value > 0 ? `+${value}` : value}
        {surged ? " (surged)" : ""}
    </Badge>
);

export const CellChip = ({
    slot,
    cellName,
}: {
    slot: string | null;
    cellName?: string | null;
}) => (
    <Badge
        variant="outline"
        className={CHIP_BASE}
        style={{ borderColor: cellTypeColor(slot) }}
    >
        <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: cellTypeColor(slot) }}
            aria-hidden
        />
        {cellName ? cellName : `${cellTypeLabel(slot)} cell`}
    </Badge>
);

export const NoSlotsChip = () => (
    <Badge variant="outline" className={`${CHIP_BASE} text-muted-foreground`}>
        No cell slots
    </Badge>
);

export const WeaknessChip = ({ element }: { element: string }) => (
    <Badge variant="outline" className={`${CHIP_BASE} text-muted-foreground`}>
        weak to {element}
    </Badge>
);

export const CellDot = ({ slot }: { slot: string | null | undefined }) => (
    <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: cellTypeColor(slot) }}
        aria-hidden
    />
);
