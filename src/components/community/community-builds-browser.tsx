"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Check,
    Clock,
    Copy,
    ExternalLink,
    Flame,
    Globe,
    Heart,
    Lock,
    MessageSquare,
    Pencil,
    Plus,
    Search,
    Trash2,
    User,
    Users,
    X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
    COMMUNITY_CATEGORIES,
    type CommunityBuildRecord,
} from "@/lib/community-types";
import { buildBuildView, tryDeserialize, type BuildView } from "@/game/build-view";
import { cellTypeColor, elementColor } from "@/lib/site";
import type { AuthUser } from "@/components/auth/auth-card";
import PublishBuildDialog from "@/components/community/publish-build-dialog";
import EditBuildDialog from "@/components/community/edit-build-dialog";
import ConfirmDeleteDialog from "@/components/community/confirm-delete-dialog";
import { cn } from "@/lib/utils";

const WEAPON_TYPES = [
    "Sword",
    "Chain Blades",
    "Hammer",
    "Axe",
    "War Pike",
    "Aether Strikers",
    "Repeater",
] as const;

interface DecodedCommunityBuild extends CommunityBuildRecord {
    view: BuildView | null;
}

interface CommunityBuildsBrowserProps {
    embedded?: boolean;
}

export default function CommunityBuildsBrowser({ embedded = false }: CommunityBuildsBrowserProps) {
    const [builds, setBuilds] = useState<CommunityBuildRecord[]>([]);
    const [likedBuilds, setLikedBuilds] = useState<Set<string>>(new Set());
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
    const [selectedWeapon, setSelectedWeapon] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [onlyMine, setOnlyMine] = useState(false);

    const [publishOpen, setPublishOpen] = useState(false);
    const [editingBuild, setEditingBuild] = useState<CommunityBuildRecord | null>(null);
    const [confirmDeleteBuild, setConfirmDeleteBuild] = useState<CommunityBuildRecord | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadCommunity = useCallback(async () => {
        try {
            const res = await fetch("/api/community/builds", { cache: "no-store" });
            if (!res.ok) return;
            const data = (await res.json()) as {
                builds?: CommunityBuildRecord[];
                userLikes?: string[];
                currentUserId?: string | null;
            };
            setBuilds(data.builds || []);
            setLikedBuilds(new Set(data.userLikes || []));
            setCurrentUserId(data.currentUserId ?? null);
        } catch (err) {
            console.error("Failed to fetch community builds:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCommunity();

        const onAuthChanged = (event: Event) => {
            const customEvent = event as CustomEvent<AuthUser | null>;
            setCurrentUserId(customEvent.detail?.id ?? null);
            loadCommunity();
        };
        window.addEventListener("mystic-auth-changed", onAuthChanged);
        return () => window.removeEventListener("mystic-auth-changed", onAuthChanged);
    }, [loadCommunity]);

    const decodedBuilds = useMemo<DecodedCommunityBuild[]>(() => {
        return builds.map((b) => {
            const model = tryDeserialize(b.buildId);
            const view = model ? buildBuildView(model, b.buildId) : null;
            return { ...b, view };
        });
    }, [builds]);

    const filteredBuilds = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = decodedBuilds.filter((b) => {
            if (onlyMine && b.accountId !== currentUserId) return false;
            if (selectedWeapon !== "all" && b.weaponType !== selectedWeapon) return false;
            if (selectedCategory !== "all" && b.category !== selectedCategory) return false;
            if (q) {
                const perkNames = b.view?.perkTotals.map((p) => p.name.toLowerCase()).join(" ") || "";
                const haystack = [
                    b.title,
                    b.description || "",
                    b.weaponName,
                    b.weaponType,
                    b.omnicell || "",
                    b.authorDisplayName,
                    b.authorUsername,
                    b.category,
                    perkNames,
                ]
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });

        return [...list].sort((a, b) => {
            if (sortBy === "top") {
                const diff = b.likes - a.likes;
                if (diff !== 0) return diff;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [decodedBuilds, onlyMine, currentUserId, selectedWeapon, selectedCategory, search, sortBy]);

    const handleToggleLike = async (buildId: string) => {
        if (!currentUserId) {
            toast({
                title: "Sign in required",
                description: "Please sign in with Discord or your account to like builds.",
            });
            window.dispatchEvent(new CustomEvent("mystic-open-auth"));
            return;
        }

        const currentlyLiked = likedBuilds.has(buildId);
        const nextLiked = !currentlyLiked;

        setLikedBuilds((prev) => {
            const next = new Set(prev);
            if (nextLiked) next.add(buildId);
            else next.delete(buildId);
            return next;
        });
        setBuilds((prev) =>
            prev.map((item) =>
                item.buildId === buildId
                    ? { ...item, likes: Math.max(0, item.likes + (nextLiked ? 1 : -1)) }
                    : item
            )
        );

        try {
            const res = await fetch(`/api/builds/${encodeURIComponent(buildId)}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (res.status === 401) {
                window.dispatchEvent(new CustomEvent("mystic-open-auth"));
                loadCommunity();
                return;
            }
            if (res.ok) {
                const data = (await res.json()) as { liked: boolean; count: number };
                setLikedBuilds((prev) => {
                    const next = new Set(prev);
                    if (data.liked) next.add(buildId);
                    else next.delete(buildId);
                    return next;
                });
                setBuilds((prev) =>
                    prev.map((item) => (item.buildId === buildId ? { ...item, likes: data.count } : item))
                );
            }
        } catch {
            loadCommunity();
        }
    };

    const handleCopyLink = async (b: CommunityBuildRecord) => {
        const url = `${window.location.origin}/builds/${encodeURIComponent(b.id)}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(b.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast({ title: "Copy link", description: url });
        }
    };

    const handleToggleVisibility = async (b: CommunityBuildRecord) => {
        const nextVisibility = b.visibility === "private" ? "public" : "private";
        setTogglingId(b.id);
        try {
            const res = await fetch(`/api/community/builds/${encodeURIComponent(b.id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visibility: nextVisibility }),
            });
            const data = (await res.json().catch(() => ({}))) as {
                build?: CommunityBuildRecord;
                error?: string;
            };
            if (res.ok && data.build) {
                setBuilds((prev) => prev.map((item) => (item.id === b.id ? data.build! : item)));
                toast({
                    title: nextVisibility === "private" ? "Build set to Private" : "Build set to Public",
                    description:
                        nextVisibility === "private"
                            ? `"${b.title}" is now hidden from other Slayers.`
                            : `"${b.title}" is now visible in Community Builds.`,
                });
            } else {
                toast({ title: "Update failed", description: data.error || "Unable to update visibility." });
            }
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (b: CommunityBuildRecord) => {
        setDeletingId(b.id);
        try {
            const res = await fetch(`/api/community/builds/${encodeURIComponent(b.id)}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setBuilds((prev) => prev.filter((item) => item.id !== b.id));
                toast({ title: "Build removed", description: `"${b.title}" was deleted from Community Builds.` });
            } else {
                const err = (await res.json().catch(() => ({}))) as { error?: string };
                toast({ title: "Delete failed", description: err.error || "Unable to remove build." });
            }
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section
            className={cn(
                "w-full flex-1 px-6 sm:px-10 md:px-[100px] lg:px-[150px]",
                embedded ? "pt-4 pb-10" : "mystic-glow py-10"
            )}
        >
            {/* Header / Action Bar */}
            {!embedded ? (
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="panel-label">Slayer Loadout Archive</p>
                    <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl font-display">
                        Community Builds
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Browse loadouts crafted and shared by fellow Slayers, or sign in to publish your own builds.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                        <Button
                            type="button"
                            size="lg"
                            className="gap-2 cursor-pointer"
                            onClick={() => setPublishOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            Publish Build
                        </Button>
                        {currentUserId && (
                            <Button
                                type="button"
                                variant={onlyMine ? "default" : "outline"}
                                size="lg"
                                className="gap-2 cursor-pointer"
                                onClick={() => setOnlyMine((prev) => !prev)}
                            >
                                <User className="h-4 w-4" />
                                {onlyMine ? "Showing My Builds" : "My Shared Builds"}
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[var(--ink-3)]">
                        Unique builds shared by Slayers — each loadout can only be published once globally.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {currentUserId && (
                            <Button
                                type="button"
                                variant={onlyMine ? "default" : "outline"}
                                size="sm"
                                className="gap-1.5 cursor-pointer"
                                onClick={() => setOnlyMine((prev) => !prev)}
                            >
                                <User className="h-3.5 w-3.5" />
                                {onlyMine ? "Showing My Builds" : "My Shared Builds"}
                            </Button>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            className="gap-1.5 cursor-pointer"
                            onClick={() => setPublishOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Publish Build
                        </Button>
                    </div>
                </div>
            )}

            <div className={embedded ? "mt-5" : "mt-8"}>
                <div className="gold-rule mb-8" aria-hidden />

                {/* Filters Bar */}
                <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[rgba(10,19,32,0.65)] p-5 backdrop-blur-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-4)]" />
                            <Input
                                type="text"
                                placeholder="Search builds, weapons, perks, or creators..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-8"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-4)] hover:text-white cursor-pointer"
                                    aria-label="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant={sortBy === "newest" ? "default" : "outline"}
                                className="gap-1.5 cursor-pointer"
                                onClick={() => setSortBy("newest")}
                            >
                                <Clock className="h-3.5 w-3.5" />
                                Newest
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={sortBy === "top" ? "default" : "outline"}
                                className="gap-1.5 cursor-pointer"
                                onClick={() => setSortBy("top")}
                            >
                                <Flame className="h-3.5 w-3.5 text-amber-300" />
                                Most Liked
                            </Button>
                        </div>
                    </div>

                    {/* Weapon Type Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedWeapon("all")}
                            className={cn(
                                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                                selectedWeapon === "all"
                                    ? "border-[var(--aether-line)] bg-[var(--aether-a10)] text-white"
                                    : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                            )}
                        >
                            All Weapons
                        </button>
                        {WEAPON_TYPES.map((w) => (
                            <button
                                key={w}
                                type="button"
                                onClick={() => setSelectedWeapon(w)}
                                className={cn(
                                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                                    selectedWeapon === w
                                        ? "border-[var(--aether-line)] bg-[var(--aether-a10)] text-white"
                                        : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                                )}
                            >
                                {w}
                            </button>
                        ))}
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory("all")}
                            className={cn(
                                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                                selectedCategory === "all"
                                    ? "border-[var(--gold)]/45 bg-[rgba(224,194,135,0.12)] text-[#f5dfb0]"
                                    : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                            )}
                        >
                            All Categories
                        </button>
                        {COMMUNITY_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                                    selectedCategory === cat
                                        ? "border-[var(--gold)]/45 bg-[rgba(224,194,135,0.12)] text-[#f5dfb0]"
                                        : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-64 animate-pulse rounded-2xl border border-[var(--line)] bg-[rgba(10,19,32,0.5)]"
                            />
                        ))}
                    </div>
                ) : filteredBuilds.length === 0 ? (
                    <div className="mx-auto my-6 flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-[var(--line-2)] bg-[rgba(10,19,32,0.7)] px-6 py-16 text-center backdrop-blur-sm">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--aether-line)] bg-[var(--aether-a10)] text-[var(--aether-hi)]">
                            <Users className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white font-display">
                            {builds.length === 0 ? "No Community Builds Yet" : "No Matching Builds Found"}
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            {builds.length === 0
                                ? "Be the first Slayer to publish a loadout! Sign in and share your favorite build with the community."
                                : "Try adjusting your search or filter selections."}
                        </p>
                        <Button
                            type="button"
                            size="lg"
                            className="mt-6 gap-2 cursor-pointer"
                            onClick={() => setPublishOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            Publish a Build
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {filteredBuilds.map((item) => {
                            const liked = likedBuilds.has(item.buildId);
                            const isOwner = currentUserId !== null && item.accountId === currentUserId;
                            const isPrivate = item.visibility === "private";
                            const accentColor = elementColor(item.element);
                            const builderHref = `/builder?b=${encodeURIComponent(item.buildId)}&name=${encodeURIComponent(item.title)}${isOwner ? `&communityId=${encodeURIComponent(item.id)}` : ""}`;

                            return (
                                <article
                                    key={item.id}
                                    className="group relative flex flex-col justify-between rounded-2xl border border-[var(--line-2)] bg-[rgba(10,19,32,0.75)] p-5 transition-all hover:border-[var(--aether-line)] hover:bg-[rgba(14,25,42,0.88)]"
                                >
                                    <div>
                                        {/* Top Row: Category + Visibility + Author */}
                                        <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Badge variant="outline" className="border-[var(--gold)]/35 bg-[rgba(224,194,135,0.08)] text-[#f5dfb0]">
                                                    {item.category}
                                                </Badge>
                                                {isOwner && (
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                                            isPrivate
                                                                ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                                                                : "border-emerald-500/35 bg-emerald-500/12 text-emerald-300"
                                                        )}
                                                    >
                                                        {isPrivate ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                                                        {isPrivate ? "Private" : "Public"}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className="inline-flex items-center gap-1 text-[var(--ink-3)] truncate"
                                                title={`@${item.authorUsername}`}
                                            >
                                                <User className="h-3 w-3 shrink-0 text-[var(--aether-hi)]" />
                                                <span className="truncate font-medium text-[var(--ink-2)]">
                                                    {item.authorDisplayName}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Weapon Header */}
                                        <Link
                                            href={`/builds/${encodeURIComponent(item.id)}`}
                                            className="group/title flex items-center gap-3"
                                        >
                                            {item.view?.weapon?.icon && (
                                                <div
                                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 p-1.5"
                                                    style={{ boxShadow: `0 0 18px -6px ${accentColor}` }}
                                                >
                                                    <img
                                                        src={item.view.weapon.icon}
                                                        alt={item.weaponName}
                                                        className="h-full w-full object-contain"
                                                    />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-base font-bold text-white font-display transition-colors group-hover/title:text-[var(--aether-hi)]">
                                                    {item.title}
                                                </h3>
                                                <p className="truncate text-xs text-[var(--ink-3)]">
                                                    {item.weaponName} • {item.weaponType}
                                                    {item.omnicell ? ` • ${item.omnicell}` : ""}
                                                </p>
                                            </div>
                                        </Link>

                                        {item.description && (
                                            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--ink-3)]">
                                                {item.description}
                                            </p>
                                        )}

                                        {/* Gear Icons Mini Strip */}
                                        {item.view && (
                                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                                {item.view.omnicell?.icon && (
                                                    <img
                                                        src={item.view.omnicell.icon}
                                                        alt={item.view.omnicell.name}
                                                        title={item.view.omnicell.name}
                                                        className="h-7 w-7 rounded-md border border-white/10 bg-black/40 p-0.5 object-contain"
                                                    />
                                                )}
                                                {item.view.lantern?.item.icon && (
                                                    <img
                                                        src={item.view.lantern.item.icon}
                                                        alt={item.view.lantern.item.name}
                                                        title={item.view.lantern.item.name}
                                                        className="h-7 w-7 rounded-md border border-white/10 bg-black/40 p-0.5 object-contain"
                                                    />
                                                )}
                                                {[
                                                    item.view.armour.head,
                                                    item.view.armour.torso,
                                                    item.view.armour.arms,
                                                    item.view.armour.legs,
                                                ].map(
                                                    (piece, idx) =>
                                                        piece && (
                                                            <img
                                                                key={`${piece.name}-${idx}`}
                                                                src={piece.icon}
                                                                alt={piece.name}
                                                                title={piece.name}
                                                                className="h-7 w-7 rounded-md border border-white/10 bg-black/40 p-0.5 object-contain"
                                                            />
                                                        )
                                                )}
                                            </div>
                                        )}

                                        {/* Top Perks */}
                                        {item.view && item.view.perkTotals.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {item.view.perkTotals.slice(0, 5).map((perk) => (
                                                    <span
                                                        key={perk.name}
                                                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-2)]"
                                                    >
                                                        <span
                                                            className="font-bold"
                                                            style={{ color: cellTypeColor(perk.type) }}
                                                        >
                                                            +{perk.value}
                                                        </span>
                                                        {perk.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleLike(item.buildId)}
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                                                    liked
                                                        ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
                                                        : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                                                )}
                                                title="Like build"
                                            >
                                                <Heart className={cn("h-3.5 w-3.5", liked && "fill-rose-400 text-rose-400")} />
                                                <span>{item.likes}</span>
                                            </button>

                                            <Link
                                                href={`/builds/${encodeURIComponent(item.id)}#discussion`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[var(--ink-3)] hover:text-white transition-colors"
                                                title="View build & comments"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                <span>{item.commentCount ?? 0}</span>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => handleCopyLink(item)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[var(--ink-3)] hover:text-white cursor-pointer"
                                                title="Copy build page link"
                                            >
                                                {copiedId === item.id ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>

                                            {isOwner && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingBuild(item)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-white/[0.04] px-2 py-1.5 text-xs text-[var(--ink-2)] hover:border-white/25 hover:text-white cursor-pointer"
                                                        title="Edit build details"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={togglingId === item.id}
                                                        onClick={() => handleToggleVisibility(item)}
                                                        className={cn(
                                                            "inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs cursor-pointer disabled:opacity-50",
                                                            isPrivate
                                                                ? "border-amber-500/40 bg-amber-500/12 text-amber-300 hover:bg-amber-500/20"
                                                                : "border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                                        )}
                                                        title={isPrivate ? "Private — click to make Public" : "Public — click to make Private"}
                                                    >
                                                        {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={deletingId === item.id}
                                                        onClick={() => setConfirmDeleteBuild(item)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 cursor-pointer disabled:opacity-50"
                                                        title="Delete your shared build"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Link
                                                href={`/builds/${encodeURIComponent(item.id)}`}
                                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-2)] transition-colors hover:border-white/25 hover:text-white"
                                            >
                                                Details
                                            </Link>
                                            <Link
                                                href={builderHref}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--aether-line)] bg-[var(--aether-a10)] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-115"
                                            >
                                                <span>Builder</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Publish Build Modal */}
            <PublishBuildDialog
                open={publishOpen}
                onOpenChange={setPublishOpen}
                onPublished={(created) => {
                    setBuilds((prev) => [created, ...prev]);
                    toast({
                        title: created.visibility === "private" ? "Saved as Private Build!" : "Published to Community!",
                        description:
                            created.visibility === "private"
                                ? `"${created.title}" is live as a private build (only visible to you).`
                                : `"${created.title}" is now visible to all Slayers.`,
                    });
                }}
            />

            {/* Edit Build Modal */}
            <EditBuildDialog
                open={Boolean(editingBuild)}
                onOpenChange={(next) => {
                    if (!next) setEditingBuild(null);
                }}
                build={editingBuild}
                onSaved={(updated) => {
                    setBuilds((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
                    toast({
                        title: "Build updated",
                        description: `"${updated.title}" saved (${updated.visibility === "private" ? "Private" : "Public"}).`,
                    });
                }}
            />

            {/* Delete Build Confirmation */}
            <ConfirmDeleteDialog
                open={Boolean(confirmDeleteBuild)}
                onOpenChange={(next) => {
                    if (!next) setConfirmDeleteBuild(null);
                }}
                title="Delete Build?"
                description={
                    confirmDeleteBuild
                        ? `Are you sure you want to permanently delete "${confirmDeleteBuild.title}"? All comments on this build will also be removed. This action cannot be undone.`
                        : ""
                }
                confirmLabel="Delete Build"
                loading={Boolean(confirmDeleteBuild && deletingId === confirmDeleteBuild.id)}
                onConfirm={async () => {
                    if (!confirmDeleteBuild) return;
                    await handleDelete(confirmDeleteBuild);
                    setConfirmDeleteBuild(null);
                }}
            />
        </section>
    );
}
