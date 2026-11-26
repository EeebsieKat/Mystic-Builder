import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CommunityBuildDetail from "@/components/community/community-build-detail";
import { Footer } from "@/components/site-footer";
import { getCurrentSession } from "@/lib/auth";
import { getBuildLikeStatus } from "@/lib/build-likes";
import { getCommunityBuildById, listCommunityComments } from "@/lib/community-builds";
import type { CommunityBuildRecord } from "@/lib/community-types";
import { findMetaBuildById, metaCommentTargetId } from "@/lib/meta-builds";
import { getBuildViews } from "@/lib/stats";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const rawId = decodeURIComponent(id);
    const session = await getCurrentSession();

    const communityBuild = await getCommunityBuildById(rawId, session?.id ?? null);
    if (communityBuild) {
        const description =
            communityBuild.description ||
            `${communityBuild.weaponName} (${communityBuild.weaponType})${communityBuild.omnicell ? ` with ${communityBuild.omnicell}` : ""} shared by ${communityBuild.authorDisplayName}.`;
        return {
            title: `${communityBuild.title} by ${communityBuild.authorDisplayName} - ${SITE_NAME}`,
            description,
        };
    }

    const metaBuild = findMetaBuildById(rawId);
    if (metaBuild) {
        return {
            title: `${metaBuild.title} - Meta Build - ${SITE_NAME}`,
            description: `${metaBuild.category} meta build for ${metaBuild.weaponName} (${metaBuild.weaponType}) in Dauntless 1.14.7 Mystic Paradox.`,
        };
    }

    return { title: `Build Not Found - ${SITE_NAME}` };
}

export default async function BuildDetailPage({ params }: PageProps) {
    const { id } = await params;
    const rawId = decodeURIComponent(id);
    const session = await getCurrentSession();

    const communityBuild = await getCommunityBuildById(rawId, session?.id ?? null);
    if (communityBuild) {
        const [views, likeStatus, comments] = await Promise.all([
            getBuildViews(communityBuild.buildId),
            getBuildLikeStatus(communityBuild.buildId, session?.id ?? null),
            listCommunityComments(communityBuild.id, session?.id ?? null),
        ]);

        return (
            <main className="flex w-full flex-1 flex-col">
                <CommunityBuildDetail
                    source="community"
                    initialBuild={{
                        ...communityBuild,
                        views: Math.max(communityBuild.views, views),
                        likes: likeStatus.count,
                    }}
                    initialLikedByMe={likeStatus.liked}
                    initialComments={comments}
                    initialUserId={session?.id ?? null}
                />
                <Footer />
            </main>
        );
    }

    const metaBuild = findMetaBuildById(rawId);
    if (!metaBuild) {
        notFound();
    }

    const commentTargetId = metaCommentTargetId(metaBuild.buildId);
    const [views, likeStatus, comments] = await Promise.all([
        getBuildViews(metaBuild.buildId),
        getBuildLikeStatus(metaBuild.buildId, session?.id ?? null),
        listCommunityComments(commentTargetId, session?.id ?? null),
    ]);

    const normalizedMeta: CommunityBuildRecord = {
        id: commentTargetId,
        buildId: metaBuild.buildId,
        title: metaBuild.title,
        description: `${metaBuild.category} official meta guide for ${metaBuild.weaponName} (${metaBuild.weaponType})${metaBuild.bondName ? ` bonded with ${metaBuild.bondName}` : ""}.`,
        category: metaBuild.category,
        weaponType: metaBuild.weaponType,
        weaponName: metaBuild.weaponName,
        element: metaBuild.weaponElement,
        omnicell: metaBuild.omnicellName,
        accountId: "meta",
        authorUsername: "meta",
        authorDisplayName: "Reforged Meta Index",
        createdAt: new Date(0).toISOString(),
        likes: likeStatus.count,
        views,
        commentCount: comments.length,
    };

    return (
        <main className="flex w-full flex-1 flex-col">
            <CommunityBuildDetail
                source="meta"
                vsElement={metaBuild.vsElement}
                subcategory={metaBuild.subcategory}
                initialBuild={normalizedMeta}
                initialLikedByMe={likeStatus.liked}
                initialComments={comments}
                initialUserId={session?.id ?? null}
            />
            <Footer />
        </main>
    );
}
