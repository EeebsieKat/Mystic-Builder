"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Globe, Loader2, Lock, LogIn, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNITY_CATEGORIES, type BuildVisibility, type CommunityBuildRecord } from "@/lib/community-types";
import { extractBuildId } from "@/lib/site";
import { validateCleanText } from "@/lib/profanity";
import { buildBuildView, tryDeserialize } from "@/game/build-view";
import type { AuthUser } from "@/components/auth/auth-card";
import { cn } from "@/lib/utils";

interface PublishBuildDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialBuildInput?: string;
    initialTitle?: string;
    onPublished?: (build: CommunityBuildRecord) => void;
}

export default function PublishBuildDialog({
    open,
    onOpenChange,
    initialBuildInput = "",
    initialTitle = "",
    onPublished,
}: PublishBuildDialogProps) {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    const isLockedBuild = Boolean(initialBuildInput.trim());

    const [buildInput, setBuildInput] = useState(initialBuildInput);
    const [title, setTitle] = useState(initialTitle);
    const [category, setCategory] = useState<string>("General");
    const [visibility, setVisibility] = useState<BuildVisibility>("public");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [existingBuildId, setExistingBuildId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        if (initialBuildInput) setBuildInput(initialBuildInput);
        if (initialTitle && initialTitle !== "SLAYER") setTitle(initialTitle);
        setError(null);
        setExistingBuildId(null);

        fetch("/api/auth/me")
            .then((r) => (r.ok ? r.json() : { user: null }))
            .then((data: { user?: AuthUser | null }) => {
                setAuthUser(data.user ?? null);
                setAuthChecked(true);
            })
            .catch(() => setAuthChecked(true));
    }, [open, initialBuildInput, initialTitle]);

    useEffect(() => {
        const onAuthChanged = (event: Event) => {
            const customEvent = event as CustomEvent<AuthUser | null>;
            setAuthUser(customEvent.detail ?? null);
        };
        window.addEventListener("mystic-auth-changed", onAuthChanged);
        return () => window.removeEventListener("mystic-auth-changed", onAuthChanged);
    }, []);

    const effectiveBuildInput = isLockedBuild ? initialBuildInput : buildInput;

    const decodedPreview = useMemo(() => {
        const id = extractBuildId(effectiveBuildInput);
        if (!id) return null;
        const model = tryDeserialize(id);
        if (!model) return null;
        const view = buildBuildView(model, id);
        if (view.invalid || !view.weapon) return null;
        return view;
    }, [effectiveBuildInput]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setExistingBuildId(null);

        if (!decodedPreview) {
            setError("Please enter a valid Mystic Builder link or build ID with a weapon equipped.");
            return;
        }

        const cleanTitle = validateCleanText(title, "Build title");
        if (!cleanTitle.valid) {
            setError(cleanTitle.error || "Invalid title.");
            return;
        }
        if (description.trim()) {
            const cleanDesc = validateCleanText(description, "Strategy notes");
            if (!cleanDesc.valid) {
                setError(cleanDesc.error || "Invalid description.");
                return;
            }
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/community/builds", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    buildInput: effectiveBuildInput,
                    title,
                    category,
                    visibility,
                    description,
                }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                build?: CommunityBuildRecord;
                error?: string;
                existingId?: string;
                requiresAuth?: boolean;
            };

            if (res.status === 401 || data.requiresAuth) {
                setAuthUser(null);
                window.dispatchEvent(new CustomEvent("mystic-open-auth"));
                return;
            }

            if (!res.ok || !data.build) {
                setError(data.error || "Could not publish build.");
                if (data.existingId) setExistingBuildId(data.existingId);
                return;
            }

            onPublished?.(data.build);
            setDescription("");
            if (!initialBuildInput) setBuildInput("");
            if (!initialTitle) setTitle("");
            onOpenChange(false);
        } catch {
            setError("Network error while publishing build.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-[var(--line-2)] bg-[rgba(8,14,26,0.96)] text-foreground backdrop-blur-xl sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl font-bold text-white flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-[var(--gold)]" />
                        Publish Build to Community
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[var(--ink-3)]">
                        Share your loadout with other Slayers. Builds are attributed to your account.
                    </DialogDescription>
                </DialogHeader>

                {authChecked && !authUser ? (
                    <div className="my-2 flex flex-col items-center rounded-xl border border-[var(--line)] bg-black/30 p-6 text-center">
                        <h3 className="text-base font-semibold text-white">Sign In Required</h3>
                        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--ink-3)]">
                            Sign in with Discord or your Mystic Builder account to publish builds and manage your shared loadouts.
                        </p>
                        <Button
                            type="button"
                            size="lg"
                            className="mt-5 gap-2 cursor-pointer"
                            onClick={() => window.dispatchEvent(new CustomEvent("mystic-open-auth"))}
                        >
                            <LogIn className="h-4 w-4" />
                            Sign In / Continue with Discord
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="publish-build-title" className="text-xs font-semibold text-[var(--ink-2)]">
                                Build Title
                            </Label>
                            <Input
                                id="publish-build-title"
                                type="text"
                                required
                                minLength={2}
                                maxLength={60}
                                placeholder="e.g. Tempest Shock Repeaters"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={submitting}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="publish-build-input" className="text-xs font-semibold text-[var(--ink-2)]">
                                    {isLockedBuild ? "Build ID" : "Build Link or Build ID"}
                                </Label>
                                {isLockedBuild && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-4)]">
                                        <Lock className="h-3 w-3" />
                                        Locked to current loadout
                                    </span>
                                )}
                            </div>
                            <Input
                                id="publish-build-input"
                                type="text"
                                required
                                placeholder="https://builder.mysticparadox.com/b/... or raw build ID"
                                value={effectiveBuildInput}
                                readOnly={isLockedBuild}
                                disabled={isLockedBuild || submitting}
                                onChange={(e) => {
                                    if (!isLockedBuild) setBuildInput(e.target.value);
                                }}
                                className={cn(isLockedBuild && "cursor-not-allowed opacity-75 select-all font-mono text-xs")}
                            />
                            {decodedPreview && (
                                <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                    <span className="truncate">
                                        {decodedPreview.weapon?.name} ({decodedPreview.weapon?.type})
                                        {decodedPreview.omnicell ? ` • ${decodedPreview.omnicell.name}` : ""}
                                        {decodedPreview.perkTotals[0] ? ` • +${decodedPreview.perkTotals[0].value} ${decodedPreview.perkTotals[0].name}` : ""}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[var(--ink-2)]">Category</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {COMMUNITY_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={cn(
                                            "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                                            category === cat
                                                ? "border-[var(--aether-line)] bg-[var(--aether-a10)] text-white"
                                                : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[var(--ink-2)]">Visibility</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setVisibility("public")}
                                    className={cn(
                                        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                                        visibility === "public"
                                            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                                            : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                                    )}
                                >
                                    <Globe className="h-3.5 w-3.5" />
                                    Public Build
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVisibility("private")}
                                    className={cn(
                                        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                                        visibility === "private"
                                            ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                                            : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-3)] hover:text-white"
                                    )}
                                >
                                    <Lock className="h-3.5 w-3.5" />
                                    Private Build
                                </button>
                            </div>
                            <p className="text-[11px] text-[var(--ink-4)]">
                                {visibility === "public"
                                    ? "Public builds appear in Community Builds. You can edit or switch visibility after publishing."
                                    : "Private builds stay hidden from other Slayers and can be edited or made public anytime."}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="publish-build-desc" className="text-xs font-semibold text-[var(--ink-2)]">
                                Strategy / Notes <span className="font-normal text-[var(--ink-4)]">(optional)</span>
                            </Label>
                            <Textarea
                                id="publish-build-desc"
                                rows={3}
                                maxLength={300}
                                placeholder="Combo rotation, tonics to swap, or why this loadout works..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={submitting}
                                className="border-[var(--line-2)] bg-[rgba(4,9,16,0.55)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-4)]"
                            />
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="flex flex-col gap-1 rounded-xl border border-[var(--bad-line)] bg-[var(--bad-a)] px-3 py-2 text-xs text-[#ffd3da]"
                            >
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                                {existingBuildId && (
                                    <a
                                        href={`/builds/${encodeURIComponent(existingBuildId)}`}
                                        className="ml-6 font-semibold text-white underline underline-offset-2 hover:text-amber-200"
                                    >
                                        View existing build →
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="gap-2">
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="h-4 w-4" />
                                        Publish Build
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
