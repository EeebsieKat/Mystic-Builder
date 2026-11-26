import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Hammer, Flame, Database, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/site-footer";
import { DISCORD_URL } from "@/lib/site";

export const metadata: Metadata = {
    title: "404 - Lost in the Maelstrom",
    description: "The page or slayer build you are looking for does not exist in the Shattered Isles.",
};

export default function NotFound() {
    return (
        <div className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-between overflow-hidden bg-background">
            {/* Ambient aetheric glow backdrop */}
            <div
                className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12)_0%,rgba(14,165,233,0.04)_40%,transparent_70%)] blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute top-1/3 left-1/2 h-[350px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0%,transparent_70%)] blur-2xl"
                aria-hidden="true"
            />

            {/* Main 404 content */}
            <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
                {/* Floating Rune / Compass Emblem */}
                <div className="relative mb-6 flex items-center justify-center">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-amber-500/20 blur-md" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 shadow-[0_0_30px_rgba(56,189,248,0.2)] backdrop-blur-md">
                        <Compass className="h-10 w-10 text-sky-400 animate-pulse" />
                    </div>
                </div>

                {/* Big stylized 404 */}
                <h1 className="font-display text-7xl font-extrabold tracking-wider sm:text-8xl md:text-9xl bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                    404
                </h1>

                {/* Title */}
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl font-display">
                    Coordinates Vanished in the Maelstrom
                </h2>

                {/* Subtitle */}
                <p className="mt-4 max-w-lg text-sm text-muted-foreground sm:text-base leading-relaxed">
                    The floating island, slayer loadout, or archive you are searching for has drifted into the dark void or never existed.
                </p>

                {/* Navigation actions */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/builder">
                            <Hammer className="h-4 w-4" />
                            Open Build Planner
                        </Link>
                    </Button>

                    <Button asChild variant="outline" size="lg" className="gap-2">
                        <Link href="/builds">
                            <Flame className="h-4 w-4 text-amber-400" />
                            Browse Builds & Community
                        </Link>
                    </Button>

                    <Button asChild variant="outline" size="lg" className="gap-2">
                        <Link href="/?tab=database">
                            <Database className="h-4 w-4 text-sky-400" />
                            Item Database
                        </Link>
                    </Button>
                </div>

                {/* Quick back link & Discord helper */}
                <div className="mt-8 flex flex-col items-center gap-3 text-xs text-muted-foreground sm:flex-row sm:gap-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Landing Page
                    </Link>
                    <span className="hidden sm:inline opacity-40">•</span>
                    <a
                        href={DISCORD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-primary underline underline-offset-4"
                    >
                        Report broken link on Discord
                    </a>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
