import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CellChip, CellDot, ElementChip, PerkChip } from "@/components/chips";
import { Separator } from "@/components/ui/separator";
import type { BuildView, CellSlotView, ArmourPieceView } from "@/game/build-view";
import { cellTypeLabel, elementColor } from "@/lib/site";

const CellChips = ({ cells }: { cells: CellSlotView[] }) => (
    <div className="flex flex-wrap gap-1.5">
        {cells
            .filter(cell => cell.cellName !== null)
            .map((cell, index) => (
                <CellChip
                    key={index}
                    slot={cell.slot}
                    cellName={
                        cell.perks.map(perk => `${perk.name} ${perk.value}`).join(" / ") || cell.cellName
                    }
                />
            ))}
    </div>
);

const PieceCard = ({
    label,
    piece,
}: {
    label: string;
    piece: ArmourPieceView | null;
}) => {
    if (!piece) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex items-center gap-3 p-4 text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 text-lg opacity-40">
                        ?
                    </div>
                    <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs">No armour equipped</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="group">
            <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 p-1 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_0_14px_oklch(0.82_0.135_85/0.25)]">
                        <Image
                            src={piece.icon}
                            alt={piece.name}
                            width={40}
                            height={40}
                            className="h-auto w-auto object-contain transition-[filter] duration-300 group-hover:icon-glow"
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                            {label}
                            {piece.surged ? " (Power Surged)" : ""}
                        </p>
                        <p className="truncate text-sm font-semibold">{piece.name}</p>
                    </div>
                </div>
                {piece.perks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {piece.perks.map((perk, index) => (
                            <PerkChip key={index} name={perk.name} value={perk.value} />
                        ))}
                    </div>
                ) : null}
                <CellChips cells={piece.cells} />
            </CardContent>
        </Card>
    );
};

export const BuildDisplay = ({ view }: { view: BuildView }) => {
    return (
        <div className="grid gap-4 lg:grid-cols-5">
            {/* Left: gear */}
            <div className="flex flex-col gap-4 lg:col-span-3">
                {view.weapon ? (
                    <Card style={{ borderColor: elementColor(view.weapon.elemental) }}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={view.weapon.icon}
                                        alt={view.weapon.name}
                                        width={56}
                                        height={56}
                                        className="h-auto w-auto object-contain"
                                    />
                                    <div>
                                        <CardTitle className="text-lg">{view.weapon.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {view.weapon.type}
                                            {view.weapon.elemental ? ` - ${view.weapon.elemental}` : ""}
                                            {view.weapon.surged ? " - Power Surged" : ""}
                                        </p>
                                    </div>
                                </div>
                                <ElementChip element={view.weapon.elemental ?? "Neutral"} />
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <CellChips cells={view.weapon.cells} />
                            {view.weapon.parts.some(part => part.part) ? (
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {view.weapon.parts
                                        .filter(part => part.part)
                                        .map(part => (
                                            <div
                                                key={part.label}
                                                className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5 transition-colors duration-300 hover:border-primary/35"
                                            >
                                                <Image
                                                    src={part.part!.icon}
                                                    alt={part.part!.name}
                                                    width={32}
                                                    height={32}
                                                    className="h-auto w-auto object-contain"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                        {part.label}
                                                    </p>
                                                    <p className="truncate text-xs font-medium">{part.part!.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : null}
                            {view.weapon.bond ? (
                                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
                                    <Image
                                        src={view.weapon.bond.icon}
                                        alt={view.weapon.bond.name}
                                        width={32}
                                        height={32}
                                        className="h-auto w-auto object-contain"
                                    />
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Bonded weapon
                                        </p>
                                        <p className="text-xs font-medium">{view.weapon.bond.name}</p>
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="p-6 text-sm text-muted-foreground">
                            No weapon in this build.
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <PieceCard label="Head" piece={view.armour.head} />
                    <PieceCard label="Torso" piece={view.armour.torso} />
                    <PieceCard label="Arms" piece={view.armour.arms} />
                    <PieceCard label="Legs" piece={view.armour.legs} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {view.lantern ? (
                        <Card>
                            <CardContent className="flex flex-col gap-2 p-4">
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={view.lantern.item.icon}
                                        alt={view.lantern.item.name}
                                        width={44}
                                        height={44}
                                        className="h-auto w-auto object-contain"
                                    />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Lantern</p>
                                        <p className="text-sm font-semibold">{view.lantern.item.name}</p>
                                    </div>
                                </div>
                                <CellChips cells={[view.lantern.cell]} />
                            </CardContent>
                        </Card>
                    ) : null}
                    {view.omnicell ? (
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <Image
                                    src={view.omnicell.icon}
                                    alt={view.omnicell.name}
                                    width={44}
                                    height={44}
                                    className="h-auto w-auto object-contain"
                                />
                                <div>
                                    <p className="text-xs text-muted-foreground">Omnicell</p>
                                    <p className="text-sm font-semibold">{view.omnicell.name}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </div>

            {/* Right: perks + effects */}
            <div className="flex flex-col gap-4 lg:col-span-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Perk totals</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        {view.perkTotals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No perks detected.</p>
                        ) : (
                            view.perkTotals.map(perk => (
                                <div key={perk.name} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <CellDot slot={perk.type} />
                                        <span className="text-sm">{perk.name}</span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {cellTypeLabel(perk.type)}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-primary">
                                        {perk.value > 0 ? "+" : ""}
                                        {perk.value}
                                    </span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {view.weapon && view.weapon.uniqueEffects.length > 0 ? (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Weapon unique effects</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            {view.weapon.uniqueEffects.map((effect, index) => (
                                <div key={index}>
                                    {index > 0 ? <Separator className="mb-3" /> : null}
                                    <p className="text-xs leading-relaxed text-muted-foreground">{effect}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </div>
    );
};
