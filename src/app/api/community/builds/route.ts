import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getAllBuildLikes } from "@/lib/build-likes";
import {
    COMMUNITY_CATEGORIES,
    DuplicateCommunityBuildError,
    createCommunityBuild,
    listCommunityBuilds,
} from "@/lib/community-builds";
import { buildBuildView, tryDeserialize } from "@/game/build-view";
import { extractBuildId } from "@/lib/site";
import { validateCleanText } from "@/lib/profanity";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getCurrentSession();
        const [builds, likesData] = await Promise.all([
            listCommunityBuilds(session?.id ?? null),
            getAllBuildLikes(session?.id ?? null),
        ]);

        return NextResponse.json({
            builds,
            userLikes: likesData.userLikes,
            currentUserId: session?.id ?? null,
        });
    } catch (error) {
        console.error("Failed to list community builds:", error);
        return NextResponse.json({ error: "Failed to load community builds." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json(
            {
                error: "Please sign in to publish a build to the community.",
                requiresAuth: true,
            },
            { status: 401 }
        );
    }

    try {
        const body = (await request.json().catch(() => ({}))) as {
            buildInput?: string;
            buildId?: string;
            title?: string;
            description?: string;
            category?: string;
            visibility?: string;
        };

        const rawInput = (body.buildInput || body.buildId || "").trim();
        const extractedId = extractBuildId(rawInput);

        if (!extractedId) {
            return NextResponse.json(
                { error: "Please provide a valid Mystic Builder link or build ID." },
                { status: 400 }
            );
        }

        const model = tryDeserialize(extractedId);
        if (!model) {
            return NextResponse.json(
                { error: "That build ID is invalid or corrupted." },
                { status: 400 }
            );
        }

        const view = buildBuildView(model, extractedId);
        if (view.invalid || !view.weapon) {
            return NextResponse.json(
                { error: "Build must have at least a valid weapon equipped before publishing." },
                { status: 400 }
            );
        }

        const title = (body.title || "").trim();
        if (title.length < 2 || title.length > 60) {
            return NextResponse.json(
                { error: "Build title must be between 2 and 60 characters." },
                { status: 400 }
            );
        }

        const cleanTitle = validateCleanText(title, "Build title");
        if (!cleanTitle.valid) {
            return NextResponse.json({ error: cleanTitle.error }, { status: 400 });
        }

        const description = (body.description || "").trim().slice(0, 300) || null;
        if (description) {
            const cleanDesc = validateCleanText(description, "Build description");
            if (!cleanDesc.valid) {
                return NextResponse.json({ error: cleanDesc.error }, { status: 400 });
            }
        }
        const requestedCategory = (body.category || "General").trim();
        const category = (COMMUNITY_CATEGORIES as readonly string[]).includes(requestedCategory)
            ? requestedCategory
            : "General";
        const visibility = body.visibility === "private" ? "private" : "public";

        const created = await createCommunityBuild({
            buildId: extractedId,
            title,
            description,
            category,
            visibility,
            weaponType: view.weapon.type,
            weaponName: view.weapon.name,
            element: view.weapon.elemental,
            omnicell: view.omnicell?.name ?? null,
            accountId: session.id,
            authorUsername: session.username,
            authorDisplayName: session.displayName || session.username,
        });

        return NextResponse.json({ build: created }, { status: 201 });
    } catch (error) {
        if (error instanceof DuplicateCommunityBuildError) {
            return NextResponse.json(
                { error: error.message, existingId: error.existingId },
                { status: 409 }
            );
        }
        console.error("Failed to publish community build:", error);
        return NextResponse.json({ error: "Unable to publish build right now." }, { status: 500 });
    }
}
