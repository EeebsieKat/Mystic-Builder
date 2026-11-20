import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ViewCounter } from "@/components/view-counter";
import { LoadoutScreen } from "@/components/loadout/loadout-screen";
import { buildSummary, buildTitle, parseBuildId } from "@/game/build-view";
import { elementColor, SITE_NAME } from "@/lib/site";

export const revalidate = 86400;

interface BuildPageProps {
    params: Promise<{ buildId: string }>;
}

export async function generateMetadata({ params }: BuildPageProps): Promise<Metadata> {
    const { buildId } = await params;
    const parsed = parseBuildId(buildId);

    if (!parsed) {
        return {
            title: `Invalid build - ${SITE_NAME}`,
            robots: { index: false },
        };
    }

    const title = buildTitle(parsed.view);
    const description = buildSummary(parsed.view);
    const themeColor = parsed.view.weapon ? elementColor(parsed.view.weapon.elemental) : "#f0b232";

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

const BuildPage = async ({ params }: BuildPageProps) => {
    const { buildId } = await params;
    const parsed = parseBuildId(buildId);

    if (!parsed) {
        return (
            <main className="flex h-dvh min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
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
<<<<<<< HEAD
        /* Share pages are documents-in-a-shell: the page never scrolls,
           the inner region does - the sticky header stays visible. */
        <main className="flex h-dvh min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
                    <div className="mb-6 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/builder">
                                    <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
                                    Builder
                                </Link>
                            </Button>
                            <Badge variant="outline">Dauntless {view.gameVersion}</Badge>
                            {view.upgraded ? (
                                <Badge variant="outline" className="border-sky-600/50 text-sky-400">
                                    Upgraded from an older build format
                                </Badge>
                            ) : null}
                            {view.invalid ? (
                                <Badge variant="outline" className="border-red-500/50 text-red-400">
                                    Possibly invalid
                                </Badge>
                            ) : null}
                            <ViewCounter buildId={view.buildId} />
                        </div>

                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                                    <Hammer className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                                    {buildTitle(view)}
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Shared build{" "}
                                    <code className="text-xs">{view.buildId.slice(0, 24)}…</code>
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <CopyLinkButton path={`/b/${view.buildId}`} />
                                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Link href={localEditPath(view.buildId)}>
                                        <Pencil className="mr-2 h-4 w-4" aria-hidden />
                                        Edit this build
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {view.invalid ? (
                        <Card className="mb-4 border-destructive/40 bg-destructive/5">
                            <CardContent className="p-4 text-sm text-destructive">
                                This build decoded, but some items or cells don&apos;t fit together. It might use content from a
                                newer Dauntless patch than the builder&apos;s dataset. Displaying it as-is.
                            </CardContent>
                        </Card>
                    ) : null}

                    <BuildDisplay view={view} />
                </div>
            </div>
=======
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
                <LoadoutScreen initialBuildId={buildId} />
            </Suspense>
>>>>>>> 03511302b138c57110588e09df9171cfdad17763
        </main>
    );
};

export default BuildPage;
