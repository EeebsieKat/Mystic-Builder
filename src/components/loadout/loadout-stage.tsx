"use client";

import { useEffect, useRef, useState } from "react";

const MIN_DESIGN_W = 1920;
const DESIGN_H = 1080;

export const LoadoutStage = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [stageWidth, setStageWidth] = useState(MIN_DESIGN_W);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) {
            return;
        }
        const update = () => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (w === 0 || h === 0) return;
            const nextScale = Math.min(w / MIN_DESIGN_W, h / DESIGN_H);
            const nextWidth = Math.max(MIN_DESIGN_W, w / nextScale);
            setScale(nextScale);
            setStageWidth(nextWidth);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={wrapperRef}
            className={`lo-stage-wrapper relative w-full overflow-hidden ${className}`}
            style={{ height: "calc(100vh - 56px)", minHeight: 520 }}
        >
            {/* Stage content */}

            {scale > 0 && (
                <div
                    className="relative z-10"
                    style={{
                        width: stageWidth,
                        height: DESIGN_H,
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                        position: "absolute",
                        left: 0,
                        top: 0,
                    }}
                >
                    {/* 2. All loadout UI cards sit at z-10, cleanly above the particles */}
                    <div className="lo-stage relative z-10" style={{ width: stageWidth, height: DESIGN_H }}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};
