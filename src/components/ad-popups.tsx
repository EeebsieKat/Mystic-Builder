"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import {
    AD_CONFIG,
    getActiveAds,
    isExternalHref,
    pickNextAd,
    type AdItem,
} from "@/ads";
import { cn } from "@/lib/utils";

/**
 * Bottom-corner promo popups (the "ad system" UI half — ads themselves are
 * managed in `src/ads/ads.json`, behaviour knobs in `src/ads/index.ts`).
 *
 * Behaviour: after `firstDelayMs` a small card slides in just above the
 * bottom-right corner, lingers for `visibleMs` (hover pauses it), then
 * slides away. After `gapMs` of quiet the next ad rotates in. Closing the
 * card suppresses every promo for `suppressHoursAfterClose` (remembered in
 * localStorage), so it never nags someone who dismissed it.
 */

type Phase = "waiting" | "visible" | "leaving";

const SLIDE_OUT_MS = 320;

const AdPopups = () => {
    const pathname = usePathname();
    const [ad, setAd] = useState<AdItem | null>(null);
    const [phase, setPhase] = useState<Phase>("waiting");
    const [paused, setPaused] = useState(false);

    const nextDelayRef = useRef(AD_CONFIG.firstDelayMs);
    const remainingRef = useRef(AD_CONFIG.visibleMs);
    const startedAtRef = useRef(0);
    const lastIdRef = useRef<string | null>(null);
    const showNextRef = useRef<() => void>(() => {});
    const retryTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    useEffect(
        () => () => {
            retryTimers.current.forEach(clearTimeout);
            retryTimers.current.clear();
        },
        [],
    );

    const isSuppressed = useCallback((): boolean => {
        try {
            // Clear legacy 12-hour dismissal lock if present
            window.localStorage.removeItem("mystic-builder-ads-suppressed-until");
            const raw = window.localStorage.getItem(AD_CONFIG.storageKey);
            if (!raw) return false;
            return Date.now() < Number(raw);
        } catch {
            return false;
        }
    }, []);

    const suppress = useCallback(() => {
        try {
            const until =
                Date.now() + AD_CONFIG.suppressHoursAfterClose * 3600_000;
            window.localStorage.setItem(AD_CONFIG.storageKey, String(until));
        } catch {
            /* private mode etc. — suppression just won't persist */
        }
    }, []);

    const pathDisabled = useCallback(
        (path: string): boolean =>
            AD_CONFIG.disabledOnPaths.some(
                (p) => path === p || path.startsWith(p.replace(/\/+$/, "") + "/"),
            ),
        [],
    );

    const showNext = useCallback(() => {
        // Deferred retries self-reschedule instead of bouncing through the
        // phase effect — staying in "waiting" wouldn't re-arm its timer.
        const retry = (ms: number) => {
            const t = setTimeout(() => {
                retryTimers.current.delete(t);
                showNextRef.current();
            }, ms);
            retryTimers.current.add(t);
        };
        // Defer while the tab is in the background — never ambush someone
        // returning to the page, and background timers are throttled anyway.
        if (typeof document !== "undefined" && document.hidden) {
            retry(10_000);
            return;
        }
        const path = pathname ?? "/";
        if (pathDisabled(path) || isSuppressed()) {
            // Quiet re-check loop: wait out the suppression, keep cycling.
            retry(Math.min(AD_CONFIG.gapMs, 15_000));
            return;
        }
        const next = pickNextAd(getActiveAds(), lastIdRef.current);
        if (!next) {
            retry(AD_CONFIG.gapMs);
            return;
        }
        lastIdRef.current = next.id;
        remainingRef.current = AD_CONFIG.visibleMs;
        setPaused(false);
        setAd(next);
        setPhase("visible");
    }, [isSuppressed, pathDisabled, pathname]);
    showNextRef.current = showNext;

    // One timer per phase — hover-pause simply cancels it and resuming
    // restarts it with the remaining time.
    useEffect(() => {
        if (phase === "waiting") {
            const t = setTimeout(() => showNextRef.current(), nextDelayRef.current);
            return () => clearTimeout(t);
        }
        if (phase === "visible") {
            if (paused) return;
            startedAtRef.current = Date.now();
            const t = setTimeout(() => setPhase("leaving"), remainingRef.current);
            return () => clearTimeout(t);
        }
        // phase === "leaving"
        const t = setTimeout(() => {
            setAd(null);
            nextDelayRef.current = AD_CONFIG.gapMs;
            setPhase("waiting");
        }, SLIDE_OUT_MS);
        return () => clearTimeout(t);
    }, [phase, paused, ad?.id]);

    const dismiss = useCallback(() => {
        suppress();
        setPhase("leaving");
    }, [suppress]);

    const release = useCallback(() => {
        // CTA clicked — hide without punishing an engaged user.
        setPhase("leaving");
    }, []);

    const pause = useCallback(() => {
        if (phase !== "visible" || paused) return;
        remainingRef.current = Math.max(
            500,
            remainingRef.current - (Date.now() - startedAtRef.current),
        );
        setPaused(true);
    }, [paused, phase]);

    const resume = useCallback(() => setPaused(false), []);

    if (!ad) return null;

    const external = ad.href ? isExternalHref(ad.href) : false;

    const cta = ad.href ? (
        external ? (
            <a
                href={ad.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={release}
                className={cn(
                    "inline-flex items-center gap-1 rounded-[10px] border px-3 py-1.5 text-[12.5px] font-[560] transition-all duration-200",
                    ad.accent === "gold"
                        ? "border-[var(--gold-lo)]/60 bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20 hover:text-[var(--gold-bright)]"
                        : "border-[var(--aether-line)] bg-[var(--aether-a10)] text-[var(--aether-hi)] hover:bg-[var(--aether-a20)] hover:text-white",
                )}
            >
                {ad.ctaLabel ?? "Learn more"}
                <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
        ) : (
            <Link
                href={ad.href}
                onClick={release}
                className={cn(
                    "inline-flex items-center gap-1 rounded-[10px] border px-3 py-1.5 text-[12.5px] font-[560] transition-all duration-200",
                    ad.accent === "gold"
                        ? "border-[var(--gold-lo)]/60 bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20 hover:text-[var(--gold-bright)]"
                        : "border-[var(--aether-line)] bg-[var(--aether-a10)] text-[var(--aether-hi)] hover:bg-[var(--aether-a20)] hover:text-white",
                )}
            >
                {ad.ctaLabel ?? "Learn more"}
                <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
        )
    ) : null;

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 w-[min(340px,calc(100vw-2rem))]">
            <aside
                role="complementary"
                aria-label="Site promotion"
                onMouseEnter={pause}
                onMouseLeave={resume}
                className={cn(
                    "ad-card pointer-events-auto relative overflow-hidden rounded-[14px] border border-[var(--line-2)] bg-[var(--bg-raise)]/95 shadow-lg shadow-black/40 backdrop-blur-md",
                    phase === "leaving" ? "ad-exit" : "ad-enter",
                )}
            >
                <div className="gold-rule absolute inset-x-0 top-0 h-px" aria-hidden />
                {ad.image ? (
                    <img
                        src={ad.image}
                        alt=""
                        className="h-24 w-full border-b border-[var(--line)] object-cover"
                    />
                ) : null}
                <div className="flex items-start gap-2.5 px-4 pb-3.5 pt-3.5">
                    <img
                        src={ad.icon ?? ""}
                        alt=""
                        className="h-8 w-8 flex-none rounded-lg border border-[var(--line-2)] bg-black/30 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="font-display text-[14px] font-bold leading-tight text-white">
                            {ad.title}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-snug text-[var(--ink-2)]">
                            {ad.message}
                        </p>
                        {cta ? <div className="mt-2.5">{cta}</div> : null}
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Hide promotions"
                        title="Hide promotions for a while"
                        className="-mr-1 -mt-0.5 flex-none rounded-lg p-1.5 text-[var(--ink-3)] transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {phase === "visible" ? (
                    <div
                        aria-hidden
                        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-[var(--aether)] to-[var(--aether-hi)]"
                        style={{
                            animation: `ad-progress ${AD_CONFIG.visibleMs}ms linear forwards`,
                            animationPlayState: paused ? "paused" : "running",
                        }}
                    />
                ) : null}
            </aside>
        </div>
    );
};

export default AdPopups;
