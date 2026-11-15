"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Send } from "lucide-react";

import { SITE_NAME, localBuildPath } from "@/lib/site";

interface PreviewData {
    valid: boolean;
    invalidBuild?: boolean;
    title?: string;
    description?: string;
    themeColor?: string;
    gameVersion?: string;
}

/**
 * Renders a mock Discord message for a build id, using the same data Discord
 * sees from the /b/<id> Open Graph tags + OG image.
 */
const DiscordPreview = ({ buildId }: { buildId: string }) => {
    const [data, setData] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const response = await fetch(`/api/builds/${encodeURIComponent(buildId)}/preview`);
                if (!response.ok) {
                    if (!cancelled) {
                        setData({ valid: false });
                    }
                    return;
                }
                const json = (await response.json()) as PreviewData;
                if (!cancelled) {
                    setData(json);
                }
            } catch {
                if (!cancelled) {
                    setData({ valid: false });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [buildId]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-1 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Rendering Discord preview…
            </div>
        );
    }

    if (!data || !data.valid) {
        return (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Could not render a preview for this build id.
            </div>
        );
    }

    const descriptionLines = (data.description ?? "").split("\n").filter(Boolean);

    return (
        <div className="flex gap-3 rounded-lg bg-[#313338] p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Send className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">{SITE_NAME}</span>
                    <span className="rounded bg-[#5865f2] px-1 text-[10px] font-semibold text-white">APP</span>
                    <span className="text-[11px] text-[#949ba4]">Today at 4:20 PM</span>
                </div>
                <div
                    className="mt-1 max-w-2xl overflow-hidden rounded border-l-4 bg-[#2b2d31]"
                    style={{ borderLeftColor: data.themeColor ?? "#f0b232" }}
                >
                    <div className="px-4 py-3">
                        <Link
                            href={localBuildPath(buildId)}
                            className="text-base font-semibold text-[#00a8fc] hover:underline"
                        >
                            {data.title}
                        </Link>
                        <div className="mt-1.5 whitespace-pre-line text-[13px] leading-5 text-[#dbdee1]">
                            {descriptionLines.slice(0, 9).map((line, index) => (
                                <div key={index} className="truncate">
                                    {line}
                                </div>
                            ))}
                        </div>
                        <img
                            src={localBuildPath(buildId) + "/opengraph-image"}
                            alt="Discord embed preview card for this build"
                            className="mt-3 max-h-64 w-full rounded object-cover object-top"
                            loading="lazy"
                        />
                        <div className="mt-2 text-[11px] text-[#949ba4]">
                            {SITE_NAME} - Dauntless {data.gameVersion}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscordPreview;
