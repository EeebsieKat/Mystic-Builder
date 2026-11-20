<<<<<<< HEAD
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
=======
import type { Metadata } from "next";
import { Suspense } from "react";

import BuildSuggestions from "@/components/build-suggestions";
import DatabaseBrowser from "@/components/browse-database";
import LoadoutScreen from "@/components/loadout/loadout-screen";
import { Footer } from "@/components/site-footer";
import { gameData } from "@/game/data";
import { GAME_VERSION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
>>>>>>> 03511302b138c57110588e09df9171cfdad17763

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Database, Github, Hammer } from "lucide-react";

import { MenuBackdrop, MenuButton, SiteInfoFull, VersionLabel } from "@/components/menu-ui";
import { DiamondPip } from "@/components/loadout/decor";

<<<<<<< HEAD
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
=======
const Home = async ({ searchParams }: HomeProps) => {
    const { tab } = await searchParams;
    const isDatabase = tab === "database";
    const isSuggestions = tab === "suggestions";
    const isLiked = tab === "liked";

    return (
        <main className="flex w-full flex-1 flex-col">
            {isDatabase ? (
                <>
                    <section className="mystic-glow w-full flex-1 px-6 sm:px-10 md:px-[150px] py-10">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <p className="panel-label">Dauntless {GAME_VERSION} - Mystic Paradox</p>
                            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                                Weapons, Armors, Cells etc.
                            </h1>
                            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                                {Object.keys(gameData.weapons).length} weapons, {Object.keys(gameData.armours).length}{" "}
                                armour pieces, {Object.keys(gameData.cells).length} cells and{" "}
                                {Object.keys(gameData.perks).length} perks from the 1.14.7 game data.
                            </p>
                        </div>
                        <div className="mt-8">
                            <div className="gold-rule mb-8" aria-hidden />
                            <DatabaseBrowser />
                        </div>
                    </section>
                    <Footer />
                </>
            ) : (isSuggestions || isLiked) ? (
                <>
                    <Suspense fallback={null}>
                        <BuildSuggestions defaultLikedOnly={isLiked} />
                    </Suspense>
                    <Footer />
                </>
            ) : (
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                            Loading loadout…
                        </div>
                    }
                >
                    <LoadoutScreen />
                </Suspense>
            )}
        </main>
>>>>>>> 03511302b138c57110588e09df9171cfdad17763
    );
};

export default MainMenu;
