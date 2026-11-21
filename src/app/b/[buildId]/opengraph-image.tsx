import { ImageResponse } from "next/og";
import { parseBuildId, buildTitle } from "@/game/build-view";
import { cellTypeColor, elementColor, getSiteUrl, SITE_NAME } from "@/lib/site";
import { loadIconDataUrl } from "@/lib/og-icons";
import {
    loadOgFonts,
    OG_AETHER,
    OG_BAD,
    OG_BG,
    OG_GOLD,
    OG_GOLD_RULE,
    OG_INK,
    OG_INK_2,
    OG_INK_3,
    OG_LINE_2,
    OG_PAGE_GLOW,
    OG_PAGE_VIGNETTE,
    ogBrand,
    ogChipDot,
    ogChipPill,
    ogEyebrow,
    ogGlass,
    ogGlassSheen,
    ogHeadline,
    ogPanelTitle,
    ogRowCard,
    toneAlpha,
    type OgChip,
} from "@/lib/og-theme";

export const runtime = "nodejs";
export const alt = "Mystic Builder - Dauntless build preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;

const trunc = (value: string, max: number): string =>
    value.length > max ? `${value.slice(0, max - 1)}…` : value;

/** Site logo, inlined for the brand tile. */
const loadLogo = async (): Promise<string | null> =>
    loadIconDataUrl("/assets/awakening-ui/logo/icon.png").catch(() => null);

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const Page = ({ children }: { children: React.ReactNode }) => (
    <div
        style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            /* vignette paints above the aether glow (CSS first layer is on top) */
            backgroundColor: OG_BG,
            backgroundImage: `${OG_PAGE_VIGNETTE}, ${OG_PAGE_GLOW}`,
            color: OG_INK,
            fontFamily: "Inter",
            padding: "36px 40px 32px",
        }}
    >
        {children}
    </div>
);

const Panel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ position: "relative", ...ogGlass(), ...style }}>
        <div style={ogGlassSheen} />
        {children}
    </div>
);

const Crest = ({ icon, tone, glow }: { icon: string | null; tone: string; glow?: boolean }) => (
    <div
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 92,
            height: 92,
            flexShrink: 0,
            borderRadius: 20,
            backgroundColor: "rgba(22, 35, 56, 0.6)",
            border: `1px solid ${tone}`,
            boxShadow: glow ? `0 0 24px ${toneAlpha(tone, 0.35)}, inset 0 1px 0 rgba(255, 255, 255, 0.07)` : "none",
        }}
    >
        {icon ? (
            <img src={icon} alt="" width={72} height={72} style={{ objectFit: "contain" }} />
        ) : (
            <div style={{ fontSize: 30, fontFamily: "Cinzel", fontWeight: 700, color: OG_INK_2, display: "flex" }}>
                ?
            </div>
        )}
    </div>
);

const Chip = ({ chip, compact }: { chip: OgChip; compact?: boolean }) => (
    <div style={ogChipPill(chip.tone, compact ? 13 : 14, compact ? 26 : 32)}>
        <div
            style={{
                ...ogChipDot(chip.tone, compact ? 8 : 9),
                marginRight: compact ? 7 : 8,
                flexShrink: 0,
            }}
        />
        <div
            style={{
                display: "flex",
                ...(compact
                    ? {}
                    : { textTransform: "uppercase" as const, letterSpacing: 1 }),
            }}
        >
            {trunc(chip.text, compact ? 30 : 28)}
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/* Image route                                                         */
/* ------------------------------------------------------------------ */

interface GearRow {
    icon: string;
    name: string;
    chips: OgChip[];
}

export default async function Image({ params }: { params: Promise<{ buildId: string }> }) {
    const { buildId } = await params;
    const parsed = parseBuildId(buildId);
    const fonts = await loadOgFonts();

    if (!parsed) {
        const logo = await loadLogo();
        return new ImageResponse(
            (
                <Page>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: 1,
                            gap: 22,
                        }}
                    >
                        <Crest icon={logo} tone={OG_LINE_2} glow={true} />
                        <div style={ogBrand(22)}>{"Mystic Builder"}</div>
                        <div style={ogHeadline(52)}>{"Dauntless Build"}</div>
                        <div style={ogChipPill(OG_BAD, 17)}>
                            <div style={{ ...ogChipDot(OG_BAD, 10), marginRight: 10 }} />
                            <div style={{ display: "flex" }}>{"This build link looks invalid or corrupted"}</div>
                        </div>
                        <div style={{ display: "flex", fontSize: 20, color: OG_INK_3 }}>
                            {"Open Mystic Builder to create or fix a build"}
                        </div>
                    </div>
                </Page>
            ),
            { ...size, fonts },
        );
    }

    const view = parsed.view;
    const rows: GearRow[] = [];

    // Armour pieces (weapon identity lives in the header tile + title).
    const armourRows: [string, typeof view.armour.head][] = [
        ["Head", view.armour.head],
        ["Torso", view.armour.torso],
        ["Arms", view.armour.arms],
        ["Legs", view.armour.legs],
    ];

    for (const [label, piece] of armourRows) {
        if (!piece) {
            continue;
        }
        rows.push({
            icon: piece.icon,
            name: piece.name,
            chips: [
                { text: piece.surged ? `${label} · surged` : label, tone: OG_GOLD },
                ...piece.perks.map(perk => ({ text: `${perk.name} ${perk.value}`, tone: OG_GOLD })),
                ...piece.cells
                    .filter(cell => cell.cellName !== null)
                    .flatMap(cell =>
                        cell.perks.map(perk => ({ text: `${perk.name} ${perk.value}`, tone: cellTypeColor(cell.slot) })),
                    ),
            ],
        });
    }

    // Lantern + omnicell as one compact row.
    const extrasChips: OgChip[] = [];
    let extrasIcon: string | null = null;
    if (view.lantern) {
        extrasIcon = view.lantern.item.icon;
        extrasChips.push({ text: `Lantern: ${view.lantern.item.name}`, tone: OG_GOLD });
        for (const perk of view.lantern.cell.perks) {
            extrasChips.push({
                text: `${perk.name} ${perk.value}`,
                tone: cellTypeColor(view.lantern?.cell.slot ?? null),
            });
        }
    }
    if (view.omnicell) {
        extrasIcon = extrasIcon ?? view.omnicell.icon;
        extrasChips.push({ text: `Omnicell: ${view.omnicell.name}`, tone: "#c58bea" });
    }
    if (extrasIcon && extrasChips.length > 0) {
        rows.push({ icon: extrasIcon, name: "Lantern & Omnicell", chips: extrasChips });
    }

    // Weapon-only builds still get a gear row.
    if (rows.length === 0 && view.weapon) {
        rows.push({
            icon: view.weapon.icon,
            name: view.weapon.name,
            chips: [
                { text: view.weapon.type, tone: OG_AETHER },
                ...view.weapon.cells
                    .filter(cell => cell.cellName !== null)
                    .flatMap(cell =>
                        cell.perks.map(perk => ({ text: `${perk.name} ${perk.value}`, tone: cellTypeColor(cell.slot) })),
                    ),
            ],
        });
    }

    const [logo, weaponIcon] = await Promise.all([loadLogo(), view.weapon ? loadIconDataUrl(view.weapon.icon) : null]);
    const rowIcons = await Promise.all(rows.map(row => loadIconDataUrl(row.icon).catch(() => null)));

    const perks = view.perkTotals.slice(0, 9);
    const elementTone = view.weapon ? elementColor(view.weapon.elemental) : OG_GOLD;
    const anySurged = Boolean(
        view.weapon?.surged ||
            view.armour.head?.surged ||
            view.armour.torso?.surged ||
            view.armour.arms?.surged ||
            view.armour.legs?.surged,
    );
    const domain = getSiteUrl().replace(/^https?:\/\//, "");

    const identityChips: OgChip[] = [];
    if (view.weapon?.elemental) {
        identityChips.push({ text: view.weapon.elemental, tone: elementTone });
    }
    if (view.weapon) {
        identityChips.push({ text: view.weapon.type, tone: OG_AETHER });
    }
    if (anySurged) {
        identityChips.push({ text: "Power surged", tone: "#f2c56c" });
    }
    if (view.invalid) {
        identityChips.push({ text: "Possibly invalid build", tone: OG_BAD });
    }

    return new ImageResponse(
        (
            <Page>
                {/* Brand header: logo tile + gold eyebrow + build title, weapon crest on the right */}
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <Crest icon={logo} tone={OG_LINE_2} glow={true} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, minWidth: 0 }}>
                        <div style={ogEyebrow(17)}>{"Dauntless · Mystic Paradox 1.14.7"}</div>
                        <div style={ogHeadline(38)}>{trunc(buildTitle(view), 42)}</div>
                    </div>
                    {view.weapon ? <Crest icon={weaponIcon} tone={toneAlpha(elementTone, 0.45)} glow={true} /> : null}
                </div>

                {/* Identity chips */}
                <div style={{ display: "flex", flexDirection: "row", gap: 10, marginTop: 16 }}>
                    {identityChips.map((chip, index) => (
                        <Chip key={index} chip={chip} />
                    ))}
                </div>

                {/* Gold rule */}
                <div style={{ ...OG_GOLD_RULE, marginTop: 16 }} />

                {/* Body: gear rows + perks panel */}
                <div style={{ display: "flex", flexDirection: "row", gap: 22, marginTop: 20, flex: 1, minHeight: 0 }}>
                    <Panel style={{ flex: 1.42, flexDirection: "column", padding: "12px 14px", gap: 6 }}>
                        {rows.length === 0 ? (
                            <div
                                style={{
                                    display: "flex",
                                    flex: 1,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    color: OG_INK_3,
                                }}
                            >
                                {"An empty loadout waiting to be filled"}
                            </div>
                        ) : (
                            rows.slice(0, 5).map((row, index) => (
                                <div
                                    key={index}
                                    style={{
                                        ...ogRowCard,
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "4px 10px",
                                    }}
                                >
                                    {rowIcons[index] ? (
                                        <img
                                            src={rowIcons[index]!}
                                            alt=""
                                            width={34}
                                            height={34}
                                            style={{ objectFit: "contain", flexShrink: 0 }}
                                        />
                                    ) : (
                                        <div style={{ width: 34, height: 34, flexShrink: 0 }} />
                                    )}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                fontSize: 18,
                                                fontWeight: 600,
                                                lineHeight: 1.1,
                                                color: OG_INK,
                                            }}
                                        >
                                            {trunc(row.name, 34)}
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "row", gap: 7 }}>
                                            {row.chips.slice(0, 3).map((chip, chipIndex) => (
                                                <Chip key={chipIndex} chip={chip} compact={true} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </Panel>

                    <Panel style={{ flex: 1, flexDirection: "column", padding: "14px 16px", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={ogPanelTitle(20)}>{"Perks"}</div>
                            <div
                                style={{
                                    display: "flex",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    letterSpacing: 2,
                                    color: OG_INK_3,
                                    textTransform: "uppercase",
                                }}
                            >
                                {`${view.perkTotals.length} total`}
                            </div>
                        </div>
                        {perks.length === 0 ? (
                            <div style={{ display: "flex", fontSize: 17, color: OG_INK_3 }}>{"No perks yet"}</div>
                        ) : (
                            perks.map(perk => (
                                <div
                                    key={perk.name}
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                                        <div
                                            style={{
                                                ...ogChipDot(cellTypeColor(perk.type), 9),
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ display: "flex", fontSize: 18, color: OG_INK }}>
                                            {trunc(perk.name, 22)}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            fontSize: 18,
                                            fontWeight: 700,
                                            color: OG_GOLD,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {(perk.value > 0 ? "+" : "") + String(perk.value)}
                                    </div>
                                </div>
                            ))
                        )}
                    </Panel>
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 18,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={ogBrand(16)}>{SITE_NAME}</div>
                        <div style={{ display: "flex", fontSize: 16, color: OG_INK_3 }}>{`·  ${domain}`}</div>
                    </div>
                    <div style={{ display: "flex", fontSize: 16, color: OG_INK_3 }}>
                        {"Open the link to view the full build"}
                    </div>
                </div>
            </Page>
        ),
        { ...size, fonts },
    );
}
