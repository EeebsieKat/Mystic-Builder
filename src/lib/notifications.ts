import { db } from "@/lib/db";
import { allowLocalFallback, d1Request, isD1Mode } from "@/lib/d1-client";
import type { AccountNotificationRecord } from "@/lib/community-types";

export async function listAccountNotifications(accountId: string): Promise<{
    notifications: AccountNotificationRecord[];
    unreadCount: number;
    serverTime: string;
}> {
    if (isD1Mode()) {
        try {
            const res = await d1Request<{
                notifications: AccountNotificationRecord[];
                unreadCount: number;
                serverTime?: string;
            }>(`/notifications?accountId=${encodeURIComponent(accountId)}`);
            return {
                notifications: res.notifications || [],
                unreadCount: Number(res.unreadCount ?? 0),
                serverTime: res.serverTime || new Date().toISOString(),
            };
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for listAccountNotifications:", err);
        }
    }

    const [notifications, unreadCount] = await Promise.all([
        db.notification.findMany({
            where: { accountId },
            orderBy: { createdAt: "desc" },
            take: 30,
        }),
        db.notification.count({
            where: { accountId, read: false },
        }),
    ]);

    return { notifications, unreadCount, serverTime: new Date().toISOString() };
}

export async function markAccountNotificationsRead(
    accountId: string,
    opts: { id?: string; all?: boolean }
): Promise<{ unreadCount: number }> {
    if (isD1Mode()) {
        try {
            return await d1Request<{ unreadCount: number }>(`/notifications/read`, {
                method: "POST",
                body: JSON.stringify({ accountId, ...opts }),
            });
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for markAccountNotificationsRead:", err);
        }
    }

    if (opts.all) {
        await db.notification.updateMany({
            where: { accountId, read: false },
            data: { read: true },
        });
    } else if (opts.id) {
        await db.notification.updateMany({
            where: { id: opts.id, accountId },
            data: { read: true },
        });
    }

    const unreadCount = await db.notification.count({
        where: { accountId, read: false },
    });
    return { unreadCount };
}

export async function clearAccountNotifications(
    accountId: string,
    opts: { id?: string }
): Promise<{ unreadCount: number }> {
    if (isD1Mode()) {
        try {
            return await d1Request<{ unreadCount: number }>(`/notifications`, {
                method: "DELETE",
                body: JSON.stringify({ accountId, ...opts }),
            });
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for clearAccountNotifications:", err);
        }
    }

    if (opts.id) {
        await db.notification.deleteMany({ where: { id: opts.id, accountId } });
    } else {
        await db.notification.deleteMany({ where: { accountId, read: true } });
    }

    const unreadCount = await db.notification.count({
        where: { accountId, read: false },
    });
    return { unreadCount };
}

export async function createLocalNotification(params: {
    accountId: string;
    actorId: string;
    actorUsername: string;
    actorDisplayName: string;
    type: string;
    title: string;
    message: string;
    href: string;
    dedupeUnread?: boolean;
}): Promise<void> {
    if (!params.accountId || !params.actorId || params.accountId === params.actorId) {
        return;
    }

    if (params.dedupeUnread) {
        const dup = await db.notification.findFirst({
            where: {
                accountId: params.accountId,
                actorId: params.actorId,
                type: params.type,
                href: params.href,
                read: false,
            },
            select: { id: true },
        });
        if (dup) return;
    }

    await db.notification
        .create({
            data: {
                accountId: params.accountId,
                actorId: params.actorId,
                actorUsername: params.actorUsername,
                actorDisplayName: params.actorDisplayName,
                type: params.type,
                title: params.title.slice(0, 100),
                message: params.message.slice(0, 180),
                href: params.href,
            },
        })
        .catch(() => {});
}
