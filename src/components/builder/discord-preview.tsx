"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { SITE_NAME, localBuildPath } from "@/lib/site";

interface PreviewData {
    valid: boolean;
    invalidBuild?: boolean;
    title?: string;
    description?: string;
    themeColor?: string;
    gameVersion?: string;
    gameEdition?: string;
}

/**
 * Renders a mock Discord message for a build id, using the same data Discord
 * sees from the /b/<id> Open Graph tags + OG image. Discord chrome colors
 * (#313338 / #2b2d31 / #5865f2 / #00a8fc) are Discord's own, kept faithful
 * so the mock reads exactly like the real embed.
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
    const footer = [SITE_NAME, `Dauntless ${data.gameVersion ?? ""}`.trim(), data.gameEdition]
        .filter(Boolean)
        .join(" · ");

    return (
        <div className="flex gap-3 rounded-lg bg-[#313338] p-4">
            {/* Bot avatar: the Mystic Paradox mark, like the deployed bot would show */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1e293b]">
                <img
                    src="/assets/awakening-ui/logo/icon.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">{SITE_NAME}</span>
                    <span className="rounded bg-[#5865f2] px-1 text-[10px] font-semibold leading-4 text-white">
                        APP
                    </span>
                    <span className="text-[11px] text-[#949ba4]">Today at 4:20 PM</span>
                </div>
                <div
                    className="mt-1 max-w-2xl overflow-hidden rounded-lg bg-[#2b2d31]"
                    style={{ borderLeft: `4px solid ${data.themeColor ?? "#e0c287"}` }}
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
                            className="mt-3 w-full rounded-lg"
                            loading="lazy"
                        />
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#949ba4]">
                            <img
                                src="/assets/awakening-ui/logo/icon.png"
                                alt=""
                                width={16}
                                height={16}
                                className="h-4 w-4 rounded-sm object-cover"
                            />
                            {footer}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscordPreview;
