import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const user = await getCurrentSession();
    return NextResponse.json({ user });
}
