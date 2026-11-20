import type { Metadata, Viewport } from "next";
import { Cinzel, Source_Sans_3 } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
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
    themeColor: "#10151f",
    colorScheme: "dark",
};

/*
 * Application shell: no site-wide header/footer and no page-level
 * scrolling. Every route fills the viewport and manages its own internal
 * scroll regions; the shared chrome lives in the menu-ui kit and the
 * loadout stage.
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`dark ${cinzel.variable} ${sourceSans.variable}`} suppressHydrationWarning>
            <body className="flex h-dvh flex-col overflow-hidden bg-background text-foreground antialiased">
                {children}
                <Toaster />
            </body>
        </html>
    );
}
