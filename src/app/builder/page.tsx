import type { Metadata } from "next";
import { Suspense } from "react";

import LoadoutScreen, { DEFAULT_BUILD_ID, DEFAULT_BUILD_NAME } from "@/components/loadout/loadout-screen";
import { SITE_TAGLINE } from "@/lib/site";

interface BuilderPageProps {
    searchParams?: Promise<{ b?: string; name?: string; n?: string }>;
}

export async function generateMetadata({ searchParams }: BuilderPageProps): Promise<Metadata> {
    const sp = await searchParams;
    const customName = sp?.name || sp?.n;
    return {
        title: customName ? customName : DEFAULT_BUILD_NAME,
        description: SITE_TAGLINE,
    };
}

export default async function BuilderPage({ searchParams }: BuilderPageProps) {
    const sp = await searchParams;
    const initialBuildId = sp?.b || DEFAULT_BUILD_ID;
    const initialName = sp?.name || sp?.n || (sp?.b ? undefined : DEFAULT_BUILD_NAME);

    return (
        <main className="flex w-full flex-1 flex-col">
            <Suspense
                fallback={
                    <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                        Loading loadout…
                    </div>
                }
            >
                <LoadoutScreen initialBuildId={initialBuildId} initialName={initialName} />
            </Suspense>
        </main>
    );
}
