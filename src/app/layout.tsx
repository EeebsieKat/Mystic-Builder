import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Hammer, Github } from "lucide-react";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import { SITE_NAME, SITE_TAGLINE, getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

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
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden />
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/50 bg-primary/15 text-primary shadow-[0_0_14px_oklch(0.82_0.135_85/0.35)]">
                    <Hammer className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-primary">{SITE_NAME}</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground" aria-label="Main navigation">
                <Link href="/" className="transition-colors hover:text-foreground">
                    Builder
                </Link>
                <Link href="/?tab=database" className="transition-colors hover:text-foreground">
                    Database
                </Link>
                <a
                    href="https://github.com/atomicptr/dauntless-builder-reforged"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                    <Github className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Source data</span>
                </a>
            </nav>
        </div>
    </header>
);

const Footer = () => (
    <footer className="mt-auto border-t py-6">
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
                    className="underline underline-offset-4 hover:text-foreground"
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
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
                <Header />
                {children}
                <Footer />
                <Toaster />
            </body>
        </html>
    );
}
