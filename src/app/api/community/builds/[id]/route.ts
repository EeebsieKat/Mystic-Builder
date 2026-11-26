import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getBuildLikeStatus } from "@/lib/build-likes";
import {
    COMMUNITY_CATEGORIES,
    deleteCommunityBuild,
    getCommunityBuildById,
    listCommunityComments,
    updateCommunityBuild,
} from "@/lib/community-builds";
import { buildBuildView, tryDeserialize } from "@/game/build-view";
import { extractBuildId } from "@/lib/site";
import { validateCleanText } from "@/lib/profanity";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
    const { id } = await params;

    try {
        const session = await getCurrentSession();
        const build = await getCommunityBuildById(id, session?.id ?? null);
        if (!build) {
            return NextResponse.json({ error: "Community build not found." }, { status: 404 });
        }

        const [likeStatus, comments] = await Promise.all([
            getBuildLikeStatus(build.buildId, session?.id ?? null),
            listCommunityComments(id, session?.id ?? null),
        ]);

        return NextResponse.json({
            build: { ...build, likes: likeStatus.count },
            likedByMe: likeStatus.liked,
            comments,
            currentUserId: session?.id ?? null,
        });
    } catch (error) {
        console.error("Failed to fetch community build detail:", error);
        return NextResponse.json({ error: "Unable to load build." }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: RouteContext) {
    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json(
            { error: "Please sign in to edit a build.", requiresAuth: true },
            { status: 401 }
        );
    }

    const { id } = await params;

    try {
        const body = (await request.json().catch(() => ({}))) as {
            title?: string;
            description?: string | null;
            category?: string;
            visibility?: string;
            buildInput?: string;
            buildId?: string;
        };

        const patch: Parameters<typeof updateCommunityBuild>[2] = {};

        if (typeof body.title === "string") {
            const title = body.title.trim();
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
            patch.title = title;
        }

        if ("description" in body) {
            const description = typeof body.description === "string"
                ? body.description.trim().slice(0, 300) || null
                : null;
            if (description) {
                const cleanDesc = validateCleanText(description, "Build description");
                if (!cleanDesc.valid) {
                    return NextResponse.json({ error: cleanDesc.error }, { status: 400 });
                }
            }
            patch.description = description;
        }

        if (typeof body.category === "string") {
            const requested = body.category.trim();
            if (!(COMMUNITY_CATEGORIES as readonly string[]).includes(requested)) {
                return NextResponse.json({ error: "Invalid build category." }, { status: 400 });
            }
            patch.category = requested;
        }

        if (typeof body.visibility === "string") {
            if (body.visibility !== "public" && body.visibility !== "private") {
                return NextResponse.json({ error: "Visibility must be public or private." }, { status: 400 });
            }
            patch.visibility = body.visibility;
        }

        const rawBuildInput = typeof body.buildInput === "string"
            ? body.buildInput.trim()
            : typeof body.buildId === "string"
                ? body.buildId.trim()
                : "";
        if (rawBuildInput) {
            const extractedId = extractBuildId(rawBuildInput);
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
                    { error: "Build must have at least a valid weapon equipped." },
                    { status: 400 }
                );
            }
            patch.buildId = extractedId;
            patch.weaponType = view.weapon.type;
            patch.weaponName = view.weapon.name;
            patch.element = view.weapon.elemental;
            patch.omnicell = view.omnicell?.name ?? null;
        }

        const result = await updateCommunityBuild(id, session.id, patch);
        if (!result.ok || !result.build) {
            return NextResponse.json(
                { error: result.error, existingId: result.existingId },
                { status: result.status }
            );
        }

        return NextResponse.json({ build: result.build });
    } catch (error) {
        console.error("Failed to update community build:", error);
        return NextResponse.json({ error: "Unable to update build." }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
    const session = await getCurrentSession();
    if (!session) {
        return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await deleteCommunityBuild(id, session.id);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to delete community build:", error);
        return NextResponse.json({ error: "Unable to delete build." }, { status: 500 });
    }
}
