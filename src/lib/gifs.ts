export interface GifPresetItem {
    id: string;
    title: string;
    url: string;
    tags: string[];
}

export const BUILTIN_GIFS: GifPresetItem[] = [
    {
        id: "gg-wp",
        title: "GG WP",
        url: "/assets/gifs/gg-wp.gif",
        tags: ["gg", "wp", "win", "victory", "nice", "good game"],
    },
    {
        id: "big-bonk",
        title: "BONK!",
        url: "/assets/gifs/bonk.gif",
        tags: ["bonk", "hammer", "axe", "stagger", "hit", "meme"],
    },
    {
        id: "on-fire",
        title: "ON FIRE",
        url: "/assets/gifs/fire.gif",
        tags: ["fire", "blaze", "hot", "op", "meta", "insane"],
    },
    {
        id: "hype",
        title: "HYPE!",
        url: "/assets/gifs/hype.gif",
        tags: ["hype", "lets go", "pumped", "fast", "speed", "trial"],
    },
    {
        id: "clap",
        title: "CLEAN!",
        url: "/assets/gifs/clean.gif",
        tags: ["clean", "clap", "respect", "pro", "smooth"],
    },
    {
        id: "rip",
        title: "OOF / RIP",
        url: "/assets/gifs/rip.gif",
        tags: ["rip", "oof", "dead", "down", "revenant", "pain"],
    },
    {
        id: "aether",
        title: "AETHER CHARGED",
        url: "/assets/gifs/aether.gif",
        tags: ["aether", "charge", "strikers", "tempest", "magic"],
    },
    {
        id: "salute",
        title: "SLAYER SALUTE",
        url: "/assets/gifs/salute.gif",
        tags: ["salute", "thanks", "ty", "slayer", "respect", "love"],
    },
];

const ALLOWED_EXTERNAL_HOSTS = new Set([
    "static.klipy.com",
    "media.klipy.com",
    "media.giphy.com",
    "media0.giphy.com",
    "media1.giphy.com",
    "media2.giphy.com",
    "media3.giphy.com",
    "media4.giphy.com",
    "i.giphy.com",
    "media.tenor.com",
    "c.tenor.com",
    "i.imgur.com",
]);

export function sanitizeGifUrl(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 500) return null;

    if (trimmed.startsWith("/assets/gifs/") && /^\/assets\/gifs\/[a-z0-9-]+\.gif$/i.test(trimmed)) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "https:") return null;
        const host = parsed.hostname.toLowerCase();

        // Convert giphy.com page links (e.g. https://giphy.com/gifs/slug-abc123) into direct media URLs
        if (host === "giphy.com" || host === "www.giphy.com") {
            const match = parsed.pathname.match(/\/gifs\/(?:.*-)?([A-Za-z0-9]+)\/?$/);
            if (match?.[1]) {
                return `https://i.giphy.com/media/${match[1]}/giphy.gif`;
            }
            return null;
        }

        const isAllowedHost =
            ALLOWED_EXTERNAL_HOSTS.has(host) ||
            /^media[0-9]*\.giphy\.com$/.test(host) ||
            /^[a-z0-9-]+\.klipy\.com$/.test(host);
        if (!isAllowedHost) return null;
        if (
            !/\.(gif|webp)(\?.*)?$/i.test(parsed.pathname + parsed.search) &&
            !host.includes("tenor.com") &&
            !host.includes("giphy.com") &&
            !host.includes("klipy.com")
        ) {
            return null;
        }
        return parsed.toString();
    } catch {
        return null;
    }
}
