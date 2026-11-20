"use client";

import { cn } from "@/lib/utils";

/**
 * The site info that used to live in the removed header/footer:
 * version banner, fan-made disclaimer, data + source credits.
 *
 * - `full` variant: the complete block used on the main menu.
 * - `compact` variant: one small dim line used inside the loadout
 *   stage bottom bar.
 */

export const VERSION_LABEL = `DAUNTLESS 1.14.7 — MYSTIC PARADOX REVIVAL`;

export const VersionLabel = ({ className }: { className?: string }) => (
    <p className={cn("mk-version-label", className)}>{VERSION_LABEL}</p>
);

export const SiteInfoFull = ({ className }: { className?: string }) => (
    <div className={cn("mk-site-info", className)}>
        <p>
            Mystic Builder is a fan-made, unofficial Dauntless build planner for the 1.14.7 Mystic Paradox revival.
            Dauntless and all related assets are property of Phoenix Labs.
        </p>
        <p>
            Game data from{" "}
            <a href="https://github.com/atomicptr/dauntless-builder-reforged" target="_blank" rel="noopener noreferrer">
                dauntless-builder-reforged
            </a>{" "}
            (AGPL-3.0, data public domain) · Source code{" "}
            <a href="https://github.com/EeebsieKat/Mystic-Builder" target="_blank" rel="noopener noreferrer">
                Mystic-Builder
            </a>{" "}
            (AGPL-3.0, data public domain).
        </p>
    </div>
);

export const SiteInfoCompact = ({ className }: { className?: string }) => (
    <p className={cn("mk-site-info-compact", className)}>
        Mystic Builder is a fan-made, unofficial Dauntless build planner for the Mystic Paradox revival. Dauntless and
        all related assets are property of Phoenix Labs. Game data from{" "}
        <a href="https://github.com/atomicptr/dauntless-builder-reforged" target="_blank" rel="noopener noreferrer">
            dauntless-builder-reforged
        </a>{" "}
        · Source code{" "}
        <a href="https://github.com/EeebsieKat/Mystic-Builder" target="_blank" rel="noopener noreferrer">
            Mystic-Builder
        </a>{" "}
        (AGPL-3.0).
    </p>
);
