"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
    Check,
    Compass,
    Copy,
    ExternalLink,
    Heart,
    MessageSquare,
    Plus,
    RotateCcw,
    Search,
    User,
    X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import metaBuildsData from "@/game/meta-builds-indexed.json";
import { gameData } from "@/game/data";
import type { CommunityBuildRecord } from "@/lib/community-types";
import { elementColor } from "@/lib/site";
import { toast } from "@/hooks/use-toast";
import type { AuthUser } from "@/components/auth/auth-card";

/* ------------------------------------------------------------------ */
/* Types & Configurations                                             */
/* ------------------------------------------------------------------ */

interface IndexedMetaBuild {
    buildId: string;
    title: string;
    category: string;
    vsElement: string | null;
    subcategory: string | null;
    weaponType: string;
    weaponName: string;
    weaponIcon: string;
    weaponElement: string;
    bondName?: string | null;
    bondIcon?: string | null;
    omnicellName: string | null;
    omnicellIcon: string | null;
    lanternName: string;
    lanternIcon: string;
    head: { name: string; icon: string };
    torso: { name: string; icon: string };
    arms: { name: string; icon: string };
    legs: { name: string; icon: string };
    perks: { name: string; value: number }[];
    cells: { slot: string; cellName: string }[];
}

const WEAPON_CONFIGS: { type: string; label: string; icon: string }[] = [
    { type: "Aether Strikers", label: "Aether Strikers", icon: "/assets/icons/generic/AetherStrikers.png" },
    { type: "Axe", label: "Axe", icon: "/assets/icons/generic/Axe.png" },
    { type: "Chain Blades", label: "Chain Blades", icon: "/assets/icons/generic/ChainBlades.png" },
    { type: "Hammer", label: "Hammer", icon: "/assets/icons/generic/Hammer.png" },
    { type: "Repeater", label: "Repeaters", icon: "/assets/icons/generic/Repeater.png" },
    { type: "Sword", label: "Sword", icon: "/assets/icons/generic/Sword.png" },
    { type: "War Pike", label: "War Pike", icon: "/assets/icons/generic/WarPike.png" },
];

const CATEGORY_ORDER = [
    "Revenant",
    "Tempest",
    "Discipline",
    "Bastion",
    "Artificer",
    "Iceborne",
];

const CATEGORY_ICONS: Record<string, string> = {
    Revenant: "/assets/icons/omnicells/Revenant.png",
    Tempest: "/assets/icons/omnicells/Tempest.png",
    Discipline: "/assets/icons/omnicells/Discipline.png",
    Bastion: "/assets/icons/omnicells/Bastion.png",
    Artificer: "/assets/icons/omnicells/Artificer.png",
    Iceborne: "/assets/icons/omnicells/Iceborne.png",
};

const ELEMENT_CONFIGS: { element: string; label: string; icon: string; color: string }[] = [
    { element: "Blaze", label: "vs Blaze", icon: "/assets/icons/elements/Blaze.png", color: "#E25822" },
    { element: "Frost", label: "vs Frost", icon: "/assets/icons/elements/Frost.png", color: "#6EC6E8" },
    { element: "Shock", label: "vs Shock", icon: "/assets/icons/elements/Shock.png", color: "#F3C13A" },
    { element: "Terra", label: "vs Terra", icon: "/assets/icons/elements/Terra.png", color: "#6FBF4B" },
    { element: "Radiant", label: "vs Radiant", icon: "/assets/icons/elements/Radiant.png", color: "#EFD97F" },
    { element: "Umbral", label: "vs Umbral", icon: "/assets/icons/elements/Umbral.png", color: "#8A5FE8" },
];

const POPULAR_PERK_FILTERS = [
    "Predator",
    "Overpower",
    "Pulse",
    "Cunning",
    "Adrenaline",
    "Galvanized",
    "Impulse",
    "Catalyst",
    "Reuse",
];

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */

interface BuildSuggestionsProps {
    defaultLikedOnly?: boolean;
    embedded?: boolean;
    onBrowseMeta?: () => void;
}

const BuildSuggestions = ({
    defaultLikedOnly = false,
    embedded = false,
    onBrowseMeta,
}: BuildSuggestionsProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    /* -------------------------------------------------------------- */
    /* State: Meta Builds Browser                                     */
    /* -------------------------------------------------------------- */
    const [showLikedOnly, setShowLikedOnly] = useState<boolean>(() => {
        if (defaultLikedOnly) return true;
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get("tab") === "liked";
        }
        return false;
    });
    const [selectedWeapon, setSelectedWeapon] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("tab") === "liked") return "all";
            const w = urlParams.get("weapon");
            if (w) return w;
        }
        if (defaultLikedOnly) return "all";
        return "Aether Strikers";
    });
    const [selectedCategory, setSelectedCategory] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("tab") === "liked") return "all";
            const cat = urlParams.get("category");
            if (cat) return cat;
            if (urlParams.get("q") || urlParams.get("search")) return "all";
        }
        if (defaultLikedOnly) return "all";
        return "Revenant";
    });
    const [selectedElement, setSelectedElement] = useState<string>("all");
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get("q") || urlParams.get("search") || "";
        }
        return "";
    });
    const [selectedPerkFilters, setSelectedPerkFilters] = useState<string[]>(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const perksParam = urlParams.get("perks");
            if (perksParam) {
                return perksParam.split(",").map(p => p.trim()).filter(Boolean);
            }
        }
        return [];
    });
    const [perkDropdownSearch, setPerkDropdownSearch] = useState<string>("");
    const [copiedBuildId, setCopiedBuildId] = useState<string | null>(null);
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
    const [likedBuilds, setLikedBuilds] = useState<Set<string>>(new Set());
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
    const [communityBuilds, setCommunityBuilds] = useState<CommunityBuildRecord[]>([]);
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);

    const loadLikes = useCallback(() => {
        fetch("/api/builds/likes")
            .then(res => res.json())
            .then(data => {
                if (data && typeof data === "object") {
                    if (data.likes && typeof data.likes === "object") {
                        setLikeCounts(data.likes);
                    }
                    if (data.commentCounts && typeof data.commentCounts === "object") {
                        setCommentCounts(data.commentCounts);
                    }
                    if (Array.isArray(data.userLikes)) {
                        setLikedBuilds(new Set(data.userLikes));
                    } else {
                        setLikedBuilds(new Set());
                    }
                }
            })
            .catch(err => {
                console.error("Failed to load likes from database:", err);
            });
    }, []);

    useEffect(() => {
        if (!showLikedOnly) return;
        fetch("/api/community/builds", { cache: "no-store" })
            .then((res) => (res.ok ? res.json() : { builds: [] }))
            .then((data: { builds?: CommunityBuildRecord[] }) => {
                setCommunityBuilds(data.builds || []);
            })
            .catch(() => {});
    }, [showLikedOnly]);

    // Track auth state and re-sync account-bound likes on login/logout
    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => (res.ok ? res.json() : { user: null }))
            .then((data: { user?: AuthUser | null }) => {
                setAuthUser(data.user ?? null);
            })
            .catch(() => {});

        loadLikes();

        const onAuthChanged = (event: Event) => {
            const customEvent = event as CustomEvent<AuthUser | null>;
            setAuthUser(customEvent.detail ?? null);
            loadLikes();
        };

        window.addEventListener("mystic-auth-changed", onAuthChanged);
        return () => window.removeEventListener("mystic-auth-changed", onAuthChanged);
    }, [loadLikes]);

    const toggleLike = useCallback(async (buildId: string) => {
        if (!authUser) {
            toast({
                title: "Sign in required",
                description: "Please sign in with your Discord username to like builds.",
            });
            window.dispatchEvent(new CustomEvent("mystic-open-auth"));
            return;
        }

        const currentlyLiked = likedBuilds.has(buildId);
        const nextLiked = !currentlyLiked;

        // Optimistic UI update
        setLikedBuilds(prev => {
            const next = new Set(prev);
            if (nextLiked) next.add(buildId);
            else next.delete(buildId);
            return next;
        });

        setLikeCounts(prev => {
            const currentCount = prev[buildId] ?? 0;
            const updatedCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
            return { ...prev, [buildId]: updatedCount };
        });

        try {
            const res = await fetch(`/api/builds/${encodeURIComponent(buildId)}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (res.status === 401) {
                // Session missing/expired -> revert and prompt sign-in
                setLikedBuilds(prev => {
                    const next = new Set(prev);
                    if (currentlyLiked) next.add(buildId);
                    else next.delete(buildId);
                    return next;
                });
                setLikeCounts(prev => {
                    const currentCount = prev[buildId] ?? 0;
                    const revertedCount = currentlyLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
                    return { ...prev, [buildId]: revertedCount };
                });
                toast({
                    title: "Sign in required",
                    description: "Please sign in with your Discord username to like builds.",
                });
                window.dispatchEvent(new CustomEvent("mystic-open-auth"));
                return;
            }

            if (res.ok) {
                const data = (await res.json()) as { liked: boolean; count: number };
                setLikedBuilds(prev => {
                    const next = new Set(prev);
                    if (data.liked) next.add(buildId);
                    else next.delete(buildId);
                    return next;
                });
                setLikeCounts(prev => ({ ...prev, [buildId]: data.count }));
            }
        } catch (err) {
            console.error("Failed to toggle like on server:", err);
            // Revert on error
            setLikedBuilds(prev => {
                const next = new Set(prev);
                if (currentlyLiked) next.add(buildId);
                else next.delete(buildId);
                return next;
            });
            setLikeCounts(prev => {
                const currentCount = prev[buildId] ?? 0;
                const revertedCount = currentlyLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
                return { ...prev, [buildId]: revertedCount };
            });
        }
    }, [likedBuilds, authUser]);
    const allBuilds = useMemo(() => {
        return (metaBuildsData.builds as IndexedMetaBuild[]).filter(
            b => CATEGORY_ORDER.includes(b.category) && Boolean(b.weaponName),
        );
    }, []);
    const categoryDescriptions = metaBuildsData.categories as { name: string; description: string }[];

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "liked") {
            setShowLikedOnly(true);
            setSelectedWeapon("all");
            setSelectedCategory("all");
        } else if (tab === "suggestions" || tab === "meta") {
            setShowLikedOnly(false);
        }

        const weaponParam = searchParams.get("weapon");
        if (weaponParam) setSelectedWeapon(weaponParam);

        const categoryParam = searchParams.get("category");
        if (categoryParam) setSelectedCategory(categoryParam);

        const qParam = searchParams.get("q") || searchParams.get("search");
        if (qParam !== null) {
            setSearchQuery(qParam);
            if (!categoryParam) setSelectedCategory("all");
        }

        const viewId = searchParams.get("view");
        if (viewId) {
            router.replace(`/builds/${encodeURIComponent(viewId)}`);
        }
    }, [searchParams, router]);

    const likedMetaBuilds = useMemo(() => {
        return allBuilds.filter(b => likedBuilds.has(b.buildId));
    }, [allBuilds, likedBuilds]);

    const likedCommunityBuilds = useMemo(() => {
        if (!showLikedOnly) return [];
        return communityBuilds.filter(b => likedBuilds.has(b.buildId));
    }, [communityBuilds, showLikedOnly, likedBuilds]);

    const baseBuilds = useMemo(() => {
        if (!showLikedOnly) return allBuilds;
        return likedMetaBuilds;
    }, [allBuilds, showLikedOnly, likedMetaBuilds]);

    // Current category description
    const currentCategoryInfo = useMemo(() => {
        if (selectedCategory === "all") {
            return {
                name: "All Omnicells",
                description: "Displaying top meta builds across all omnicell archetypes.",
            };
        }
        return (
            categoryDescriptions.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase()) ?? {
                name: selectedCategory,
                description: "Optimized meta loadout designed for high-tier Dauntless combat.",
            }
        );
    }, [selectedCategory, categoryDescriptions]);

    // Available subcategories for Escalations or Exotics in selected weapon
    const availableSubcategories = useMemo(() => {
        const set = new Set<string>();
        for (const b of baseBuilds) {
            if (
                (selectedWeapon === "all" || b.weaponType === selectedWeapon) &&
                (selectedCategory === "all" || b.category === selectedCategory) &&
                b.subcategory
            ) {
                set.add(b.subcategory);
            }
        }
        return Array.from(set);
    }, [baseBuilds, selectedWeapon, selectedCategory]);

    // Build counts per category for selected weapon
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const b of baseBuilds) {
            if (selectedWeapon === "all" || b.weaponType === selectedWeapon) {
                counts[b.category] = (counts[b.category] || 0) + 1;
            }
        }
        return counts;
    }, [baseBuilds, selectedWeapon]);

    // Build counts per weapon
    const weaponCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const b of baseBuilds) {
            counts[b.weaponType] = (counts[b.weaponType] || 0) + 1;
        }
        return counts;
    }, [baseBuilds]);

    // Filtered builds for the Meta tab
    const filteredMetaBuilds = useMemo(() => {
        return baseBuilds.filter(b => {
            // Weapon filter
            if (selectedWeapon !== "all" && b.weaponType !== selectedWeapon) return false;

            // Category filter
            if (selectedCategory !== "all" && b.category !== selectedCategory) return false;

            // Subcategory filter (for Escalations or Exotics)
            if (selectedSubcategory !== "all" && b.subcategory !== selectedSubcategory) {
                return false;
            }

            // Element filter (vs Element)
            if (selectedElement !== "all" && b.vsElement !== selectedElement) {
                return false;
            }

            // Multi-perk selector filter (matches ALL selected perks)
            if (selectedPerkFilters.length > 0) {
                const buildPerkNames = new Set(
                    (b.perks || []).filter(p => p?.name).map(p => p.name.toLowerCase()),
                );
                const hasAllPerks = selectedPerkFilters.every(p => buildPerkNames.has(p.toLowerCase()));
                if (!hasAllPerks) return false;
            }

            // Search query filter (matches title, weaponName, bondName, perks, armor, cells)
            if (searchQuery.trim().length > 0) {
                const q = searchQuery.toLowerCase().trim();
                const titleMatch = Boolean(b.title?.toLowerCase().includes(q));
                const weaponMatch = Boolean(b.weaponName?.toLowerCase().includes(q));
                const bondMatch = Boolean(b.bondName?.toLowerCase().includes(q));
                const omnicellMatch = Boolean(b.omnicellName?.toLowerCase().includes(q));
                const lanternMatch = Boolean(b.lanternName?.toLowerCase().includes(q));
                const gearMatch =
                    Boolean(b.head?.name?.toLowerCase().includes(q)) ||
                    Boolean(b.torso?.name?.toLowerCase().includes(q)) ||
                    Boolean(b.arms?.name?.toLowerCase().includes(q)) ||
                    Boolean(b.legs?.name?.toLowerCase().includes(q));
                const perkMatch =
                    Array.isArray(b.perks) &&
                    b.perks.some(p => p?.name && p.name.toLowerCase().includes(q));
                const cellMatch =
                    Array.isArray(b.cells) &&
                    b.cells.some(c => c?.cellName && c.cellName.toLowerCase().includes(q));

                if (
                    !titleMatch &&
                    !weaponMatch &&
                    !bondMatch &&
                    !omnicellMatch &&
                    !lanternMatch &&
                    !gearMatch &&
                    !perkMatch &&
                    !cellMatch
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [
        baseBuilds,
        selectedWeapon,
        selectedCategory,
        selectedSubcategory,
        selectedElement,
        selectedPerkFilters,
        searchQuery,
    ]);

    const togglePerkFilter = (perk: string) => {
        setSelectedPerkFilters(prev =>
            prev.includes(perk) ? prev.filter(p => p !== perk) : [...prev, perk],
        );
    };

    const handleCopyLink = async (buildId: string) => {
        try {
            const url =
                typeof window !== "undefined"
                    ? `${window.location.origin}/builds/${encodeURIComponent(buildId)}`
                    : `/builds/${encodeURIComponent(buildId)}`;
            await navigator.clipboard.writeText(url);
            setCopiedBuildId(buildId);
            setTimeout(() => setCopiedBuildId(null), 2200);
        } catch {
            setCopiedBuildId(buildId);
            setTimeout(() => setCopiedBuildId(null), 2200);
        }
    };

    const resetFilters = () => {
        setSelectedElement("all");
        setSelectedSubcategory("all");
        setSelectedPerkFilters([]);
        setSearchQuery("");
    };

    const allPerkNames = useMemo(() => {
        return Object.keys(gameData.perks).sort();
    }, []);

    const hasNoLikedBuilds =
        showLikedOnly && likedMetaBuilds.length === 0 && likedCommunityBuilds.length === 0;

    return (
        <section
            className={cn(
                "w-full flex-1 px-4 sm:px-8 md:px-[100px]",
                embedded ? "pt-4 pb-10" : "mystic-glow py-10"
            )}
        >
            {/* Header */}
            {!embedded && (
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="panel-label">
                        {showLikedOnly
                            ? "Dauntless 1.14.7 - Your Saved Builds"
                            : "Dauntless 1.14.7 - Official Meta Builds & Suggestions"}
                    </p>
                    <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl flex items-center justify-center gap-3">
                        {showLikedOnly ? (
                            <>
                                <span>Liked Builds</span>
                                <Heart className="h-7 w-7 sm:h-8 sm:w-8 fill-rose-500 text-rose-500 inline-block drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
                            </>
                        ) : (
                            "Builds & Loadout Suggestions"
                        )}
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-[#c2d0e2] sm:text-base">
                        {showLikedOnly
                            ? `Viewing your personal collection of liked loadouts (${likedMetaBuilds.length + likedCommunityBuilds.length} saved).`
                            : "Explore all 517 curated Dauntless meta loadouts from the official Reforged meta index. Filter by weapon, omnicell, and elemental matchup, or 1-click open any build in the planner."}
                    </p>
                </div>
            )}

            <div className={embedded ? "mt-4" : "mt-8"}>
                {!embedded && <div className="gold-rule mb-8" aria-hidden />}

                {/* Official Reforged Meta Builds Browser */}
                {hasNoLikedBuilds ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line-2)] bg-[rgba(10,19,32,0.7)] py-20 px-6 text-center shadow-lg backdrop-blur-sm max-w-2xl mx-auto my-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] mb-5">
                            <Heart className="h-10 w-10 text-rose-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {authUser ? "No Liked Builds Yet" : "Sign In to View Liked Builds"}
                        </h3>
                        <p className="max-w-md text-sm text-[#b8c7db] leading-relaxed mb-6">
                            {authUser
                                ? "You haven't liked any builds yet. Click the heart icon on any Meta or Community build card while exploring to save it here."
                                : "Liked builds are saved to your account. Sign in with Discord or your account to like builds and access your collection anywhere."}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {!authUser && (
                                <button
                                    type="button"
                                    onClick={() => window.dispatchEvent(new CustomEvent("mystic-open-auth"))}
                                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                                >
                                    <span>Sign In</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    if (onBrowseMeta) {
                                        onBrowseMeta();
                                    } else {
                                        setShowLikedOnly(false);
                                        window.history.replaceState(null, "", "/builds");
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all cursor-pointer",
                                    authUser
                                        ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                                        : "border border-[var(--line-2)] bg-white/[0.045] text-white hover:bg-white/[0.08]"
                                )}
                            >
                                <span>Browse Meta Builds</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {showLikedOnly && likedCommunityBuilds.length > 0 && (
                            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--gold)]/25 bg-[rgba(10,19,32,0.7)] p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#f5dfb0]">
                                        Liked Community Builds ({likedCommunityBuilds.length})
                                    </h2>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {likedCommunityBuilds.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => router.push(`/builds/${encodeURIComponent(item.id)}`)}
                                            className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/35 p-4 transition-all hover:border-[var(--aether-line)] cursor-pointer"
                                        >
                                            <div>
                                                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                                                    <Badge variant="outline" className="border-[var(--gold)]/35 text-[#f5dfb0]">
                                                        {item.category}
                                                    </Badge>
                                                    <span className="inline-flex items-center gap-1 text-[var(--ink-3)] truncate">
                                                        <User className="h-3 w-3 text-[var(--aether-hi)]" />
                                                        <span className="truncate">{item.authorDisplayName}</span>
                                                    </span>
                                                </div>
                                                <h3 className="truncate text-sm font-bold text-white">
                                                    {item.title}
                                                </h3>
                                                <p className="mt-0.5 truncate text-xs text-[var(--ink-3)]">
                                                    {item.weaponName} • {item.weaponType}
                                                </p>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleLike(item.buildId);
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-300 cursor-pointer"
                                                    >
                                                        <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
                                                        <span>{likeCounts[item.buildId] ?? item.likes}</span>
                                                    </button>
                                                    <Link
                                                        href={`/builds/${encodeURIComponent(item.id)}#discussion`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[var(--ink-3)] hover:text-white"
                                                    >
                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                        <span>{item.commentCount ?? 0}</span>
                                                    </Link>
                                                </div>
                                                <Link
                                                    href={`/builder?b=${encodeURIComponent(item.buildId)}&name=${encodeURIComponent(item.title)}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
                                                >
                                                    <span>Builder</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* 1. Weapon Selector Bar */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#d6e0ee]">
                                    Select Weapon Class
                                </span>
                                {selectedWeapon !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedWeapon("all");
                                            setSelectedSubcategory("all");
                                        }}
                                        className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/20 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                                        title="Deselect weapon to view builds across all weapon classes"
                                    >
                                        <X className="h-3 w-3" />
                                        <span>Remove weapon filter</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* All Weapons option */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedWeapon("all");
                                        setSelectedSubcategory("all");
                                    }}
                                    className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 border cursor-pointer ${selectedWeapon === "all"
                                            ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(91,163,255,0.25)]"
                                            : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:border-primary/60 hover:text-white hover:bg-[rgba(15,26,44,0.85)] shadow-xs"
                                        }`}
                                >
                                    <span>All Weapons</span>
                                    <span
                                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedWeapon === "all"
                                                ? "bg-primary/30 text-primary font-bold"
                                                : "bg-white/10 text-[#cbd5e1] font-semibold"
                                            }`}
                                    >
                                        {baseBuilds.length}
                                    </span>
                                </button>

                                {WEAPON_CONFIGS.map(w => {
                                    const isSelected = selectedWeapon === w.type;
                                    const count = weaponCounts[w.type] || 0;
                                    return (
                                        <button
                                            key={w.type}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedWeapon("all");
                                                } else {
                                                    setSelectedWeapon(w.type);
                                                }
                                                setSelectedSubcategory("all");
                                            }}
                                            title={isSelected ? `Click to remove ${w.label} filter` : `Filter by ${w.label}`}
                                            className={`group flex items-center gap-2.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 border cursor-pointer ${isSelected
                                                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(91,163,255,0.25)]"
                                                    : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:border-primary/60 hover:text-white hover:bg-[rgba(15,26,44,0.85)] shadow-xs"
                                                }`}
                                        >
                                            <div className="relative h-5 w-5 flex-shrink-0">
                                                <Image
                                                    src={w.icon}
                                                    alt={w.label}
                                                    fill
                                                    sizes="20px"
                                                    className={`object-contain transition-transform group-hover:scale-110 ${isSelected ? "brightness-125" : "brightness-105 opacity-95"
                                                        }`}
                                                />
                                            </div>
                                            <span>{w.label}</span>
                                            <span
                                                className={`rounded-full px-1.5 py-0.2 text-[10px] ${isSelected
                                                        ? "bg-primary/30 text-primary font-bold"
                                                        : "bg-white/10 text-[#cbd5e1] font-semibold"
                                                    }`}
                                            >
                                                {count}
                                            </span>
                                            {isSelected && (
                                                <span
                                                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/30 transition-colors"
                                                    title="Remove selection"
                                                >
                                                    <X className="h-3 w-3" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Omnicell Navigation */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#d6e0ee]">
                                Omnicell
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory("all");
                                        setSelectedSubcategory("all");
                                    }}
                                    className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border cursor-pointer ${selectedCategory === "all"
                                            ? "border-primary/80 bg-primary/20 text-primary font-semibold shadow-[0_0_10px_rgba(91,163,255,0.2)]"
                                            : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:border-primary/60 hover:text-white hover:bg-[rgba(15,26,44,0.85)] shadow-xs"
                                        }`}
                                >
                                    <span>All Omnicells</span>
                                    <span
                                        className={`rounded-full px-1.5 py-0.1 text-[10px] ${selectedCategory === "all"
                                                ? "bg-primary/30 text-primary font-bold"
                                                : "bg-white/10 text-[#cbd5e1] font-semibold"
                                            }`}
                                    >
                                        {baseBuilds.filter(b => selectedWeapon === "all" || b.weaponType === selectedWeapon).length}
                                    </span>
                                </button>
                                {CATEGORY_ORDER.map(cat => {
                                    const isSelected = selectedCategory === cat;
                                    const count = categoryCounts[cat] || 0;
                                    const icon = CATEGORY_ICONS[cat];
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setSelectedSubcategory("all");
                                            }}
                                            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border cursor-pointer ${isSelected
                                                ? "border-primary/80 bg-primary/20 text-primary font-semibold shadow-[0_0_10px_rgba(91,163,255,0.2)]"
                                                : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:border-primary/60 hover:text-white hover:bg-[rgba(15,26,44,0.85)] shadow-xs"
                                                }`}
                                        >
                                            {icon && (
                                                <div className="relative h-4 w-4 flex-shrink-0">
                                                    <Image
                                                        src={icon}
                                                        alt={cat}
                                                        fill
                                                        sizes="16px"
                                                        className="object-contain"
                                                    />
                                                </div>
                                            )}
                                            <span>{cat}</span>
                                            <span
                                                className={`rounded-full px-1.5 py-0.1 text-[10px] ${isSelected
                                                    ? "bg-primary/30 text-primary font-bold"
                                                    : "bg-white/10 text-[#cbd5e1] font-semibold"
                                                    }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Category Mechanics Banner */}
                        <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-card/95 via-card/85 to-card/75 p-5 shadow-sm backdrop-blur-sm">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                {CATEGORY_ICONS[selectedCategory] && (
                                    <div className="relative h-12 w-12 flex-shrink-0 rounded-xl border border-primary/30 bg-primary/10 p-2 shadow-inner">
                                        <Image
                                            src={CATEGORY_ICONS[selectedCategory]}
                                            alt={selectedCategory}
                                            fill
                                            sizes="48px"
                                            className="object-contain p-1"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-foreground">
                                            {currentCategoryInfo.name} Archetype Guide
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                                            {selectedWeapon === "all" ? "All Weapons" : selectedWeapon}
                                        </Badge>
                                    </div>
                                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                        {currentCategoryInfo.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 4. Matchup Element & Subcategory & Search Filter Bar */}
                        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/15 p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Elemental Matchup Filter */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-[#d6e0ee] mr-1">
                                        Matchup:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedElement("all")}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border cursor-pointer ${selectedElement === "all"
                                            ? "border-primary/80 bg-primary/20 text-primary font-semibold"
                                            : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:text-white hover:bg-[rgba(15,26,44,0.85)]"
                                            }`}
                                    >
                                        All Elements
                                    </button>
                                    {ELEMENT_CONFIGS.map(elem => {
                                        const isSelected = selectedElement === elem.element;
                                        return (
                                            <button
                                                key={elem.element}
                                                type="button"
                                                onClick={() => setSelectedElement(elem.element)}
                                                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 border cursor-pointer ${isSelected
                                                    ? "border-current bg-white/10 font-bold shadow-xs"
                                                    : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:text-white hover:bg-[rgba(15,26,44,0.85)]"
                                                    }`}
                                                style={{ color: isSelected ? elem.color : undefined }}
                                            >
                                                <div className="relative h-3.5 w-3.5 flex-shrink-0">
                                                    <Image
                                                        src={elem.icon}
                                                        alt={elem.label}
                                                        fill
                                                        sizes="14px"
                                                        className="object-contain"
                                                    />
                                                </div>
                                                <span>{elem.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Live Search Input */}
                                <div className="relative w-full lg:w-72">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8ba0bc]" />
                                    <Input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search build, perk, bond, weapon…"
                                        className="h-9 rounded-full pl-9 pr-8 text-xs bg-muted/30 border-border/60 text-[#eef3fb] placeholder:text-[#8ba0bc]"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba0bc] hover:text-foreground cursor-pointer"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Subcategories (if Escalations or Exotics) */}
                            {availableSubcategories.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
                                    <span className="text-xs font-bold text-[#d6e0ee] mr-1">
                                        Tier / Variant:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSubcategory("all")}
                                        className={`rounded-full px-2.5 py-0.5 text-xs transition-colors border cursor-pointer ${selectedSubcategory === "all"
                                            ? "border-primary bg-primary/20 text-primary font-semibold"
                                            : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:text-white"
                                            }`}
                                    >
                                        All Variants
                                    </button>
                                    {availableSubcategories.map(sub => {
                                        const label =
                                            sub === "preEsca"
                                                ? "Pre-Escalation"
                                                : sub === "legendaries"
                                                    ? "Legendaries"
                                                    : sub === "heroics"
                                                        ? "Heroic Escalation"
                                                        : sub;
                                        return (
                                            <button
                                                key={sub}
                                                type="button"
                                                onClick={() => setSelectedSubcategory(sub)}
                                                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors border cursor-pointer ${selectedSubcategory === sub
                                                    ? "border-primary bg-primary/20 text-primary font-semibold"
                                                    : "border-[var(--line-2)] bg-[rgba(10,19,32,0.65)] text-[#e2e8f0] hover:text-white"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Multi-Perk Filter Chips & Selector */}
                            <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-[#d6e0ee]">
                                            Filter by Perks (Multi-Select):
                                        </span>
                                        {selectedPerkFilters.length > 0 && (
                                            <Badge
                                                variant="outline"
                                                className="border-primary/50 bg-primary/15 text-primary text-[10px] font-bold"
                                            >
                                                {selectedPerkFilters.length} Selected (Match All)
                                            </Badge>
                                        )}
                                    </div>
                                    {selectedPerkFilters.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPerkFilters([])}
                                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                            <span>Clear perks</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    {POPULAR_PERK_FILTERS.map(perk => {
                                        const isSelected = selectedPerkFilters.includes(perk);
                                        return (
                                            <button
                                                key={perk}
                                                type="button"
                                                onClick={() => togglePerkFilter(perk)}
                                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all duration-150 border cursor-pointer ${isSelected
                                                    ? "border-primary bg-primary/25 text-primary font-bold shadow-[0_0_8px_rgba(91,163,255,0.25)]"
                                                    : "border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-border"
                                                    }`}
                                            >
                                                {isSelected && <Check className="h-3 w-3 text-primary" />}
                                                <span>{perk}</span>
                                            </button>
                                        );
                                    })}

                                    {/* Any selected perks outside the popular set */}
                                    {selectedPerkFilters
                                        .filter(p => !POPULAR_PERK_FILTERS.includes(p))
                                        .map(perk => (
                                            <button
                                                key={perk}
                                                type="button"
                                                onClick={() => togglePerkFilter(perk)}
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border border-primary bg-primary/25 text-primary shadow-[0_0_8px_rgba(91,163,255,0.25)] cursor-pointer"
                                            >
                                                <Check className="h-3 w-3 text-primary" />
                                                <span>{perk}</span>
                                                <X className="h-3 w-3 ml-0.5 opacity-70 hover:opacity-100" />
                                            </button>
                                        ))}

                                    {/* Quick "+ Add Perk" Dropdown Search */}
                                    <div className="relative">
                                        <Input
                                            value={perkDropdownSearch}
                                            onChange={e => setPerkDropdownSearch(e.target.value)}
                                            placeholder="+ Add perk…"
                                            className="h-7 w-28 rounded-md text-[11px] bg-muted/20 border-border/50 focus:w-40 transition-all"
                                        />
                                        {perkDropdownSearch && (
                                            <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-52 overflow-y-auto rounded-lg border border-border/80 bg-popover/95 p-1 shadow-xl backdrop-blur-md">
                                                {allPerkNames
                                                    .filter(
                                                        p =>
                                                            p.toLowerCase().includes(perkDropdownSearch.toLowerCase()) &&
                                                            !selectedPerkFilters.includes(p),
                                                    )
                                                    .slice(0, 8)
                                                    .map(perk => (
                                                        <button
                                                            key={perk}
                                                            type="button"
                                                            onClick={() => {
                                                                togglePerkFilter(perk);
                                                                setPerkDropdownSearch("");
                                                            }}
                                                            className="flex w-full items-center justify-between rounded px-2 py-1 text-xs text-foreground hover:bg-primary/20 hover:text-primary transition-colors text-left cursor-pointer"
                                                        >
                                                            <span>{perk}</span>
                                                            <Plus className="h-3 w-3 text-muted-foreground" />
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    {(selectedElement !== "all" ||
                                        selectedSubcategory !== "all" ||
                                        selectedPerkFilters.length > 0 ||
                                        searchQuery) && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                                <span>Reset all filters</span>
                                            </button>
                                        )}
                                </div>
                            </div>
                        </div>

                        {/* 5. Results Counter */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                            <span>
                                Showing <strong className="text-foreground">{filteredMetaBuilds.length}</strong>{" "}
                                {filteredMetaBuilds.length === 1 ? "build" : "builds"}
                                {showLikedOnly ? " (from your liked collection)" : ""} for{" "}
                                <strong className="text-foreground">{selectedWeapon === "all" ? "All Weapons" : selectedWeapon}</strong> ({selectedCategory === "all" ? "All Archetypes" : selectedCategory})
                                {selectedPerkFilters.length > 0 && (
                                    <span className="text-primary font-medium ml-1">
                                        • Matching: {selectedPerkFilters.join(" + ")}
                                    </span>
                                )}
                            </span>
                        </div>

                        {/* 6. Clean, Minimal Meta Build Cards Grid */}
                        {filteredMetaBuilds.length === 0 ? (
                            showLikedOnly ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line-2)] bg-[rgba(10,19,32,0.7)] py-16 px-6 text-center shadow-lg backdrop-blur-sm">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-400 mb-4">
                                        <Search className="h-7 w-7 text-amber-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">No Liked Builds Match Your Filters</h3>
                                    <p className="max-w-md text-sm text-[#b8c7db] leading-relaxed mb-6">
                                        None of your {likedBuilds.size} liked build{likedBuilds.size === 1 ? "" : "s"} match the selected weapon, archetype, or perk filters.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            resetFilters();
                                            setSelectedWeapon("all");
                                            setSelectedCategory("all");
                                        }}
                                        className="text-xs gap-1.5"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Reset Active Filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center">
                                    <Compass className="h-10 w-10 text-muted-foreground/60 mb-3" />
                                    <h4 className="text-base font-semibold text-foreground">No matching meta builds found</h4>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-md">
                                        No loadouts match your current combination of weapon, category, and filters.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={resetFilters}
                                        className="mt-4 text-xs gap-1.5"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Clear Active Filters
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredMetaBuilds.map(build => {
                                    const isHovered = hoveredCardId === build.buildId;
                                    const hasAnyHovered = hoveredCardId !== null;
                                    const isDimmed = hasAnyHovered && !isHovered;

                                    return (
                                        <div
                                            key={build.buildId}
                                            onClick={() => router.push(`/builds/${encodeURIComponent(build.buildId)}`)}
                                            onMouseEnter={() => setHoveredCardId(build.buildId)}
                                            onMouseLeave={() => setHoveredCardId(null)}
                                            className={`group relative flex flex-col justify-between rounded-xl border border-border/70 bg-gradient-to-b from-card/95 via-card/85 to-card/75 p-4 shadow-sm transition-all duration-300 cursor-pointer ${isDimmed
                                                ? "opacity-35 scale-[0.985] filter blur-[0.2px]"
                                                : "opacity-100 hover:scale-[1.015] hover:border-primary/80 hover:shadow-xl hover:shadow-primary/10"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-3">
                                                {/* Header: Matchup Badge & Weapon Type */}
                                                <div className="flex items-center justify-between gap-2">
                                                    {build.vsElement ? (
                                                        <div
                                                            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border"
                                                            style={{
                                                                borderColor: `${elementColor(build.vsElement)}80`,
                                                                backgroundColor: `${elementColor(build.vsElement)}18`,
                                                                color: elementColor(build.vsElement),
                                                                textShadow: `0 0 8px ${elementColor(build.vsElement)}60`,
                                                            }}
                                                        >
                                                            <div className="relative h-3 w-3 flex-shrink-0">
                                                                <Image
                                                                    src={`/assets/icons/elements/${build.vsElement}.png`}
                                                                    alt={build.vsElement}
                                                                    fill
                                                                    sizes="12px"
                                                                    className="object-contain"
                                                                />
                                                            </div>
                                                            <span>VS {build.vsElement.toUpperCase()}</span>
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-primary/40 bg-primary/10 text-primary text-[10px] font-bold uppercase"
                                                        >
                                                            {build.subcategory === "heroics"
                                                                ? "Heroic Escalation"
                                                                : build.subcategory === "preEsca"
                                                                    ? "Pre-Escalation"
                                                                    : build.subcategory === "legendaries"
                                                                        ? "Legendary Esca"
                                                                        : build.category}
                                                        </Badge>
                                                    )}

                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] font-medium text-muted-foreground"
                                                    >
                                                        {build.weaponType}
                                                    </Badge>
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                    {build.title}
                                                </h4>

                                                {/* Weapon & Bond Line (Compact) */}
                                                <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2">
                                                    <div className="relative h-7 w-7 flex-shrink-0 rounded border border-border/60 bg-muted/40 p-0.5">
                                                        <Image
                                                            src={build.weaponIcon}
                                                            alt={build.weaponName}
                                                            fill
                                                            sizes="28px"
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1 text-xs">
                                                        <p className="font-semibold text-foreground truncate">{build.weaponName}</p>
                                                        {build.bondName ? (
                                                            <p className="text-[10px] text-muted-foreground truncate">
                                                                Bond: <span className="text-foreground/90 font-medium">{build.bondName}</span>
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] text-muted-foreground truncate">
                                                                Element: {build.weaponElement}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Omnicell & Lantern Pills */}
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border/40 bg-muted/15 px-2 py-1 min-w-0">
                                                        <div className="relative h-4 w-4 flex-shrink-0">
                                                            {build.omnicellIcon ? (
                                                                <Image
                                                                    src={build.omnicellIcon}
                                                                    alt={build.omnicellName || "Omnicell"}
                                                                    fill
                                                                    sizes="16px"
                                                                    className="object-contain"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full rounded-full bg-muted/40" />
                                                            )}
                                                        </div>
                                                        <span className="truncate text-[11px] font-medium text-foreground/90">
                                                            {build.omnicellName || "No Omnicell"}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border/40 bg-muted/15 px-2 py-1 min-w-0">
                                                        <div className="relative h-4 w-4 flex-shrink-0">
                                                            <Image
                                                                src={build.lanternIcon}
                                                                alt={build.lanternName}
                                                                fill
                                                                sizes="16px"
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        <span className="truncate text-[11px] font-medium text-foreground/90">
                                                            {build.lanternName}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Top 3 Core Perks Preview */}
                                                <div className="flex flex-wrap items-center gap-1">
                                                    {build.perks.slice(0, 3).map(perk => {
                                                        const rank = Math.min(6, perk.value);
                                                        return (
                                                            <span
                                                                key={perk.name}
                                                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${rank >= 6
                                                                    ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
                                                                    : "border-primary/40 bg-primary/10 text-primary"
                                                                    }`}
                                                            >
                                                                +{rank} {perk.name}
                                                            </span>
                                                        );
                                                    })}
                                                    {build.perks.length > 3 && (
                                                        <span className="rounded bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                            +{build.perks.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons Footer */}
                                            <div className="mt-3.5 pt-2.5 border-t border-border/40 flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyLink(build.buildId);
                                                        }}
                                                        className="p-1 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                                                        title="Copy build page link"
                                                    >
                                                        {copiedBuildId === build.buildId ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>

                                                    <Link
                                                        href={`/builds/${encodeURIComponent(build.buildId)}#discussion`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-muted/20 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                                                        title="View details & comments"
                                                    >
                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                        <span className="tabular-nums">{commentCounts[build.buildId] ?? 0}</span>
                                                    </Link>

                                                    <Link
                                                        href={`/b/${build.buildId}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                                                    >
                                                        <span>Builder</span>
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </div>

                                                {(() => {
                                                    const isLiked = likedBuilds.has(build.buildId);
                                                    const likeCount = likeCounts[build.buildId] ?? 0;

                                                    return (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleLike(build.buildId);
                                                            }}
                                                            className={cn(
                                                                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 cursor-pointer",
                                                                isLiked
                                                                    ? "border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                                                                    : "border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-border/80"
                                                            )}
                                                            title={isLiked ? "Unlike build" : "Like build"}
                                                            aria-label={`${likeCount} likes`}
                                                        >
                                                            <Heart
                                                                className={cn(
                                                                    "h-3.5 w-3.5 transition-transform duration-200",
                                                                    isLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground"
                                                                )}
                                                            />
                                                            <span className="font-semibold tabular-nums text-xs">{likeCount}</span>
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default BuildSuggestions;
