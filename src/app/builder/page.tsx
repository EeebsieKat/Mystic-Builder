import type { Metadata } from "next";
import { Suspense } from "react";

import LoadoutScreen from "@/components/loadout/loadout-screen";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
    title: `Loadout builder - ${SITE_NAME}`,
    description: SITE_TAGLINE,
};

/**
 * The Awakening loadout builder. Occupies the full viewport - the stage
 * scales itself and all chrome (version, links, site info) lives inside
 * the screen itself.
 */
const BuilderPage = () => (
    <main className="min-h-0 flex-1">
        <Suspense
            fallback={
                <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
                    Loading loadout…
                </div>
            }
        >
            <LoadoutScreen />
        </Suspense>
    </main>
);

export default BuilderPage;
