import type { Metadata } from "next";
import { Suspense } from "react";
import UnifiedBuildsHub from "@/components/builds/unified-builds-hub";
import { Footer } from "@/components/site-footer";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
    title: `Community Builds - ${SITE_NAME}`,
    description: "Browse, like, comment on, and publish Dauntless 1.14.7 Mystic Paradox community builds.",
};

export default function CommunityPage() {
    return (
        <main className="flex w-full flex-1 flex-col">
            <Suspense fallback={null}>
                <UnifiedBuildsHub initialTab="community" />
            </Suspense>
            <Footer />
        </main>
    );
}
