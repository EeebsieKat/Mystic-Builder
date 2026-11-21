"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    Suspense,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageTransitionContextType {
    transitionTo: (href: string) => Promise<void>;
    isTransitioning: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
    transitionTo: async () => {},
    isTransitioning: false,
});

export const usePageTransition = () => useContext(PageTransitionContext);

/**
 * Curved page transition component inspired by Olivier Larose / Denis Snellenberg / bencodes.de.
 * Smoothly wipes an animated Bézier curved curtain across the viewport when switching pages.
 */
function CurvedPageTransitionContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
        width: 0,
        height: 0,
    });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const isTransitioningRef = useRef(false);
    const [scope, animate] = useAnimate();

    // Track window dimensions with resize listener
    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Calculate curve parameters dynamically based on viewport height
    const W = dimensions.width;
    const H = dimensions.height;
    // Curve height is proportional to screen height, between 160px and 280px
    const C = Math.min(280, Math.max(160, Math.round(H * 0.28)));
    const totalSvgHeight = H + C * 2;

    // Phase 1 (Covering): Dome arch pointing upwards leads into the viewport
    const initialPath = `M 0 ${C} Q ${W / 2} 0 ${W} ${C} L ${W} ${H + C} Q ${W / 2} ${H + C * 2} 0 ${H + C} Z`;

    // Phase 2 (Revealing): Top flattens, bottom arches upwards, unveiling page from center
    const revealingPath = `M 0 ${C} Q ${W / 2} ${C} ${W} ${C} L ${W} ${H + C} Q ${W / 2} ${H} 0 ${H + C} Z`;

    const transitionTo = useCallback(
        async (href: string) => {
            if (isTransitioningRef.current || !dimensions.width || !dimensions.height) {
                return;
            }

            isTransitioningRef.current = true;
            setIsTransitioning(true);
            setIsVisible(true);

            try {
                // Ensure starting state is below the screen
                if (scope.current) {
                    animate("svg", { top: H }, { duration: 0 });
                    animate("path", { d: initialPath }, { duration: 0 });
                }

                // Phase 1: Wipe upwards to cover the entire viewport
                await Promise.all([
                    animate(
                        "svg",
                        { top: -C },
                        { duration: 0.45, ease: [0.76, 0, 0.24, 1] }
                    ),
                    animate(
                        "path",
                        { d: initialPath },
                        { duration: 0.45, ease: [0.76, 0, 0.24, 1] }
                    ),
                ]);

                // While 100% covered by the dark curtain, navigate to the target route
                router.push(href);
                window.scrollTo({ top: 0, behavior: "instant" });

                // Allow brief frame for React to mount the new route view
                await new Promise((r) => setTimeout(r, 70));

                // Phase 2: Morph curve and slide away off the top, revealing the new page
                await Promise.all([
                    animate(
                        "svg",
                        { top: -(H + C * 2) },
                        { duration: 0.48, ease: [0.76, 0, 0.24, 1] }
                    ),
                    animate(
                        "path",
                        { d: revealingPath },
                        { duration: 0.48, ease: [0.76, 0, 0.24, 1] }
                    ),
                ]);
            } catch (err) {
                console.error("Transition animation error:", err);
            } finally {
                // Reset positions silently below screen for next navigation
                if (scope.current) {
                    animate("svg", { top: H }, { duration: 0 });
                    animate("path", { d: initialPath }, { duration: 0 });
                }
                setIsVisible(false);
                isTransitioningRef.current = false;
                setIsTransitioning(false);
            }
        },
        [C, H, W, animate, dimensions.height, dimensions.width, initialPath, revealingPath, router, scope]
    );

    // Global click listener to intercept internal route / tab navigation links
    useEffect(() => {
        const handleAnchorClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement)?.closest?.("a");
            if (!anchor) return;

            // Ignore modified clicks (cmd, ctrl, shift, alt) or new tab targets
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
            if (anchor.target === "_blank") return;
            if (anchor.hasAttribute("download")) return;

            const href = anchor.getAttribute("href");
            if (!href) return;

            // Ignore external protocols or mailto/tel or in-page hashes
            if (
                href.startsWith("http://") ||
                href.startsWith("https://") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("#") ||
                href.startsWith("blob:") ||
                href.startsWith("javascript:")
            ) {
                return;
            }

            // Compare with current location
            const currentFullUrl = window.location.pathname + window.location.search;
            if (href === currentFullUrl) {
                e.preventDefault();
                return;
            }

            // Intercept navigation and trigger transition
            e.preventDefault();
            transitionTo(href);
        };

        document.addEventListener("click", handleAnchorClick, { capture: true });
        return () => {
            document.removeEventListener("click", handleAnchorClick, { capture: true });
        };
    }, [transitionTo, pathname, searchParams]);

    return (
        <PageTransitionContext.Provider value={{ transitionTo, isTransitioning }}>
            {children}

            {/* Fullscreen Curved Curtain Transition Overlay */}
            <div
                ref={scope}
                className={cn(
                    "fixed inset-0 z-[99999] overflow-hidden pointer-events-none select-none",
                    isVisible && "pointer-events-auto"
                )}
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: dimensions.width > 0 && isVisible ? "block" : "none",
                }}
                aria-hidden="true"
            >
                <svg
                    className="absolute left-0 w-full"
                    style={{
                        top: H || 1000,
                        height: totalSvgHeight || 0,
                    }}
                    viewBox={`0 0 ${W || 100} ${totalSvgHeight || 100}`}
                    preserveAspectRatio="none"
                >
                    <path
                        d={initialPath}
                        fill="#050a12"
                    />
                </svg>
            </div>
        </PageTransitionContext.Provider>
    );
}

/**
 * Wrapper with Suspense boundary to satisfy Next.js useSearchParams requirement.
 */
export function CurvedPageTransition({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <CurvedPageTransitionContent>{children}</CurvedPageTransitionContent>
        </Suspense>
    );
}
