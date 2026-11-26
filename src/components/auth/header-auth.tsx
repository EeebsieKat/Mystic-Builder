"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AuthCard, { type AuthUser } from "@/components/auth/auth-card";
import NotificationBell from "@/components/auth/notification-bell";

export default function HeaderAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let active = true;
        fetch("/api/auth/me")
            .then((r) => (r.ok ? r.json() : { user: null }))
            .then((data: { user?: AuthUser | null }) => {
                if (active) {
                    setUser(data.user ?? null);
                    setLoaded(true);
                }
            })
            .catch(() => {
                if (active) setLoaded(true);
            });

        const onAuthChanged = (event: Event) => {
            const customEvent = event as CustomEvent<AuthUser | null>;
            setUser(customEvent.detail ?? null);
        };

        const onOpenAuth = () => {
            setOpen(true);
        };

        window.addEventListener("mystic-auth-changed", onAuthChanged);
        window.addEventListener("mystic-open-auth", onOpenAuth);
        return () => {
            active = false;
            window.removeEventListener("mystic-auth-changed", onAuthChanged);
            window.removeEventListener("mystic-open-auth", onOpenAuth);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } finally {
            setUser(null);
            window.dispatchEvent(new CustomEvent("mystic-auth-changed", { detail: null }));
        }
    };

    if (!loaded) {
        return <div className="h-8 w-20" aria-hidden="true" />;
    }

    if (user) {
        const shownName = user.displayName || user.username;
        return (
            <div className="flex items-center gap-2">
                <NotificationBell user={user} />
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-[var(--aether-line)] bg-[var(--aether-a10)] text-white hover:bg-[var(--aether-a10)]/80"
                        >
                            <User className="h-3.5 w-3.5 text-[var(--aether-hi)]" />
                            <span className="max-w-[84px] sm:max-w-[140px] truncate">{shownName}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            <div>
                                Signed in as <span className="font-semibold text-foreground">{shownName}</span>
                            </div>
                            {shownName !== user.username && (
                                <div className="mt-0.5 text-[11px] font-normal text-muted-foreground/80">
                                    @{user.username}
                                </div>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            variant="destructive"
                            className="cursor-pointer"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                    <LogIn className="h-3.5 w-3.5 text-[var(--aether-hi)]" />
                    <span>Sign In</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-md">
                <DialogTitle className="sr-only">Sign In or Create Account</DialogTitle>
                <DialogDescription className="sr-only">
                    Sign in using your Discord username and password.
                </DialogDescription>
                <AuthCard
                    onSuccess={(loggedInUser) => {
                        setUser(loggedInUser);
                        setOpen(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
