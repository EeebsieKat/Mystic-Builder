"use client";

import { useEffect, useRef, useState } from "react";
import BottomParticles from "@/components/bottom-particles";

const DESIGN_W = 1920;
const DESIGN_H = 1080;

export const LoadoutStage = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0);
    const [offsetX, setOffsetX] = useState(0);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) {
            return;
        }
        const update = () => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            const next = Math.min(w / DESIGN_W, h / DESIGN_H);
            setScale(next);
            setOffsetX(Math.max(0, (w - DESIGN_W * next) / 2));
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const tooSmall = scale > 0 && scale < 0.47;

    return (
        <div
            ref={wrapperRef}
            className={`lo-stage-wrapper relative w-full overflow-hidden ${className}`}
            style={{ height: "100dvh", minHeight: 520 }}
        >
            {/* 1. Renders right above .lo-stage-wrapper's background */}
            <BottomParticles />

            {scale > 0 && (
                <div
                    className="relative z-10"
                    style={{
                        width: DESIGN_W,
                        height: DESIGN_H,
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                        position: "absolute",
                        left: offsetX,
                        top: 0,
                    }}
                    aria-hidden={tooSmall || undefined}
                >
                    {/* 2. All loadout UI cards sit at z-10, cleanly above the particles */}
                    <div className="lo-stage relative z-10">{children}</div>
                </div>
            )}
            {tooSmall && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#060708]/80 p-6 text-center">
                    <p className="max-w-sm text-sm text-[#9a9a94]">
                        The Awakening loadout screen is designed for desktop widths.
                        Open this page on a larger display for the full experience.
                    </p>
                </div>
            )}
        </div>
    );
};
