/**
 * Client + server profanity & slur filter.
 * Normalizes common leetspeak/separators while avoiding false-positives on normal gaming words.
 */

const EXACT_ONLY_TERMS = new Set([
    "asshole",
    "cock",
    "dick",
    "fag",
    "kys",
    "pussy",
]);

const SUBSTRING_SAFE_TERMS = [
    "fuck",
    "shit",
    "bitch",
    "bastard",
    "cunt",
    "dickhead",
    "faggot",
    "nigger",
    "nigga",
    "retard",
    "slut",
    "whore",
];

const LEET_MAP: Record<string, string> = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "@": "a",
    "$": "s",
    "!": "i",
};

function normalizeLetters(token: string): string {
    const lower = token.toLowerCase();
    let out = "";
    for (let i = 0; i < lower.length; i++) {
        const mapped = LEET_MAP[lower[i]] ?? lower[i];
        if (mapped >= "a" && mapped <= "z") {
            out += mapped;
        }
    }
    return out;
}

function collapseRepeats(word: string, maxRun: number): string {
    let res = "";
    let prev = "";
    let run = 0;
    for (const ch of word) {
        if (ch === prev) {
            run += 1;
            if (run <= maxRun) res += ch;
        } else {
            prev = ch;
            run = 1;
            res += ch;
        }
    }
    return res;
}

function matchesBlocked(word: string): boolean {
    if (!word) return false;
    const variants = [word, collapseRepeats(word, 2), collapseRepeats(word, 1)];
    for (const v of variants) {
        if (EXACT_ONLY_TERMS.has(v)) return true;
        for (const sub of SUBSTRING_SAFE_TERMS) {
            if (v.includes(sub)) return true;
        }
    }
    return false;
}

export function containsProfanity(text: string): boolean {
    if (!text) return false;

    // 1. Tokenize on whitespace, punctuation, underscores, and hyphens (catches "my_dick_123" and "fucktest123")
    const rawTokens = text.split(/[\s_.,;:!?()[\]{}"'\/\\|<>-]+/).filter(Boolean);
    for (const raw of rawTokens) {
        if (matchesBlocked(normalizeLetters(raw))) return true;
    }

    // 2. Check space/punctuation-separated letters like "f u c k" or "s.h.i.t"
    const collapsedSpaces = text
        .toLowerCase()
        .replace(/(?<=\b[a-z0-9@$!])[\s._-]+(?=[a-z0-9@$!]\b)/g, "");
    const spaceCollapsedTokens = collapsedSpaces.split(/[\s_.,;:!?()[\]{}"'\/\\|<>-]+/).filter(Boolean);
    for (const tok of spaceCollapsedTokens) {
        if (matchesBlocked(normalizeLetters(tok))) return true;
    }

    return false;
}

export function validateCleanText(
    text: string,
    fieldName = "Content"
): { valid: boolean; error?: string } {
    if (containsProfanity(text)) {
        return {
            valid: false,
            error: `${fieldName} contains blocked language. Please keep the community respectful.`,
        };
    }
    return { valid: true };
}
