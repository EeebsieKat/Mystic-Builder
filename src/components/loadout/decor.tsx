/**
 * Awakening loadout decorative atoms.
 *
 * All ornamentation is drawn as inline SVG so it stays crisp at any stage
 * scale. Every component accepts an optional `src` prop: when official ripped
 * art becomes available it can be dropped in without touching layout.
 */

import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Diamonds & flourishes                                               */
/* ------------------------------------------------------------------ */

export const DiamondPip = ({ size = 8, className = "", color = "#c8b98a" }: { size?: number; className?: string; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 10 10" className={className} aria-hidden>
        <path d="M5 0 L10 5 L5 10 L0 5 Z" fill={color} />
    </svg>
);

/** Section header with flourish rules and diamond finials on both sides. */
export const FlourishHeader = ({ title, className = "" }: { title: string; className?: string }) => (
    <div className={`flex items-center gap-3 ${className}`} role="heading" aria-level={2}>
        <span className="lo-flourish" aria-hidden />
        <DiamondPip size={7} color="#bfae85" />
        <span className="lo-serif whitespace-nowrap text-[21px] font-semibold tracking-[0.18em] text-[#dcd8cc]">
            {title.toUpperCase()}
        </span>
        <DiamondPip size={7} color="#bfae85" />
        <span className="lo-flourish lo-flourish-r" aria-hidden />
    </div>
);

/* ------------------------------------------------------------------ */
/* Winged crest emblem                                                 */
/* ------------------------------------------------------------------ */

export const CrestEmblem = ({ size = 150, className = "" }: { size?: number; className?: string }) => (
    <img alt="Loadout Crest" width="180" src="assets/awakening-ui/loadout/loadoutlevel10.png">
    </img>
);

/* ------------------------------------------------------------------ */
/* Plaque chips                                                        */
/* ------------------------------------------------------------------ */

export const SwordGlyph = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
    <img alt="Weapon Level" width="30" height="30" src="/assets/icons/generic/Weapon.png"></img>
);

export const ShieldGlyph = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
    <img alt="Weapon Level" width="30" height="30" src="/assets/icons/generic/Head.png"></img>
);

/* ------------------------------------------------------------------ */
/* Cell hex icon                                                       */
/* ------------------------------------------------------------------ */

/** White hexagonal ring used for cell slots (filled & empty states). */
export const CellHexIcon = ({ size = 56, dim = false }: { size?: number; dim?: boolean }) => (
    <img alt="Weapon Level" width="20" height="20" src="/assets/icons/perks/NoCell.png"></img>
);

/* ------------------------------------------------------------------ */
/* Consumable glyphs (fallbacks until PAK art lands)                   */
/* ------------------------------------------------------------------ */

const TINTS: Record<string, { liquid: string; glow: string }> = {
    flask: { liquid: "#c0453f", glow: "rgba(192,69,63,0.45)" },
    tonic: { liquid: "#57b06a", glow: "rgba(87,176,106,0.4)" },
    pylon: { liquid: "#7d68d8", glow: "rgba(125,104,216,0.42)" },
};

/** Vector stand-in for tonic/pylon/flask icons; swapped for rips later. */
export const ConsumableGlyph = ({ type, size = 52 }: { type: "flask" | "tonic" | "pylon"; size?: number }) => {
    const tint = TINTS[type];
    return (
        <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden style={{ filter: `drop-shadow(0 0 8px ${tint.glow})` }}>
            {type === "flask" && (
                <g>
                    <path d="M24 6 h12 v6 h-12 z" fill="#8f9aa8" />
                    <path
                        d="M22 14 h16 v10 l10 18 c2 4-1 8-5 8 H17 c-4 0-7-4-5-8 l10-18 z"
                        fill="rgba(16,19,24,0.9)"
                        stroke="#aab3bf"
                        strokeWidth="2"
                    />
                    <path d="M18 38 c4-3 20-3 24 0 l5 8 c2 4-1 7-5 7 H18 c-4 0-7-3-5-7 z" fill={tint.liquid} />
                    <path d="M27 20 h6 v14 h-6 z" fill={tint.liquid} opacity="0.7" />
                    <path d="M31 44 h6 l-2 6 h-4 z" fill="#fff" opacity="0.5" />
                </g>
            )}
            {type === "tonic" && (
                <g>
                    <path d="M27 5 h6 v5 h-6 z" fill="#8f6f4a" />
                    <path
                        d="M26 10 h8 v14 c8 5 10 12 10 18 c0 8-6 13-14 13 s-14-5-14-13 c0-6 2-13 10-18 z"
                        fill="rgba(16,19,24,0.9)"
                        stroke="#aab3bf"
                        strokeWidth="2"
                    />
                    <path
                        d="M21 34 c-4 4-5 8-5 11 c0 6 5 10 14 10 s14-4 14-10 c0-3-1-7-5-11 c-3 3-6 4-9 4 s-6-1-9-4 z"
                        fill={tint.liquid}
                    />
                    <ellipse cx="30" cy="41" rx="3.4" ry="5" fill={tint.liquid} opacity="0.85" />
                    <path d="M24 47 l3 5" stroke="#fff" strokeWidth="1.6" opacity="0.5" strokeLinecap="round" />
                </g>
            )}
            {type === "pylon" && (
                <g>
                    <path d="M18 50 h24 l-3 5 h-18 z" fill="#3d4450" stroke="#59616e" strokeWidth="1.5" />
                    <path d="M22 47 h16 l-2-4 h-12 z" fill="#4a5260" />
                    <path
                        d="M30 8 L40 22 L36 44 H24 L20 22 Z"
                        fill="rgba(16,19,24,0.85)"
                        stroke={tint.liquid}
                        strokeWidth="2.2"
                    />
                    <path d="M30 14 L36 23 L33 41 H27 L24 23 Z" fill={tint.liquid} opacity="0.8" />
                    <path d="M30 14 L30 41" stroke="#fff" strokeWidth="1.4" opacity="0.45" />
                </g>
            )}
        </svg>
    );
};

/* ------------------------------------------------------------------ */
/* Corner brackets for the item showcase box                           */
/* ------------------------------------------------------------------ */

export const CornerFrame = ({ size = 22, color = "#c8955a" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="absolute">
        <path d="M2 10 V4 Q2 2 4 2 H10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const ShowcaseCorners = () => (
    <>
        <span className="absolute left-[4px] top-[4px]"><CornerFrame /></span>
        <span className="absolute right-[4px] top-[4px] rotate-90"><CornerFrame /></span>
        <span className="absolute right-[4px] bottom-[4px] rotate-180"><CornerFrame /></span>
        <span className="absolute left-[4px] bottom-[4px] -rotate-90"><CornerFrame /></span>
    </>
);

/* ------------------------------------------------------------------ */
/* Item icon with graceful fallback                                    */
/* ------------------------------------------------------------------ */

/**
 * Renders a game icon from /assets/...; if the file is missing (or `icon` is
 * null) renders the fallback glyph instead. This keeps the UI complete while
 * PAK-extracted art lands progressively.
 */
export const ItemIcon = ({
    icon,
    alt,
    size = 64,
    fallback,
    className = "",
}: {
    icon: string | null | undefined;
    alt: string;
    size?: number;
    fallback?: React.ReactNode;
    className?: string;
}) => {
    const [failed, setFailed] = useState(false);
    if (!icon || failed) {
        return (
            <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }} role="img" aria-label={alt}>
                {fallback ?? (
                    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" aria-hidden>
                        <path d="M12 3 L19 6 V11 C 19 16, 16 20, 12 21.5 C 8 20, 5 16, 5 11 V6 Z" fill="none" stroke="#8a8f99" strokeWidth="1.6" />
                    </svg>
                )}
            </span>
        );
    }
    return (
        <img
            src={icon}
            alt={alt}
            width={size}
            height={size}
            className={`object-contain ${className}`}
            style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.55))" }}
            onError={() => setFailed(true)}
            draggable={false}
        />
    );
};
