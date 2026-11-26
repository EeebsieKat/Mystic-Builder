import { NextResponse } from "next/server";
import { BUILTIN_GIFS, sanitizeGifUrl, type GifPresetItem } from "@/lib/gifs";

export const dynamic = "force-dynamic";

interface KlipySizeBucket {
    gif?: { url?: string };
    webp?: { url?: string };
}

interface KlipyMediaItem {
    id: string | number;
    type?: string;
    title?: string;
    slug?: string;
    file?: {
        xs?: KlipySizeBucket;
        sm?: KlipySizeBucket;
        md?: KlipySizeBucket;
        hd?: KlipySizeBucket;
    };
    files?: {
        gif?: { url?: string };
        webp?: { url?: string };
    };
}

interface GiphyGifObject {
    id: string;
    title?: string;
    images?: {
        fixed_height?: { url?: string };
        fixed_height_small?: { url?: string };
        downsized_medium?: { url?: string };
        original?: { url?: string };
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    const q = rawQuery.toLowerCase();

    const localMatches = q
        ? BUILTIN_GIFS.filter(
              (g) =>
                  g.title.toLowerCase().includes(q) ||
                  g.tags.some((t) => t.toLowerCase().includes(q))
          )
        : BUILTIN_GIFS;

    const externalResults: GifPresetItem[] = [];
    let provider: "klipy" | "giphy" | "builtin" = "builtin";

    const klipyKey = process.env.KLIPY_API_KEY?.trim();
    const giphyKey = process.env.GIPHY_API_KEY?.trim();

    if (klipyKey) {
        try {
            const endpoint = rawQuery
                ? `https://api.klipy.com/api/v1/${encodeURIComponent(klipyKey)}/gifs/search?q=${encodeURIComponent(rawQuery)}&per_page=16&content_filter=medium`
                : `https://api.klipy.com/api/v1/${encodeURIComponent(klipyKey)}/gifs/trending?per_page=16&content_filter=medium`;

            const res = await fetch(endpoint, { cache: "no-store" });
            if (res.ok) {
                const json = (await res.json()) as {
                    result?: boolean;
                    data?: { data?: KlipyMediaItem[] };
                };
                for (const item of json.data?.data || []) {
                    if (item.type === "ad") continue;
                    const candidate =
                        item.file?.sm?.gif?.url ||
                        item.file?.md?.gif?.url ||
                        item.file?.hd?.gif?.url ||
                        item.file?.xs?.gif?.url ||
                        item.files?.gif?.url ||
                        item.file?.sm?.webp?.url;
                    const safeUrl = sanitizeGifUrl(candidate);
                    if (safeUrl) {
                        externalResults.push({
                            id: `klipy-${item.id}`,
                            title: item.title?.trim() || rawQuery || "Trending GIF",
                            url: safeUrl,
                            tags: rawQuery ? [q] : ["trending"],
                        });
                    }
                }
                if (externalResults.length > 0) {
                    provider = "klipy";
                }
            }
        } catch {
            // Fall back cleanly
        }
    }

    if (externalResults.length === 0 && giphyKey) {
        try {
            const endpoint = rawQuery
                ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(giphyKey)}&q=${encodeURIComponent(rawQuery)}&limit=16&rating=pg-13&lang=en`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(giphyKey)}&limit=16&rating=pg-13`;

            const res = await fetch(endpoint, { cache: "no-store" });
            if (res.ok) {
                const json = (await res.json()) as { data?: GiphyGifObject[] };
                for (const item of json.data || []) {
                    const candidate =
                        item.images?.fixed_height?.url ||
                        item.images?.fixed_height_small?.url ||
                        item.images?.downsized_medium?.url ||
                        item.images?.original?.url;
                    const safeUrl = sanitizeGifUrl(candidate);
                    if (safeUrl) {
                        externalResults.push({
                            id: `giphy-${item.id}`,
                            title: item.title?.trim() || rawQuery || "GIPHY GIF",
                            url: safeUrl,
                            tags: rawQuery ? [q] : ["trending"],
                        });
                    }
                }
                if (externalResults.length > 0) {
                    provider = "giphy";
                }
            }
        } catch {
            // Fall back cleanly
        }
    }

    return NextResponse.json({
        gifs: externalResults.length > 0 ? [...externalResults, ...localMatches] : localMatches,
        provider,
        liveSearchEnabled: Boolean(klipyKey || giphyKey),
    });
}
