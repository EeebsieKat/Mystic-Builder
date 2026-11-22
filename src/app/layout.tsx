import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import SiteHeader from "@/components/site-header";
import PageTransition from "@/components/page-transition";
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
        title: "mystic Builder",
        description: SITE_TAGLINE,
        url: siteUrl,
        siteName: "mystic Builder",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "mystic Builder",
        description: SITE_TAGLINE,
    },
    robots: { index: true, follow: true },
};

export const viewport: Viewport = {
    themeColor: "#050a12",
    colorScheme: "dark",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`dark ${cinzel.variable} ${inter.variable}`} suppressHydrationWarning>
            <body className="relative flex min-h-screen flex-col bg-background text-foreground antialiased">
                <SiteHeader />
                <PageTransition>
                    {children}
                </PageTransition>
                <Toaster />
                <AdPopups />
            </body>
        </html>
    );
}

