import { ImageResponse } from "next/og";
import { parseBuildId, buildTitle } from "@/game/build-view";
import { cellTypeColor, elementColor, getSiteUrl, SITE_NAME } from "@/lib/site";
import { loadFont, loadIconDataUrl } from "@/lib/og-icons";

export const runtime = "nodejs";
export const alt = "Dauntless build preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;

const trunc = (value: string, max: number): string =>
    value.length > max ? `${value.slice(0, max - 1)}…` : value;

const loadFonts = async (): Promise<{ name: string; data: Buffer; weight: 400 | 700; style: "normal" }[]> => {
    const [regular, bold] = await Promise.all([loadFont("DejaVuSans.ttf"), loadFont("DejaVuSans-Bold.ttf")]);
    return [
        { name: "sans", data: regular, weight: 400, style: "normal" },
        { name: "sans", data: bold, weight: 700, style: "normal" },
    ];
};

interface GearRow {
    icon: string;
    name: string;
    chips: { text: string; color: string }[];
}

export default async function Image({ params }: { params: Promise<{ buildId: string }> }) {
    const { buildId } = await params;
    const parsed = parseBuildId(buildId);
    const fonts = await loadFonts();

    if (!parsed) {
        return new ImageResponse(
            (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#0d1117",
                        color: "#e6edf3",
                        fontFamily: "sans",
                    }}
                >
                    <div style={{ fontSize: 52, fontWeight: 700 }}>Dauntless Build</div>
                    <div style={{ fontSize: 28, color: "#f0b232", marginTop: 16 }}>
                        This build link looks invalid or corrupted.
                    </div>
                </div>
            ),
            { ...size, fonts },
        );
    }

    const view = parsed.view;
    const rows: GearRow[] = [];

    // 1) Weapon with element + cell chips
    if (view.weapon) {
        rows.push({
            icon: view.weapon.icon,
            name: view.weapon.name,
            chips: [
                { text: view.weapon.type, color: elementColor(view.weapon.elemental) },
                ...view.weapon.cells
                    .filter(cell => cell.cellName !== null)
                    .flatMap(cell =>
                        cell.perks.map(perk => ({ text: `${perk.name} ${perk.value}`, color: cellTypeColor(cell.slot) })),
                    ),
            ],
        });
    }

    // 2) Armour pieces
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
                { text: label + (piece.surged ? " (surged)" : ""), color: "#c9a86a" },
                ...piece.perks.map(perk => ({ text: `${perk.name} ${perk.value}`, color: "#c9a86a" })),
                ...piece.cells
                    .filter(cell => cell.cellName !== null)
                    .flatMap(cell =>
                        cell.perks.map(perk => ({ text: `${perk.name} ${perk.value}`, color: cellTypeColor(cell.slot) })),
                    ),
            ],
        });
    }

    // 3) Lantern + Omnicell merged into one compact row if present
    const extrasChips: { text: string; color: string }[] = [];
    let extrasIcon: string | null = null;
    if (view.lantern) {
        extrasIcon = view.lantern.item.icon;
        extrasChips.push({ text: `Lantern: ${view.lantern.item.name}`, color: "#f0b232" });
        for (const perk of view.lantern.cell.perks) {
            extrasChips.push({ text: `${perk.name} ${perk.value}`, color: cellTypeColor(view.lantern?.cell.slot ?? null) });
        }
    }
    if (view.omnicell) {
        extrasIcon = extrasIcon ?? view.omnicell.icon;
        extrasChips.push({ text: `Omnicell: ${view.omnicell.name}`, color: "#c58bea" });
    }
    if (extrasIcon && extrasChips.length > 0) {
        rows.push({ icon: extrasIcon, name: "Loadout extras", chips: extrasChips });
    }

    const iconUrls = await Promise.all(rows.map(row => loadIconDataUrl(row.icon).catch(() => null)));

    const perks = view.perkTotals.slice(0, 10);
    const accent = view.weapon ? elementColor(view.weapon.elemental) : "#f0b232";
    const domain = getSiteUrl().replace(/^https?:\/\//, "");

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#0d1117",
                    backgroundImage: "linear-gradient(135deg, #0d1117 0%, #1a1626 60%, #241a10 100%)",
                    color: "#e6edf3",
                    fontFamily: "sans",
                    padding: 28,
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 22 }}>
                    <div
                        style={{
                            width: 92,
                            height: 92,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 16,
                            backgroundColor: "#161b22",
                            border: `3px solid ${accent}`,
                        }}
                    >
                        {iconUrls[0] ? (
                            <img src={iconUrls[0]} alt="" width={78} height={78} style={{ objectFit: "contain" }} />
                        ) : (
                            <div style={{ fontSize: 36, display: "flex" }}>{view.weapon ? "W" : "A"}</div>
                        )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1 }}>
                            {trunc(buildTitle(view), 44)}
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <div
                                style={{
                                    display: "flex",
                                    padding: "5px 14px",
                                    borderRadius: 999,
                                    backgroundColor: "#f0b232",
                                    color: "#14161a",
                                    fontSize: 20,
                                    fontWeight: 700,
                                }}
                            >
                                {"Dauntless " + view.gameVersion}
                            </div>
                            {view.weapon?.elemental ? (
                                <div
                                    style={{
                                        display: "flex",
                                        padding: "5px 14px",
                                        borderRadius: 999,
                                        border: `2px solid ${accent}`,
                                        color: accent,
                                        fontSize: 20,
                                    }}
                                >
                                    {view.weapon.elemental}
                                </div>
                            ) : null}
                            {view.invalid ? (
                                <div
                                    style={{
                                        display: "flex",
                                        padding: "5px 14px",
                                        borderRadius: 999,
                                        border: "2px solid #e2574c",
                                        color: "#e2574c",
                                        fontSize: 20,
                                    }}
                                >
                                    Possibly invalid build
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ display: "flex", flexDirection: "row", gap: 24, marginTop: 22, flex: 1 }}>
                    {/* Gear column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1.35 }}>
                        {rows.slice(0, 6).map((row, index) => (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 14,
                                    backgroundColor: "rgba(255,255,255,0.04)",
                                    borderRadius: 12,
                                    padding: "6px 14px",
                                }}
                            >
                                {iconUrls[index] ? (
                                    <img
                                        src={iconUrls[index]}
                                        alt=""
                                        width={40}
                                        height={40}
                                        style={{ objectFit: "contain", flexShrink: 0 }}
                                    />
                                ) : (
                                    <div style={{ width: 40, height: 40 }} />
                                )}
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    <div style={{ fontSize: 22, fontWeight: 700 }}>{trunc(row.name, 36)}</div>
                                    <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
                                        {row.chips.slice(0, 3).map((chip, chipIndex) => (
                                            <div
                                                key={chipIndex}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 5,
                                                    fontSize: 15,
                                                    color: "#b7bec7",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 9,
                                                        height: 9,
                                                        borderRadius: 999,
                                                        backgroundColor: chip.color,
                                                    }}
                                                />
                                                {trunc(chip.text, 26)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Perks column */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            backgroundColor: "rgba(240,178,50,0.07)",
                            border: "2px solid rgba(240,178,50,0.35)",
                            borderRadius: 14,
                            padding: 16,
                            gap: 9,
                        }}
                    >
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#f0b232" }}>Perks</div>
                        {perks.length === 0 ? (
                            <div style={{ fontSize: 18, color: "#8b949e" }}>No perks</div>
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
                                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                        <div
                                            style={{
                                                width: 11,
                                                height: 11,
                                                borderRadius: 999,
                                                backgroundColor: cellTypeColor(perk.type),
                                            }}
                                        />
                                        <div style={{ fontSize: 19 }}>{trunc(perk.name, 22)}</div>
                                    </div>
                                    <div style={{ fontSize: 19, fontWeight: 700, color: "#f0b232" }}>
                                        {(perk.value > 0 ? "+" : "") + String(perk.value)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 16,
                    }}
                >
                    <div style={{ fontSize: 20, color: "#8b949e" }}>{SITE_NAME + " - " + domain}</div>
                    <div style={{ fontSize: 20, color: "#8b949e" }}>Open the link to view the full build</div>
                </div>
            </div>
        ),
        { ...size, fonts },
    );
}
