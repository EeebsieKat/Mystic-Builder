"use client";

/**
 * Main menu - the boot screen of Mystic Builder.
 *
 * Full-viewport game menu in the style of the Awakening main menu: brand
 * block top-left, menu column on the left, decorative stage on the right,
 * site info along the bottom. No page scrolling anywhere.
 *
 * All art comes from src/lib/menu-assets.ts - drop real assets (bg art,
 * nine-sliced button textures, sounds) there and this screen picks them
 * up without code changes.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Database, Github, Hammer } from "lucide-react";

import { MenuBackdrop, MenuButton, SiteInfoFull, VersionLabel } from "@/components/menu-ui";
import { DiamondPip } from "@/components/loadout/decor";

const MainMenu = () => {
    const router = useRouter();

    /* Game-style keyboard shortcuts (B -> builder, D -> database). */
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }
            const target = event.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
                return;
            }
            const key = event.key.toLowerCase();
            if (key === "b") {
                router.push("/builder");
            } else if (key === "d") {
                router.push("/database");
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [router]);

    return (
        <MenuBackdrop>
            {/* Brand block (top-left) */}
            <header className="flex items-start gap-4 px-10 pt-9 sm:px-14">
                <span
                    className="mystic-pulse flex h-[64px] w-[64px] items-center justify-center rounded-[10px] border border-[#3a3f47]/80 bg-[rgba(10,12,16,0.75)]"
                    aria-hidden
                >
                    <img alt="" width="44" height="44" src="/assets/awakening-ui/logo/icon.png" />
                </span>
                <div>
                    <h1 className="lo-serif text-[30px] font-semibold leading-tight tracking-[0.1em]">
                        <span className="text-gold-gradient">Mystic</span> <span className="text-[#e8e4da]">Builder</span>
                    </h1>
                    <VersionLabel className="mt-1.5" />
                </div>
            </header>

            {/* Body: menu column left, decorative stage right */}
            <div className="flex min-h-0 flex-1 items-center">
                <nav
                    className="lo-fade-in flex w-full max-w-[430px] flex-col gap-[14px] px-10 sm:px-14"
                    aria-label="Main menu"
                >
                    <MenuButton
                        label="LOADOUT"
                        note="Plan & share builds"
                        hint="B"
                        icon={<Hammer className="h-[18px] w-[18px]" aria-hidden />}
                        href="/builder"
                        primary
                    />
                    <MenuButton
                        label="ITEM DATABASE"
                        note="Weapons · armour · cells"
                        hint="D"
                        icon={<Database className="h-[18px] w-[18px]" aria-hidden />}
                        href="/database"
                    />

                    <div className="my-[10px] flex items-center gap-3 px-[6px]" aria-hidden>
                        <DiamondPip size={8} color="#c8955a" />
                        <span className="lo-flourish" />
                        <span className="lo-flourish lo-flourish-r" />
                        <DiamondPip size={8} color="#c8955a" />
                    </div>

                    <MenuButton
                        label="SOURCE CODE"
                        icon={<Github className="h-[18px] w-[18px]" aria-hidden />}
                        externalHref="https://github.com/EeebsieKat/Mystic-Builder"
                    />
                    <MenuButton
                        label="SOURCE DATA"
                        icon={<Github className="h-[18px] w-[18px]" aria-hidden />}
                        externalHref="https://github.com/atomicptr/dauntless-builder-reforged"
                    />
                </nav>

                {/* Decorative right stage - art slot for future key art. */}
                <div className="relative hidden flex-1 items-center justify-center md:flex" aria-hidden>
                    <div
                        className="relative flex h-[380px] w-[380px] items-center justify-center rounded-full"
                        style={{
                            background:
                                "radial-gradient(closest-side, rgba(120,140,190,0.16) 0%, rgba(90,110,160,0.08) 45%, transparent 72%)",
                        }}
                    >
                        <div
                            className="absolute inset-[-40px] rounded-full"
                            style={{
                                background:
                                    "radial-gradient(closest-side, rgba(224,163,62,0.07) 0%, transparent 70%)",
                            }}
                        />
                        <img
                            alt=""
                            width="200"
                            height="200"
                            src="/assets/awakening-ui/logo/icon.png"
                            className="icon-glow opacity-80"
                            style={{ filter: "drop-shadow(0 0 34px rgba(224,163,62,0.3))" }}
                        />
                        <span className="absolute left-[24px] top-[84px]">
                            <DiamondPip size={10} color="#c8955a" />
                        </span>
                        <span className="absolute right-[36px] top-[64px]">
                            <DiamondPip size={7} color="#8a94a6" />
                        </span>
                        <span className="absolute bottom-[92px] right-[88px]">
                            <DiamondPip size={9} color="#c8955a" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Site info / legal (formerly the footer) */}
            <footer className="flex justify-center px-10 pb-6 sm:px-14">
                <SiteInfoFull />
            </footer>
        </MenuBackdrop>
    );
};

export default MainMenu;
