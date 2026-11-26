"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Compass, Database, ExternalLink, Globe, Hammer, Info, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header nav links with an active pill state. Split into a client component
 * so the root layout stays a server component.
 */
interface NavLinksProps {
    mobile?: boolean;
    onNavigate?: () => void;
}

const NavLinks = ({ mobile = false, onNavigate }: NavLinksProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const databaseActive = pathname === "/" && searchParams.get("tab") === "database";
    const buildsActive =
        pathname.startsWith("/builds") ||
        pathname.startsWith("/community") ||
        (pathname === "/" && (searchParams.get("tab") === "suggestions" || searchParams.get("tab") === "liked"));
    const builderActive =
        pathname === "/builder" ||
        pathname === "/builer" ||
        (pathname === "/" && (searchParams.get("tab") === "builder" || searchParams.has("b"))) ||
        pathname.startsWith("/b/");
    const aboutActive = pathname === "/about";

    const navItems = [
        { href: "/builder", label: "Builder", icon: Hammer, active: builderActive },
        { href: "/?tab=database", label: "Item Database", icon: Database, active: databaseActive },
        { href: "/builds", label: "Builds", icon: Compass, active: buildsActive },
        { href: "/about", label: "About", icon: Info, active: aboutActive },
        {
            href: "https://mysticparadox.com",
            label: "Main Website",
            icon: Globe,
            external: true,
        },
    ];

    return (
        <>
            {navItems.map(({ href, label, icon: Icon, active, external }) =>
                external ? (
                    <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onNavigate}
                        className={cn(
                            "flex items-center gap-2 rounded-[12px] font-[560] transition-all duration-200 border border-transparent text-[var(--ink-2)] hover:border-[var(--line)] hover:bg-white/[0.045] hover:text-white [&>svg]:text-[var(--ink-3)] group cursor-pointer",
                            mobile ? "w-full px-3.5 py-2.5 text-sm" : "gap-1.5 px-3.5 py-1.5 text-[13.5px]",
                        )}
                    >
                        <Icon className="h-4 w-4 transition-colors group-hover:text-[var(--gold)]" />
                        <span>{label}</span>
                        <ExternalLink className="ml-auto h-3 w-3 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </a>
                ) : (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "flex items-center rounded-[12px] font-[560] transition-all duration-200 border",
                            mobile ? "w-full gap-2 px-3.5 py-2.5 text-sm" : "gap-1.5 px-3.5 py-1.5 text-[13.5px]",
                            active
                                ? "border-[var(--aether-line)] bg-[var(--aether-a10)] text-white shadow-xs [&>svg]:text-[var(--aether-hi)]"
                                : "border-transparent text-[var(--ink-2)] hover:border-[var(--line)] hover:bg-white/[0.045] hover:text-white [&>svg]:text-[var(--ink-3)]",
                        )}
                    >
                        <Icon className={cn("transition-colors", mobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
                        <span>{label}</span>
                    </Link>
                )
            )}
        </>
    );
};

export function MobileNavMenu() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={open}
                className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--line-2)] bg-white/[0.04] text-[var(--ink-2)] transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer"
            >
                {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 top-14 z-30 bg-black/50 lg:hidden"
                        onClick={() => setOpen(false)}
                        aria-hidden
                    />
                    <nav
                        aria-label="Mobile navigation"
                        className="absolute inset-x-0 top-full z-40 flex flex-col gap-1 border-b border-[var(--line)] bg-[#070b14]/96 px-4 py-3 shadow-2xl backdrop-blur-xl lg:hidden"
                    >
                        <Suspense fallback={null}>
                            <NavLinks mobile onNavigate={() => setOpen(false)} />
                        </Suspense>
                    </nav>
                </>
            )}
        </>
    );
}

export default NavLinks;
