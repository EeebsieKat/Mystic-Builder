import type { CSSProperties } from "react";

import { loadFont } from "./og-icons";

/**
 * Mystic Paradox Launcher Theme tokens, translated for the Open Graph renderer.
 *
 * Source of truth: the "Mystic Paradox Launcher Theme" design doc
 * (launcher src/styles/tokens.css) - dark-only night-glass world with
 * luminous aether blue and antique gold. The OG card must read as the
 * same product as the site, so it reuses these exact values.
 */

/* ------------------------------------------------------------------ */
/* Palette (design doc: Colors)                                        */
/* ------------------------------------------------------------------ */

export const OG_BG = "#050a12"; // --bg
export const OG_BG_RAISE = "#0a1320"; // --bg-raise
export const OG_CARD = "#060a12"; // loadout --lo-card, used for gear rows

export const OG_INK = "#eef3fb"; // --ink, main text
export const OG_INK_2 = "#b9c5d8"; // --ink-2, secondary / labels
export const OG_INK_3 = "#8191a8"; // --ink-3, muted / captions
export const OG_INK_4 = "#76859f"; // --ink-4, placeholders

export const OG_AETHER = "#5ba3ff"; // --aether, accent
export const OG_AETHER_HI = "#8cc6ff"; // --aether-hi
export const OG_AETHER_LO = "#2a6fe0"; // --aether-lo

export const OG_GOLD = "#e0c287"; // --gold, eyebrows / featured
export const OG_GOLD_LO = "#b8955a"; // --gold-lo, ornament

export const OG_OK = "#45d99b";
export const OG_WARN = "#f2c56c";
export const OG_BAD = "#ff7186";

/** Fixed color from the design doc: hero titles render near-white. */
export const OG_HERO_TITLE = "#f4f8ff";

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const value = hex.replace("#", "");
    const int = parseInt(value.length === 3 ? value.replace(/./g, ch => ch + ch) : value, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

/** tone at N% alpha over transparent - used for chip fills and borders. */
export const toneAlpha = (tone: string, alpha: number): string => {
    const { r, g, b } = hexToRgb(tone);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Design doc chips: "text mixed 55% with white" i.e. color-mix(in srgb, tone 55%, white).
 * 55% of the tone + 45% white keeps small colored text readable on dark glass.
 */
export const toneText = (tone: string): string => {
    const { r, g, b } = hexToRgb(tone);
    const mix = (channel: number) => Math.round(channel * 0.55 + 255 * 0.45);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

/* ------------------------------------------------------------------ */
/* Surface styles (design doc: glass, lines, radius)                   */
/* ------------------------------------------------------------------ */

/** Hairline / hover lines from the doc (--line / --line-2 / --line-3). */
export const OG_LINE = "rgba(164, 198, 240, 0.11)";
export const OG_LINE_2 = "rgba(164, 198, 240, 0.2)";
export const OG_LINE_3 = "rgba(164, 198, 240, 0.32)";

/** Glass panel: 22px radius (--r-xl), top→bottom glass gradient, hairline border. */
export const ogGlass = (radius = 22): CSSProperties => ({
    display: "flex",
    backgroundImage: "linear-gradient(180deg, rgba(22, 35, 56, 0.6), rgba(9, 16, 28, 0.72))",
    border: `1px solid ${OG_LINE}`,
    borderRadius: radius,
});

/**
 * Top-edge sheen overlay (design doc --sheen). Rendered as a gradient strip
 * inside the panel instead of inset box-shadow, which satori renders less reliably.
 */
export const ogGlassSheen: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "45%",
    borderRadius: 22,
    backgroundImage: "linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 100%)",
};

/** Gear row card: the loadout screen's --lo-card recipe at OG scale. */
export const ogRowCard: CSSProperties = {
    display: "flex",
    backgroundColor: OG_CARD,
    backgroundImage: "linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0) 45%)",
    border: `1px solid rgba(164, 198, 240, 0.16)`,
    borderRadius: 14,
};

/** Page background glow: the doc's aether radial (body::before), brightened for print scale. */
export const OG_PAGE_GLOW = "radial-gradient(60% 40% at 50% 0%, rgba(91, 163, 255, 0.16), transparent 70%)";

/** Soft vignette so the card edges stay dark like the launcher's backdrop. */
export const OG_PAGE_VIGNETTE = "radial-gradient(120% 90% at 50% 45%, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.42) 100%)";

/** Gold rule: the site's .gold-rule divider. */
export const OG_GOLD_RULE: CSSProperties = {
    height: 2,
    backgroundImage:
        "linear-gradient(to right, rgba(224, 194, 135, 0), rgba(224, 194, 135, 0.3) 20%, rgba(224, 194, 135, 0.75) 50%, rgba(224, 194, 135, 0.3) 80%, rgba(224, 194, 135, 0))",
};

/* ------------------------------------------------------------------ */
/* Text styles (design doc: Text styles, scaled for a 1200x630 card)   */
/* ------------------------------------------------------------------ */

/** Eyebrow: Inter ~650, gold, +0.34em, uppercase. */
export const ogEyebrow = (fontSize: number): CSSProperties => ({
    display: "flex",
    fontWeight: 600,
    fontSize,
    letterSpacing: 0.34 * fontSize,
    textTransform: "uppercase",
    color: OG_GOLD,
});

/** Panel title: Cinzel 700, uppercase, +0.1em. */
export const ogPanelTitle = (fontSize: number): CSSProperties => ({
    display: "flex",
    fontFamily: "Cinzel",
    fontWeight: 700,
    fontSize,
    letterSpacing: 0.1 * fontSize,
    textTransform: "uppercase",
    color: OG_INK,
});

/** Display serif headline: Cinzel 700 near-white with the doc's soft aether glow. */
export const ogHeadline = (fontSize: number): CSSProperties => ({
    display: "flex",
    fontFamily: "Cinzel",
    fontWeight: 700,
    fontSize,
    lineHeight: 1.12,
    letterSpacing: 0.02 * fontSize,
    color: OG_HERO_TITLE,
    textShadow: "0 2px 30px rgba(0, 0, 0, 0.55), 0 0 42px rgba(91, 163, 255, 0.2)",
});

/** Brand name: Cinzel 700, +0.2em, uppercase ("MYSTIC PARADOX" style). */
export const ogBrand = (fontSize: number): CSSProperties => ({
    display: "flex",
    fontFamily: "Cinzel",
    fontWeight: 700,
    fontSize,
    letterSpacing: 0.2 * fontSize,
    textTransform: "uppercase",
    color: OG_INK_2,
});

/* ------------------------------------------------------------------ */
/* Chips (design doc: 26px pill, tone 13% fill / 32% border /           */
/* text mixed 55% with white, 7px dot in currentColor)                  */
/* ------------------------------------------------------------------ */

export interface OgChip {
    text: string;
    tone: string;
}

/** Chip pill scaled for the OG card. Doc chips are 26px pills; identity chips run taller. */
export const ogChipPill = (tone: string, fontSize: number, height = 32): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    height,
    padding: "0 12px",
    borderRadius: 999,
    backgroundColor: toneAlpha(tone, 0.13),
    border: `1px solid ${toneAlpha(tone, 0.32)}`,
    color: toneText(tone),
    fontSize,
    fontWeight: 600,
});

export const ogChipDot = (tone: string, size = 10): CSSProperties => ({
    width: size,
    height: size,
    borderRadius: 999,
    backgroundColor: tone,
});

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

export interface OgFont {
    name: string;
    data: Buffer;
    weight: 400 | 500 | 600 | 700;
    style: "normal";
}

/**
 * Site typography for the OG renderer: Cinzel display serif (always 700)
 * + Inter UI text, matching --font-display / --font-body from the design doc.
 */
export const loadOgFonts = async (): Promise<OgFont[]> => {
    const [cinzel700, inter400, inter500, inter600, inter700] = await Promise.all([
        loadFont("Cinzel-700.ttf"),
        loadFont("Inter-400.ttf"),
        loadFont("Inter-500.ttf"),
        loadFont("Inter-600.ttf"),
        loadFont("Inter-700.ttf"),
    ]);

    return [
        { name: "Cinzel", data: cinzel700, weight: 700, style: "normal" },
        { name: "Inter", data: inter400, weight: 400, style: "normal" },
        { name: "Inter", data: inter500, weight: 500, style: "normal" },
        { name: "Inter", data: inter600, weight: 600, style: "normal" },
        { name: "Inter", data: inter700, weight: 700, style: "normal" },
    ];
};
