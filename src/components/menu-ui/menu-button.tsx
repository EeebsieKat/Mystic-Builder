"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MENU_ASSETS } from "@/lib/menu-assets";
import { useMenuSound } from "./use-menu-sound";

/**
 * Game-style menu button used across the shell screens (main menu,
 * database header, anywhere the shell needs navigation).
 *
 * When button textures are configured in menu-assets.ts the border is
 * drawn nine-sliced from the texture and swapped per interaction state
 * (CSS variables + one global rule in globals.css). Without textures it
 * falls back to the built-in Dauntless-ish CSS look: dark plaque, gold
 * hover text and a left tick bar.
 */

export interface MenuButtonProps {
    label: string;
    /** Optional dim note on the right edge (e.g. "COMING SOON"). */
    note?: string;
    /** Optional keybind chip on the right edge, e.g. "B". */
    hint?: string;
    /** Optional leading icon or glyph slot. */
    icon?: ReactNode;
    /** Internal route (rendered as next/link). */
    href?: string;
    /** External URL (plain anchor, new tab). */
    externalHref?: string;
    onClick?: () => void;
    disabled?: boolean;
    /** Emphasised entry (main call to action). */
    primary?: boolean;
    /** Stretch to the full width of the menu column (default) or hug content. */
    block?: boolean;
    className?: string;
    children?: ReactNode;
}

export const MenuButton = ({
    label,
    note,
    hint,
    icon,
    href,
    externalHref,
    onClick,
    disabled = false,
    primary = false,
    block = true,
    className,
    children,
}: MenuButtonProps) => {
    const { playHover, playClick } = useMenuSound();
    const textures = MENU_ASSETS.buttonTextures;
    const textured = textures.normal !== null && textures.hover !== null && textures.active !== null;

    const handleMouseEnter = () => {
        if (!disabled) {
            playHover();
        }
    };

    const handleClick = () => {
        if (disabled) {
            return;
        }
        playClick();
        onClick?.();
    };

    const inner = (
        <>
            {icon ? <span className="mk-button-icon">{icon}</span> : null}
            <span className="mk-button-label">{label}</span>
            {children}
            <span className="mk-button-tail">
                {note ? <span className="mk-button-note">{note}</span> : null}
                {hint ? <kbd className="mk-button-hint">{hint}</kbd> : null}
            </span>
        </>
    );

    const classes = cn(
        "mk-button",
        textured && !disabled && "mk-button-textured",
        primary && "mk-button-primary",
        !textured && !disabled && "mk-button-live",
        disabled && "mk-button-disabled",
        block ? "w-full" : "w-fit",
        className,
    );

    /* Texture state variables consumed by the .mk-button-textured rules. */
    const textureStyle: CSSProperties | undefined = textured
        ? ({
              "--mk-btn-normal": `url(${textures.normal})`,
              "--mk-btn-hover": `url(${textures.hover})`,
              "--mk-btn-active": `url(${textures.active})`,
              "--mk-btn-slice": textures.slice,
              "--mk-btn-width": `${textures.width}px`,
          } as CSSProperties)
        : undefined;

    const shared = {
        className: classes,
        style: textureStyle,
        onMouseEnter: handleMouseEnter,
        "aria-disabled": disabled || undefined,
    };

    if (externalHref !== undefined) {
        return (
            <a
                {...shared}
                href={externalHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
            >
                {inner}
            </a>
        );
    }

    if (href !== undefined) {
        return (
            <Link {...shared} href={href} onClick={handleClick}>
                {inner}
            </Link>
        );
    }

    return (
        <button {...shared} type="button" onClick={handleClick} disabled={disabled}>
            {inner}
        </button>
    );
};
