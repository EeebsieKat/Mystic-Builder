import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { clearAccountNotifications, listAccountNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json({
            notifications: [],
            unreadCount: 0,
            serverTime: new Date().toISOString(),
        });
    }

    try {
        const data = await listAccountNotifications(session.id);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json({
            notifications: [],
            unreadCount: 0,
            serverTime: new Date().toISOString(),
        });
    }
}

export async function DELETE(request: Request) {
    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await request.json().catch(() => ({}))) as { id?: string };
        const result = await clearAccountNotifications(session.id, { id: body.id });
        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to clear notifications:", error);
        return NextResponse.json({ error: "Unable to clear notifications." }, { status: 500 });
    }
}
