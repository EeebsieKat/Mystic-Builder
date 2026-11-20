"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Database, Hammer, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header nav links with an active pill state. Split into a client component
 * so the root layout stays a server component.
 */
const NavLinks = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const databaseActive = pathname === "/" && searchParams.get("tab") === "database";
    const builderActive = pathname === "/" && !databaseActive;
    const aboutActive = pathname === "/about";

    return (
        <>
            <Link
                href="/"
                aria-current={builderActive ? "page" : undefined}
                className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-accent/60 hover:text-foreground",
                    builderActive
                        ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.82_0.135_85/0.35)]"
                        : "text-muted-foreground",
                )}
            >
                <Hammer className="h-3.5 w-3.5" />
                <span>Builder</span>
            </Link>
            <Link
                href="/?tab=database"
                aria-current={databaseActive ? "page" : undefined}
                className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-accent/60 hover:text-foreground",
                    databaseActive
                        ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.82_0.135_85/0.35)]"
                        : "text-muted-foreground",
                )}
            >
                <Database className="h-3.5 w-3.5" />
                <span>Database</span>
            </Link>
            <Link
                href="/about"
                aria-current={aboutActive ? "page" : undefined}
                className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-accent/60 hover:text-foreground",
                    aboutActive
                        ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.82_0.135_85/0.35)]"
                        : "text-muted-foreground",
                )}
            >
                <Info className="h-3.5 w-3.5" />
                <span>About</span>
            </Link>
        </>
    );
};

export default NavLinks;
