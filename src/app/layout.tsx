import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Cinzel, Source_Sans_3 } from "next/font/google";
import { Github, Hammer } from "lucide-react";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import NavLinks from "@/components/site-nav-links";
import { SITE_NAME, SITE_TAGLINE, getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

/* Awakening loadout typography: Trajan-style display serif + clean UI sans. */
const cinzel = Cinzel({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-display",
    display: "swap",
});

const sourceSans = Source_Sans_3({
    subsets: ["latin"],
    weight: ["300", "400", "600", "700"],
    variable: "--font-ui",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: `${SITE_NAME} - Dauntless build planner & Discord link previews`,
        template: `%s - ${SITE_NAME}`,
    },
    description: SITE_TAGLINE,
    keywords: ["Dauntless", "Dauntless Builder", "build planner", "Mystic Paradox", "Discord embed", "Open Graph"],
    openGraph: {
        title: SITE_NAME,
        description: SITE_TAGLINE,
        url: siteUrl,
        siteName: SITE_NAME,
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
    },
    robots: { index: true, follow: true },
};

export const viewport: Viewport = {
    themeColor: "#10151f",
    colorScheme: "dark",
};

const Header = () => (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden />
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
            <Link href="/" className="group flex items-center gap-2.5 font-semibold tracking-tight">
                <span
                    className="mystic-pulse flex h-8 w-8 rotate-45 items-center justify-center rounded-md border border-primary/60 bg-primary/15 text-primary transition-transform duration-300 group-hover:rotate-[50deg]"
                    aria-hidden
                >
                    <Hammer className="h-4 w-4 -rotate-45" />
                </span>
                <span className="whitespace-nowrap text-base sm:text-lg">
                    <span className="text-gold-gradient">Mystic</span>{" "}
                    <span className="text-foreground">Builder</span>
                </span>
            </Link>
            <nav
                className="flex items-center gap-1 text-sm"
                aria-label="Main navigation"
            >
                <Suspense fallback={null}>
                    <NavLinks />
                </Suspense>
                <a
                    href="https://github.com/atomicptr/dauntless-builder-reforged"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition-all duration-200 hover:bg-accent/60 hover:text-foreground"
                >
                    <Github className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Source data</span>
                </a>
            </nav>
        </div>
    </header>
);

const Footer = () => (
    <footer className="relative mt-auto border-t py-6">
        <div className="gold-rule absolute inset-x-0 top-0 opacity-60" aria-hidden />
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row">
            <p>
                {SITE_NAME} - a fan-made Dauntless build planner for the 1.14.7 Mystic Paradox revival. Dauntless and
                all related assets are property of Phoenix Labs.
            </p>
            <p>
                Game data from{" "}
                <a
                    href="https://github.com/atomicptr/dauntless-builder-reforged"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 transition-colors hover:text-primary"
                >
                    dauntless-builder-reforged
                </a>{" "}
                (AGPL-3.0, data public domain).
            </p>
        </div>
    </footer>
);

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`dark ${cinzel.variable} ${sourceSans.variable}`} suppressHydrationWarning>
            <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
                <Header />
                {children}
                <Footer />
                <Toaster />
            </body>
        </html>
    );
}
