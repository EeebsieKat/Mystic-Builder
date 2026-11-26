"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DISCORD_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface AuthUser {
    id: string;
    username: string;
    displayName?: string | null;
}

const DiscordIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
);

interface AuthCardProps {
    initialMode?: "login" | "register";
    initialError?: string | null;
    onSuccess?: (user: AuthUser) => void;
    className?: string;
}

export default function AuthCard({
    initialMode = "login",
    initialError = null,
    onSuccess,
    className,
}: AuthCardProps) {
    const [mode, setMode] = useState<"login" | "register">(initialMode);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [discordLoading, setDiscordLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError);

    const handleDiscordLogin = () => {
        setError(null);
        setDiscordLoading(true);
        const current = window.location.pathname + window.location.search;
        const nextPath = window.location.pathname === "/login" ? "/builder" : current;
        window.location.href = `/api/auth/discord?next=${encodeURIComponent(nextPath)}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = (await res.json().catch(() => ({}))) as {
                user?: AuthUser;
                error?: string;
            };

            if (!res.ok || !data.user) {
                setError(data.error || "Authentication failed. Please check your credentials.");
                return;
            }

            window.dispatchEvent(new CustomEvent("mystic-auth-changed", { detail: data.user }));
            onSuccess?.(data.user);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (next: "login" | "register") => {
        setMode(next);
        setError(null);
    };

    return (
        <div
            className={cn(
                "relative w-full max-w-md rounded-2xl border border-[var(--line-2)] bg-[rgba(8,14,26,0.92)] p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl",
                className
            )}
        >
            <div className="gold-rule absolute inset-x-6 top-0 opacity-70" aria-hidden="true" />

            {/* Header */}
            <div className="mb-5 text-center">
                <h2 className="font-display text-2xl font-bold tracking-wide text-white">
                    {mode === "login" ? "Slayer Sign In" : "Create Account"}
                </h2>
                <p className="mt-1 text-xs text-[var(--ink-3)]">
                    Username & password only — no email required.
                </p>
            </div>

            {/* Mode Switcher */}
            <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-xl border border-[var(--line)] bg-black/30 p-1">
                <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                        mode === "login"
                            ? "bg-[var(--aether-a10)] text-white border border-[var(--aether-line)] shadow-xs"
                            : "text-[var(--ink-3)] hover:text-white border border-transparent"
                    )}
                >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign In
                </button>
                <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                        mode === "register"
                            ? "bg-[var(--aether-a10)] text-white border border-[var(--aether-line)] shadow-xs"
                            : "text-[var(--ink-3)] hover:text-white border border-transparent"
                    )}
                >
                    <UserPlus className="h-3.5 w-3.5" />
                    Create Account
                </button>
            </div>

            {/* Discord Username Recovery Callout */}
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#5865F2]/35 bg-[#5865F2]/10 px-3.5 py-3 text-xs leading-relaxed text-[#d7dcff]">
                <DiscordIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#7289da]" />
                <div>
                    <p className="font-semibold text-white">Use your Discord username</p>
                    <p className="mt-0.5 text-[#b9c2f5]">
                        Please use your Discord username so we can help you in case your password is lost.{" "}
                        <a
                            href={DISCORD_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 text-white hover:text-[#9ea9ff]"
                        >
                            Discord Support
                        </a>
                    </p>
                </div>
            </div>

            {/* Form (Username + Password only, NO email) */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="auth-username" className="text-xs font-semibold text-[var(--ink-2)]">
                        Discord Username
                    </Label>
                    <Input
                        id="auth-username"
                        name="username"
                        type="text"
                        required
                        minLength={2}
                        maxLength={32}
                        autoComplete="username"
                        placeholder="e.g. slayer_name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="auth-password" className="text-xs font-semibold text-[var(--ink-2)]">
                        Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="auth-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            maxLength={128}
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            placeholder={mode === "register" ? "At least 6 characters" : "Enter your password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-white transition-colors cursor-pointer"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="flex items-center gap-2 rounded-xl border border-[var(--bad-line)] bg-[var(--bad-a)] px-3 py-2.5 text-xs text-[#ffd3da]"
                    >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <Button type="submit" disabled={loading || discordLoading} className="w-full" size="lg">
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {mode === "login" ? "Signing in..." : "Creating account..."}
                        </>
                    ) : mode === "login" ? (
                        <>
                            <LogIn className="h-4 w-4" />
                            Sign In
                        </>
                    ) : (
                        <>
                            <UserPlus className="h-4 w-4" />
                            Create Account
                        </>
                    )}
                </Button>
            </form>

            {/* Discord OAuth2 Sign In */}
            <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--line)]" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-4)]">
                    or
                </span>
                <div className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <Button
                type="button"
                disabled={loading || discordLoading}
                onClick={handleDiscordLogin}
                size="lg"
                className="w-full gap-2 bg-[#5865F2] text-white shadow-[0_8px_20px_-8px_rgba(88,101,242,0.75)] hover:bg-[#4752C4] hover:brightness-105 cursor-pointer"
            >
                {discordLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting to Discord...
                    </>
                ) : (
                    <>
                        <DiscordIcon className="h-4 w-4" />
                        Continue with Discord
                    </>
                )}
            </Button>
        </div>
    );
}
