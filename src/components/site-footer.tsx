import Link from "next/link";
import { Database, Github, Info } from "lucide-react";
import { DISCORD_URL, SITE_NAME } from "@/lib/site";

const DiscordIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
    <svg
        role="img"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
);

export const Footer = () => (
    <footer className="relative mt-auto border-t py-6">
        <div className="gold-rule absolute inset-x-0 top-0 opacity-60" aria-hidden />
        <div className="flex w-full flex-col items-center justify-between gap-3 px-6 sm:px-10 md:px-[150px] text-xs text-muted-foreground sm:flex-row">
            <p>
                {SITE_NAME} - a fan-made Dauntless build planner for the 1.14.7{" "}
                <a
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 transition-colors hover:text-primary"
                >
                    Mystic Paradox revival
                </a>
                . Dauntless and all related assets are property of Phoenix Labs.
            </p>
            <div className="flex flex-wrap items-center gap-4">
                <a
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 underline underline-offset-4 transition-colors hover:text-primary"
                >
                    <DiscordIcon className="h-3.5 w-3.5" />
                    Discord
                </a>
                <span>•</span>
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
