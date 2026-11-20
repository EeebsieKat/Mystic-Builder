"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
    CellChip,
    ElementChip,
    NoSlotsChip,
    PerkChip,
    StatChip,
    TypeChip,
    WeaknessChip,
} from "@/components/chips";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { gameData } from "@/game/data";
import type { Armour, Cell, Lantern, Omnicell, PerkValue, Weapon } from "@/game/types";
import { cellTypeColor, cellTypeLabel } from "@/lib/site";

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
        // armour descriptions use {{typeAlt}} ("Head protection forged from…")
        typeAlt: typeof record.type === "string" ? record.type : null,
        behemoth: typeof record.behemoth === "string" ? record.behemoth : null,
        element: element ?? null,
        elemental: element ?? null,
    };
};

const normalize = (value: string): string => value.toLowerCase().trim();

/* ------------------------------------------------------------------ */
/* Shared item card skeleton                                           */
/* Every database row uses the exact same structure:                   */
/*   [ 64px icon box ] title / meta chips / description /              */
/*                     cell chips / perk chips / effects               */
/* ------------------------------------------------------------------ */

const IconBox = ({ src, name }: { src: string; name: string }) => (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 p-1.5 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_0_14px_oklch(0.82_0.135_85/0.25)]">
        <Image
            src={src}
            alt={name}
            width={48}
            height={48}
            className="h-auto w-auto max-h-full max-w-full object-contain transition-[filter] duration-300 group-hover:icon-glow"
        />
    </div>
);

const ItemTitle = ({ name, subtitle }: { name: string; subtitle?: string | null }) => (
    <div className="min-w-0">
        <p className="truncate font-semibold leading-tight text-foreground">{name}</p>
        {subtitle ? <p className="text-[11px] leading-tight text-muted-foreground">{subtitle}</p> : null}
    </div>
);

const ItemDescription = ({ text }: { text: string | null | undefined }) =>
    text ? <p className="text-xs leading-relaxed text-muted-foreground">{text}</p> : null;

const EffectList = ({ effects }: { effects: { description: string; values?: Record<string, string | number> }[] }) => {
    if (effects.length === 0) {
        return null;
    }
    return (
        <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
            {effects.map((effect, index) => (
                <li key={index}>
                    {effect.description.replace(/\{\{(\w+)\}\}/g, (_m, key: string) =>
                        effect.values && key in effect.values ? String(effect.values[key]) : "?",
                    )}
                </li>
            ))}
        </ul>
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

const ItemCard = ({ icon, name, subtitle, children }: {
    icon?: string | null;
    name: string;
    subtitle?: string | null;
    children: React.ReactNode;
}) => (
    <Card className="group h-full">
        <CardContent className="relative flex h-full gap-3 p-4">
            {icon ? <IconBox src={icon} name={name} /> : null}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <ItemTitle name={name} subtitle={subtitle} />
                {children}
            </div>
        </CardContent>
    </Card>
);

/* ------------------------------------------------------------------ */
/* Row renderers                                                       */
/* ------------------------------------------------------------------ */

const WeaponRow = ({ weapon }: { weapon: Weapon }) => (
    <ItemCard icon={weapon.icon} name={weapon.name} subtitle={null}>
        <MetaRow>
            <TypeChip label={weapon.type} />
            <ElementChip element={weapon.elemental} />
            <StatChip
                label="Power"
                value={`${weapon.power.powerSurged ?? weapon.power.base}${weapon.power.powerSurged ? ` (${weapon.power.base} base)` : ""}`}
            />
        </MetaRow>
        <ItemDescription text={interpolate(weapon.description, itemTemplateValues(weapon))} />
        <ChipRow>
            {weapon.cells === null ? (
                <NoSlotsChip />
            ) : (
                (Array.isArray(weapon.cells) ? weapon.cells : [weapon.cells]).map((slot, index) => (
                    <CellChip key={`c${index}`} slot={slot} />
                ))
            )}
            {(weapon.perks ?? []).map((perk: PerkValue, index: number) => (
                <PerkChip key={`p${index}`} name={perk.name} value={perk.value} surged={perk.powerSurged} />
            ))}
        </ChipRow>
        <EffectList effects={weapon.unique_effects ?? []} />
    </ItemCard>
);

const ArmourRow = ({ armour }: { armour: Armour }) => (
    <ItemCard icon={armour.icon} name={armour.name} subtitle={null}>
        <MetaRow>
            <TypeChip label={armour.type} />
            <ElementChip element={armour.strength} />
            {armour.weakness ? <WeaknessChip element={armour.weakness} /> : null}
            <StatChip
                label="Res"
                value={`${armour.resistance.powerSurged ?? armour.resistance.base}${armour.resistance.powerSurged ? ` (${armour.resistance.base} base)` : ""}`}
            />
        </MetaRow>
        <ItemDescription text={interpolate(armour.description, itemTemplateValues(armour))} />
        <ChipRow>
            {armour.cells === null ? (
                <NoSlotsChip />
            ) : (
                (Array.isArray(armour.cells) ? armour.cells : [armour.cells]).map((slot, index) => (
                    <CellChip key={`c${index}`} slot={slot} />
                ))
            )}
            {(armour.perks ?? []).map((perk: PerkValue, index: number) => (
                <PerkChip key={`p${index}`} name={perk.name} value={perk.value} surged={perk.powerSurged} />
            ))}
        </ChipRow>
    </ItemCard>
);

const PerkRow = ({ perk }: { perk: { name: string; description: string; type: string } }) => (
    <ItemCard name={perk.name} subtitle={cellTypeLabel(perk.type)}>
        <span
            className="absolute right-4 top-4 inline-block h-3 w-3 rounded-full ring-2 ring-card"
            style={{ backgroundColor: cellTypeColor(perk.type) }}
            aria-hidden
        />
        <ItemDescription text={perk.description} />
    </ItemCard>
);

const CellRow = ({ cell }: { cell: Cell }) => (
    <ItemCard name={cell.name} subtitle={cellTypeLabel(cell.slot)}>
        <span
            className="absolute right-4 top-4 inline-block h-3 w-3 rounded-full ring-2 ring-card"
            style={{ backgroundColor: cellTypeColor(cell.slot) }}
            aria-hidden
        />
        <ChipRow>
            {Object.entries(cell.variants).map(([variantName, variant]) => (
                <StatChip
                    key={variantName}
                    label={variantName}
                    value={Object.entries(variant.perks)
                        .map(([perk, value]) => `${perk} ${value > 0 ? `+${value}` : value}`)
                        .join(", ")}
                />
            ))}
        </ChipRow>
    </ItemCard>
);

const LanternRow = ({ lantern }: { lantern: Lantern }) => (
    <ItemCard icon={lantern.icon} name={lantern.name} subtitle="Lantern">
        <ItemDescription text={interpolate(lantern.description, itemTemplateValues(lantern))} />
        <ChipRow>
            {lantern.cells ? (
                (Array.isArray(lantern.cells) ? lantern.cells : [lantern.cells]).map((slot, index) => (
                    <CellChip key={`c${index}`} slot={slot} />
                ))
            ) : (
                <NoSlotsChip />
            )}
            {(lantern.perks ?? []).map((perk: PerkValue, index: number) => (
                <PerkChip key={`p${index}`} name={perk.name} value={perk.value} surged={perk.powerSurged} />
            ))}
        </ChipRow>
    </ItemCard>
);

const OmnicellRow = ({ omnicell }: { omnicell: Omnicell }) => (
    <ItemCard icon={omnicell.icon} name={omnicell.name} subtitle="Omnicell">
        <ItemDescription text={interpolate(omnicell.description, itemTemplateValues(omnicell))} />
        <EffectList effects={omnicell.unique_effects ?? []} />
    </ItemCard>
);

/* ------------------------------------------------------------------ */
/* Browser                                                             */
/* ------------------------------------------------------------------ */

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
    <div className="mt-3 grid max-h-[70vh] items-start gap-3 overflow-y-auto pr-1 md:grid-cols-2">
        {children}
    </div>
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
