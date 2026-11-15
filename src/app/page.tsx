import type { Metadata } from "next";
import { Suspense } from "react";
import { Database } from "lucide-react";

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
        <main className="mystic-glow mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            <section className="flex flex-col items-center gap-3 text-center">
                <p className="panel-label">
                    Dauntless {GAME_VERSION} - Mystic Paradox revival
                </p>
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                    Plan builds in the dark.{" "}
                    <span className="text-primary">Share them with the light.</span>
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    {SITE_NAME} is a full Dauntless build planner: pick your weapon, armour, lantern, omnicell and
                    cells, then share a link that renders as a rich embed card in Discord.
                </p>
                <p className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5" aria-hidden />
                        {Object.keys(gameData.weapons).length} weapons, {Object.keys(gameData.armours).length} armour
                        pieces, {Object.keys(gameData.cells).length} cells, {Object.keys(gameData.perks).length} perks
                    </span>
                </p>
            </section>

            <section className="mt-8" aria-label="Build planner and database">
                <div className="gold-rule mb-6" aria-hidden />
                <Tabs defaultValue={defaultTab}>
                    <TabsList className="grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
                        <TabsTrigger value="builder">Builder</TabsTrigger>
                        <TabsTrigger value="database">Item database</TabsTrigger>
                    </TabsList>
                    <TabsContent value="builder" className="mt-4">
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
                    <TabsContent value="database" className="mt-4">
                        <DatabaseBrowser />
                    </TabsContent>
                </Tabs>
            </section>
        </main>
    );
};

export default Home;
