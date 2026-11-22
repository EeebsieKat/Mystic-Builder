import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import NavLinks from "@/components/site-nav-links";
import AdPopups from "@/components/ad-popups";
import { SITE_NAME, SITE_TAGLINE, getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

/* Mystic Paradox Launcher Typography: Cinzel display serif + Inter UI text. */
const cinzel = Cinzel({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
    variable: "--font-display",
    display: "swap",
});

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-body",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: `${SITE_NAME} - Dauntless build planner & Discord link previews`,
        template: `%s - ${SITE_NAME}`,
    },
    description: SITE_TAGLINE,
    icons: {
        icon: '/icon.png',
    },
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
    themeColor: "#050a12",
    colorScheme: "dark",
};

const Header = () => (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg)]/60">
        <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden />
        <div className="relative flex h-14 w-full items-center justify-between px-6 lg:px-10">
            <Link href="/" className="group flex items-center gap-2.5 font-semibold tracking-tight">
                <img alt="Mystic Paradox Logo" width="50" src="/assets/awakening-ui/logo/icon.png" />
                <span className="whitespace-nowrap text-base sm:text-lg">
                    <span className="text-gold-gradient font-display font-bold">Mystic</span>{" "}
                    <span className="text-foreground font-display font-bold">Builder</span>
                </span>
            </Link>
            <nav
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm"
                aria-label="Main navigation"
            >
                <Suspense fallback={null}>
                    <NavLinks />
                </Suspense>
            </nav>
        </div>
    </header>
);

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`dark ${cinzel.variable} ${inter.variable}`} suppressHydrationWarning>
            <body className="relative flex min-h-screen flex-col bg-background text-foreground antialiased">
                <Header />
                <div className="relative flex flex-1 flex-col">
                    {children}
                </div>
                <Toaster />
                <AdPopups />
            </body>
        </html>
    );
}

