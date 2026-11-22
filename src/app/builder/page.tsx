import type { Metadata } from "next";
import { Suspense } from "react";

import LoadoutScreen from "@/components/loadout/loadout-screen";
import { DEFAULT_BUILD_ID, DEFAULT_BUILD_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface BuilderPageProps {
    searchParams?: Promise<{ b?: string; name?: string; n?: string }>;
}

export async function generateMetadata({ searchParams }: BuilderPageProps): Promise<Metadata> {
    const sp = searchParams ? await searchParams : undefined;
    const customName = sp?.name || sp?.n;
    const rawTitle = customName ? customName : DEFAULT_BUILD_NAME;
    const fullTitle = `${rawTitle} - ${SITE_NAME}`;
    return {
        title: {
            absolute: fullTitle,
        },
        description: SITE_TAGLINE,
        openGraph: {
            title: fullTitle,
            description: SITE_TAGLINE,
            siteName: SITE_NAME,
        },
        twitter: {
            card: "summary_large_image",
            title: fullTitle,
            description: SITE_TAGLINE,
        },
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
