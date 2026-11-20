"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { MENU_ASSETS } from "@/lib/menu-assets";
import { cn } from "@/lib/utils";

/**
 * Full-viewport shell backdrop.
 *
 * Renders the configured background art (cover + readability dim) when
 * available, otherwise the built-in CSS night sky: layered aether
 * gradients and a faint drifting starfield, plus the shared sparkle
 * particles used by the loadout stage.
 */

export const MenuBackdrop = ({ children, className }: { children?: ReactNode; className?: string }) => {
    const art = MENU_ASSETS.background;

    return (
        <div className={cn("relative h-dvh w-full overflow-hidden bg-[#070a12]", className)}>
            {art ? (
                <>
                    <Image
                        src={art}
                        alt=""
                        fill
                        priority
                        sizes="100vw"
                        className="pointer-events-none absolute inset-0 object-cover"
                    />
                    {/* Readability dim - keeps menu text legible over any art. */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(120% 90% at 50% 40%, rgba(4,6,10,0.25) 0%, rgba(4,6,10,0.72) 100%)",
                        }}
                    />
                </>
            ) : (
                <>
                    {/* Built-in fallback: deep night gradient + corner washes. */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(90% 70% at 50% 30%, #131a2a 0%, #0a0e18 55%, #05070c 100%)",
                        }}
                    />
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(45% 35% at 8% 12%, rgba(120,140,200,0.10) 0%, transparent 70%)," +
                                "radial-gradient(45% 35% at 92% 20%, rgba(170,120,220,0.08) 0%, transparent 70%)," +
                                "radial-gradient(70% 30% at 50% 108%, rgba(224,163,62,0.10) 0%, transparent 70%)",
                        }}
                    />
                    {/* Faint static starfield - cheap CSS, no canvas needed. */}
                    <div className="mk-stars pointer-events-none absolute inset-0" aria-hidden />
                </>
            )}
            <div className="relative z-10 flex h-full w-full flex-col">{children}</div>
        </div>
    );
};
