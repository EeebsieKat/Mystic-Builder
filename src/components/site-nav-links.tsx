"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Database, Hammer, Heart, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header nav links rendered as a centered "conveyor" of five pills.
 *
 * The active page's pill is always the middle pill of the group, and the
 * group itself stays horizontally centered in the header. When the page
 * changes, the strip slides so the newly active pill glides into the middle
 * slot — circular order is preserved, so the pills appear to scroll around
 * a wheel (going "forward" scrolls them left, "backward" scrolls right).
 *
 * Implementation notes:
 * - The strip renders 5 copies of the 5 items and is translated so the
 *   active item's center matches the window's center. Nearest-copy
 *   selection gives the shortest slide and a seamless wrap-around.
 * - Slot widths are measured from the DOM (font + breakpoint aware) so the
 *   window is always exactly wide enough for the five visible pills.
 */

const SLOT_COUNT = 5;
const COPIES = 5;
const STRIP_LEN = COPIES * SLOT_COUNT;
const MIDDLE_COPY_OFFSET = 2 * SLOT_COUNT;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = 560;

const NavLinks = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const databaseActive = pathname === "/" && searchParams.get("tab") === "database";
    const suggestionsActive = pathname === "/" && searchParams.get("tab") === "suggestions";
    const likedActive = pathname === "/" && searchParams.get("tab") === "liked";
    const builderActive =
        (pathname === "/" || pathname.startsWith("/b/")) && !databaseActive && !suggestionsActive && !likedActive;
    const aboutActive = pathname === "/about";

    const navItems = [
        { href: "/", label: "Builder", icon: Hammer, active: builderActive },
        { href: "/?tab=database", label: "Database", icon: Database, active: databaseActive },
        { href: "/?tab=suggestions", label: "Suggestions", icon: Lightbulb, active: suggestionsActive },
        { href: "/?tab=liked", label: "Liked", icon: Heart, active: likedActive },
        { href: "/about", label: "About", icon: Info, active: aboutActive },
    ];

    // Fall back to the Builder slot on routes with no dedicated nav state.
    const activeIdx = Math.max(
        0,
        navItems.findIndex((item) => item.active),
    );

    const [slotWidths, setSlotWidths] = useState<number[] | null>(null);
    const [virtual, setVirtual] = useState<number | null>(null);
    const [armed, setArmed] = useState(false);
    const slotRefs = useRef<Array<HTMLDivElement | null>>([]);

    const measure = useCallback(() => {
        const widths: number[] = [];
        for (let i = 0; i < SLOT_COUNT; i++) {
            const el = slotRefs.current[MIDDLE_COPY_OFFSET + i];
            if (!el) return;
            widths.push(el.offsetWidth);
        }
        setSlotWidths((prev) => {
            if (prev && prev.length === widths.length && prev.every((w, i) => w === widths[i])) return prev;
            return widths;
        });
    }, []);

    // Measure once on mount, then keep the widths in sync with the real
    // rendered boxes via ResizeObserver: it fires after every layout change
    // (webfont swap, label/icon breakpoint flip, zoom) with the settled
    // sizes, so a measurement can never race a style recalc. Animations
    // stay disabled until the first stable measurement so the initial
    // position is applied instantly (no slide-in on page load).
    useEffect(() => {
        const ro = new ResizeObserver(() => measure());
        for (let i = 0; i < SLOT_COUNT; i++) {
            const el = slotRefs.current[MIDDLE_COPY_OFFSET + i];
            if (el) ro.observe(el);
        }
        let alive = true;
        const arm = () => requestAnimationFrame(() => alive && setArmed(true));
        const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
        if (fonts?.ready) {
            fonts.ready
                .then(() => {
                    if (!alive) return;
                    measure();
                    arm();
                })
                .catch(arm);
        } else {
            arm();
        }
        measure();
        return () => {
            alive = false;
            ro.disconnect();
        };
    }, [measure]);

    // Center the active item: pick the copy of `activeIdx` nearest to the
    // currently centered slot so each navigation slides the shortest way.
    useEffect(() => {
        if (!slotWidths) return;
        setVirtual((prev) => {
            const base = prev ?? activeIdx + MIDDLE_COPY_OFFSET;
            let best = base;
            let bestDist = Infinity;
            for (let copy = 0; copy < COPIES; copy++) {
                const cand = activeIdx + copy * SLOT_COUNT;
                const dist = Math.abs(cand - base);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = cand;
                }
            }
            // Keep the visible window (slot +/- 2) inside the strip.
            return Math.min(Math.max(best, 2), STRIP_LEN - 3);
        });
    }, [activeIdx, slotWidths]);

    const geometry = useMemo(() => {
        if (!slotWidths || virtual === null) return null;
        const wAt = (k: number) => slotWidths[((k % SLOT_COUNT) + SLOT_COUNT) % SLOT_COUNT];
        const prefix = [0];
        for (let i = 0; i < SLOT_COUNT; i++) prefix.push(prefix[i] + slotWidths[i]);
        const cycle = prefix[SLOT_COUNT];
        // Left edge (in strip coordinates) of a slot. Slot widths include
        // their inter-pill padding, so consecutive slots are contiguous.
        const leftOf = (k: number) => Math.floor(k / SLOT_COUNT) * cycle + prefix[k % SLOT_COUNT];
        let winW = 0;
        for (let d = -2; d <= 2; d++) winW += wAt(virtual + d);
        // Align the window with the slot boundaries (not the active pill's
        // center): pill widths differ, so centering the active pill exactly
        // would let slivers of neighbour pills peek in at the window edges.
        // This way exactly the five pills around the active one are visible,
        // the group sits centered in the header, and the active pill is the
        // middle pill of the group.
        return { winW, tx: -leftOf(virtual - 2) };
    }, [slotWidths, virtual]);

    return (
        <div
            className="nav-conveyor relative overflow-hidden"
            style={{
                width: geometry ? geometry.winW : undefined,
                opacity: geometry ? 1 : 0,
                transition: armed
                    ? `width ${DURATION}ms ${EASE}, opacity 300ms ease`
                    : "opacity 300ms ease",
            }}
        >
            <div
                className="flex items-center"
                style={{
                    transform: geometry ? `translateX(${geometry.tx}px)` : undefined,
                    transition: armed ? `transform ${DURATION}ms ${EASE}` : "none",
                    willChange: "transform",
                }}
            >
                {Array.from({ length: STRIP_LEN }, (_, k) => {
                    const item = navItems[k % SLOT_COUNT];
                    const Icon = item.icon;
                    const inWindow = virtual !== null && k >= virtual - 2 && k <= virtual + 2;
                    return (
                        <div
                            key={k}
                            ref={(el) => {
                                slotRefs.current[k] = el;
                            }}
                            className="flex-none px-[4px]"
                            aria-hidden={!inWindow}
                        >
                            <Link
                                href={item.href}
                                tabIndex={inWindow ? 0 : -1}
                                aria-label={item.label}
                                title={item.label}
                                aria-current={item.active ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-[12px] border px-2 py-1.5 text-[13.5px] font-[560] transition-all duration-200 xl:px-3.5",
                                    item.active
                                        ? "border-[var(--aether-line)] bg-[var(--aether-a10)] text-white shadow-xs [&>svg]:text-[var(--aether-hi)]"
                                        : "border-transparent text-[var(--ink-2)] hover:border-[var(--line)] hover:bg-white/[0.045] hover:text-white [&>svg]:text-[var(--ink-3)]",
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 transition-colors" />
                                <span className="hidden xl:inline">{item.label}</span>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NavLinks;
