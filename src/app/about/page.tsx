import type { Metadata } from "next";
import Link from "next/link";
import {
    Code2,
    Database,
    ExternalLink,
    FileText,
    Github,
    Globe,
    Layers,
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

const SERVICES_AND_TECH = [
    {
        category: "Cloud & Deployment",
        items: [
            {
                name: "GitHub",
                description: "Source code repository hosting, version control, and collaborative development.",
                url: "https://github.com/EeebsieKat/Mystic-Builder",
                license: "Service",
            },
            {
                name: "Netlify",
                description: "Global edge CDN deployment, serverless functions, and Netlify Blobs for dynamic Open Graph social cards.",
                url: "https://www.netlify.com",
                license: "Service",
            },
            {
                name: "SQLite",
                description: "Self-contained, serverless embedded database engine for build persistence and view counters.",
                url: "https://www.sqlite.org",
                license: "Public Domain",
            },
        ],
    },
    {
        category: "Frontend Framework & Libraries",
        items: [
            {
                name: "Next.js 16 & React 19",
                description: "Full-stack React framework utilizing the modern App Router, React Server Components, and streaming.",
                url: "https://nextjs.org",
                license: "MIT License",
            },
            {
                name: "Tailwind CSS 4",
                description: "Utility-first CSS framework providing modern color spaces (OKLCH), layout composition, and responsive styling.",
                url: "https://tailwindcss.com",
                license: "MIT License",
            },
            {
                name: "shadcn/ui & Radix UI",
                description: "Accessible, unstyled UI primitives powering modals, tabs, dialogs, drawers, and input controls.",
                url: "https://ui.shadcn.com",
                license: "MIT License",
            },
            {
                name: "Prisma ORM",
                description: "Next-generation TypeScript ORM used for type-safe database migrations and SQLite querying.",
                url: "https://www.prisma.io",
                license: "Apache 2.0",
            },
            {
                name: "Lucide Icons",
                description: "Beautiful and consistent open-source iconography used throughout the interface.",
                url: "https://lucide.dev",
                license: "ISC License",
            },
        ],
    },
    {
        category: "Game Assets & Extraction Tools",
        items: [
            {
                name: "CUE4Parse",
                description: "High-performance .NET Unreal Engine 4 package parser used in tools/pak-extract to parse game PAK files and extract consumable icons.",
                url: "https://github.com/FabianFG/CUE4Parse",
                license: "Apache 2.0",
            },
            {
                name: "Google Fonts (Cinzel & Source Sans 3)",
                description: "Trajan-style classical serif for Awakening loadout titles alongside clean sans-serif for numbers and descriptions.",
                url: "https://fonts.google.com",
                license: "SIL Open Font License",
            },
        ],
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

                    {/* Services & Technology Stack */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                Services & Technology Stack
                            </h2>
                        </div>

                        <div className="flex flex-col gap-8">
                            {SERVICES_AND_TECH.map(section => (
                                <div key={section.category} className="flex flex-col gap-3">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        {section.category}
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {section.items.map(item => (
                                            <div
                                                key={item.name}
                                                className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/15 p-4 transition-colors hover:border-primary/40 hover:bg-muted/25"
                                            >
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-semibold text-sm text-foreground">
                                                            {item.name}
                                                        </span>
                                                        <span className="rounded-md border border-border/60 bg-background/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                            {item.license}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <div className="pt-3">
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                                    >
                                                        Official Website
                                                        <ExternalLink className="h-3 w-3 opacity-70" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
