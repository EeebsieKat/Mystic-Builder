"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Database, Hammer, Heart, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header nav links with an active pill state. Split into a client component
 * so the root layout stays a server component.
 */
const NavLinks = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const databaseActive = pathname === "/" && searchParams.get("tab") === "database";
    const suggestionsActive = pathname === "/" && searchParams.get("tab") === "suggestions";
    const likedActive = pathname === "/" && searchParams.get("tab") === "liked";
    const builderActive =
        pathname === "/builder" ||
        pathname === "/builer" ||
        (pathname === "/" && (searchParams.get("tab") === "builder" || searchParams.has("b"))) ||
        pathname.startsWith("/b/");
    const aboutActive = pathname === "/about";

    const navItems = [
        { href: "/builder", label: "Builder", icon: Hammer, active: builderActive },
        { href: "/?tab=database", label: "Item Database", icon: Database, active: databaseActive },
        { href: "/?tab=suggestions", label: "Meta Builds", icon: Lightbulb, active: suggestionsActive },
        { href: "/?tab=liked", label: "Liked Builds", icon: Heart, active: likedActive },
        { href: "/about", label: "About", icon: Info, active: aboutActive },
    ];

    return (
        <>
            {navItems.map(({ href, label, icon: Icon, active }) => (
                <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                        "flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[13.5px] font-[560] transition-all duration-200 border",
                        active
                            ? "border-[var(--aether-line)] bg-[var(--aether-a10)] text-white shadow-xs [&>svg]:text-[var(--aether-hi)]"
                            : "border-transparent text-[var(--ink-2)] hover:border-[var(--line)] hover:bg-white/[0.045] hover:text-white [&>svg]:text-[var(--ink-3)]",
                    )}
                >
                    <Icon className="h-3.5 w-3.5 transition-colors" />
                    <span>{label}</span>
                </Link>
            ))}
        </>
    );
};

export default NavLinks;
