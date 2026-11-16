"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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

    return (
        <>
            <Link
                href="/"
                aria-current={builderActive ? "page" : undefined}
                className={cn(
                    "rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-accent/60 hover:text-foreground",
                    builderActive
                        ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.82_0.135_85/0.35)]"
                        : "text-muted-foreground",
                )}
            >
                Builder
            </Link>
            <Link
                href="/?tab=database"
                aria-current={databaseActive ? "page" : undefined}
                className={cn(
                    "rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-accent/60 hover:text-foreground",
                    databaseActive
                        ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.82_0.135_85/0.35)]"
                        : "text-muted-foreground",
                )}
            >
                Database
            </Link>
        </>
    );
};

export default NavLinks;
