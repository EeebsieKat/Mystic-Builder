import { db } from "@/lib/db";
import { allowLocalFallback, d1Request, isD1Mode } from "@/lib/d1-client";

export interface StoredAccount {
    id: string;
    username: string;
    usernameLower: string;
    displayName?: string | null;
    discordId?: string | null;
    passwordHash: string;
    createdAt: string | Date;
}

export class UsernameTakenError extends Error {
    constructor(message = "That Discord username is already registered.") {
        super(message);
        this.name = "UsernameTakenError";
    }
}

export async function findAccountByUsername(usernameLower: string): Promise<StoredAccount | null> {
    const normalized = usernameLower.trim().toLowerCase();

    if (isD1Mode()) {
        try {
            const res = await d1Request<{ user: StoredAccount | null }>(
                `/auth/users/${encodeURIComponent(normalized)}`
            );
            return res.user;
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for findAccountByUsername:", err);
        }
    }

    const account = await db.account.findUnique({
        where: { usernameLower: normalized },
    });
    return account;
}

export async function createAccount(data: {
    username: string;
    usernameLower: string;
    displayName?: string | null;
    passwordHash: string;
}): Promise<Omit<StoredAccount, "passwordHash">> {
    if (isD1Mode()) {
        try {
            const res = await d1Request<{ user: Omit<StoredAccount, "passwordHash"> }>("/auth/users", {
                method: "POST",
                body: JSON.stringify(data),
            });
            return res.user;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            if (msg.includes("(409)")) {
                throw new UsernameTakenError();
            }
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for createAccount:", err);
        }
    }

    const existing = await db.account.findUnique({
        where: { usernameLower: data.usernameLower },
        select: { id: true },
    });
    if (existing) {
        throw new UsernameTakenError();
    }

    try {
        const created = await db.account.create({
            data: {
                username: data.username,
                usernameLower: data.usernameLower,
                displayName: data.displayName ?? data.username,
                passwordHash: data.passwordHash,
            },
            select: {
                id: true,
                username: true,
                usernameLower: true,
                displayName: true,
                createdAt: true,
            },
        });
        return created;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Unique constraint")) {
            throw new UsernameTakenError();
        }
        throw err;
    }
}

export async function upsertDiscordAccount(data: {
    discordId: string;
    username: string;
    usernameLower: string;
    displayName?: string | null;
    passwordHash: string;
}): Promise<Omit<StoredAccount, "passwordHash">> {
    if (isD1Mode()) {
        try {
            const res = await d1Request<{ user: Omit<StoredAccount, "passwordHash"> }>(
                "/auth/users/discord",
                {
                    method: "POST",
                    body: JSON.stringify(data),
                }
            );
            return res.user;
        } catch (err) {
            if (!allowLocalFallback()) throw err;
            console.warn("[D1] Falling back to local DB for upsertDiscordAccount:", err);
        }
    }

    const displayName = data.displayName?.trim() || data.username;

    const byDiscord = await db.account.findUnique({
        where: { discordId: data.discordId },
        select: { id: true, username: true, usernameLower: true, displayName: true, discordId: true, createdAt: true },
    });

    if (byDiscord) {
        let nextUsername = byDiscord.username;
        let nextLower = byDiscord.usernameLower;
        if (byDiscord.username !== data.username) {
            const conflict = await db.account.findFirst({
                where: { usernameLower: data.usernameLower, id: { not: byDiscord.id } },
                select: { id: true },
            });
            if (!conflict) {
                nextUsername = data.username;
                nextLower = data.usernameLower;
            }
        }
        if (nextUsername !== byDiscord.username || byDiscord.displayName !== displayName) {
            return db.account.update({
                where: { id: byDiscord.id },
                data: { username: nextUsername, usernameLower: nextLower, displayName },
                select: { id: true, username: true, usernameLower: true, displayName: true, discordId: true, createdAt: true },
            });
        }
        return byDiscord;
    }

    const byUsername = await db.account.findUnique({
        where: { usernameLower: data.usernameLower },
        select: { id: true, discordId: true },
    });

    if (byUsername && !byUsername.discordId) {
        return db.account.update({
            where: { id: byUsername.id },
            data: { discordId: data.discordId, username: data.username, displayName },
            select: { id: true, username: true, usernameLower: true, displayName: true, discordId: true, createdAt: true },
        });
    }

    const finalUsername = byUsername ? `${data.username}_${data.discordId.slice(-4)}` : data.username;
    const finalLower = finalUsername.toLowerCase();

    return db.account.create({
        data: {
            username: finalUsername,
            usernameLower: finalLower,
            displayName,
            discordId: data.discordId,
            passwordHash: data.passwordHash,
        },
        select: { id: true, username: true, usernameLower: true, displayName: true, discordId: true, createdAt: true },
    });
}
