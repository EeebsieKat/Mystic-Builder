import type { Metadata } from "next";
import { Suspense } from "react";
import { Database, Hammer, Swords, Shield, Sparkles, Puzzle } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BuildEditor from "@/components/builder/build-editor";
import DatabaseBrowser from "@/components/browse-database";
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
    const defaultTab = tab === "database" ? "database" : "builder";

    return (
        <main className="mystic-glow mx-auto w-full max-w-6xl flex-1 px-4 py-10">
            <section className="flex flex-col items-center gap-4 text-center">
                <span
                    className="mystic-pulse flex h-12 w-12 rotate-45 items-center justify-center rounded-lg border border-primary/60 bg-primary/15 text-primary"
                    aria-hidden
                >
                    <Hammer className="h-5 w-5 -rotate-45" />
                </span>
                <p className="panel-label">
                    Dauntless {GAME_VERSION} - Mystic Paradox revival
                </p>
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                    Plan builds in the dark.{" "}
                    <span className="text-gold-gradient">Share them with the light.</span>
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {SITE_NAME} is a full Dauntless build planner: pick your weapon, armour, lantern, omnicell and
                    cells, then share a link that renders as a rich embed card in Discord.
                </p>
                <ul className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                    {(
                        [
                            [Swords, `${Object.keys(gameData.weapons).length} weapons`],
                            [Shield, `${Object.keys(gameData.armours).length} armour pieces`],
                            [Puzzle, `${Object.keys(gameData.cells).length} cells`],
                            [Sparkles, `${Object.keys(gameData.perks).length} perks`],
                        ] as const
                    ).map(([Icon, label]) => (
                        <li
                            key={label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/50 px-3 py-1 backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                            <Icon className="h-3.5 w-3.5 text-primary/80" aria-hidden />
                            {label}
                        </li>
                    ))}
                    <li className="sr-only">
                        <Database aria-hidden />
                    </li>
                </ul>
            </section>

            <section className="mt-8" aria-label="Build planner and database">
                <div className="gold-rule mb-8" aria-hidden />
                <Tabs defaultValue={defaultTab}>
                    <div className="flex justify-center">
                        <TabsList className="grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
                            <TabsTrigger value="builder">
                                <Hammer className="h-4 w-4" aria-hidden />
                                Builder
                            </TabsTrigger>
                            <TabsTrigger value="database">
                                <Database className="h-4 w-4" aria-hidden />
                                Item database
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="builder" className="mt-6">
                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                                    Loading builder…
                                </div>
                            }
                        >
                            <BuildEditor />
                        </Suspense>
                    </TabsContent>
                    <TabsContent value="database" className="mt-6">
                        <DatabaseBrowser />
                    </TabsContent>
                </Tabs>
            </section>
        </main>
    );
};

export default Home;
