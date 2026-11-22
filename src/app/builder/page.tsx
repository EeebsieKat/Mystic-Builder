import type { Metadata } from "next";
import { Suspense } from "react";

import LoadoutScreen from "@/components/loadout/loadout-screen";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
    title: `Loadout Builder - ${SITE_NAME}`,
    description: SITE_TAGLINE,
};

export default function BuilderPage() {
    return (
        <main className="flex w-full flex-1 flex-col">
            <Suspense
                fallback={
                    <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                        Loading loadout…
                    </div>
                }
            >
                <LoadoutScreen />
            </Suspense>
        </main>
    );
}
