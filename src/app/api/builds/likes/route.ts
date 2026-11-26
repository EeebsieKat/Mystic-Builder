import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getAllBuildLikes } from "@/lib/build-likes";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getCurrentSession();
        const data = await getAllBuildLikes(session?.id ?? null);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to fetch build likes:", error);
        return NextResponse.json({ error: "Failed to fetch build likes" }, { status: 500 });
    }
}
