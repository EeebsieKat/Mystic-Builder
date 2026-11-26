"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Heart, MessageSquare, Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AccountNotificationRecord } from "@/lib/community-types";
import type { AuthUser } from "@/components/auth/auth-card";
import { cn } from "@/lib/utils";

function parseUtcTimestampMs(raw: string | Date): number {
    if (raw instanceof Date) return raw.getTime();
    const s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
        return Date.parse(`${s.replace(" ", "T")}Z`);
    }
    return Date.parse(s);
}

function formatRelativeTime(raw: string | Date, serverNowMs: number): string {
    const t = parseUtcTimestampMs(raw);
    if (Number.isNaN(t)) return "";
    const diffSec = Math.max(0, Math.floor((serverNowMs - t) / 1000));
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
}

export default function NotificationBell({ user }: { user: AuthUser | null }) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AccountNotificationRecord[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [serverClock, setServerClock] = useState<{ serverMs: number; perfMs: number } | null>(null);
    const [nowTick, setNowTick] = useState(0);
    const [open, setOpen] = useState(false);

    const loadNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setServerClock(null);
            return;
        }
        try {
            const res = await fetch("/api/notifications", { cache: "no-store" });
            if (!res.ok) return;
            const data = (await res.json()) as {
                notifications?: AccountNotificationRecord[];
                unreadCount?: number;
                serverTime?: string;
            };
            setNotifications(data.notifications || []);
            setUnreadCount(Number(data.unreadCount ?? 0));
            const parsedServer = data.serverTime ? Date.parse(data.serverTime) : NaN;
            if (!Number.isNaN(parsedServer) && typeof performance !== "undefined") {
                setServerClock({ serverMs: parsedServer, perfMs: performance.now() });
                setNowTick((t) => t + 1);
            }
        } catch {
            // Ignore transient fetch failure
        }
    }, [user]);

    useEffect(() => {
        loadNotifications();
        if (!user) return;

        const timer = setInterval(loadNotifications, 30_000);
        const tickTimer = setInterval(() => setNowTick((t) => t + 1), 30_000);
        const onFocus = () => loadNotifications();
        window.addEventListener("focus", onFocus);
        return () => {
            clearInterval(timer);
            clearInterval(tickTimer);
            window.removeEventListener("focus", onFocus);
        };
    }, [user, loadNotifications]);

    const currentServerNowMs = (() => {
        void nowTick;
        if (serverClock && typeof performance !== "undefined") {
            return serverClock.serverMs + (performance.now() - serverClock.perfMs);
        }
        return Date.now();
    })();

    if (!user) return null;

    const handleMarkAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        await fetch("/api/notifications/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ all: true }),
        }).catch(() => {});
    };

    const handleClearRead = async () => {
        setNotifications((prev) => prev.filter((n) => !n.read));
        await fetch("/api/notifications", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        }).catch(() => {});
    };

    const handleClickNotification = async (n: AccountNotificationRecord) => {
        if (!n.read) {
            setNotifications((prev) =>
                prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
            fetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: n.id }),
            }).catch(() => {});
        }
        setOpen(false);
        router.push(n.href);
    };

    const renderIcon = (type: string) => {
        if (type === "build_like" || type === "comment_like") {
            return <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400/40 shrink-0" />;
        }
        if (type === "comment_reply") {
            return <Reply className="h-3.5 w-3.5 text-[var(--aether-hi)] shrink-0" />;
        }
        return <MessageSquare className="h-3.5 w-3.5 text-amber-300 shrink-0" />;
    };

    return (
        <DropdownMenu open={open} onOpenChange={(next) => {
            setOpen(next);
            if (next) loadNotifications();
        }} modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                    className="relative px-2.5 border-[var(--line-2)] bg-white/[0.03] text-[var(--ink-2)] hover:text-white cursor-pointer"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[calc(100vw-24px)] max-w-[384px] sm:w-96 border-[var(--line-2)] bg-[rgba(8,14,26,0.97)] p-0 text-foreground backdrop-blur-xl"
            >
                <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--aether-hi)] hover:text-white cursor-pointer"
                            >
                                <CheckCheck className="h-3 w-3" />
                                Mark read
                            </button>
                        )}
                        {notifications.some((n) => n.read) && (
                            <button
                                type="button"
                                onClick={handleClearRead}
                                className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-4)] hover:text-rose-300 cursor-pointer"
                                title="Clear read notifications"
                            >
                                <Trash2 className="h-3 w-3" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
                <DropdownMenuSeparator className="m-0 bg-white/10" />

                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                        <div className="py-8 px-4 text-center text-xs text-[var(--ink-4)]">
                            No notifications yet. Activity on your builds and comments will show up here.
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => handleClickNotification(n)}
                                className={cn(
                                    "flex w-full items-start gap-2.5 px-3.5 py-3 text-left text-xs transition-colors hover:bg-white/[0.06] cursor-pointer",
                                    !n.read && "bg-[var(--aether-a10)]/45"
                                )}
                            >
                                <div className="mt-0.5">{renderIcon(n.type)}</div>
                                <div className="min-w-0 flex-1">
                                    <p className="leading-snug text-[var(--ink-2)]">
                                        <span className="font-semibold text-white">{n.actorDisplayName}</span>{" "}
                                        {n.message}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--ink-4)]">
                                        <span className="truncate">{n.title}</span>
                                        <span>•</span>
                                        <span className="shrink-0">
                                            {formatRelativeTime(n.createdAt, currentServerNowMs)}
                                        </span>
                                    </div>
                                </div>
                                {!n.read && (
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--aether-hi)]" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
