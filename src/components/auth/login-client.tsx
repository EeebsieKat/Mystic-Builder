"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hammer, LogOut, UserCheck } from "lucide-react";
import AuthCard, { type AuthUser } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

interface LoginClientProps {
    initialError: string | null;
}

export default function LoginClient({ initialError }: LoginClientProps) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => (r.ok ? r.json() : { user: null }))
            .then((data: { user?: AuthUser | null }) => {
                setUser(data.user ?? null);
                setChecked(true);
            })
            .catch(() => setChecked(true));
    }, []);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        window.dispatchEvent(new CustomEvent("mystic-auth-changed", { detail: null }));
    };

    if (checked && user) {
        return (
            <div className="w-full max-w-md rounded-2xl border border-[var(--line-2)] bg-[rgba(8,14,26,0.92)] p-6 text-center shadow-2xl backdrop-blur-xl">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--aether-line)] bg-[var(--aether-a10)]">
                    <UserCheck className="h-6 w-6 text-[var(--aether-hi)]" />
                </div>
                <h1 className="font-display text-2xl font-bold text-white">
                    Signed in as {user.displayName || user.username}
                </h1>
                <p className="mt-2 text-xs text-muted-foreground">
                    {user.displayName && user.displayName !== user.username
                        ? `Discord username: @${user.username}`
                        : "Your session is active and protected."}
                </p>
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                    <Button asChild size="lg">
                        <Link href="/builder">
                            <Hammer className="h-4 w-4" />
                            Open Build Planner
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <AuthCard
            initialError={initialError}
            onSuccess={(loggedInUser) => {
                setUser(loggedInUser);
                router.push("/builder");
            }}
        />
    );
}
