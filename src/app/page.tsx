import type { Metadata } from "next";
import { Suspense } from "react";

import BuildSuggestions from "@/components/build-suggestions";
import DatabaseBrowser from "@/components/browse-database";
import LandingPage from "@/components/landing-page";
import LoadoutScreen from "@/components/loadout/loadout-screen";
import { Footer } from "@/components/site-footer";
import { gameData } from "@/game/data";
import { GAME_VERSION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
    title: `${SITE_NAME} - Dauntless build planner`,
    description: SITE_TAGLINE,
};

interface HomeProps {
    searchParams: Promise<{ tab?: string; b?: string }>;
}

const Home = async ({ searchParams }: HomeProps) => {
    const { tab, b } = await searchParams;
    const isDatabase = tab === "database";
    const isSuggestions = tab === "suggestions";
    const isLiked = tab === "liked";
    const isBuilder = tab === "builder" || Boolean(b);

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
            ) : isBuilder ? (
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                            Loading loadout…
                        </div>
                    }
                >
                    <LoadoutScreen />
                </Suspense>
            ) : (
                <LandingPage />
            )}
        </main>
    );
};

export default Home;
