import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ViewCounter } from "@/components/view-counter";
import { LoadoutScreen } from "@/components/loadout/loadout-screen";
import { buildSummary, buildTitle, parseBuildId } from "@/game/build-view";
import { elementColor, SITE_NAME } from "@/lib/site";
import { OG_GOLD } from "@/lib/og-theme";

export const revalidate = 86400;

interface BuildPageProps {
    params: Promise<{ buildId: string }>;
    searchParams?: Promise<{ name?: string; n?: string }>;
}

export async function generateMetadata({ params, searchParams }: BuildPageProps): Promise<Metadata> {
    const { buildId } = await params;
    const sp = await searchParams;
    const customName = sp?.name || sp?.n;
    const parsed = parseBuildId(buildId);

    if (!parsed) {
        return {
            title: `Invalid build - ${SITE_NAME}`,
            robots: { index: false },
        };
    }

    const title = customName ? customName : buildTitle(parsed.view);
    const description = buildSummary(parsed.view);
    const themeColor = parsed.view.weapon ? elementColor(parsed.view.weapon.elemental) : OG_GOLD;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            siteName: SITE_NAME,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        other: {
            "theme-color": themeColor,
        },
    };
}

const BuildPage = async ({ params, searchParams }: BuildPageProps) => {
    const { buildId } = await params;
    const sp = await searchParams;
    const customName = sp?.name || sp?.n;
    const parsed = parseBuildId(buildId);

    if (!parsed) {
        return (
            <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
                <TriangleAlert className="h-14 w-14 text-primary" aria-hidden />
                <h1 className="text-2xl font-bold">This build link could not be decoded</h1>
                <p className="text-muted-foreground">
                    The link either points to an empty build, uses an unsupported format, or got mangled somewhere
                    along the way. Double-check that the whole <code>/b/...</code> part is intact.
                </p>
                <Button asChild>
                    <Link href="/builder">
                        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                        Back to the builder
                    </Link>
                </Button>
            </main>
        );
    }

    const { view } = parsed;

    return (
        <main className="flex w-full flex-1 flex-col">
            <div className="sr-only">
                <ViewCounter buildId={view.buildId} />
            </div>
            <Suspense
                fallback={
                    <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                        Loading loadout…
                    </div>
                }
            >
                <LoadoutScreen initialBuildId={buildId} initialName={customName} />
            </Suspense>
        </main>
    );
};

export default BuildPage;
