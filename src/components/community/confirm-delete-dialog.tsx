"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
}

export default function ConfirmDeleteDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Delete",
    loading = false,
    onConfirm,
}: ConfirmDeleteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
            <AlertDialogContent className="border-[var(--line-2)] bg-[rgba(8,14,26,0.97)] text-foreground backdrop-blur-xl sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 font-display text-lg font-bold text-white">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/15 text-rose-400">
                            <AlertTriangle className="h-4 w-4" />
                        </span>
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed text-[var(--ink-3)]">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-2">
                    <AlertDialogCancel disabled={loading} className="cursor-pointer">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading}
                        onClick={(e) => {
                            e.preventDefault();
                            void onConfirm();
                        }}
                        className="gap-1.5 bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                {confirmLabel}
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
