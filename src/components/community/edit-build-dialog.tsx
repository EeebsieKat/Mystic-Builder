"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Globe, Loader2, Lock, Pencil } from "lucide-react";
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
import {
    COMMUNITY_CATEGORIES,
    type BuildVisibility,
    type CommunityBuildRecord,
} from "@/lib/community-types";
import { extractBuildId } from "@/lib/site";
import { validateCleanText } from "@/lib/profanity";
import { buildBuildView, tryDeserialize } from "@/game/build-view";
import { cn } from "@/lib/utils";

interface EditBuildDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    build: CommunityBuildRecord | null;
    overrideBuildId?: string | null;
    onSaved?: (updated: CommunityBuildRecord) => void;
}

export default function EditBuildDialog({
    open,
    onOpenChange,
    build,
    overrideBuildId = null,
    onSaved,
}: EditBuildDialogProps) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<string>("General");
    const [visibility, setVisibility] = useState<BuildVisibility>("public");
    const [description, setDescription] = useState("");
    const [buildInput, setBuildInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !build) return;
        setTitle(build.title);
        setCategory(build.category || "General");
        setVisibility(build.visibility === "private" ? "private" : "public");
        setDescription(build.description || "");
        setBuildInput(overrideBuildId && overrideBuildId.trim() ? overrideBuildId.trim() : build.buildId);
        setError(null);
    }, [open, build, overrideBuildId]);

    const decodedPreview = useMemo(() => {
        const id = extractBuildId(buildInput);
        if (!id) return null;
        const model = tryDeserialize(id);
        if (!model) return null;
        const view = buildBuildView(model, id);
        if (view.invalid || !view.weapon) return null;
        return view;
    }, [buildInput]);

    if (!build) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanTitle = validateCleanText(title, "Build title");
        if (!cleanTitle.valid) {
            setError(cleanTitle.error || "Invalid title.");
            return;
        }
        if (title.trim().length < 2 || title.trim().length > 60) {
            setError("Build title must be between 2 and 60 characters.");
            return;
        }
        if (description.trim()) {
            const cleanDesc = validateCleanText(description, "Strategy notes");
            if (!cleanDesc.valid) {
                setError(cleanDesc.error || "Invalid description.");
                return;
            }
        }
        if (!decodedPreview) {
            setError("Please enter a valid Mystic Builder link or build ID with a weapon equipped.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/community/builds/${encodeURIComponent(build.id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    category,
                    visibility,
                    description: description.trim() || null,
                    buildInput: buildInput.trim(),
                }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                build?: CommunityBuildRecord;
                error?: string;
                requiresAuth?: boolean;
            };

            if (res.status === 401 || data.requiresAuth) {
                window.dispatchEvent(new CustomEvent("mystic-open-auth"));
                return;
            }

            if (!res.ok || !data.build) {
                setError(data.error || "Unable to save build changes.");
                return;
            }

            onSaved?.(data.build);
            onOpenChange(false);
        } catch {
            setError("Network error while saving build.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-[var(--line-2)] bg-[rgba(8,14,26,0.96)] text-foreground backdrop-blur-xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl font-bold text-white flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-[var(--gold)]" />
                        Edit Build
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[var(--ink-3)]">
                        Update your build details, loadout link, or switch between Public and Private visibility.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                                ? "Listed in Community Builds and visible to anyone with the link."
                                : "Hidden from Community Builds and only accessible by your account."}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-build-title" className="text-xs font-semibold text-[var(--ink-2)]">
                            Build Title
                        </Label>
                        <Input
                            id="edit-build-title"
                            type="text"
                            required
                            minLength={2}
                            maxLength={60}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-build-input" className="text-xs font-semibold text-[var(--ink-2)]">
                            Build Link or Build ID
                        </Label>
                        <Input
                            id="edit-build-input"
                            type="text"
                            required
                            value={buildInput}
                            onChange={(e) => setBuildInput(e.target.value)}
                            disabled={submitting}
                            className="font-mono text-xs"
                        />
                        {decodedPreview && (
                            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                <span className="truncate">
                                    {decodedPreview.weapon?.name} ({decodedPreview.weapon?.type})
                                    {decodedPreview.omnicell ? ` • ${decodedPreview.omnicell.name}` : ""}
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
                        <Label htmlFor="edit-build-desc" className="text-xs font-semibold text-[var(--ink-2)]">
                            Strategy / Notes <span className="font-normal text-[var(--ink-4)]">(optional)</span>
                        </Label>
                        <Textarea
                            id="edit-build-desc"
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
                            className="flex items-center gap-2 rounded-xl border border-[var(--bad-line)] bg-[var(--bad-a)] px-3 py-2 text-xs text-[#ffd3da]"
                        >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
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
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
