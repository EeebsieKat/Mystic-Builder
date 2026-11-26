"use client";

import { useState } from "react";
import { Heart, Lightbulb, Users } from "lucide-react";
import BuildSuggestions from "@/components/build-suggestions";
import CommunityBuildsBrowser from "@/components/community/community-builds-browser";
import { cn } from "@/lib/utils";

export type BuildsHubTab = "meta" | "community" | "liked";

interface UnifiedBuildsHubProps {
    initialTab?: BuildsHubTab;
}

export default function UnifiedBuildsHub({ initialTab = "meta" }: UnifiedBuildsHubProps) {
    const [activeTab, setActiveTab] = useState<BuildsHubTab>(initialTab);

    const switchTab = (next: BuildsHubTab) => {
        setActiveTab(next);
        if (typeof window !== "undefined") {
            const targetUrl = next === "meta" ? "/builds" : `/builds?tab=${next}`;
            window.history.replaceState(null, "", targetUrl);
        }
    };

    const tabs: { id: BuildsHubTab; label: string; icon: typeof Lightbulb; accent: string }[] = [
        {
            id: "meta",
            label: "Meta Builds",
            icon: Lightbulb,
            accent: "border-[var(--aether-line)] bg-[var(--aether-a10)] text-white",
        },
        {
            id: "community",
            label: "Community",
            icon: Users,
            accent: "border-[var(--gold)]/45 bg-[rgba(224,194,135,0.12)] text-[#f5dfb0]",
        },
        {
            id: "liked",
            label: "Liked Builds",
            icon: Heart,
            accent: "border-rose-500/45 bg-rose-500/15 text-rose-200",
        },
    ];

    const subtitle =
        activeTab === "meta"
            ? "Explore all 517 curated Dauntless meta loadouts, discuss tips in comments, or 1-click open any build in the planner."
            : activeTab === "community"
              ? "Browse loadouts crafted and shared by fellow Slayers, vote & discuss, or publish your own unique build."
              : "All Meta and Community builds you have liked on your account, synced everywhere you sign in.";

    return (
        <div className="w-full flex-1">
            {/* Unified Header & Sub-Tabs */}
            <section className="mystic-glow w-full px-4 sm:px-8 md:px-[100px] pt-10 pb-2">
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="panel-label">Dauntless 1.14.7 - Mystic Paradox</p>
                    <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl font-display">
                        Builds & Community Loadouts
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-[#c2d0e2] sm:text-base">
                        {subtitle}
                    </p>

                    <div
                        role="tablist"
                        aria-label="Build categories"
                        className="mt-2 inline-flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-[var(--line-2)] bg-[rgba(10,19,32,0.78)] p-1.5 backdrop-blur-md"
                    >
                        {tabs.map(({ id, label, icon: Icon, accent }) => {
                            const selected = activeTab === id;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    onClick={() => switchTab(id)}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                                        selected
                                            ? accent
                                            : "border-transparent text-[var(--ink-3)] hover:bg-white/[0.05] hover:text-white"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "h-4 w-4",
                                            selected && id === "liked" ? "fill-rose-400 text-rose-400" : ""
                                        )}
                                    />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {activeTab === "community" ? (
                <CommunityBuildsBrowser embedded />
            ) : (
                <BuildSuggestions
                    key={activeTab}
                    embedded
                    defaultLikedOnly={activeTab === "liked"}
                    onBrowseMeta={() => switchTab("meta")}
                />
            )}
        </div>
    );
}
