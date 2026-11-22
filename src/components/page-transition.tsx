"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    Suspense,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageTransitionContextValue {
    navigate: (href: string) => void;
    isFading: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
    navigate: () => {},
    isFading: false,
});

export const usePageTransition = () => useContext(PageTransitionContext);

const FADE_OUT_DURATION = 150; // ms to fade out before switching route
const FADE_IN_DURATION = 200; // ms to fade in after route mounts

function TransitionInner({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Unique key identifying current page and tab
    const currentKey = `${pathname}?${searchParams?.toString() ?? ""}`;
    const prevKeyRef = useRef(currentKey);

    const [isFading, setIsFading] = useState(false);
    const isTransitioningRef = useRef(false);
    const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Navigate with fade-out -> router.push -> fade-in
    const navigate = useCallback(
        (targetHref: string) => {
            if (isTransitioningRef.current) return;

            try {
                const targetUrl = new URL(targetHref, window.location.href);
                const currentPathAndQuery = window.location.pathname + window.location.search;
                const targetPathAndQuery = targetUrl.pathname + targetUrl.search;

                // If already on the target path and query, no need to transition
                if (currentPathAndQuery === targetPathAndQuery) {
                    return;
                }

                isTransitioningRef.current = true;
                setIsFading(true);

                if (pendingTimeoutRef.current) {
                    clearTimeout(pendingTimeoutRef.current);
                }

                pendingTimeoutRef.current = setTimeout(() => {
                    router.push(targetPathAndQuery);
                }, FADE_OUT_DURATION);
            } catch {
                router.push(targetHref);
            }
        },
        [router]
    );

    // Listen for route or tab changes to trigger fade-in
    useEffect(() => {
        if (prevKeyRef.current !== currentKey) {
            prevKeyRef.current = currentKey;

            // Route changed: trigger fade-in immediately
            setIsFading(false);
            isTransitioningRef.current = false;
            if (pendingTimeoutRef.current) {
                clearTimeout(pendingTimeoutRef.current);
                pendingTimeoutRef.current = null;
            }
        }
    }, [currentKey]);

    // Safety timeout: ensure page never stays invisible if router doesn't change key
    useEffect(() => {
        if (isFading) {
            const safety = setTimeout(() => {
                setIsFading(false);
                isTransitioningRef.current = false;
            }, 900);
            return () => clearTimeout(safety);
        }
    }, [isFading]);

    // Global click listener to intercept internal <a> link navigations
    useEffect(() => {
        const handleDocumentClick = (e: MouseEvent) => {
            // Ignore non-primary clicks or key modifiers
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }

            const anchor = (e.target as HTMLElement).closest("a");
            if (!anchor) return;

            // Ignore external targets, downloads, or explicit opt-outs
            if (anchor.target && anchor.target !== "_self") return;
            if (anchor.hasAttribute("download") || anchor.getAttribute("data-no-transition") === "true") return;

            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
                return;
            }

            try {
                const targetUrl = new URL(anchor.href, window.location.href);

                // Ignore different origins
                if (targetUrl.origin !== window.location.origin) return;

                const currentPathAndQuery = window.location.pathname + window.location.search;
                const targetPathAndQuery = targetUrl.pathname + targetUrl.search;

                // Ignore if it's the exact same page & query (e.g. only a hash anchor changed)
                if (currentPathAndQuery === targetPathAndQuery) {
                    return;
                }

                // Prevent immediate jump so we can fade out cleanly
                e.preventDefault();
                navigate(targetPathAndQuery);
            } catch {
                // Fallback to normal navigation
            }
        };

        document.addEventListener("click", handleDocumentClick, { capture: true });
        return () => {
            document.removeEventListener("click", handleDocumentClick, { capture: true });
            if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
        };
    }, [navigate]);

    return (
        <PageTransitionContext.Provider value={{ navigate, isFading }}>
            {/* Top Aether Ambient Glow Line during route changes */}
            <div
                className={cn(
                    "pointer-events-none fixed top-0 inset-x-0 z-50 h-[2px] transition-opacity duration-150 select-none",
                    isFading
                        ? "opacity-100 bg-gradient-to-r from-transparent via-[var(--aether-hi)] to-transparent shadow-[0_0_12px_rgba(91,163,255,0.8)]"
                        : "opacity-0"
                )}
                aria-hidden="true"
            />

            {/* Content Container with Smooth Fade-out & Fade-in */}
            <div
                className={cn(
                    "relative flex flex-1 flex-col will-change-[opacity]",
                    isFading
                        ? "opacity-0 transition-opacity duration-150 ease-out"
                        : "opacity-100 transition-opacity duration-200 ease-in"
                )}
            >
                {children}
            </div>
        </PageTransitionContext.Provider>
    );
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="relative flex flex-1 flex-col">{children}</div>}>
            <TransitionInner>{children}</TransitionInner>
        </Suspense>
    );
}
