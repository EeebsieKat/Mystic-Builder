import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Database, Hammer } from "lucide-react";

import DatabaseBrowser from "@/components/browse-database";
import LoadoutScreen from "@/components/loadout/loadout-screen";
import { gameData } from "@/game/data";
import { GAME_VERSION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
    title: `${SITE_NAME} - Dauntless build planner`,
    description: SITE_TAGLINE,
};

interface HomeProps {
    searchParams: Promise<{ tab?: string }>;
}

const Home = async ({ searchParams }: HomeProps) => {
    const { tab } = await searchParams;
    const isDatabase = tab === "database";

    return (
        <main className="flex w-full flex-1 flex-col">
            {/* Tab switcher - slim bar so the loadout stage owns the viewport. */}
            <div className="border-b border-border/60 bg-background/70">
                <div className="mx-auto flex h-[46px] w-full max-w-6xl items-center justify-between px-4">
                    <p className="panel-label !text-[10px]">
                        Dauntless {GAME_VERSION} - Mystic Paradox revival
                    </p>
                    <nav className="flex items-center gap-1 text-sm" aria-label="Builder and database">
                        <Link
                            href="/"
                            prefetch={false}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                                !isDatabase
                                    ? "bg-primary/15 text-primary"
                                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                            }`}
                            aria-current={!isDatabase ? "page" : undefined}
                        >
                            <Hammer className="h-3.5 w-3.5" aria-hidden />
                            Loadout
                        </Link>
                        <Link
                            href="/?tab=database"
                            prefetch={false}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                                isDatabase
                                    ? "bg-primary/15 text-primary"
                                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                            }`}
                            aria-current={isDatabase ? "page" : undefined}
                        >
                            <Database className="h-3.5 w-3.5" aria-hidden />
                            Item database
                        </Link>
                    </nav>
                </div>
            </div>

            {isDatabase ? (
                <section className="mystic-glow mx-auto w-full max-w-6xl flex-1 px-4 py-10">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <p className="panel-label">Dauntless {GAME_VERSION} - Mystic Paradox revival</p>
                        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                            Every weapon, armour piece, cell and perk in the database.
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
    );
};

export default Home;
