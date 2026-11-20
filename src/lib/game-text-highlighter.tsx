import React from "react";

interface HighlightRule {
    pattern: RegExp;
    className: string;
}

const HIGHLIGHT_RULES: HighlightRule[] = [
    // 1. Critical Negatives & Restrictions ("No", "Cannot", "Prevents", "Drain", "Halved") -> RED / ROSE
    {
        pattern: /\b(?:prevents?\s+all\s+healing|prevent\s+all\s+healing)\b/gi,
        className: "text-red-400 font-bold underline decoration-red-500/50 underline-offset-2",
    },
    {
        pattern: /\b(?:cannot\s+heal(?:[^\.,;]*)|cannot\s+dodge(?:[^\.,;]*)|cannot\s+gain(?:[^\.,;]*))\b/gi,
        className: "text-red-400 font-semibold",
    },
    {
        pattern: /\b(?:cannot|can\s+not)\b/gi,
        className: "text-red-400 font-bold",
    },
    {
        pattern: /\b(?:drain(?:s|ed|ing)?(?:\s+up\s+to)?\s+\d+\s+health|\d+\s+health\s+drained|drain(?:s|ed|ing)?\s+health)\b/gi,
        className: "text-rose-400 font-semibold",
    },
    {
        pattern: /\b(?:loses?(?:\s+all)?\s+\d*%?\s+health|health\s+is\s+halved|health\s+reduced(?:[^\.,;]*)|taking\s+damage\s+removes(?:[^\.,;]*)|lose\s+health)\b/gi,
        className: "text-rose-400 font-semibold",
    },

    // 2. Elemental Damage Types
    {
        pattern: /(?:[+-]?\d+%?\s+)?umbral\s+damage\b/gi,
        className: "text-purple-400 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%?\s+)?shock\s+damage\b/gi,
        className: "text-yellow-400 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%?\s+)?blaze\s+damage\b/gi,
        className: "text-orange-400 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%?\s+)?frost\s+damage\b/gi,
        className: "text-cyan-400 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%?\s+)?terra\s+damage\b/gi,
        className: "text-lime-400 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%?\s+)?radiant\s+damage\b/gi,
        className: "text-amber-200 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%?\s+)?(?:stagger|wound|part)\s+damage\b/gi,
        className: "text-amber-400 font-semibold",
    },

    // 3. Positive Healing, Health, Shields, Immunities, Recovery -> EMERALD / GREEN
    {
        pattern: /\bcannot\s+be\s+staggered\b/gi,
        className: "text-emerald-400 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%?\s+)?lifesteal(?:\s+[+-]?\d+%?)?/gi,
        className: "text-emerald-400 font-semibold",
    },
    {
        pattern: /\b\d+\s+health\s+per\s+second\b/gi,
        className: "text-emerald-400 font-semibold",
    },
    {
        pattern: /\b(?:increases?\s+max\s+health\s+by\s+\d+|\+?\d+\s+max\s+health)\b/gi,
        className: "text-emerald-400 font-semibold",
    },
    {
        pattern: /\b(?:healing\s+from\s+all\s+sources|healing\s+aura|restores?\s+health|restores?\s+stamina)\b/gi,
        className: "text-emerald-400 font-semibold",
    },
    {
        pattern: /\b(?:heals?|healing)\b/gi,
        className: "text-emerald-400 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%?\s+)?(?:increased\s+)?shields?(?:\s+capacity)?\b/gi,
        className: "text-emerald-400 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+\s+health)\b/gi,
        className: "text-emerald-400 font-semibold",
    },

    // 4. Combat Buffs, Crits & General Damage -> GOLD / AMBER
    {
        pattern: /(?:[+-]?\d+%\s+damage|\bdeals?\s+\d+\s+damage)\b/gi,
        className: "text-amber-300 font-semibold",
    },
    {
        pattern: /\b(?:critical\s+strikes?|critical\s+hits?|critical\s+strike\s+chance)\b/gi,
        className: "text-amber-300 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%\s+)?attack\s+speed(?:\s+[+-]?\d+%)?/gi,
        className: "text-amber-300 font-semibold",
    },
    {
        pattern: /(?:[+-]?\d+%\s+)?movement\s+speed(?:\s+[+-]?\d+%)?/gi,
        className: "text-amber-300 font-semibold",
    },

    // 5. Cooldowns & Durations -> SKY / CYAN
    {
        pattern: /\b\d+\s+seconds?\s+cooldown\b/gi,
        className: "text-sky-300 font-semibold",
    },
    {
        pattern: /\b\d+\s+seconds?\b/gi,
        className: "text-sky-300 font-medium",
    },

    // 6. Signature Mechanics & Stacks
    {
        pattern: /\b(?:Void\s+Orbs?|Void\s+Energy|Umbral\s+Tendrils?)\b/gi,
        className: "text-purple-300 font-semibold",
    },
    {
        pattern: /\b(?:stacks?\s+of\s+Velocity|Velocity)\b/gi,
        className: "text-yellow-300 font-semibold",
    },
];

export function highlightGameText(text: string | null | undefined): React.ReactNode {
    if (!text) return null;

    type MatchSpan = {
        start: number;
        end: number;
        className: string;
    };

    const matches: MatchSpan[] = [];

    for (const rule of HIGHLIGHT_RULES) {
        const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            const overlaps = matches.some(
                m => (start >= m.start && start < m.end) || (end > m.start && end <= m.end),
            );
            if (!overlaps) {
                matches.push({ start, end, className: rule.className });
            }
        }
    }

    if (matches.length === 0) {
        return text;
    }

    matches.sort((a, b) => a.start - b.start);

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((m, idx) => {
        if (m.start > lastIndex) {
            nodes.push(text.slice(lastIndex, m.start));
        }
        nodes.push(
            <span key={idx} className={m.className}>
                {text.slice(m.start, m.end)}
            </span>,
        );
        lastIndex = m.end;
    });

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}
