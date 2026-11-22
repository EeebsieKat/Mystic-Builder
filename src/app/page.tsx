import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import BuildSuggestions from "@/components/build-suggestions";
import DatabaseBrowser from "@/components/browse-database";
import LandingPage from "@/components/landing-page";
import { Footer } from "@/components/site-footer";
import { gameData } from "@/game/data";
import { GAME_VERSION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
    title: `${SITE_NAME} - Dauntless build planner`,
    description: SITE_TAGLINE,
    openGraph: {
        title: SITE_NAME,
        description: SITE_TAGLINE,
        siteName: SITE_NAME,
    },
    twitter: {
        card: "summary_large_image",
        title: SITE_NAME,
        description: SITE_TAGLINE,
    },
};

interface HomeProps {
    searchParams: Promise<{ tab?: string; b?: string; name?: string; n?: string }>;
}

const Home = async ({ searchParams }: HomeProps) => {
    const { tab, b, name, n } = await searchParams;
    const customName = name || n;
    const nameParam = customName ? `name=${encodeURIComponent(customName)}` : "";

    if (tab === "builder") {
        redirect(nameParam ? `/builder?${nameParam}` : "/builder");
    }
    if (b) {
        redirect(`/builder?b=${b}${nameParam ? `&${nameParam}` : ""}`);
    }

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
                <LandingPage />
            )}
        </main>
    );
};

export default Home;
