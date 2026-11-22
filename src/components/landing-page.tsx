"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    ChevronDown,
    Compass,
    Database,
    ExternalLink,
    Hammer,
    Heart,
    Info,
    Layers,
    Lightbulb,
    Shield,
    Sparkles,
    Swords,
    Zap,
} from "lucide-react";

import { Footer } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GAME_VERSION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const WEAPON_CLASSES = [
    { id: "Sword", name: "Sword", icon: "/assets/icons/generic/Sword.png", role: "Balanced DPS & Overdrive" },
    { id: "Axe", name: "Axe", icon: "/assets/icons/generic/Axe.png", role: "Charged Cleaves & Resolve" },
    { id: "Hammer", name: "Hammer", icon: "/assets/icons/generic/Hammer.png", role: "Stagger Crushes & Aethercharge" },
    { id: "Chain Blades", name: "Chain Blades", icon: "/assets/icons/generic/ChainBlades.png", role: "High Mobility & Reapers" },
    { id: "War Pike", name: "War Pike", icon: "/assets/icons/generic/WarPike.png", role: "Wound Piercing & Missiles" },
    { id: "Repeaters", name: "Repeaters", icon: "/assets/icons/generic/Repeater.png", role: "Modular Ranged Firepower" },
    { id: "Aether Strikers", name: "Aether Strikers", icon: "/assets/icons/generic/AetherStrikers.png", role: "Rapid Mantras & Surges" },
];

const OMNICELLS = [
    {
        name: "Discipline",
        icon: "/assets/icons/omnicells/Discipline.png",
        tagline: "Flawless Parries & Critical Surges",
        color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
        pillColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        description: "Limits healing in exchange for flaming parry counter-attacks and lethal critical strike stacking.",
    },
    {
        name: "Revenant",
        icon: "/assets/icons/omnicells/Revenant.png",
        tagline: "Void Health Sacrifice & Colossal Burst",
        color: "from-purple-500/20 to-violet-500/10 border-purple-500/30",
        pillColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
        description: "Channels void tendrils that drain Slayer HP into devastating long-range dark aether explosions.",
    },
    {
        name: "Tempest",
        icon: "/assets/icons/omnicells/Tempest.png",
        tagline: "Velocity Scaling & Shock Annihilation",
        color: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
        pillColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        description: "Converts sprint velocity and dodge momentum into lightning chain charges for massive single-target strikes.",
    },
    {
        name: "Bastion",
        icon: "/assets/icons/omnicells/Bastion.png",
        tagline: "Fortified Shields & Crushing Impact",
        color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
        pillColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        description: "Amplifies shield generation and expels stacked shielding into a devastating area-of-effect ground slam.",
    },
    {
        name: "Artificer",
        icon: "/assets/icons/omnicells/Artificer.png",
        tagline: "Drone Support, Cleansing & Instant Revives",
        color: "from-teal-500/20 to-cyan-500/10 border-teal-500/30",
        pillColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
        description: "Deploys an automated companion drone to heal teammates, laser vulnerable behemoth parts, and revive fallen Slayers.",
    },
    {
        name: "Iceborne",
        icon: "/assets/icons/omnicells/Iceborne.png",
        tagline: "Unstoppable Glacial Fortitude",
        color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
        pillColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
        description: "Grants continuous lifesteal, massive damage mitigation, and an icy lance that grants temporary invulnerability.",
    },
];

const ELEMENTS = [
    { name: "Blaze", color: "#E25822", icon: "/assets/icons/elements/Blaze.png", vs: "Frost" },
    { name: "Frost", color: "#6EC6E8", icon: "/assets/icons/elements/Frost.png", vs: "Blaze" },
    { name: "Shock", color: "#F3C13A", icon: "/assets/icons/elements/Shock.png", vs: "Terra" },
    { name: "Terra", color: "#6FBF4B", icon: "/assets/icons/elements/Terra.png", vs: "Shock" },
    { name: "Radiant", color: "#EFD97F", icon: "/assets/icons/elements/Radiant.png", vs: "Umbral" },
    { name: "Umbral", color: "#8A5FE8", icon: "/assets/icons/elements/Umbral.png", vs: "Radiant" },
];

const LOGO_ASCII = `                   /\\    /\\                   
                  /8\\    /8\\                  
                 /88\\    /O8\\                 
                /8O8\\    /8O8\\                
               /#88\\      /OO8\\               
              /#88#\\      /8OO8\\              
             /#88#\\        /8OO8\\             
           /8#88#\\    ◈     /8888O\\           
          /8888#\\            /88888\\          
        /888888\\              /88888O\\        
       /8OOO88\\                /888O88\\       
       /O88OOO88\\            /8OOOO8OO\\       
     /    /88OOO8\\          /8OOOOO\\    \\     
    /88O\\   /88OO8\\        /OOOOO\\   /O88\\    
   /8oOO88\\   /8OO8\\      /OoOO\\   /O888O8\\   
  /OoOOOOO8O\\   /8O\\      /oO\\   /O888888OO\\  
/OOOOOooOOO8#\\   /88\\    /OO\\   /88OOooooOOOO\\
/8o\\       /o8\\   /8\\    /O\\   /Oo\\       /oO\\
 /8O\\              /\\    /\\              /OO\\ 
  /88\\                                  /8O\\  `;

const MAIN_NAV_ITEMS = [
    {
        name: "Builder",
        key: "B",
        href: "/builder",
        icon: Hammer,
        isPrimary: true,
    },
    {
        name: "Item Database",
        key: "D",
        href: "/?tab=database",
        icon: Database,
    },
    {
        name: "Meta Builds",
        key: "M",
        href: "/?tab=suggestions",
        icon: Lightbulb,
    },
    {
        name: "Liked Builds",
        key: "L",
        href: "/?tab=liked",
        icon: Heart,
    },
    {
        name: "About",
        key: "A",
        href: "/about",
        icon: Info,
    },
];

const SECTION_IDS = [
    "hero-section",
    "core-capabilities",
    "omnicell-archetypes",
    "weapon-classes",
    "elemental-system",
    "cta-section",
];

export default function LandingPage() {
    const router = useRouter();
    const isAutoScrollingRef = useRef(false);
    const scrollCooldownRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToSection = useCallback((targetId: string) => {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        isAutoScrollingRef.current = true;
        const navOffset = targetId === "hero-section" ? 0 : 56;
        const targetTop =
            targetId === "hero-section"
                ? 0
                : Math.max(0, targetEl.getBoundingClientRect().top + window.scrollY - navOffset);

        window.scrollTo({
            top: targetTop,
            behavior: "smooth",
        });

        if (scrollCooldownRef.current) {
            clearTimeout(scrollCooldownRef.current);
        }
        scrollCooldownRef.current = setTimeout(() => {
            isAutoScrollingRef.current = false;
        }, 850);
    }, []);

    const getCurrentSectionIndex = useCallback(() => {
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight * 0.45) {
            return 0;
        }

        const navOffset = 64;
        let closestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < SECTION_IDS.length; i++) {
            const el = document.getElementById(SECTION_IDS[i]);
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const distance = Math.abs(rect.top - navOffset);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }

        return closestIndex;
    }, []);

    /* Auto-scroll between sections on mouse wheel / trackpad scroll */
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            // Ignore dominant horizontal trackpad gestures
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) return;

            // If an auto-scroll transition is active, consume event to prevent jitter
            if (isAutoScrollingRef.current) {
                if (e.cancelable) e.preventDefault();
                return;
            }

            // Filter out finger-resting trackpad micro-noise
            if (Math.abs(e.deltaY) < 18) return;

            const direction = e.deltaY > 0 ? "down" : "up";
            const currentIdx = getCurrentSectionIndex();
            const currentId = SECTION_IDS[currentIdx];
            const currentEl = document.getElementById(currentId);

            if (!currentEl) return;

            const rect = currentEl.getBoundingClientRect();
            const navOffset = currentIdx === 0 ? 0 : 56;

            if (direction === "down") {
                // From hero section, any downward scroll immediately glides to the next section
                if (currentIdx === 0) {
                    if (e.cancelable) e.preventDefault();
                    scrollToSection(SECTION_IDS[1]);
                    return;
                }

                // For content sections, only advance when user reaches near bottom of the current section
                const isAtSectionBottom = rect.bottom <= window.innerHeight + 40;
                if (isAtSectionBottom && currentIdx < SECTION_IDS.length - 1) {
                    if (e.cancelable) e.preventDefault();
                    scrollToSection(SECTION_IDS[currentIdx + 1]);
                }
            } else {
                // Scrolling up
                if (currentIdx === 1) {
                    // Near top of first content section, return smoothly to hero
                    const isNearTop = rect.top >= navOffset - 40;
                    if (isNearTop) {
                        if (e.cancelable) e.preventDefault();
                        scrollToSection(SECTION_IDS[0]);
                        return;
                    }
                } else if (currentIdx > 1) {
                    const isAtSectionTop = rect.top >= navOffset - 40;
                    if (isAtSectionTop) {
                        if (e.cancelable) e.preventDefault();
                        scrollToSection(SECTION_IDS[currentIdx - 1]);
                    }
                }
            }
        };

        window.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            window.removeEventListener("wheel", onWheel);
            if (scrollCooldownRef.current) clearTimeout(scrollCooldownRef.current);
        };
    }, [getCurrentSectionIndex, scrollToSection]);

    /* Touch gesture swipe auto-scroll for mobile and tablets */
    useEffect(() => {
        let touchStartY = 0;
        let touchStartX = 0;

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                touchStartY = e.touches[0].clientY;
                touchStartX = e.touches[0].clientX;
            }
        };

        const onTouchEnd = (e: TouchEvent) => {
            if (isAutoScrollingRef.current) return;
            if (e.changedTouches.length !== 1) return;

            const deltaY = touchStartY - e.changedTouches[0].clientY;
            const deltaX = touchStartX - e.changedTouches[0].clientX;

            // Check if vertical swipe is distinct and greater than horizontal movement
            if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
                const direction = deltaY > 0 ? "down" : "up";
                const currentIdx = getCurrentSectionIndex();

                if (direction === "down") {
                    if (currentIdx === 0) {
                        scrollToSection(SECTION_IDS[1]);
                    } else if (currentIdx < SECTION_IDS.length - 1) {
                        const currentEl = document.getElementById(SECTION_IDS[currentIdx]);
                        if (currentEl && currentEl.getBoundingClientRect().bottom <= window.innerHeight + 50) {
                            scrollToSection(SECTION_IDS[currentIdx + 1]);
                        }
                    }
                } else {
                    if (currentIdx === 1) {
                        const currentEl = document.getElementById(SECTION_IDS[1]);
                        if (currentEl && currentEl.getBoundingClientRect().top >= 20) {
                            scrollToSection(SECTION_IDS[0]);
                        }
                    } else if (currentIdx > 1) {
                        const currentEl = document.getElementById(SECTION_IDS[currentIdx]);
                        if (currentEl && currentEl.getBoundingClientRect().top >= 20) {
                            scrollToSection(SECTION_IDS[currentIdx - 1]);
                        }
                    }
                }
            }
        };

        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchend", onTouchEnd, { passive: true });

        return () => {
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchend", onTouchEnd);
        };
    }, [getCurrentSectionIndex, scrollToSection]);

    /* Keyboard navigation shortcut matching in-game Dauntless hotkeys & scroll arrows */
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Section auto-scroll on arrow keys from hero / boundaries
            if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
                if (window.scrollY < window.innerHeight * 0.45) {
                    e.preventDefault();
                    scrollToSection(SECTION_IDS[1]);
                    return;
                }
            } else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
                const currentIdx = getCurrentSectionIndex();
                if (currentIdx === 1) {
                    const el = document.getElementById(SECTION_IDS[1]);
                    if (el && el.getBoundingClientRect().top >= 20) {
                        e.preventDefault();
                        scrollToSection(SECTION_IDS[0]);
                        return;
                    }
                }
            }

            const key = e.key.toUpperCase();
            const match = MAIN_NAV_ITEMS.find((item) => item.key === key);
            if (match) {
                router.push(match.href);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [getCurrentSectionIndex, router, scrollToSection]);

    return (
        <div className="relative flex w-full flex-col bg-[var(--bg)] text-foreground">
            {/* HERO SECTION - Full First Viewport with Generous Side Margins */}
            <section
                id="hero-section"
                className="relative flex h-screen min-h-[640px] flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-28 xl:px-36 py-8 lg:py-12 overflow-hidden"
            >
                {/* God Rays streaming down from top center - gentle ethereal opacity */}
                <div
                    className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-0 h-[640px] sm:h-[780px] lg:h-[900px] w-full max-w-[1920px] select-none"
                    style={{
                        maskImage: "linear-gradient(to bottom, black 40%, transparent 95%)",
                        WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 95%)",
                    }}
                    aria-hidden="true"
                >
                    <img
                        src="/assets/texture/rays.png"
                        alt=""
                        className="h-full w-full object-cover object-top mix-blend-screen opacity-55 sm:opacity-60"
                    />
                </div>

                {/* Ambient Background Aura */}
                <div className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,163,255,0.12)_0%,rgba(224,194,135,0.05)_45%,transparent_70%)] blur-3xl" />

                <div className="relative z-10 mx-auto w-full max-w-5xl">
                    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
                        {/* Left Column: Headlines & Dauntless Menu */}
                        <div className="flex flex-col items-start text-left lg:col-span-7">
                            {/* Main Headline */}
                            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-[50px] leading-tight">
                                Forge Your Ultimate <span className="text-gold-gradient">Slayer Loadout</span>
                            </h1>

                            {/* Subtitle */}
                            <p className="mt-3 max-w-lg text-xs leading-relaxed text-[var(--ink-2)] sm:text-sm">
                                The premier build calculator and meta armory for Dauntless 1.14.7.
                            </p>

                            {/* Dauntless Sleek Transparent Navigation Menu */}
                            <nav aria-label="Main Navigation" className="mt-8 flex w-full max-w-[420px] flex-col divide-y divide-white/[0.08] border-y border-white/[0.08]">
                                {MAIN_NAV_ITEMS.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="group relative flex items-center justify-between py-3 px-2 rounded-sm transition-all duration-200 hover:bg-white/[0.035] hover:pl-3"
                                        >
                                            {/* Left glowing accent line on hover */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0 w-[2.5px] rounded-r bg-[var(--aether-hi)] transition-all duration-200 group-hover:h-3/5 shadow-[0_0_10px_rgba(91,163,255,0.9)]" />

                                            <div className="flex items-center gap-3.5">
                                                {/* Circular Icon Medallion */}
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-[var(--aether-hi)] shadow-sm transition-all duration-200 group-hover:border-[var(--aether-line)] group-hover:bg-[var(--aether-a10)] group-hover:text-white group-hover:shadow-[0_0_14px_rgba(91,163,255,0.5)]">
                                                    <Icon className="h-4 w-4" />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="font-display text-[15px] sm:text-base font-bold tracking-wide text-white/90 transition-colors group-hover:text-white">
                                                        {item.name}
                                                    </span>
                                                    <span className="font-mono text-xs font-semibold text-[var(--gold)]/80 transition-colors group-hover:text-[var(--gold-bright)]">
                                                        [{item.key}]
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-[var(--ink-3)] transition-all duration-200 group-hover:text-white group-hover:translate-x-1">
                                                <span className="text-[10px] font-mono tracking-widest uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-80 text-[var(--aether-hi)]">
                                                    Select
                                                </span>
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right Column: ASCII Mystic Crest - Scaled to match left column hierarchy */}
                        <div className="relative flex items-center justify-center lg:col-span-5 select-none">
                            <div className="relative flex items-center justify-center">
                                {/* Ambient Glow behind Crest */}
                                <div className="absolute h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(91,163,255,0.18)_0%,rgba(224,194,135,0.09)_45%,transparent_70%)] blur-3xl" />

                                <pre
                                    aria-label="Mystic Paradox Crest ASCII Art"
                                    className="relative font-mono text-[9.5px] xs:text-[11.5px] sm:text-[13.5px] md:text-[15px] lg:text-[16px] xl:text-[18.5px] 2xl:text-[21px] leading-[1.12] font-black text-transparent bg-clip-text bg-gradient-to-b from-[var(--gold-bright)] via-[var(--gold)] to-[var(--aether)] drop-shadow-[0_0_35px_rgba(224,194,135,0.5)] transition-transform duration-500 hover:scale-105"
                                >
                                    {LOGO_ASCII}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Center Scroll Guide */}
                <button
                    type="button"
                    onClick={() => scrollToSection("core-capabilities")}
                    className="group absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-center transition-all duration-300 hover:translate-y-0.5 cursor-pointer select-none"
                    aria-label="Scroll to explore features"
                >
                    <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--ink-3)] transition-colors group-hover:text-[var(--gold)]">
                        Scroll to Explore
                    </span>
                    <div className="flex h-6 w-3.5 items-start justify-center rounded-full border border-white/20 p-0.5 transition-colors group-hover:border-[var(--gold)]/60">
                        <div className="h-1.5 w-1 rounded-full bg-[var(--gold)] animate-[bounce_1.8s_infinite]" />
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 -mt-0.5 text-[var(--ink-4)] transition-all group-hover:text-[var(--gold)] group-hover:translate-y-0.5 animate-pulse" />
                </button>
            </section>

            {/* THREE CORE PILLARS / COMPACT CINEMATIC BENTO SHOWCASE */}
            <section
                id="core-capabilities"
                className="relative z-10 flex min-h-[calc(100vh-56px)] flex-col justify-center px-6 sm:px-10 md:px-14 lg:px-16 xl:px-20 py-6 sm:py-8 lg:py-10 scroll-mt-14"
            >
                <div className="mx-auto w-full max-w-7xl">
                    <div className="flex flex-col items-start text-left max-w-2xl">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[var(--gold)]/80">
                            Core Capabilities
                        </p>
                        <h2 className="mt-0.5 font-display text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-white leading-tight">
                            Everything You Need to Master the Hunt
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[var(--ink-3)]">
                            Built from official 1.14.7 game extracts with authentic visual assets, calculation engines, and instant URL sharing.
                        </p>
                    </div>

                    <div className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
                        {/* LEFT: Large Featured Hero Card (Span 7) */}
                        <Link
                            href="/builder"
                            className="group relative lg:col-span-7 flex flex-col justify-between overflow-hidden rounded-sm border border-white/[0.08] bg-[#070e1a]/95 transition-all duration-300 hover:border-[var(--aether-line)] hover:bg-[#0a1526] hover:shadow-[0_0_35px_rgba(91,163,255,0.18)] cursor-pointer"
                        >
                            {/* Proportional Image Frame */}
                            <div className="relative h-[200px] xs:h-[230px] sm:h-[260px] lg:h-[295px] xl:h-[320px] w-full overflow-hidden bg-black/60 border-b border-white/[0.08]">
                                <Image
                                    src="/assets/showcase/preview-builder.png?v=3"
                                    alt="Loadout Planner"
                                    fill
                                    unoptimized
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#070e1a] via-transparent to-transparent opacity-85" />
                            </div>

                            {/* Bottom Content Area */}
                            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 lg:p-6">
                                <div>
                                    <div className="inline-block px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-[var(--aether-hi)] uppercase border border-[var(--aether-line)] bg-[var(--aether-a10)] rounded-sm">
                                        LIVE BUILDER
                                    </div>
                                    <h3 className="mt-2 font-display text-lg sm:text-xl lg:text-[22px] font-bold tracking-wider text-white uppercase transition-colors group-hover:text-[var(--aether-hi)]">
                                        Loadout Planner
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[var(--ink-2)] line-clamp-2">
                                        The premier build calculator for Dauntless 1.14.7. Equip weapons, armour, lanterns, and omnicells with live Power Surge scaling and perk threshold calculation.
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-xs sm:text-[13px] font-mono font-bold tracking-widest uppercase text-[var(--aether-hi)] transition-colors group-hover:text-white">
                                    <span>Launch Build Planner</span>
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>

                        {/* RIGHT: Stacked 2 Cards (Span 5) */}
                        <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5 justify-between">
                            {/* Right Top: 517 Meta Guides Index */}
                            <Link
                                href="/?tab=suggestions"
                                className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-sm border border-white/[0.08] bg-[#070e1a]/95 transition-all duration-300 hover:border-[var(--gold)]/50 hover:bg-[#0a1526] hover:shadow-[0_0_35px_rgba(224,194,135,0.18)] cursor-pointer"
                            >
                                <div className="relative h-[95px] sm:h-[115px] lg:h-[130px] xl:h-[142px] w-full overflow-hidden bg-black/60 border-b border-white/[0.08]">
                                    <Image
                                        src="/assets/showcase/preview-suggestions.png?v=3"
                                        alt="517 Meta Guides Index"
                                        fill
                                        unoptimized
                                        sizes="(max-width: 1024px) 100vw, 40vw"
                                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#070e1a] via-transparent to-transparent opacity-85" />
                                </div>

                                <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 lg:p-4.5">
                                    <div>
                                        <div className="inline-block px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-[var(--gold)] uppercase border border-[var(--gold)]/30 bg-[var(--gold)]/10 rounded-sm">
                                            517 META BUILDS
                                        </div>
                                        <h3 className="mt-1 font-display text-sm sm:text-base font-bold tracking-wider text-white uppercase transition-colors group-hover:text-[var(--gold-bright)]">
                                            517 Meta Guides Index
                                        </h3>
                                        <p className="mt-0.5 text-[11px] sm:text-xs leading-relaxed text-[var(--ink-2)] line-clamp-1">
                                            Curated community meta builds from the Reforged index. Filter by weapon, perks, elemental matchup, or game mode.
                                        </p>
                                    </div>

                                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase text-[var(--gold)] transition-colors group-hover:text-white">
                                        <span>Browse Meta Builds</span>
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>

                            {/* Right Bottom: Complete Item Armory */}
                            <Link
                                href="/?tab=database"
                                className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-sm border border-white/[0.08] bg-[#070e1a]/95 transition-all duration-300 hover:border-cyan-500/50 hover:bg-[#0a1526] hover:shadow-[0_0_35px_rgba(6,182,212,0.18)] cursor-pointer"
                            >
                                <div className="relative h-[95px] sm:h-[115px] lg:h-[130px] xl:h-[142px] w-full overflow-hidden bg-black/60 border-b border-white/[0.08]">
                                    <Image
                                        src="/assets/showcase/preview-database.png?v=3"
                                        alt="Complete Item Armory"
                                        fill
                                        unoptimized
                                        sizes="(max-width: 1024px) 100vw, 40vw"
                                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#070e1a] via-transparent to-transparent opacity-85" />
                                </div>

                                <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 lg:p-4.5">
                                    <div>
                                        <div className="inline-block px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-cyan-400 uppercase border border-cyan-500/30 bg-cyan-500/10 rounded-sm">
                                            1.14.7 ITEM DATABASE
                                        </div>
                                        <h3 className="mt-1 font-display text-sm sm:text-base font-bold tracking-wider text-white uppercase transition-colors group-hover:text-cyan-200">
                                            Complete Item Armory
                                        </h3>
                                        <p className="mt-0.5 text-[11px] sm:text-xs leading-relaxed text-[var(--ink-2)] line-clamp-1">
                                            Every weapon, armour piece, cell, and unique passive effect extracted directly from official 1.14.7 archives.
                                        </p>
                                    </div>

                                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400 transition-colors group-hover:text-white">
                                        <span>Explore Database</span>
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* OMNICELL ARCHETYPES SHOWCASE */}
            <section id="omnicell-archetypes" className="relative z-10 border-y border-[var(--line)] bg-[var(--bg-raise)]/40 px-8 sm:px-16 md:px-24 lg:px-28 xl:px-36 py-16 lg:py-20 scroll-mt-14 lg:scroll-mt-16">
                <div className="mx-auto max-w-5xl">
                    <div className="flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--aether-line)] bg-[var(--aether-a10)] px-3.5 py-1 text-xs font-semibold text-[var(--aether-hi)]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Combat Specialization</span>
                        </div>
                        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Six Distinct Omnicell Playstyles
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)] sm:text-base">
                            Tailor your loadout around unique combat mechanics: parrying, void damage bursts, high velocity shock attacks, or unbreakable shields.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {OMNICELLS.map(omni => (
                            <Link
                                key={omni.name}
                                href={`/?tab=suggestions&category=${encodeURIComponent(omni.name)}`}
                                className={`group flex flex-col justify-between rounded-xl border bg-gradient-to-br ${omni.color} p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer`}
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-black/40 p-1">
                                                <img
                                                    src={omni.icon}
                                                    alt={omni.name}
                                                    className="h-10 w-10 object-contain drop-shadow-md"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-display text-base font-bold text-white group-hover:text-[var(--aether-hi)] transition-colors">
                                                    {omni.name}
                                                </h4>
                                                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border ${omni.pillColor}`}>
                                                    Omnicell
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-[var(--ink-2)]">
                                        {omni.description}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 text-[11px] font-semibold text-[var(--ink-3)] group-hover:text-white transition-colors">
                                    <span>View {omni.name} Builds</span>
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* WEAPON CLASSES RAIL */}
            <section id="weapon-classes" className="relative z-10 px-8 sm:px-16 md:px-24 lg:px-28 xl:px-36 py-16 lg:py-20 scroll-mt-14 lg:scroll-mt-16">
                <div className="mx-auto max-w-5xl">
                    <div className="flex flex-col items-center text-center">
                        <p className="panel-label">Weapon Armory</p>
                        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            All 7 Slayer Weapon Classes
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)] sm:text-base">
                            Select a weapon class to view verified meta builds, weapon stats, cell sockets, and special modifications.
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                        {WEAPON_CLASSES.map(w => (
                            <Link
                                key={w.id}
                                href={`/?tab=suggestions&weapon=${encodeURIComponent(w.id)}`}
                                className="group flex flex-col items-center rounded-xl border border-[var(--line)] bg-[var(--bg-raise)]/60 p-4 text-center transition-all duration-200 hover:border-[var(--aether-line)] hover:bg-[var(--aether-a10)] hover:scale-105 cursor-pointer"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--line-2)] bg-black/40 p-2 group-hover:border-[var(--aether-line)] transition-colors">
                                    <img
                                        src={w.icon}
                                        alt={w.name}
                                        className="h-10 w-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                                    />
                                </div>
                                <span className="mt-3 font-display text-xs font-bold text-white group-hover:text-[var(--aether-hi)] transition-colors">
                                    {w.name}
                                </span>
                                <span className="mt-1 line-clamp-1 text-[10px] text-[var(--ink-4)]">
                                    {w.role}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ELEMENTAL MATCHUP MATRIX */}
            <section id="elemental-system" className="relative z-10 border-t border-[var(--line)] bg-[var(--bg-raise)]/30 px-8 sm:px-16 md:px-24 lg:px-28 xl:px-36 py-14 scroll-mt-14 lg:scroll-mt-16">
                <div className="mx-auto max-w-5xl">
                    <div className="flex flex-col items-center text-center">
                        <p className="panel-label">Elemental Affinity</p>
                        <h3 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                            Master Elemental Strengths &amp; Weaknesses
                        </h3>
                        <p className="mt-2 max-w-xl text-xs text-[var(--ink-3)] sm:text-sm">
                            Harness opposing elements to deal +25 power advantage and avoid -25 resistance penalties.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {ELEMENTS.map(elem => (
                            <Link
                                key={elem.name}
                                href={`/?tab=database&element=${elem.name}`}
                                className="flex flex-col items-center rounded-xl border border-[var(--line)] bg-[var(--bg-raise)]/80 p-3.5 text-center transition-all hover:border-white/30 hover:scale-105"
                            >
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-lg p-1.5"
                                    style={{ backgroundColor: `${elem.color}20`, border: `1px solid ${elem.color}50` }}
                                >
                                    <img src={elem.icon} alt={elem.name} className="h-7 w-7 object-contain" />
                                </div>
                                <span className="mt-2.5 text-xs font-bold text-white" style={{ color: elem.color }}>
                                    {elem.name}
                                </span>
                                <span className="text-[10px] text-[var(--ink-3)]">
                                    Strong vs {elem.vs}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* BOTTOM CALL TO ACTION */}
            <section id="cta-section" className="relative px-6 py-20 text-center lg:py-28 scroll-mt-14 lg:scroll-mt-16">
                <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-25 select-none">
                    <img
                        src="/assets/awakening-ui/loadout/GildWingsGold.png"
                        alt=""
                        className="h-auto w-[800px] max-w-none md:w-[1000px]"
                        aria-hidden="true"
                    />
                </div>

                <div className="mx-auto max-w-3xl">
                    <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                        Ready to Hunt, Slayer?
                    </h2>
                    <p className="mt-4 text-base text-[var(--ink-2)]">
                        Launch the builder to craft, optimize, and share your Dauntless 1.14.7 loadouts today.
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 rounded-xl bg-gradient-to-r from-[var(--aether)] to-[#38bdf8] px-8 text-sm font-bold text-black shadow-[0_0_25px_rgba(91,163,255,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(91,163,255,0.6)] cursor-pointer"
                        >
                            <Link href="/builder" className="inline-flex items-center gap-2">
                                <Hammer className="h-4 w-4" />
                                <span>Start Building Now</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
