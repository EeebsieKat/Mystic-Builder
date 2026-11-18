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

const GoldGradient = ({ id }: { id: string }) => (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f0c25e" />
        <stop offset="55%" stopColor="#e0a33e" />
        <stop offset="100%" stopColor="#b07c33" />
    </linearGradient>
);

const ShieldGradient = ({ id }: { id: string }) => (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a83232" />
        <stop offset="100%" stopColor="#5d161a" />
    </linearGradient>
);

const Wing = ({ side }: { side: "l" | "r" }) => {
    const flip = side === "l";
    return (
        <g transform={flip ? "translate(200,0) scale(-1,1)" : undefined}>
            {/* three layered feathers */}
            <path
                d="M100 62 C 64 30, 30 22, 6 30 C 26 40, 34 48, 38 56 C 22 56, 12 60, 4 66 C 26 70, 36 74, 44 80 C 30 84, 22 90, 16 98 C 42 96, 58 90, 68 84 Z"
                fill="url(#crest-gold)"
                stroke="#8a6428"
                strokeWidth="1.2"
            />
            <path
                d="M100 66 C 72 44, 48 40, 28 46 C 44 54, 52 60, 58 68 C 46 70, 38 74, 32 80 C 52 80, 66 78, 76 76 Z"
                fill="url(#crest-gold-soft)"
                opacity="0.92"
            />
        </g>
    );
};

const Star = ({ x, y, size, fill = "#f0c25e" }: { x: number; y: number; size: number; fill?: string }) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? size : size * 0.42;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        return `${(x + r * Math.cos(a)).toFixed(2)},${(y + r * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    return <polygon points={pts} fill={fill} stroke="#8a6428" strokeWidth="0.6" />;
};

/**
 * The winged crest from the Awakening loadout header: spread gold wings,
 * maroon heraldic shield, star on top and a three-star rank banner.
 */
export const CrestEmblem = ({ size = 150, className = "" }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={(size * 160) / 200}
        viewBox="0 0 200 160"
        className={className}
        aria-hidden
        style={{ filter: "drop-shadow(0 0 14px rgba(224,163,62,0.28))" }}
    >
        <defs>
            <GoldGradient id="crest-gold" />
            <linearGradient id="crest-gold-soft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8b959" />
                <stop offset="100%" stopColor="#c8955a" />
            </linearGradient>
            <ShieldGradient id="crest-shield" />
        </defs>

        <Wing side="l" />
        <Wing side="r" />

        {/* shield */}
        <path
            d="M100 34 L134 46 L134 84 C 134 108, 118 124, 100 132 C 82 124, 66 108, 66 84 L66 46 Z"
            fill="url(#crest-shield)"
            stroke="url(#crest-gold)"
            strokeWidth="3"
        />
        <path
            d="M100 42 L126 51 L126 83 C 126 102, 114 115, 100 122 C 86 115, 74 102, 74 83 L74 51 Z"
            fill="none"
            stroke="#e0a33e"
            strokeWidth="0.8"
            opacity="0.55"
        />

        <Star x={100} y={26} size={11} />

        {/* rank banner with three stars */}
        <path d="M70 134 C 84 128, 116 128, 130 134 L124 146 C 112 141, 88 141, 76 146 Z" fill="url(#crest-gold)" stroke="#8a6428" strokeWidth="1" />
        <Star x={88} y={140} size={4} fill="#fff3d6" />
        <Star x={100} y={139} size={4.6} fill="#fff3d6" />
        <Star x={112} y={140} size={4} fill="#fff3d6" />
    </svg>
);

/* ------------------------------------------------------------------ */
/* Plaque chips                                                        */
/* ------------------------------------------------------------------ */

export const SwordGlyph = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
        <path
            d="M20 4 L14 10 M20 4 h-4 M20 4 v4 M12.5 8.5 L5 16 M6.5 21 L3 17.5 L4.5 16 L8 19.5 Z M9 12 L12 15"
            stroke="#f2efe7"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
        />
    </svg>
);

export const ShieldGlyph = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
        <path
            d="M12 3 L19 6 V11 C 19 16, 16 20, 12 21.5 C 8 20, 5 16, 5 11 V6 Z"
            stroke="#f2efe7"
            strokeWidth="1.6"
            fill="none"
            strokeLinejoin="round"
        />
    </svg>
);

/* ------------------------------------------------------------------ */
/* Cell hex icon                                                       */
/* ------------------------------------------------------------------ */

/** White hexagonal ring used for cell slots (filled & empty states). */
export const CellHexIcon = ({ size = 56, dim = false }: { size?: number; dim?: boolean }) => (
    <svg width={size} height={size * 1.05} viewBox="0 0 52 55" aria-hidden style={{ opacity: dim ? 0.4 : 1 }}>
        <polygon
            points="26,2 48,14 48,41 26,53 4,41 4,14"
            fill="none"
            stroke="#e8e4da"
            strokeWidth="2.4"
        />
        <polygon
            points="26,12 40,20 40,35 26,43 12,35 12,20"
            fill="none"
            stroke="#9a9a94"
            strokeWidth="1.2"
        />
    </svg>
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
        <span className="absolute left-[6px] top-[6px]"><CornerFrame /></span>
        <span className="absolute right-[6px] top-[6px] rotate-90"><CornerFrame /></span>
        <span className="absolute right-[6px] bottom-[6px] rotate-180"><CornerFrame /></span>
        <span className="absolute left-[6px] bottom-[6px] -rotate-90"><CornerFrame /></span>
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
