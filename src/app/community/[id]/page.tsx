import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CommunityBuildDetail from "@/components/community/community-build-detail";
import { Footer } from "@/components/site-footer";
import { getCurrentSession } from "@/lib/auth";
import { getBuildLikeStatus } from "@/lib/build-likes";
import { getCommunityBuildById, listCommunityComments } from "@/lib/community-builds";
import { getBuildViews } from "@/lib/stats";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const build = await getCommunityBuildById(id);

    if (!build) {
        return { title: `Build Not Found - ${SITE_NAME}` };
    }

    const description =
        build.description ||
        `${build.weaponName} (${build.weaponType})${build.omnicell ? ` with ${build.omnicell}` : ""} shared by ${build.authorDisplayName}.`;

    return {
        title: `${build.title} by ${build.authorDisplayName} - ${SITE_NAME}`,
        description,
    };
}

export default async function CommunityBuildPage({ params }: PageProps) {
    const { id } = await params;
    const session = await getCurrentSession();
    const build = await getCommunityBuildById(id);

    if (!build) {
        notFound();
    }

    const [views, likeStatus, comments] = await Promise.all([
        getBuildViews(build.buildId),
        getBuildLikeStatus(build.buildId, session?.id ?? null),
        listCommunityComments(build.id, session?.id ?? null),
    ]);

    return (
        <main className="flex w-full flex-1 flex-col">
            <CommunityBuildDetail
                initialBuild={{
                    ...build,
                    views: Math.max(build.views, views),
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
