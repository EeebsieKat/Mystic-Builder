import type { Metadata } from "next";
import Link from "next/link";
import {
    Code2,
    Database,
    ExternalLink,
    FileText,
    Github,
    Globe,
    Palette,
    Scale,
    ShieldAlert,
    Sparkles,
} from "lucide-react";

import Footer from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GAME_VERSION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
    title: `About & Licenses - ${SITE_NAME}`,
    description: `Licensing information, services, and third-party attributions for ${SITE_NAME}.`,
};

const LICENSES = [
    {
        name: "GNU Affero General Public License v3.0 (AGPL-3.0)",
        role: "Mystic Builder Core License",
        description:
            "Mystic Builder is free, open-source software. You are free to inspect, modify, run, and distribute this software under the terms of the GNU AGPL v3 license. Any network-hosted modifications must also make their source code available.",
        url: "https://www.gnu.org/licenses/agpl-3.0.html",
        badge: "AGPL-3.0",
    },
    {
        name: "Phoenix Labs Intellectual Property Notice",
        role: "Game Copyright & Trademark",
        description:
            "Dauntless, all behemoths, weapons, armours, icons, and related artwork are copyright and property of Phoenix Labs. Mystic Builder is a fan-made, non-commercial community tool and is not affiliated with or endorsed by Phoenix Labs.",
        url: "https://playdauntless.com",
        badge: "Copyright Phoenix Labs",
    },
    {
        name: "dauntless-builder-reforged Data Attribution",
        role: "Game Data Source & Schema",
        description:
            "Raw game dataset (weapons, armours, cells, perks, unique effects) and legacy calculation models are adapted from the open-source dauntless-builder-reforged project created by Christopher Kaster (atomicptr).",
        url: "https://github.com/atomicptr/dauntless-builder-reforged",
        badge: "AGPL-3.0 / Public Domain",
    },
];

export default function AboutPage() {
    return (
        <main className="flex w-full flex-1 flex-col">
            <section className="mystic-glow w-full flex-1 px-6 py-12 lg:px-12">
                {/* Header */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="panel-label">Dauntless {GAME_VERSION} - Mystic Paradox</p>
                    <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-5xl">
                        About <span className="text-gold-gradient">{SITE_NAME}</span>
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {SITE_TAGLINE}. A dark-mode build calculator, armory database, and Discord share card generator
                        built with love for the Dauntless community.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Button asChild variant="outline" size="sm" className="gap-2">
                            <a
                                href="https://github.com/EeebsieKat/Mystic-Builder"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github className="h-4 w-4" />
                                GitHub Repository
                                <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                        </Button>
                        <Button asChild variant="default" size="sm" className="gap-2">
                            <Link href="/">
                                Open Build Planner →
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="gold-rule my-10" aria-hidden />

                <div className="mx-auto flex max-w-5xl flex-col gap-12">
                    {/* Project Mission */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Code2 className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                Project Overview
                            </h2>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                            Mystic Builder was designed to provide Dauntless Slayers with a faithful, full-screen loadout
                            experience inspired by the Awakening user interface. It allows players to plan complete Slayer
                            builds—including weapons, bonded legendary weapons, head, torso, arms, and legs armour, lanterns,
                            omnicells, and consumable tonics/pylons—with live perk summaries, power/resistance ratings, and
                            instant URL shareability with Discord rich embed previews.
                        </p>
                    </div>

                    {/* Licenses & Legal Disclaimers */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <Scale className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                Licenses & Legal Notices
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                            {LICENSES.map(item => (
                                <Card key={item.name} className="flex flex-col justify-between border-border/70 bg-card/80 backdrop-blur-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge variant="secondary" className="text-[10px] font-semibold">
                                                {item.badge}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base font-bold text-foreground pt-1.5">
                                            {item.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs font-medium text-primary">
                                            {item.role}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-1 flex-col justify-between gap-4">
                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                            {item.description}
                                        </p>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:underline"
                                        >
                                            View Official Reference
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Disclaimer Box */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-xs leading-relaxed text-amber-200/90 sm:p-5">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-amber-300">Disclaimer of Affiliation</span>
                                <p>
                                    Mystic Builder is not affiliated with, authorized, maintained, or endorsed by Phoenix Labs
                                    or Epic Games. All game trademarks, behemoth identities, and visual assets are registered
                                    trademarks of their respective owners. This project operates as a non-commercial utility
                                    under the GNU Affero General Public License v3.0.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
}
