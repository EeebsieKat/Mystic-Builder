import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DatabaseBrowser from "@/components/browse-database";
import { VersionLabel } from "@/components/menu-ui";
import { gameData } from "@/game/data";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
    title: `Item database - ${SITE_NAME}`,
    description: SITE_TAGLINE,
};

/**
 * Item database. The page itself never scrolls: a fixed header strip and
 * one internal scroll region below it hold the whole browser.
 */
const DatabasePage = () => {
    const counts = [
        `${Object.keys(gameData.weapons).length} weapons`,
        `${Object.keys(gameData.armours).length} armour pieces`,
        `${Object.keys(gameData.cells).length} cells`,
        `${Object.keys(gameData.perks).length} perks`,
    ].join(" · ");

    return (
        <main className="flex min-h-0 flex-1 flex-col">
            {/* Fixed header strip */}
            <header className="relative z-10 shrink-0 border-b border-[#3a3f47]/60 bg-[rgba(10,12,16,0.85)]">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.14em] text-[#9aa2ae] transition-colors hover:text-[#e0a33e]"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        MENU
                    </Link>
                    <div className="hidden h-6 w-px bg-[#3a3f47]/80 sm:block" aria-hidden />
                    <div className="min-w-0">
                        <h1 className="lo-serif truncate text-[17px] font-semibold tracking-[0.12em] text-[#e8e4da]">
                            ITEM DATABASE
                        </h1>
                        <p className="truncate text-[11px] text-[#6f7783]">{counts} from the 1.14.7 game data</p>
                    </div>
                    <div className="ml-auto hidden md:block">
                        <VersionLabel />
                    </div>
                </div>
            </header>

            {/* Internal scroll region */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
                    <DatabaseBrowser />
                </section>
            </div>
        </main>
    );
};

export default DatabasePage;
