"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import NavLinks from "@/components/site-nav-links";

function HeaderContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Check if the user is on the main landing page hero (clean "/" with no tab or build param)
    const isLandingPage = pathname === "/" && !searchParams.get("tab") && !searchParams.has("b");

    const [isHeroVisible, setIsHeroVisible] = useState(true);

    useEffect(() => {
        if (!isLandingPage) {
            setIsHeroVisible(false);
            return;
        }

        const heroEl = document.getElementById("hero-section");

        // IntersectionObserver to detect when the hero section is visible on screen
        if (heroEl && typeof IntersectionObserver !== "undefined") {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    // When hero is mostly visible (more than 20% in view and near top), hide the header
                    const visible = entry.isIntersecting && entry.boundingClientRect.bottom > 200;
                    setIsHeroVisible(visible);
                },
                { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] }
            );

            observer.observe(heroEl);

            const onScroll = () => {
                if (window.scrollY < 120) {
                    setIsHeroVisible(true);
                }
            };
            window.addEventListener("scroll", onScroll, { passive: true });

            return () => {
                observer.disconnect();
                window.removeEventListener("scroll", onScroll);
            };
        } else {
            // Fallback to scroll position
            const onScroll = () => {
                setIsHeroVisible(window.scrollY < 300);
            };
            onScroll();
            window.addEventListener("scroll", onScroll, { passive: true });
            return () => window.removeEventListener("scroll", onScroll);
        }
    }, [isLandingPage]);

    // On the landing page, the header is hidden when the hero is in view
    const showHeader = !isLandingPage || !isHeroVisible;

    // Fixed overlay on landing page so it doesn't displace the full-screen hero; sticky on other routes
    const positionClass = isLandingPage
        ? "fixed top-0 inset-x-0"
        : "sticky top-0";

    const visibilityClass = isLandingPage
        ? showHeader
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-full opacity-0 pointer-events-none"
        : "translate-y-0 opacity-100 pointer-events-auto";

    return (
        <header
            className={`${positionClass} z-40 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg)]/70 transition-all duration-300 ease-out ${visibilityClass}`}
        >
            <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden />
            <div className="relative flex h-14 w-full items-center justify-between px-6 lg:px-10">
                <Link href="/" className="group flex items-center gap-2.5 font-semibold tracking-tight">
                    <img alt="Mystic Paradox Logo" width="50" src="/assets/awakening-ui/logo/icon.png" />
                    <span className="whitespace-nowrap text-base sm:text-lg">
                        <span className="text-gold-gradient font-display font-bold">Mystic</span>{" "}
                        <span className="text-foreground font-display font-bold">Builder</span>
                    </span>
                </Link>
                <nav
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm"
                    aria-label="Main navigation"
                >
                    <Suspense fallback={null}>
                        <NavLinks />
                    </Suspense>
                </nav>
            </div>
        </header>
    );
}

export default function SiteHeader() {
    return (
        <Suspense
            fallback={
                <header className="sticky top-0 z-40 h-14 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md" />
            }
        >
            <HeaderContent />
        </Suspense>
    );
}
