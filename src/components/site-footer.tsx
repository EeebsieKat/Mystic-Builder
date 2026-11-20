import Link from "next/link";
import { Database, Github, Info } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export const Footer = () => (
    <footer className="relative mt-auto border-t py-6">
        <div className="gold-rule absolute inset-x-0 top-0 opacity-60" aria-hidden />
        <div className="flex w-full flex-col items-center justify-between gap-3 px-6 sm:px-10 md:px-[150px] text-xs text-muted-foreground sm:flex-row">
            <p>
                {SITE_NAME} - a fan-made Dauntless build planner for the 1.14.7 Mystic Paradox revival. Dauntless and
                all related assets are property of Phoenix Labs.
            </p>
            <div className="flex flex-wrap items-center gap-4">
                <Link
                    href="/about"
                    className="inline-flex items-center gap-1.5 underline underline-offset-4 transition-colors hover:text-primary"
                >
                    <Info className="h-3.5 w-3.5" />
                    About & Licenses
                </Link>
                <span>•</span>
                <a
                    href="https://github.com/atomicptr/dauntless-builder-reforged"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 underline underline-offset-4 transition-colors hover:text-primary"
                >
                    <Database className="h-3.5 w-3.5" />
                    Game Data (AGPL-3.0)
                </a>
                <span>•</span>
                <a
                    href="https://github.com/EeebsieKat/Mystic-Builder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 underline underline-offset-4 transition-colors hover:text-primary"
                >
                    <Github className="h-3.5 w-3.5" />
                    Source Code
                </a>
            </div>
        </div>
    </footer>
);

export default Footer;
