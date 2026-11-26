import type { Metadata } from "next";
import { Suspense } from "react";
import UnifiedBuildsHub, { type BuildsHubTab } from "@/components/builds/unified-builds-hub";
import { Footer } from "@/components/site-footer";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
    title: `Builds & Community - ${SITE_NAME}`,
    description:
        "Browse official Reforged meta builds, Slayer-shared community builds, and your liked loadouts for Dauntless 1.14.7 Mystic Paradox.",
};

interface BuildsPageProps {
    searchParams: Promise<{ tab?: string }>;
}

export default async function BuildsPage({ searchParams }: BuildsPageProps) {
    const { tab } = await searchParams;
    const initialTab: BuildsHubTab =
        tab === "community" ? "community" : tab === "liked" ? "liked" : "meta";

    return (
        <main className="flex w-full flex-1 flex-col">
            <Suspense fallback={null}>
                <UnifiedBuildsHub initialTab={initialTab} />
            </Suspense>
            <Footer />
        </main>
    );
}
