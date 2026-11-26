"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Check,
    Copy,
    ExternalLink,
    Eye,
    Globe,
    Heart,
    Loader2,
    Lock,
    LogIn,
    MessageSquare,
    Pencil,
    Reply,
    Send,
    Trash2,
    User,
    X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { CommunityBuildRecord, CommunityCommentRecord } from "@/lib/community-types";
import { buildBuildView, tryDeserialize } from "@/game/build-view";
import { cellTypeColor, elementColor } from "@/lib/site";
import { validateCleanText } from "@/lib/profanity";
import type { AuthUser } from "@/components/auth/auth-card";
import GifPicker from "@/components/community/gif-picker";
import EditBuildDialog from "@/components/community/edit-build-dialog";
import ConfirmDeleteDialog from "@/components/community/confirm-delete-dialog";
import { PerkTierHoverTooltip } from "@/components/loadout/perk-summary-dialog";
import { cn } from "@/lib/utils";

interface CommunityBuildDetailProps {
    initialBuild: CommunityBuildRecord;
    initialLikedByMe: boolean;
    initialComments: CommunityCommentRecord[];
    initialUserId: string | null;
    source?: "community" | "meta";
    vsElement?: string | null;
    subcategory?: string | null;
}

function formatDate(raw: string | Date): string {
    const normalized =
        typeof raw === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(raw.trim())
            ? `${raw.trim().replace(" ", "T")}Z`
            : raw;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CommunityBuildDetail({
    initialBuild,
    initialLikedByMe,
    initialComments,
    initialUserId,
    source = "community",
    vsElement = null,
    subcategory = null,
}: CommunityBuildDetailProps) {
    const router = useRouter();
    const [build, setBuild] = useState<CommunityBuildRecord>(initialBuild);
    const [likedByMe, setLikedByMe] = useState(initialLikedByMe);
    const [comments, setComments] = useState<CommunityCommentRecord[]>(initialComments);
    const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserId);

    const [commentInput, setCommentInput] = useState("");
    const [commentGif, setCommentGif] = useState<string | null>(null);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [postingComment, setPostingComment] = useState(false);

    const [replyingTo, setReplyingTo] = useState<CommunityCommentRecord | null>(null);
    const [replyInput, setReplyInput] = useState("");
    const [replyGif, setReplyGif] = useState<string | null>(null);
    const [replyError, setReplyError] = useState<string | null>(null);
    const [postingReply, setPostingReply] = useState(false);

    const [copied, setCopied] = useState(false);
    const [deletingBuild, setDeletingBuild] = useState(false);
    const [confirmDeleteBuildOpen, setConfirmDeleteBuildOpen] = useState(false);
    const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);
    const [deletingComment, setDeletingComment] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [togglingVisibility, setTogglingVisibility] = useState(false);

    const view = useMemo(() => {
        const model = tryDeserialize(build.buildId);
        return model ? buildBuildView(model, build.buildId) : null;
    }, [build.buildId]);

    const refreshState = async () => {
        try {
            if (source === "meta") {
                const [meRes, likeRes, commentsRes] = await Promise.all([
                    fetch("/api/auth/me", { cache: "no-store" }),
                    fetch(`/api/builds/${encodeURIComponent(build.buildId)}/like`, { cache: "no-store" }),
                    fetch(`/api/community/builds/${encodeURIComponent(build.id)}/comments`, { cache: "no-store" }),
                ]);
                if (meRes.ok) {
                    const me = (await meRes.json()) as { user?: AuthUser | null };
                    setCurrentUserId(me.user?.id ?? null);
                }
                if (likeRes.ok) {
                    const likeData = (await likeRes.json()) as { liked: boolean; count: number };
                    setLikedByMe(likeData.liked);
                    setBuild((prev) => ({ ...prev, likes: likeData.count }));
                }
                if (commentsRes.ok) {
                    const cData = (await commentsRes.json()) as { comments?: CommunityCommentRecord[] };
                    if (Array.isArray(cData.comments)) setComments(cData.comments);
                }
                return;
            }

            const res = await fetch(`/api/community/builds/${encodeURIComponent(build.id)}`, {
                cache: "no-store",
            });
            if (!res.ok) return;
            const data = (await res.json()) as {
                build?: CommunityBuildRecord;
                likedByMe?: boolean;
                comments?: CommunityCommentRecord[];
                currentUserId?: string | null;
            };
            if (data.build) setBuild(data.build);
            if (typeof data.likedByMe === "boolean") setLikedByMe(data.likedByMe);
            if (Array.isArray(data.comments)) setComments(data.comments);
            setCurrentUserId(data.currentUserId ?? null);
        } catch {
            // Ignore transient refresh failure
        }
    };

    useEffect(() => {
        let active = true;
        fetch(`/api/builds/${encodeURIComponent(build.buildId)}/views`, { method: "POST" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { views?: number } | null) => {
                if (active && data && typeof data.views === "number") {
                    setBuild((prev) => ({ ...prev, views: data.views! }));
                }
            })
            .catch(() => { });
        return () => {
            active = false;
        };
    }, [build.buildId]);

    useEffect(() => {
        const onAuthChanged = (event: Event) => {
            const customEvent = event as CustomEvent<AuthUser | null>;
            setCurrentUserId(customEvent.detail?.id ?? null);
            refreshState();
        };
        window.addEventListener("mystic-auth-changed", onAuthChanged);
        return () => window.removeEventListener("mystic-auth-changed", onAuthChanged);
    }, [build.id]);

    const handleToggleBuildLike = async () => {
        if (!currentUserId) {
            toast({
                title: "Sign in required",
                description: "Please sign in with Discord or your account to like builds.",
            });
            window.dispatchEvent(new CustomEvent("mystic-open-auth"));
            return;
        }

        const prevLiked = likedByMe;
        const nextLiked = !prevLiked;
        setLikedByMe(nextLiked);
        setBuild((prev) => ({ ...prev, likes: Math.max(0, prev.likes + (nextLiked ? 1 : -1)) }));

        try {
            const res = await fetch(`/api/builds/${encodeURIComponent(build.buildId)}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (res.status === 401) {
                setLikedByMe(prevLiked);
                window.dispatchEvent(new CustomEvent("mystic-open-auth"));
                return;
            }
            if (res.ok) {
                const data = (await res.json()) as { liked: boolean; count: number };
                setLikedByMe(data.liked);
                setBuild((prev) => ({ ...prev, likes: data.count }));
            }
        } catch {
            setLikedByMe(prevLiked);
            refreshState();
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        setCommentError(null);
        if (!currentUserId) {
            window.dispatchEvent(new CustomEvent("mystic-open-auth"));
            return;
        }
        const trimmed = commentInput.trim();
        if (!trimmed && !commentGif) return;

        if (trimmed) {
            const clean = validateCleanText(trimmed, "Comment");
            if (!clean.valid) {
                setCommentError(clean.error || "Comment contains blocked language.");
                return;
            }
        }

        setPostingComment(true);
        try {
            const res = await fetch(
                `/api/community/builds/${encodeURIComponent(build.id)}/comments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: trimmed, gifUrl: commentGif }),
                }
            );
            const data = (await res.json().catch(() => ({}))) as {
                comment?: CommunityCommentRecord;
                error?: string;
                requiresAuth?: boolean;
            };
            if (res.status === 401 || data.requiresAuth) {
                window.dispatchEvent(new CustomEvent("mystic-open-auth"));
                return;
            }
            if (!res.ok || !data.comment) {
                setCommentError(data.error || "Unable to post comment.");
                return;
            }
            setComments((prev) => [...prev, data.comment!]);
            setCommentInput("");
            setCommentGif(null);
            setBuild((prev) => ({ ...prev, commentCount: (prev.commentCount ?? 0) + 1 }));
        } finally {
            setPostingComment(false);
        }
    };

    const handlePostReply = async (e: React.FormEvent) => {
        e.preventDefault();
        setReplyError(null);
        if (!replyingTo) return;
        if (!currentUserId) {
            window.dispatchEvent(new CustomEvent("mystic-open-auth"));
            return;
        }
        const trimmed = replyInput.trim();
        if (!trimmed && !replyGif) return;

        if (trimmed) {
            const clean = validateCleanText(trimmed, "Reply");
            if (!clean.valid) {
                setReplyError(clean.error || "Reply contains blocked language.");
                return;
            }
        }

        setPostingReply(true);
        try {
            const res = await fetch(
                `/api/community/builds/${encodeURIComponent(build.id)}/comments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: trimmed,
                        parentId: replyingTo.id,
                        gifUrl: replyGif,
                    }),
                }
            );
            const data = (await res.json().catch(() => ({}))) as {
                comment?: CommunityCommentRecord;
                error?: string;
                requiresAuth?: boolean;
            };
            if (res.status === 401 || data.requiresAuth) {
                window.dispatchEvent(new CustomEvent("mystic-open-auth"));
                return;
            }
            if (!res.ok || !data.comment) {
                setReplyError(data.error || "Unable to post reply.");
                return;
            }
            setComments((prev) => [...prev, data.comment!]);
            setReplyInput("");
            setReplyGif(null);
            setReplyingTo(null);
            setBuild((prev) => ({ ...prev, commentCount: (prev.commentCount ?? 0) + 1 }));
        } finally {
            setPostingReply(false);
        }
    };

    const handleToggleCommentLike = async (commentId: string) => {
        if (!currentUserId) {
            toast({
                title: "Sign in required",
                description: "Please sign in with Discord or your account to like comments.",
            });
            window.dispatchEvent(new CustomEvent("mystic-open-auth"));
            return;
        }

        const target = comments.find((c) => c.id === commentId);
        if (!target) return;
        const prevLiked = target.likedByMe;
        const nextLiked = !prevLiked;

        setComments((prev) =>
            prev.map((c) =>
                c.id === commentId
                    ? { ...c, likedByMe: nextLiked, likes: Math.max(0, c.likes + (nextLiked ? 1 : -1)) }
                    : c
            )
        );

        try {
            const res = await fetch(`/api/community/comments/${encodeURIComponent(commentId)}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ buildTitle: build.title }),
            });
            if (res.status === 401) {
                window.dispatchEvent(new CustomEvent("mystic-open-auth"));
                refreshState();
                return;
            }
            if (res.ok) {
                const data = (await res.json()) as { liked: boolean; likes: number };
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === commentId ? { ...c, likedByMe: data.liked, likes: data.likes } : c
                    )
                );
            }
        } catch {
            refreshState();
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const res = await fetch(`/api/community/comments/${encodeURIComponent(commentId)}`, {
            method: "DELETE",
        });
        if (res.ok) {
            setComments((prev) => {
                const toDelete = new Set<string>([commentId]);
                let added = true;
                while (added) {
                    added = false;
                    for (const item of prev) {
                        if (item.parentId && toDelete.has(item.parentId) && !toDelete.has(item.id)) {
                            toDelete.add(item.id);
                            added = true;
                        }
                    }
                }
                const next = prev.filter((c) => !toDelete.has(c.id));
                setBuild((bPrev) => ({ ...bPrev, commentCount: next.length }));
                return next;
            });
            if (replyingTo?.id === commentId) {
                setReplyingTo(null);
            }
        }
    };

    const { topLevelComments, repliesByRoot, commentMap } = useMemo(() => {
        const map = new Map<string, CommunityCommentRecord>(comments.map((c) => [c.id, c]));
        const top: CommunityCommentRecord[] = [];
        const groups = new Map<string, CommunityCommentRecord[]>();

        const findRootId = (c: CommunityCommentRecord): string => {
            const seen = new Set<string>([c.id]);
            let cur: CommunityCommentRecord = c;
            while (cur.parentId && map.has(cur.parentId) && !seen.has(cur.parentId)) {
                cur = map.get(cur.parentId)!;
                seen.add(cur.id);
            }
            return cur.id;
        };

        for (const c of comments) {
            if (!c.parentId || !map.has(c.parentId)) {
                top.push(c);
            } else {
                const rootId = findRootId(c);
                const arr = groups.get(rootId) || [];
                arr.push(c);
                groups.set(rootId, arr);
            }
        }
        return { topLevelComments: top, repliesByRoot: groups, commentMap: map };
    }, [comments]);

    const handleToggleVisibility = async () => {
        if (source !== "community") return;
        const nextVisibility = build.visibility === "private" ? "public" : "private";
        setTogglingVisibility(true);
        try {
            const res = await fetch(`/api/community/builds/${encodeURIComponent(build.id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visibility: nextVisibility }),
            });
            const data = (await res.json().catch(() => ({}))) as {
                build?: CommunityBuildRecord;
                error?: string;
            };
            if (res.ok && data.build) {
                setBuild(data.build);
                toast({
                    title: nextVisibility === "private" ? "Build is now Private" : "Build is now Public",
                    description:
                        nextVisibility === "private"
                            ? "Hidden from public Community Builds."
                            : "Visible in Community Builds to all Slayers.",
                });
                router.refresh();
            } else {
                toast({ title: "Update failed", description: data.error || "Unable to update visibility." });
            }
        } finally {
            setTogglingVisibility(false);
        }
    };

    const handleDeleteBuild = async () => {
        if (source !== "community") return;
        setDeletingBuild(true);
        try {
            const res = await fetch(`/api/community/builds/${encodeURIComponent(build.id)}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast({ title: "Build deleted", description: `"${build.title}" was removed.` });
                router.push("/builds?tab=community");
                router.refresh();
            } else {
                const err = (await res.json().catch(() => ({}))) as { error?: string };
                toast({ title: "Delete failed", description: err.error || "Unable to delete build." });
            }
        } finally {
            setDeletingBuild(false);
        }
    };

    const handleCopyPageLink = async () => {
        const pathId = source === "meta" ? build.buildId : build.id;
        const url = `${window.location.origin}/builds/${encodeURIComponent(pathId)}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: "Build URL", description: url });
        }
    };

    const isOwner = source === "community" && currentUserId !== null && build.accountId === currentUserId;
    const isPrivate = build.visibility === "private";
    const accentColor = elementColor(build.element);
    const builderHref = `/builder?b=${encodeURIComponent(build.buildId)}&name=${encodeURIComponent(build.title)}${isOwner ? `&communityId=${encodeURIComponent(build.id)}` : ""}`;
    const backHref = source === "meta" ? "/builds?tab=meta" : "/builds?tab=community";
    const backLabel = source === "meta" ? "Back to Meta Builds" : "Back to Community Builds";

    const armourEntries = view
        ? [
            { label: "Head", piece: view.armour.head },
            { label: "Torso", piece: view.armour.torso },
            { label: "Arms", piece: view.armour.arms },
            { label: "Legs", piece: view.armour.legs },
        ]
        : [];

    return (
        <section className="mystic-glow w-full flex-1 px-6 sm:px-10 md:px-[100px] lg:px-[150px] py-10">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Breadcrumb */}
                <div>
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-3)] transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        {backLabel}
                    </Link>
                </div>

                {/* Header Card */}
                <div className="rounded-2xl border border-[var(--line-2)] bg-[rgba(10,19,32,0.82)] p-6 sm:p-8 backdrop-blur-md">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                            {view?.weapon?.icon && (
                                <div
                                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/50 p-2"
                                    style={{ boxShadow: `0 0 28px -6px ${accentColor}` }}
                                >
                                    <img
                                        src={view.weapon.icon}
                                        alt={build.weaponName}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            )}
                            <div>
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    {vsElement ? (
                                        <span
                                            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold"
                                            style={{
                                                borderColor: `${elementColor(vsElement)}80`,
                                                backgroundColor: `${elementColor(vsElement)}18`,
                                                color: elementColor(vsElement),
                                            }}
                                        >
                                            VS {vsElement.toUpperCase()}
                                        </span>
                                    ) : null}
                                    <Badge
                                        variant="outline"
                                        className="border-[var(--gold)]/40 bg-[rgba(224,194,135,0.1)] text-[#f5dfb0]"
                                    >
                                        {subcategory === "heroics"
                                            ? "Heroic Escalation"
                                            : subcategory === "preEsca"
                                                ? "Pre-Escalation"
                                                : subcategory === "legendaries"
                                                    ? "Legendary Esca"
                                                    : build.category}
                                    </Badge>
                                    {source === "meta" ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--aether-line)] bg-[var(--aether-a10)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--aether-hi)]">
                                            Official Meta Guide
                                        </span>
                                    ) : (
                                        <>
                                            {isOwner && (
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                                                        isPrivate
                                                            ? "border-amber-500/45 bg-amber-500/15 text-amber-300"
                                                            : "border-emerald-500/40 bg-emerald-500/12 text-emerald-300"
                                                    )}
                                                >
                                                    {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                                    {isPrivate ? "Private Build" : "Public Build"}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
                                                <User className="h-3.5 w-3.5 text-[var(--aether-hi)]" />
                                                <span className="font-semibold text-white">{build.authorDisplayName}</span>
                                                {build.authorDisplayName !== build.authorUsername && (
                                                    <span>@{build.authorUsername}</span>
                                                )}
                                                <span>• {formatDate(build.createdAt)}</span>
                                            </span>
                                        </>
                                    )}
                                </div>

                                <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    {build.title}
                                </h1>
                                <p className="mt-1 text-sm text-[var(--ink-3)]">
                                    {build.weaponName} • {build.weaponType}
                                    {build.omnicell ? ` • ${build.omnicell}` : ""}
                                </p>
                            </div>
                        </div>

                        {/* Primary Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleToggleBuildLike}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                                    likedByMe
                                        ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
                                        : "border-[var(--line-2)] bg-white/[0.045] text-[var(--ink-2)] hover:text-white"
                                )}
                            >
                                <Heart className={cn("h-4 w-4", likedByMe && "fill-rose-400 text-rose-400")} />
                                <span>{build.likes}</span>
                            </button>

                            <Button variant="outline" onClick={handleCopyPageLink} className="gap-1.5 cursor-pointer">
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 text-emerald-400" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Share Link
                                    </>
                                )}
                            </Button>

                            <Button asChild className="gap-1.5">
                                <Link href={builderHref}>
                                    Open in Builder
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </Button>

                            {isOwner && (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditOpen(true)}
                                        className="gap-1.5 border-[var(--aether-line)] bg-[var(--aether-a10)] text-white hover:bg-[var(--aether-a10)]/80 cursor-pointer"
                                    >
                                        <Pencil className="h-4 w-4 text-[var(--aether-hi)]" />
                                        Edit Build
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={togglingVisibility}
                                        onClick={handleToggleVisibility}
                                        className={cn(
                                            "gap-1.5 cursor-pointer",
                                            isPrivate
                                                ? "border-amber-500/45 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
                                                : "border-emerald-500/40 bg-emerald-500/12 text-emerald-200 hover:bg-emerald-500/22"
                                        )}
                                    >
                                        {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                                        {isPrivate ? "Private · Make Public" : "Public · Make Private"}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        disabled={deletingBuild}
                                        onClick={() => setConfirmDeleteBuildOpen(true)}
                                        className="gap-1.5 cursor-pointer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {build.description && (
                        <div className="mt-6 rounded-xl border border-white/10 bg-black/35 p-4 text-sm leading-relaxed text-[var(--ink-2)]">
                            {build.description}
                        </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-[var(--ink-3)]">
                        <span className="inline-flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            {build.views} views
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {comments.length} {comments.length === 1 ? "comment" : "comments"}
                        </span>
                    </div>
                </div>

                {/* Loadout Breakdown */}
                {view && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left 2 cols: Gear */}
                        <div className="space-y-4 lg:col-span-2">
                            {/* Weapon & Bond */}
                            {view.weapon && (
                                <div className="rounded-2xl border border-[var(--line)] bg-[rgba(10,19,32,0.72)] p-5">
                                    <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                                        Weapon & Bond
                                    </h2>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={view.weapon.icon}
                                                alt={view.weapon.name}
                                                className="h-12 w-12 rounded-xl border border-white/10 bg-black/40 p-1.5 object-contain"
                                            />
                                            <div>
                                                <p className="font-semibold text-white">
                                                    {view.weapon.name}
                                                    {view.weapon.surged && (
                                                        <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                                            SURGED
                                                        </span>
                                                    )}
                                                </p>
                                                {view.weapon.bond && (
                                                    <p className="text-xs text-[var(--ink-3)]">
                                                        Bond: <span className="text-[var(--ink-2)]">{view.weapon.bond.name}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {view.weapon.cells.map(
                                                (c, i) =>
                                                    c.cellName && (
                                                        <span
                                                            key={i}
                                                            className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-[var(--ink-2)]"
                                                        >
                                                            {c.variantName || c.cellName}
                                                        </span>
                                                    )
                                            )}
                                        </div>
                                    </div>

                                    {view.weapon.parts.some((p) => p.part) && (
                                        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3 text-xs text-[var(--ink-3)]">
                                            {view.weapon.parts.map(
                                                (p) =>
                                                    p.part && (
                                                        <span key={p.label}>
                                                            {p.label}: <span className="text-white">{p.part.name}</span>
                                                        </span>
                                                    )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Armour Grid */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {armourEntries.map(({ label, piece }) => (
                                    <div
                                        key={label}
                                        className="rounded-2xl border border-[var(--line)] bg-[rgba(10,19,32,0.72)] p-4"
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-4)]">
                                            {label}
                                        </span>
                                        {piece ? (
                                            <div className="mt-2 flex items-center gap-3">
                                                <img
                                                    src={piece.icon}
                                                    alt={piece.name}
                                                    className="h-10 w-10 rounded-lg border border-white/10 bg-black/40 p-1 object-contain"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-white">
                                                        {piece.name}
                                                    </p>
                                                    <p className="truncate text-xs text-[var(--ink-3)]">
                                                        {piece.cells[0]?.variantName || piece.cells[0]?.cellName || "No cell"}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-xs text-[var(--ink-4)]">Empty slot</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Omnicell, Lantern & Tonics */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-[var(--line)] bg-[rgba(10,19,32,0.72)] p-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-4)]">
                                        Omnicell & Lantern
                                    </span>
                                    <div className="mt-2 space-y-2 text-xs">
                                        <div className="flex items-center gap-2.5">
                                            {view.omnicell?.icon && (
                                                <img
                                                    src={view.omnicell.icon}
                                                    alt={view.omnicell.name}
                                                    className="h-8 w-8 rounded-lg border border-white/10 bg-black/40 p-1 object-contain"
                                                />
                                            )}
                                            <span className="font-semibold text-white">
                                                {view.omnicell?.name || "No Omnicell"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            {view.lantern?.item.icon && (
                                                <img
                                                    src={view.lantern.item.icon}
                                                    alt={view.lantern.item.name}
                                                    className="h-8 w-8 rounded-lg border border-white/10 bg-black/40 p-1 object-contain"
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-semibold text-white">
                                                    {view.lantern?.item.name || "No Lantern"}
                                                </p>
                                                {view.lantern?.cell.variantName && (
                                                    <p className="text-[11px] text-[var(--ink-3)]">
                                                        {view.lantern.cell.variantName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[var(--line)] bg-[rgba(10,19,32,0.72)] p-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-4)]">
                                        Consumables
                                    </span>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {view.consumables.map((c, idx) => (
                                            <div
                                                key={`${c.name}-${idx}`}
                                                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1.5 text-xs text-[var(--ink-2)]"
                                            >
                                                {c.icon && (
                                                    <img
                                                        src={c.icon}
                                                        alt={c.name}
                                                        className="h-5 w-5 object-contain"
                                                    />
                                                )}
                                                <span>{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right col: Perk Summary */}
                        <div className="rounded-2xl border border-[var(--line)] bg-[rgba(10,19,32,0.72)] p-5">
                            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                                Active Perks ({view.perkTotals.length})
                            </h2>
                            <div className="space-y-2">
                                {view.perkTotals.map((p) => (
                                    <PerkTierHoverTooltip
                                        key={p.name}
                                        name={p.name}
                                        value={Math.min(6, p.value)}
                                        inline
                                    >
                                        <div className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs transition-colors hover:border-white/25 cursor-help">
                                            <span className="font-medium text-white">{p.name}</span>
                                            <span
                                                className="font-bold"
                                                style={{ color: cellTypeColor(p.type) }}
                                            >
                                                +{Math.min(6, p.value)}
                                            </span>
                                        </div>
                                    </PerkTierHoverTooltip>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Dedicated Discussion & Comment Likes Section */}
                <div id="discussion" className="rounded-2xl border border-[var(--line-2)] bg-[rgba(10,19,32,0.78)] p-6 sm:p-8 scroll-mt-24">
                    <div className="mb-5 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-[var(--aether-hi)]" />
                        <h2 className="font-display text-xl font-bold text-white">
                            Discussion ({comments.length})
                        </h2>
                    </div>

                    {currentUserId ? (
                        <form onSubmit={handlePostComment} className="mb-6 space-y-3">
                            <Textarea
                                rows={3}
                                maxLength={500}
                                placeholder="Share tips, ask questions, or suggest cell swaps for this build..."
                                value={commentInput}
                                onChange={(e) => {
                                    setCommentInput(e.target.value);
                                    if (commentError) setCommentError(null);
                                }}
                                disabled={postingComment}
                                className="border-[var(--line-2)] bg-black/40 text-sm text-white placeholder:text-[var(--ink-4)]"
                            />
                            {commentGif && (
                                <div className="relative inline-block overflow-hidden rounded-xl border border-white/15 bg-black/50 p-1.5">
                                    <img
                                        src={commentGif}
                                        alt="Selected GIF"
                                        className="max-h-36 rounded-lg object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCommentGif(null)}
                                        className="absolute right-2 top-2 rounded-full bg-black/80 p-1 text-white hover:bg-rose-600 cursor-pointer"
                                        title="Remove GIF"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                            {commentError && (
                                <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200">
                                    {commentError}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <GifPicker selectedGif={commentGif} onSelectGif={setCommentGif} />
                                    <span className="text-[11px] text-[var(--ink-4)]">
                                        {commentInput.length}/500 characters
                                    </span>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={postingComment || (!commentInput.trim() && !commentGif)}
                                    className="gap-1.5 cursor-pointer"
                                >
                                    {postingComment ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Post Comment
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-black/35 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-white">Join the discussion</p>
                                <p className="text-xs text-[var(--ink-3)]">
                                    Sign in with Discord or your Mystic Builder account to comment, reply, send GIFs, or like comments.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-1.5 cursor-pointer shrink-0"
                                onClick={() => window.dispatchEvent(new CustomEvent("mystic-open-auth"))}
                            >
                                <LogIn className="h-4 w-4" />
                                Sign In
                            </Button>
                        </div>
                    )}

                    {topLevelComments.length === 0 ? (
                        <p className="py-6 text-center text-sm text-[var(--ink-4)]">
                            No comments yet. Be the first Slayer to start the discussion!
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {topLevelComments.map((root) => {
                                const childReplies = repliesByRoot.get(root.id) || [];
                                const renderItem = (c: CommunityCommentRecord, isReply: boolean) => {
                                    const canDelete =
                                        currentUserId !== null &&
                                        (c.accountId === currentUserId || build.accountId === currentUserId);
                                    const directParent =
                                        isReply && c.parentId && c.parentId !== root.id
                                            ? commentMap.get(c.parentId)
                                            : null;

                                    return (
                                        <div key={c.id} className="space-y-2">
                                            <div
                                                id={`comment-${c.id}`}
                                                className={cn(
                                                    "scroll-mt-24 rounded-xl border p-4 transition-colors target:border-[var(--aether-line)] target:bg-[var(--aether-a10)]/20",
                                                    isReply
                                                        ? "border-white/10 bg-black/25"
                                                        : "border-white/10 bg-black/35"
                                                )}
                                            >
                                                <div className="mb-2 flex items-center justify-between gap-2">
                                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                                        <span className="font-semibold text-white">
                                                            {c.authorDisplayName}
                                                        </span>
                                                        {c.authorDisplayName !== c.authorUsername && (
                                                            <span className="text-[var(--ink-4)]">
                                                                @{c.authorUsername}
                                                            </span>
                                                        )}
                                                        {directParent && (
                                                            <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-[var(--aether-hi)]">
                                                                <Reply className="h-3 w-3" />
                                                                @{directParent.authorDisplayName}
                                                            </span>
                                                        )}
                                                        <span className="text-[var(--ink-4)]">
                                                            • {formatDate(c.createdAt)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCommentLike(c.id)}
                                                            className={cn(
                                                                "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-all cursor-pointer",
                                                                c.likedByMe
                                                                    ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
                                                                    : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                                                            )}
                                                            title="Like comment"
                                                        >
                                                            <Heart
                                                                className={cn(
                                                                    "h-3 w-3",
                                                                    c.likedByMe && "fill-rose-400 text-rose-400"
                                                                )}
                                                            />
                                                            <span>{c.likes}</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!currentUserId) {
                                                                    window.dispatchEvent(new CustomEvent("mystic-open-auth"));
                                                                    return;
                                                                }
                                                                if (replyingTo?.id === c.id) {
                                                                    setReplyingTo(null);
                                                                } else {
                                                                    setReplyingTo(c);
                                                                    setReplyInput("");
                                                                    setReplyGif(null);
                                                                    setReplyError(null);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors cursor-pointer",
                                                                replyingTo?.id === c.id
                                                                    ? "border-[var(--aether-line)] bg-[var(--aether-a10)] text-white"
                                                                    : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                                                            )}
                                                            title="Reply to comment"
                                                        >
                                                            <Reply className="h-3 w-3" />
                                                            <span className="hidden sm:inline">Reply</span>
                                                        </button>

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmDeleteCommentId(c.id)}
                                                                className="rounded-lg p-1 text-[var(--ink-4)] hover:text-rose-400 transition-colors cursor-pointer"
                                                                title="Delete comment"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {c.content && (
                                                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--ink-2)]">
                                                        {c.content}
                                                    </p>
                                                )}

                                                {c.gifUrl && (
                                                    <div className={cn("overflow-hidden rounded-xl border border-white/10 bg-black/40 inline-block p-1", c.content && "mt-2.5")}>
                                                        <img
                                                            src={c.gifUrl}
                                                            alt="GIF attachment"
                                                            className="max-h-44 rounded-lg object-contain"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {replyingTo?.id === c.id && (
                                                <form
                                                    onSubmit={handlePostReply}
                                                    className="ml-4 sm:ml-6 space-y-2.5 rounded-xl border border-[var(--aether-line)]/50 bg-[rgba(10,19,32,0.85)] p-3"
                                                >
                                                    <div className="flex items-center justify-between text-xs text-[var(--ink-3)]">
                                                        <span>
                                                            Replying to{" "}
                                                            <strong className="text-white">{c.authorDisplayName}</strong>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setReplyingTo(null)}
                                                            className="text-[var(--ink-4)] hover:text-white cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <Textarea
                                                        rows={2}
                                                        maxLength={500}
                                                        placeholder={`Reply to ${c.authorDisplayName}...`}
                                                        value={replyInput}
                                                        onChange={(e) => {
                                                            setReplyInput(e.target.value);
                                                            if (replyError) setReplyError(null);
                                                        }}
                                                        disabled={postingReply}
                                                        className="border-white/15 bg-black/45 text-xs text-white placeholder:text-[var(--ink-4)]"
                                                    />
                                                    {replyGif && (
                                                        <div className="relative inline-block overflow-hidden rounded-lg border border-white/15 bg-black/50 p-1">
                                                            <img
                                                                src={replyGif}
                                                                alt="Reply GIF"
                                                                className="max-h-28 rounded object-contain"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setReplyGif(null)}
                                                                className="absolute right-1.5 top-1.5 rounded-full bg-black/80 p-0.5 text-white hover:bg-rose-600 cursor-pointer"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {replyError && (
                                                        <p className="rounded border border-rose-500/35 bg-rose-500/10 px-2.5 py-1 text-[11px] text-rose-200">
                                                            {replyError}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <GifPicker selectedGif={replyGif} onSelectGif={setReplyGif} compact />
                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                            disabled={postingReply || (!replyInput.trim() && !replyGif)}
                                                            className="gap-1.5 cursor-pointer"
                                                        >
                                                            {postingReply ? (
                                                                <>
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    Replying...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="h-3.5 w-3.5" />
                                                                    Post Reply
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    );
                                };

                                return (
                                    <div key={root.id} className="space-y-2.5">
                                        {renderItem(root, false)}
                                        {childReplies.length > 0 && (
                                            <div className="ml-4 sm:ml-7 space-y-2.5 border-l-2 border-white/10 pl-3 sm:pl-4">
                                                {childReplies.map((reply) => renderItem(reply, true))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {isOwner && (
                <>
                    <EditBuildDialog
                        open={editOpen}
                        onOpenChange={setEditOpen}
                        build={build}
                        onSaved={(updated) => {
                            setBuild(updated);
                            toast({
                                title: "Build updated",
                                description: `"${updated.title}" saved (${updated.visibility === "private" ? "Private" : "Public"}).`,
                            });
                            router.refresh();
                        }}
                    />

                    <ConfirmDeleteDialog
                        open={confirmDeleteBuildOpen}
                        onOpenChange={setConfirmDeleteBuildOpen}
                        title="Delete Build?"
                        description={`Are you sure you want to permanently delete "${build.title}"? All comments on this build will also be removed. This action cannot be undone.`}
                        confirmLabel="Delete Build"
                        loading={deletingBuild}
                        onConfirm={async () => {
                            await handleDeleteBuild();
                            setConfirmDeleteBuildOpen(false);
                        }}
                    />
                </>
            )}

            <ConfirmDeleteDialog
                open={Boolean(confirmDeleteCommentId)}
                onOpenChange={(next) => {
                    if (!next) setConfirmDeleteCommentId(null);
                }}
                title="Delete Comment?"
                description="Are you sure you want to permanently delete this comment and any replies to it?"
                confirmLabel="Delete Comment"
                loading={deletingComment}
                onConfirm={async () => {
                    if (!confirmDeleteCommentId) return;
                    setDeletingComment(true);
                    try {
                        await handleDeleteComment(confirmDeleteCommentId);
                        setConfirmDeleteCommentId(null);
                    } finally {
                        setDeletingComment(false);
                    }
                }}
            />
        </section>
    );
}
