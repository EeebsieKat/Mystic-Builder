import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { markAccountNotificationsRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await request.json().catch(() => ({}))) as { id?: string; all?: boolean };
        const result = await markAccountNotificationsRead(session.id, {
            id: body.id,
            all: Boolean(body.all),
        });
        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to mark notifications read:", error);
        return NextResponse.json({ error: "Unable to update notifications." }, { status: 500 });
    }
}
