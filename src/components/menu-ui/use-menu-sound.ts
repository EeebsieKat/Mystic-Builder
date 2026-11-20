"use client";

import { useCallback, useRef } from "react";
import { MENU_ASSETS } from "@/lib/menu-assets";

/**
 * Tiny sound helper for menu interactions.
 *
 * Sounds are cloned on every trigger so rapid hovering overlaps cleanly,
 * and every call is a silent no-op when the path is unconfigured. Audio
 * elements are created lazily on first user gesture (browser autoplay
 * policies only allow playback after interaction anyway).
 */

export const useMenuSound = () => {
    const cacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());

    const play = useCallback(
        (src: string | null, volume = 0.55) => {
            if (!src || typeof window === "undefined") {
                return;
            }
            try {
                let audio = cacheRef.current.get(src);
                if (!audio) {
                    audio = new Audio(src);
                    audio.volume = volume;
                    cacheRef.current.set(src, audio);
                }
                // Clone so overlapping triggers (fast hover sweeps) work.
                const instance = audio.cloneNode() as HTMLAudioElement;
                instance.volume = audio.volume;
                void instance.play().catch(() => {
                    /* autoplay rejected - ignore */
                });
            } catch {
                /* media unavailable - stay silent */
            }
        },
        [],
    );

    const playHover = useCallback(() => play(MENU_ASSETS.sounds.hover, 0.35), [play]);
    const playClick = useCallback(() => play(MENU_ASSETS.sounds.click, 0.55), [play]);

    return { playHover, playClick };
};
