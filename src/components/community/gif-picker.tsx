"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Link2, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sanitizeGifUrl, type GifPresetItem } from "@/lib/gifs";

interface GifPickerProps {
    selectedGif: string | null;
    onSelectGif: (url: string | null) => void;
    compact?: boolean;
}

export default function GifPicker({ selectedGif, onSelectGif, compact = false }: GifPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [customUrl, setCustomUrl] = useState("");
    const [customError, setCustomError] = useState<string | null>(null);
    const [gifs, setGifs] = useState<GifPresetItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [liveEnabled, setLiveEnabled] = useState<boolean | null>(null);
    const [provider, setProvider] = useState<string>("builtin");

    useEffect(() => {
        if (!open) return;
        let active = true;
        setLoading(true);
        const timer = setTimeout(() => {
            fetch(`/api/community/gifs?q=${encodeURIComponent(query.trim())}`)
                .then((r) => (r.ok ? r.json() : { gifs: [], liveSearchEnabled: false }))
                .then((data: { gifs?: GifPresetItem[]; provider?: string; liveSearchEnabled?: boolean }) => {
                    if (active) {
                        setGifs(data.gifs || []);
                        if (data.provider) setProvider(data.provider);
                        if (typeof data.liveSearchEnabled === "boolean") {
                            setLiveEnabled(data.liveSearchEnabled);
                        }
                    }
                })
                .catch(() => {})
                .finally(() => {
                    if (active) setLoading(false);
                });
        }, 200);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [open, query]);

    const handleApplyCustomUrl = () => {
        setCustomError(null);
        const safe = sanitizeGifUrl(customUrl);
        if (!safe) {
            setCustomError("Paste a valid KLIPY, GIPHY, or HTTPS .gif URL.");
            return;
        }
        onSelectGif(safe);
        setCustomUrl("");
        setOpen(false);
    };

    const badgeLabel = provider === "klipy" ? "KLIPY" : provider === "giphy" ? "GIPHY" : "GIFs";

    return (
        <div className="relative inline-block">
            <Button
                type="button"
                variant={selectedGif ? "default" : "outline"}
                size={compact ? "sm" : "sm"}
                onClick={() => setOpen((prev) => !prev)}
                className="gap-1.5 cursor-pointer"
                title="Attach a GIF"
            >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>{selectedGif ? "Change GIF" : "GIF"}</span>
            </Button>

            {open && (
                <div className="absolute left-0 bottom-full z-40 mb-2 w-72 sm:w-80 rounded-2xl border border-[var(--line-2)] bg-[rgba(8,14,26,0.98)] p-3 shadow-2xl backdrop-blur-xl">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-white">
                                Choose a GIF
                            </span>
                            <span className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[var(--aether-hi)]">
                                {badgeLabel}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded p-0.5 text-[var(--ink-4)] hover:text-white cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="relative mb-2.5">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-4)]" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={liveEnabled ? "Search GIFs (bonk, hype, gg...)" : "Search GIFs or paste URL..."}
                            className="h-8 pl-8 pr-7 text-xs border-white/15 bg-black/40"
                        />
                        {loading && (
                            <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-[var(--aether-hi)]" />
                        )}
                    </div>

                    <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
                        {gifs.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                    onSelectGif(g.url);
                                    setOpen(false);
                                }}
                                className="group overflow-hidden rounded-lg border border-white/10 bg-black/45 p-1 text-left transition-all hover:border-[var(--aether-line)] cursor-pointer"
                            >
                                <img
                                    src={g.url}
                                    alt={g.title}
                                    className="h-16 w-full rounded object-cover"
                                    loading="lazy"
                                />
                                <span className="mt-1 block truncate text-[10px] font-medium text-[var(--ink-3)] group-hover:text-white">
                                    {g.title}
                                </span>
                            </button>
                        ))}
                        {!loading && gifs.length === 0 && (
                            <p className="col-span-2 py-4 text-center text-xs text-[var(--ink-4)]">
                                No matching GIFs found.
                            </p>
                        )}
                    </div>

                    <div className="mt-2.5 border-t border-white/10 pt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                                <Link2 className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--ink-4)]" />
                                <Input
                                    value={customUrl}
                                    onChange={(e) => {
                                        setCustomUrl(e.target.value);
                                        setCustomError(null);
                                    }}
                                    placeholder="Paste GIF URL..."
                                    className="h-7 pl-6 text-[11px] border-white/15 bg-black/40"
                                />
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={handleApplyCustomUrl}
                                className="h-7 px-2.5 text-[11px] cursor-pointer"
                            >
                                Use
                            </Button>
                        </div>
                        {customError && (
                            <p className="mt-1 text-[10px] text-rose-300">{customError}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
