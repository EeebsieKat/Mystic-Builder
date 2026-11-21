import { NextResponse } from "next/server";
import { buildSummary, buildTitle, parseBuildId } from "@/game/build-view";
import { elementColor, GAME_EDITION } from "@/lib/site";
import { OG_GOLD } from "@/lib/og-theme";

export const revalidate = 86400;

interface RouteContext {
    params: Promise<{ buildId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
    const { buildId } = await params;
    const parsed = parseBuildId(buildId);

    if (!parsed) {
        return NextResponse.json({ valid: false }, { status: 404 });
    }

    const { view } = parsed;

    return NextResponse.json({
        valid: true,
        invalidBuild: view.invalid,
        title: buildTitle(view),
        description: buildSummary(view),
        themeColor: view.weapon ? elementColor(view.weapon.elemental) : OG_GOLD,
        gameVersion: view.gameVersion,
        gameEdition: GAME_EDITION,
        weaponName: view.weapon?.name ?? null,
    });
}
