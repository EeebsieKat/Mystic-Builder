"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Check,
    Copy,
    Dices,
    Eraser,
    Link2,
    MessageSquare,
    TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import ItemSelect, { type SelectOption } from "@/components/builder/item-select";
import DiscordPreview from "@/components/builder/discord-preview";

import { gameData } from "@/game/data";
import {
    BuildModel,
    doesCellFitIntoSlot,
    findArmourByName,
    findCellByVariantName,
    findLanternByName,
    findOmnicellByName,
    findWeaponByName,
} from "@/game/build-model";
import { buildBuildView, tryDeserialize } from "@/game/build-view";
import type { CellType, Part, WeaponType } from "@/game/types";
import {
    cellTypeColor,
    cellTypeLabel,
    elementColor,
    extractBuildId,
    GAME_EDITION,
    GAME_VERSION,
    localBuildPath,
} from "@/lib/site";

/* ------------------------------------------------------------------ */
/* Draft model                                                         */
/* ------------------------------------------------------------------ */

interface Draft {
    weaponName: string | null;
    weaponSurged: boolean;
    weaponPart1: string | null;
    weaponPart2: string | null;
    weaponPart3: string | null;
    bondWeapon: string | null;
    weaponCell1: string | null;
    weaponCell2: string | null;
    headName: string | null;
    headSurged: boolean;
    headCell: string | null;
    torsoName: string | null;
    torsoSurged: boolean;
    torsoCell: string | null;
    armsName: string | null;
    armsSurged: boolean;
    armsCell: string | null;
    legsName: string | null;
    legsSurged: boolean;
    legsCell: string | null;
    lantern: string | null;
    lanternCell: string | null;
    omnicell: string | null;
}

const EMPTY_DRAFT: Draft = {
    weaponName: null,
    weaponSurged: true,
    weaponPart1: null,
    weaponPart2: null,
    weaponPart3: null,
    bondWeapon: null,
    weaponCell1: null,
    weaponCell2: null,
    headName: null,
    headSurged: true,
    headCell: null,
    torsoName: null,
    torsoSurged: true,
    torsoCell: null,
    armsName: null,
    armsSurged: true,
    armsCell: null,
    legsName: null,
    legsSurged: true,
    legsCell: null,
    lantern: null,
    lanternCell: null,
    omnicell: null,
};

const draftFromModel = (model: BuildModel): Draft => ({
    weaponName: model.weaponName,
    weaponSurged: model.weaponSurged,
    weaponPart1: model.weaponPart1,
    weaponPart2: model.weaponPart2,
    weaponPart3: model.weaponPart3,
    bondWeapon: model.bondWeapon,
    weaponCell1: model.weaponCell1,
    weaponCell2: model.weaponCell2,
    headName: model.headName,
    headSurged: model.headSurged,
    headCell: model.headCell,
    torsoName: model.torsoName,
    torsoSurged: model.torsoSurged,
    torsoCell: model.torsoCell,
    armsName: model.armsName,
    armsSurged: model.armsSurged,
    armsCell: model.armsCell,
    legsName: model.legsName,
    legsSurged: model.legsSurged,
    legsCell: model.legsCell,
    lantern: model.lantern,
    lanternCell: model.lanternCell,
    omnicell: model.omnicell,
});

const draftToModel = (draft: Draft): BuildModel => Object.assign(new BuildModel(), draft);

const hasAnyItem = (draft: Draft): boolean =>
    Object.entries(draft).some(([key, value]) => key.endsWith("Name") || key === "lantern" || key === "omnicell"
        ? value !== null
        : false);

/* ------------------------------------------------------------------ */
/* Option builders                                                     */
/* ------------------------------------------------------------------ */

const perkHint = (perks: { name: string; value: number }[] | undefined): string =>
    (perks ?? []).map(perk => `${perk.name} +${perk.value}`).join(", ");

const weaponOptions: SelectOption[] = Object.values(gameData.weapons)
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
    .map(weapon => ({
        value: weapon.name,
        label: weapon.name,
        icon: weapon.icon,
        group: weapon.type,
        hint: weapon.elemental ?? undefined,
    }));

const armourOptionsByType: Record<string, SelectOption[]> = {
    Head: [],
    Torso: [],
    Arms: [],
    Legs: [],
};
for (const armour of Object.values(gameData.armours)) {
    armourOptionsByType[armour.type]?.push({
        value: armour.name,
        label: armour.name,
        icon: armour.icon,
        hint: perkHint(armour.perks) || undefined,
    });
}
for (const list of Object.values(armourOptionsByType)) {
    list.sort((a, b) => a.label.localeCompare(b.label));
}

const lanternOptions: SelectOption[] = Object.values(gameData.lanterns)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(lantern => ({
        value: lantern.name,
        label: lantern.name,
        icon: lantern.icon,
        hint: perkHint(lantern.perks) || undefined,
    }));

const omnicellOptions: SelectOption[] = Object.values(gameData.omnicells)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(omnicell => ({
        value: omnicell.name,
        label: omnicell.name,
        icon: omnicell.icon,
    }));

const cellVariantOptions = (allowed: CellType | CellType[] | null): SelectOption[] => {
    const result: SelectOption[] = [];
    for (const cell of Object.values(gameData.cells)) {
        for (const variantName of Object.keys(cell.variants)) {
            if (!doesCellFitIntoSlot(allowed, variantName)) {
                continue;
            }
            const perks = Object.entries(cell.variants[variantName].perks).map(([name, value]) => ({
                name,
                value,
            }));
            result.push({
                value: variantName,
                label: variantName,
                group: cellTypeLabel(cell.slot),
                hint: perkHint(perks) || undefined,
            });
        }
    }
    return result.sort((a, b) => (a.group ?? "").localeCompare(b.group ?? "") || a.label.localeCompare(b.label));
};

const partsKeyFor = (weaponType: WeaponType): string | null =>
    ({
        "Aether Strikers": "aetherstrikers",
        Axe: "axe",
        "Chain Blades": "chainblades",
        Hammer: "hammer",
        Repeater: "repeater",
        Sword: "sword",
        "War Pike": "warpike",
    })[weaponType] ?? null;

const partOptions = (weaponType: WeaponType, bucket: "specials" | "mods" | "chambers" | "grips"): SelectOption[] => {
    const key = partsKeyFor(weaponType);
    if (!key) {
        return [];
    }
    const category = gameData.parts[key] as unknown as Record<string, Record<string, Part>>;
    const items = category[bucket] ? Object.values(category[bucket]) : [];
    return items
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(part => ({
            value: part.name,
            label: part.name,
            icon: part.icon,
            hint: perkHint(part.perks) || undefined,
        }));
};

const bondableWeapons = (weapon: { elemental: string | null; name: string } | null): SelectOption[] => {
    if (!weapon) {
        return [];
    }
    return Object.values(gameData.weapons)
        .filter(candidate => candidate.bond && candidate.elemental === weapon.elemental)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(candidate => ({
            value: candidate.name,
            label: candidate.name,
            icon: candidate.icon,
        }));
};

const randomOf = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/* ------------------------------------------------------------------ */
/* Small presentational bits                                           */
/* ------------------------------------------------------------------ */

const PerkBadge = ({ name, value }: { name: string; value: number }) => (
    <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
        {name} {value > 0 ? `+${value}` : value}
    </Badge>
);

const CellDot = ({ slot }: { slot: CellType | null }) => (
    <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: cellTypeColor(slot) }}
        aria-hidden
    />
);

const CellSlotRow = ({
    index,
    allowed,
    value,
    onChange,
    disabled,
}: {
    index: number;
    allowed: CellType | CellType[] | null;
    value: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
}) => {
    const options = useMemo(() => cellVariantOptions(allowed), [allowed]);
    const slotLabel = allowed === null ? "No cell slot" : (Array.isArray(allowed) ? allowed.join(" / ") : allowed);
    const cell = value ? findCellByVariantName(value) : null;

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CellDot slot={cell?.slot ?? null} />
                <span>
                    Cell {index}
                    {allowed !== null ? ` - ${slotLabel}` : ""}
                </span>
            </div>
            <ItemSelect
                ariaLabel={`Cell slot ${index}`}
                options={options}
                value={value}
                onChange={onChange}
                placeholder={disabled ? "No slot" : "Empty cell"}
                emptyLabel="No cells fit this slot."
                className={disabled ? "pointer-events-none opacity-50" : undefined}
            />
        </div>
    );
};

const SurgedToggle = ({
    surged,
    onChange,
    label,
}: {
    surged: boolean;
    onChange: (surged: boolean) => void;
    label: string;
}) => (
    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <Switch checked={surged} onCheckedChange={onChange} aria-label={`${label} power surge`} />
        {surged ? "Power Surged" : "Base level"}
    </label>
);

/* ------------------------------------------------------------------ */
/* The editor                                                          */
/* ------------------------------------------------------------------ */

const BuildEditor = () => {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [draft, setDraft] = useState<Draft>(() => {
        const id = searchParams.get("b");
        if (id) {
            const parsed = tryDeserialize(id);
            if (parsed) {
                return draftFromModel(parsed);
            }
        }
        return EMPTY_DRAFT;
    });
    const [importValue, setImportValue] = useState("");
    const [copied, setCopied] = useState(false);

    const model = useMemo(() => draftToModel(draft), [draft]);
    const buildId = useMemo(() => {
        try {
            return model.serialize();
        } catch {
            return null;
        }
    }, [model]);
    const view = useMemo(
        () => (buildId ? buildBuildView(model, buildId) : null),
        [model, buildId],
    );

    /* Keep the URL in sync so the editor state is always shareable. */
    useEffect(() => {
        if (!buildId) {
            return;
        }
        const url = hasAnyItem(draft) ? `/?b=${buildId}` : "/";
        window.history.replaceState(null, "", url);
    }, [buildId, draft]);

    const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
        setDraft(previous => {
            const next = { ...previous, [key]: value };

            // Re-validate dependent slots like the original builder does.
            if (key === "weaponName") {
                const previousWeapon = findWeaponByName(previous.weaponName ?? "");
                const nextWeapon = findWeaponByName(value as string | null ?? "");
                if (previousWeapon?.type !== nextWeapon?.type) {
                    next.weaponPart1 = null;
                    next.weaponPart2 = null;
                    next.weaponPart3 = null;
                    next.bondWeapon = null;
                }
                if (!nextWeapon?.bond) {
                    next.bondWeapon = null;
                }
                const allowed = nextWeapon?.cells ?? null;
                if (!doesCellFitIntoSlot(allowed, next.weaponCell1)) {
                    next.weaponCell1 = null;
                }
                if (!doesCellFitIntoSlot(allowed, next.weaponCell2)) {
                    next.weaponCell2 = null;
                }
            }

            if (key === "headName" && !doesCellFitIntoSlot(findArmourByName(next.headName ?? "")?.cells ?? null, next.headCell)) {
                next.headCell = null;
            }
            if (key === "torsoName" && !doesCellFitIntoSlot(findArmourByName(next.torsoName ?? "")?.cells ?? null, next.torsoCell)) {
                next.torsoCell = null;
            }
            if (key === "armsName" && !doesCellFitIntoSlot(findArmourByName(next.armsName ?? "")?.cells ?? null, next.armsCell)) {
                next.armsCell = null;
            }
            if (key === "legsName" && !doesCellFitIntoSlot(findArmourByName(next.legsName ?? "")?.cells ?? null, next.legsCell)) {
                next.legsCell = null;
            }
            if (key === "lantern" && !doesCellFitIntoSlot(findLanternByName(next.lantern ?? "")?.cells ?? null, next.lanternCell)) {
                next.lanternCell = null;
            }

            return next;
        });
    }, []);

    /* --------------------------- actions --------------------------- */

    const randomize = useCallback(() => {
        const weaponsWithCells = Object.values(gameData.weapons).filter(weapon => weapon.cells !== null);
        const weapon = randomOf(weaponsWithCells);
        const partsKey = partsKeyFor(weapon.type);
        const category = partsKey
            ? (gameData.parts[partsKey] as unknown as Record<string, Record<string, Part>>)
            : null;

        const pickFittingCell = (allowed: CellType | CellType[] | null): string | null => {
            if (allowed === null) {
                return null;
            }
            const fitting: string[] = [];
            for (const cell of Object.values(gameData.cells)) {
                for (const variantName of Object.keys(cell.variants)) {
                    if (doesCellFitIntoSlot(allowed, variantName)) {
                        fitting.push(variantName);
                    }
                }
            }
            return fitting.length > 0 ? randomOf(fitting) : null;
        };

        const randomArmour = (type: string) =>
            randomOf(Object.values(gameData.armours).filter(armour => armour.type === type));

        const head = randomArmour("Head");
        const torso = randomArmour("Torso");
        const arms = randomArmour("Arms");
        const legs = randomArmour("Legs");
        const lantern = randomOf(Object.values(gameData.lanterns));
        const omnicell = randomOf(Object.values(gameData.omnicells));

        const bondPool = bondableWeapons({ elemental: weapon.elemental, name: weapon.name });

        setDraft({
            weaponName: weapon.name,
            weaponSurged: Math.random() >= 0.5,
            weaponPart1:
                weapon.type === "Repeater"
                    ? (category?.chambers ? randomOf(Object.keys(category.chambers)) : null)
                    : (category?.specials ? randomOf(Object.keys(category.specials)) : null),
            weaponPart2:
                weapon.type === "Repeater"
                    ? (category?.grips ? randomOf(Object.keys(category.grips)) : null)
                    : (category?.mods ? randomOf(Object.keys(category.mods)) : null),
            weaponPart3:
                weapon.type === "Repeater" && category?.mods ? randomOf(Object.keys(category.mods)) : null,
            bondWeapon: bondPool.length > 0 && Math.random() < 0.3 ? randomOf(bondPool).value : null,
            weaponCell1: pickFittingCell(weapon.cells),
            weaponCell2: pickFittingCell(weapon.cells),
            headName: head.name,
            headSurged: Math.random() >= 0.5,
            headCell: pickFittingCell(head.cells),
            torsoName: torso.name,
            torsoSurged: Math.random() >= 0.5,
            torsoCell: pickFittingCell(torso.cells),
            armsName: arms.name,
            armsSurged: Math.random() >= 0.5,
            armsCell: pickFittingCell(arms.cells),
            legsName: legs.name,
            legsSurged: Math.random() >= 0.5,
            legsCell: pickFittingCell(legs.cells),
            lantern: lantern.name,
            lanternCell: pickFittingCell(lantern.cells),
            omnicell: omnicell.name,
        });

        toast({ title: "Random build rolled", description: "Feeling lucky, Slayer?" });
    }, [toast]);

    const importBuild = useCallback(() => {
        const id = extractBuildId(importValue);
        if (!id) {
            toast({
                title: "Not a build link",
                description: "Paste a full /b/ link or a raw build id.",
                variant: "destructive",
            });
            return;
        }
        const parsed = tryDeserialize(id);
        if (!parsed) {
            toast({
                title: "Could not decode that build",
                description: "The link may be corrupted or use an unsupported format.",
                variant: "destructive",
            });
            return;
        }
        setDraft(draftFromModel(parsed));
        setImportValue("");
        toast({ title: "Build loaded into the editor" });
    }, [importValue, toast]);

    const copyShareLink = useCallback(async () => {
        if (!buildId) {
            return;
        }
        const url = `${window.location.origin}${localBuildPath(buildId)}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast({ title: "Build link copied", description: url });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: "Could not copy", description: url, variant: "destructive" });
        }
    }, [buildId, toast]);

    /* --------------------------- stats ----------------------------- */

    const weaponData = draft.weaponName ? findWeaponByName(draft.weaponName) : null;
    const armourPieces = [
        { label: "Head", name: draft.headName, surged: draft.headSurged },
        { label: "Torso", name: draft.torsoName, surged: draft.torsoSurged },
        { label: "Arms", name: draft.armsName, surged: draft.armsSurged },
        { label: "Legs", name: draft.legsName, surged: draft.legsSurged },
    ]
        .map(piece => ({ ...piece, data: piece.name ? findArmourByName(piece.name) : null }))
        .filter(piece => piece.data !== null);

    const totalPower = weaponData
        ? (draft.weaponSurged ? weaponData.power.powerSurged ?? weaponData.power.base : weaponData.power.base)
        : 0;
    const totalResistance = armourPieces.reduce(
        (sum, piece) =>
            sum +
            (piece.surged
                ? piece.data!.resistance.powerSurged ?? piece.data!.resistance.base
                : piece.data!.resistance.base),
        0,
    );
    const filledCells = [
        draft.weaponCell1,
        draft.weaponCell2,
        draft.headCell,
        draft.torsoCell,
        draft.armsCell,
        draft.legsCell,
        draft.lanternCell,
    ].filter(value => value !== null).length;

    const isRepeater = weaponData?.type === "Repeater";
    const partSlotConfig = weaponData
        ? isRepeater
            ? ([
                  { key: "weaponPart1" as const, label: "Chamber", bucket: "chambers" as const },
                  { key: "weaponPart2" as const, label: "Grip", bucket: "grips" as const },
                  { key: "weaponPart3" as const, label: "Mod", bucket: "mods" as const },
              ])
            : ([
                  { key: "weaponPart1" as const, label: "Special", bucket: "specials" as const },
                  { key: "weaponPart2" as const, label: "Mod", bucket: "mods" as const },
              ])
        : [];

    const weaponCellSlots = weaponData?.cells ?? null;
    const cellCount = Array.isArray(weaponCellSlots) ? weaponCellSlots.length : weaponCellSlots ? 1 : 0;

    /* --------------------------- render ---------------------------- */

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-lg border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-semibold">
                        {view?.weapon ? view.weapon.name : "New build"}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                            Dauntless {GAME_VERSION} - {GAME_EDITION}
                        </span>
                    </p>
                    {buildId && hasAnyItem(draft) ? (
                        <p className="truncate font-mono text-[11px] text-muted-foreground" title={buildId}>
                            {buildId}
                        </p>
                    ) : (
                        <p className="text-[11px] text-muted-foreground">
                            Pick gear below or roll a random build to get started.
                        </p>
                    )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={randomize}>
                        <Dices className="mr-1.5 h-4 w-4" aria-hidden />
                        Randomize
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDraft(EMPTY_DRAFT)}
                        disabled={!hasAnyItem(draft)}
                    >
                        <Eraser className="mr-1.5 h-4 w-4" aria-hidden />
                        Clear
                    </Button>
                    <Button size="sm" onClick={copyShareLink} disabled={!buildId || !hasAnyItem(draft)}>
                        {copied ? (
                            <Check className="mr-1.5 h-4 w-4" aria-hidden />
                        ) : (
                            <Copy className="mr-1.5 h-4 w-4" aria-hidden />
                        )}
                        Copy build link
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                {/* ------------------------- left column ------------------------- */}
                <div className="flex flex-col gap-4 lg:col-span-3">
                    {/* Weapon */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="text-base">Weapon</CardTitle>
                                {weaponData ? (
                                    <SurgedToggle
                                        label="Weapon"
                                        surged={draft.weaponSurged}
                                        onChange={value => set("weaponSurged", value)}
                                    />
                                ) : null}
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <ItemSelect
                                ariaLabel="Weapon"
                                options={weaponOptions}
                                value={draft.weaponName}
                                onChange={value => set("weaponName", value)}
                                placeholder="Choose a weapon…"
                            />

                            {weaponData ? (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">{weaponData.type}</Badge>
                                        {weaponData.elemental ? (
                                            <Badge
                                                style={{
                                                    backgroundColor: elementColor(weaponData.elemental),
                                                    color: "#14161a",
                                                }}
                                            >
                                                {weaponData.elemental}
                                            </Badge>
                                        ) : null}
                                        <Badge variant="outline">
                                            Power {draft.weaponSurged
                                                ? weaponData.power.powerSurged ?? weaponData.power.base
                                                : weaponData.power.base}
                                        </Badge>
                                        <Badge variant="outline">{weaponData.damage} damage</Badge>
                                        {weaponData.perks
                                            ?.filter(perk => (perk.powerSurged ?? false) === draft.weaponSurged)
                                            .map((perk, index) => (
                                                <PerkBadge key={index} name={perk.name} value={perk.value} />
                                            ))}
                                    </div>

                                    {partSlotConfig.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {partSlotConfig.map(slot => (
                                                <div key={slot.key} className="flex flex-col gap-1.5">
                                                    <p className="text-xs text-muted-foreground">{slot.label}</p>
                                                    <ItemSelect
                                                        ariaLabel={`Weapon ${slot.label}`}
                                                        options={partOptions(weaponData.type, slot.bucket)}
                                                        value={draft[slot.key]}
                                                        onChange={value => set(slot.key, value)}
                                                        placeholder={`No ${slot.label.toLowerCase()}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}

                                    {weaponData.bond ? (
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-xs text-muted-foreground">
                                                Bonded weapon ({weaponData.elemental})
                                            </p>
                                            <ItemSelect
                                                ariaLabel="Bonded weapon"
                                                options={bondableWeapons(weaponData)}
                                                value={draft.bondWeapon}
                                                onChange={value => set("bondWeapon", value)}
                                                placeholder="No bonded weapon"
                                            />
                                        </div>
                                    ) : null}

                                    {cellCount > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {Array.from({ length: cellCount }, (_, index) => (
                                                <CellSlotRow
                                                    key={index}
                                                    index={index + 1}
                                                    allowed={weaponCellSlots}
                                                    value={index === 0 ? draft.weaponCell1 : draft.weaponCell2}
                                                    onChange={value =>
                                                        set(index === 0 ? "weaponCell1" : "weaponCell2", value)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No weapon selected yet. Every weapon brings its own specials, mods and cell slots.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Armour */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Armour</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {(
                                    [
                                        ["head", "Head", "headName", "headSurged", "headCell"],
                                        ["torso", "Torso", "torsoName", "torsoSurged", "torsoCell"],
                                        ["arms", "Arms", "armsName", "armsSurged", "armsCell"],
                                        ["legs", "Legs", "legsName", "legsSurged", "legsCell"],
                                    ] as const
                                ).map(([id, label, nameKey, surgedKey, cellKey]) => {
                                    const piece = draft[nameKey] ? findArmourByName(draft[nameKey]!) : null;
                                    return (
                                        <div key={id} className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    {label}
                                                </p>
                                                <SurgedToggle
                                                    label={label}
                                                    surged={draft[surgedKey]}
                                                    onChange={value => set(surgedKey, value)}
                                                />
                                            </div>
                                            <ItemSelect
                                                ariaLabel={`${label} armour`}
                                                options={armourOptionsByType[label]}
                                                value={draft[nameKey]}
                                                onChange={value => set(nameKey, value)}
                                                placeholder={`No ${label.toLowerCase()} armour`}
                                            />
                                            {piece ? (
                                                <>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {piece.perks
                                                            ?.filter(
                                                                perk =>
                                                                    (perk.powerSurged ?? false) ===
                                                                    draft[surgedKey],
                                                            )
                                                            .map((perk, index) => (
                                                                <PerkBadge key={index} name={perk.name} value={perk.value} />
                                                            ))}
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            Res {draft[surgedKey]
                                                                ? piece.resistance.powerSurged ??
                                                                  piece.resistance.base
                                                                : piece.resistance.base}
                                                        </Badge>
                                                    </div>
                                                    <CellSlotRow
                                                        index={1}
                                                        allowed={piece.cells}
                                                        value={draft[cellKey]}
                                                        onChange={value => set(cellKey, value)}
                                                    />
                                                </>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lantern + Omnicell */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Lantern</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <ItemSelect
                                    ariaLabel="Lantern"
                                    options={lanternOptions}
                                    value={draft.lantern}
                                    onChange={value => set("lantern", value)}
                                    placeholder="No lantern"
                                />
                                {draft.lantern ? (
                                    <CellSlotRow
                                        index={1}
                                        allowed={findLanternByName(draft.lantern)?.cells ?? null}
                                        value={draft.lanternCell}
                                        onChange={value => set("lanternCell", value)}
                                    />
                                ) : null}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Omnicell</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <ItemSelect
                                    ariaLabel="Omnicell"
                                    options={omnicellOptions}
                                    value={draft.omnicell}
                                    onChange={value => set("omnicell", value)}
                                    placeholder="No omnicell"
                                />
                                {draft.omnicell ? (
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        {findOmnicellByName(draft.omnicell)?.description}
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ------------------------- right column ------------------------- */}
                <div className="flex flex-col gap-4 lg:col-span-2">
                    {/* Stats */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Build stats</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p className="text-2xl font-bold text-primary">{totalPower}</p>
                                <p className="text-xs text-muted-foreground">Weapon power</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">{totalResistance}</p>
                                <p className="text-xs text-muted-foreground">Armour resistance</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">
                                    {filledCells}/7
                                </p>
                                <p className="text-xs text-muted-foreground">Cells filled</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Perk totals */}
                    <Card className="flex min-h-0 flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Perk totals</CardTitle>
                            <CardDescription>Everything your gear and cells add up to.</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-80 overflow-y-auto">
                            {view && view.perkTotals.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {view.perkTotals.map(perk => (
                                        <div
                                            key={perk.name}
                                            className="flex items-center justify-between gap-2"
                                            title={gameData.perks[perk.name]?.description ?? undefined}
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <CellDot slot={perk.type} />
                                                <span className="truncate text-sm">{perk.name}</span>
                                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                                    {cellTypeLabel(perk.type)}
                                                </span>
                                            </div>
                                            <span
                                                className={`shrink-0 text-sm font-bold ${
                                                    perk.value >= 6 ? "text-primary" : "text-foreground"
                                                }`}
                                            >
                                                {perk.value > 0 ? "+" : ""}
                                                {perk.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No perks yet - equip gear or drop in some cells.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Import */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Link2 className="h-4 w-4 text-primary" aria-hidden />
                                Import a build
                            </CardTitle>
                            <CardDescription>
                                Paste a link from Mystic Builder or the original Dauntless Builder - both formats
                                decode.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Input
                                    value={importValue}
                                    onChange={event => setImportValue(event.target.value)}
                                    placeholder="https://…/b/…"
                                    aria-label="Build link to import"
                                    spellCheck={false}
                                    onKeyDown={event => {
                                        if (event.key === "Enter") {
                                            importBuild();
                                        }
                                    }}
                                />
                                <Button onClick={importBuild} className="shrink-0">
                                    Load
                                </Button>
                            </div>
                            {view?.invalid ? (
                                <p className="flex items-start gap-1.5 text-xs text-destructive">
                                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                                    Some items or cells in this build don&apos;t fit together - it may use gear from a
                                    newer patch.
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Discord preview */}
                    {buildId && hasAnyItem(draft) ? (
                        <Collapsible defaultOpen>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
                                            Discord preview
                                        </CardTitle>
                                        <span className="text-xs text-muted-foreground">toggle</span>
                                    </CollapsibleTrigger>
                                    <CardDescription>
                                        This is what Discord shows when someone posts your build link.
                                    </CardDescription>
                                </CardHeader>
                                <CollapsibleContent>
                                    <CardContent>
                                        <DiscordPreview buildId={buildId} />
                                    </CardContent>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    ) : null}
                </div>
            </div>

            <Separator className="opacity-40" />
            <p className="text-center text-xs text-muted-foreground">
                Builds are encoded entirely in the link - no account needed. Copy the link, share it anywhere, and
                Discord renders the full build card.
            </p>
        </div>
    );
};

export default BuildEditor;
