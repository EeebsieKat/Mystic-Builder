"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { gameData } from "@/game/data";
import type { Armour, Cell, Lantern, Omnicell, PerkValue, Weapon } from "@/game/types";
import { cellTypeColor, cellTypeLabel, elementColor } from "@/lib/site";

const interpolate = (
    text: string,
    values: Record<string, string | null | undefined>,
): string =>
    text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
        const value = values[key];
        return value !== undefined && value !== null ? value : "?";
    });

const itemTemplateValues = (item: object): Record<string, string | null> => {
    const record = item as Record<string, unknown>;
    const element = (record.elemental ?? record.strength) as string | undefined;
    return {
        type: typeof record.type === "string" ? record.type.toLowerCase() : null,
        behemoth: typeof record.behemoth === "string" ? record.behemoth : null,
        element: element ?? null,
        elemental: element ?? null,
    };
};

const normalize = (value: string): string => value.toLowerCase().trim();

const ElementBadge = ({ element }: { element: string | null }) =>
    element ? (
        <Badge style={{ backgroundColor: elementColor(element), color: "#14161a" }}>{element}</Badge>
    ) : null;

const PerkChips = ({ perks }: { perks: PerkValue[] | undefined }) => (
    <>
        {(perks ?? []).map((perk, index) => (
            <Badge key={index} variant="outline" className="border-primary/40 text-primary">
                {perk.name} {perk.value > 0 ? `+${perk.value}` : perk.value}
                {perk.powerSurged ? " (surged)" : ""}
            </Badge>
        ))}
    </>
);

const CellSlotChips = ({ cells }: { cells: Weapon["cells"] }) => {
    if (!cells) {
        return <Badge variant="outline" className="text-muted-foreground">No cell slots</Badge>;
    }
    const slots = Array.isArray(cells) ? cells : [cells];
    return (
        <>
            {slots.map((slot, index) => (
                <Badge key={index} variant="outline" style={{ borderColor: cellTypeColor(slot) }}>
                    <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: cellTypeColor(slot) }}
                        aria-hidden
                    />
                    {slot} cell
                </Badge>
            ))}
        </>
    );
};

const WeaponRow = ({ weapon }: { weapon: Weapon }) => (
    <Card>
        <CardContent className="flex gap-3 p-4">
            <Image src={weapon.icon} alt={weapon.name} width={44} height={44} className="h-auto w-auto shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{weapon.name}</p>
                    <Badge variant="secondary">{weapon.type}</Badge>
                    <ElementBadge element={weapon.elemental} />
                    <Badge variant="outline">
                        Power {weapon.power.powerSurged ?? weapon.power.base}
                        {weapon.power.powerSurged ? ` (${weapon.power.base} base)` : ""}
                    </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{interpolate(weapon.description, itemTemplateValues(weapon))}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    <CellSlotChips cells={weapon.cells} />
                    <PerkChips perks={weapon.perks} />
                </div>
                {(weapon.unique_effects ?? []).length > 0 ? (
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                        {weapon.unique_effects!.map((effect, index) => (
                            <li key={index}>
                                {effect.description.replace(/\{\{(\w+)\}\}/g, (_m, key: string) =>
                                    effect.values && key in effect.values ? String(effect.values[key]) : "?",
                                )}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </CardContent>
    </Card>
);

const ArmourRow = ({ armour }: { armour: Armour }) => (
    <Card>
        <CardContent className="flex gap-3 p-4">
            <Image src={armour.icon} alt={armour.name} width={44} height={44} className="h-auto w-auto shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{armour.name}</p>
                    <Badge variant="secondary">{armour.type}</Badge>
                    <ElementBadge element={armour.strength} />
                    {armour.weakness ? (
                        <Badge variant="outline" className="text-muted-foreground">
                            weak to {armour.weakness}
                        </Badge>
                    ) : null}
                    <Badge variant="outline">
                        Res {armour.resistance.powerSurged ?? armour.resistance.base}
                        {armour.resistance.powerSurged ? ` (${armour.resistance.base} base)` : ""}
                    </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{interpolate(armour.description, itemTemplateValues(armour))}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    <CellSlotChips cells={armour.cells} />
                    <PerkChips perks={armour.perks} />
                </div>
            </div>
        </CardContent>
    </Card>
);

const PerkRow = ({ perk }: { perk: { name: string; description: string; type: string } }) => (
    <Card>
        <CardContent className="flex items-start gap-3 p-4">
            <span
                className="mt-1.5 inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cellTypeColor(perk.type) }}
                aria-hidden
            />
            <div>
                <p className="font-semibold">
                    {perk.name} <span className="text-xs font-normal text-muted-foreground">({cellTypeLabel(perk.type)})</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{perk.description}</p>
            </div>
        </CardContent>
    </Card>
);

const CellRow = ({ cell }: { cell: Cell }) => (
    <Card>
        <CardContent className="p-4">
            <div className="flex items-center gap-2">
                <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: cellTypeColor(cell.slot) }}
                    aria-hidden
                />
                <p className="font-semibold">{cell.name}</p>
                <Badge variant="outline">{cellTypeLabel(cell.slot)}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(cell.variants).map(([variantName, variant]) => (
                    <Badge key={variantName} variant="outline" className="text-muted-foreground">
                        {variantName} ({variant.rarity}) -{" "}
                        {Object.entries(variant.perks)
                            .map(([perk, value]) => `${perk} ${value}`)
                            .join(", ")}
                    </Badge>
                ))}
            </div>
        </CardContent>
    </Card>
);

const LanternRow = ({ lantern }: { lantern: Lantern }) => (
    <Card>
        <CardContent className="flex gap-3 p-4">
            <Image src={lantern.icon} alt={lantern.name} width={44} height={44} className="h-auto w-auto shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
                <p className="font-semibold">{lantern.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{interpolate(lantern.description, itemTemplateValues(lantern))}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    <CellSlotChips cells={lantern.cells} />
                    <PerkChips perks={lantern.perks} />
                </div>
            </div>
        </CardContent>
    </Card>
);

const OmnicellRow = ({ omnicell }: { omnicell: Omnicell }) => (
    <Card>
        <CardContent className="flex gap-3 p-4">
            <Image src={omnicell.icon} alt={omnicell.name} width={44} height={44} className="h-auto w-auto shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
                <p className="font-semibold">{omnicell.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{interpolate(omnicell.description, itemTemplateValues(omnicell))}</p>
                {(omnicell.unique_effects ?? []).length > 0 ? (
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                        {omnicell.unique_effects!.map((effect, index) => (
                            <li key={index}>
                                {effect.description.replace(/\{\{(\w+)\}\}/g, (_m, key: string) =>
                                    effect.values && key in effect.values ? String(effect.values[key]) : "?",
                                )}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </CardContent>
    </Card>
);

const SearchInput = ({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) => (
    <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder={placeholder}
            className="pl-9"
            aria-label={placeholder}
        />
    </div>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2">{children}</div>
);

const DatabaseBrowser = () => {
    const [weaponQuery, setWeaponQuery] = useState("");
    const [armourQuery, setArmourQuery] = useState("");
    const [perkQuery, setPerkQuery] = useState("");
    const [cellQuery, setCellQuery] = useState("");
    const [miscQuery, setMiscQuery] = useState("");

    const weapons = useMemo(
        () =>
            Object.values(gameData.weapons)
                .filter(weapon =>
                    normalize(`${weapon.name} ${weapon.type} ${weapon.elemental ?? ""}`).includes(
                        normalize(weaponQuery),
                    ),
                )
                .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)),
        [weaponQuery],
    );

    const armours = useMemo(
        () =>
            Object.values(gameData.armours)
                .filter(armour => normalize(`${armour.name} ${armour.type}`).includes(normalize(armourQuery)))
                .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)),
        [armourQuery],
    );

    const perks = useMemo(
        () =>
            Object.values(gameData.perks)
                .filter(perk => normalize(`${perk.name} ${perk.type} ${perk.description}`).includes(normalize(perkQuery)))
                .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)),
        [perkQuery],
    );

    const cells = useMemo(
        () =>
            Object.values(gameData.cells)
                .filter(cell => normalize(`${cell.name} ${cell.slot}`).includes(normalize(cellQuery)))
                .sort((a, b) => a.slot.localeCompare(b.slot) || a.name.localeCompare(b.name)),
        [cellQuery],
    );

    const lanterns = useMemo(
        () =>
            Object.values(gameData.lanterns).filter(lantern =>
                normalize(lantern.name).includes(normalize(miscQuery)),
            ),
        [miscQuery],
    );

    const omnicells = useMemo(
        () =>
            Object.values(gameData.omnicells).filter(omnicell =>
                normalize(omnicell.name).includes(normalize(miscQuery)),
            ),
        [miscQuery],
    );

    return (
        <Tabs defaultValue="weapons">
            <TabsList className="flex w-full flex-wrap justify-start gap-1">
                <TabsTrigger value="weapons">Weapons ({weapons.length})</TabsTrigger>
                <TabsTrigger value="armour">Armour ({armours.length})</TabsTrigger>
                <TabsTrigger value="perks">Perks ({perks.length})</TabsTrigger>
                <TabsTrigger value="cells">Cells ({cells.length})</TabsTrigger>
                <TabsTrigger value="misc">Lanterns & Omnicells ({lanterns.length + omnicells.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="weapons" className="mt-4">
                <SearchInput value={weaponQuery} onChange={setWeaponQuery} placeholder="Search weapons…" />
                <Grid>
                    {weapons.map(weapon => (
                        <WeaponRow key={weapon.name} weapon={weapon} />
                    ))}
                </Grid>
            </TabsContent>

            <TabsContent value="armour" className="mt-4">
                <SearchInput value={armourQuery} onChange={setArmourQuery} placeholder="Search armour…" />
                <Grid>
                    {armours.map(armour => (
                        <ArmourRow key={armour.name} armour={armour} />
                    ))}
                </Grid>
            </TabsContent>

            <TabsContent value="perks" className="mt-4">
                <SearchInput value={perkQuery} onChange={setPerkQuery} placeholder="Search perks…" />
                <Grid>
                    {perks.map(perk => (
                        <PerkRow key={perk.name} perk={perk} />
                    ))}
                </Grid>
            </TabsContent>

            <TabsContent value="cells" className="mt-4">
                <SearchInput value={cellQuery} onChange={setCellQuery} placeholder="Search cells…" />
                <Grid>
                    {cells.map(cell => (
                        <CellRow key={cell.name} cell={cell} />
                    ))}
                </Grid>
            </TabsContent>

            <TabsContent value="misc" className="mt-4">
                <SearchInput value={miscQuery} onChange={setMiscQuery} placeholder="Search lanterns & omnicells…" />
                <Grid>
                    {lanterns.map(lantern => (
                        <LanternRow key={lantern.name} lantern={lantern} />
                    ))}
                    {omnicells.map(omnicell => (
                        <OmnicellRow key={omnicell.name} omnicell={omnicell} />
                    ))}
                </Grid>
            </TabsContent>
        </Tabs>
    );
};

export default DatabaseBrowser;
