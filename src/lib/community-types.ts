export const COMMUNITY_CATEGORIES = [
    "General",
    "Trials",
    "Escalation",
    "Heroic Escalation",
    "Beginner",
    "Fun / Meme",
] as const;

export type BuildVisibility = "public" | "private";

export interface CommunityBuildRecord {
    id: string;
    buildId: string;
    title: string;
    description: string | null;
    category: string;
    visibility?: BuildVisibility;
    weaponType: string;
    weaponName: string;
    element: string | null;
    omnicell: string | null;
    accountId: string;
    authorUsername: string;
    authorDisplayName: string;
    createdAt: string | Date;
    likes: number;
    views: number;
    commentCount: number;
}

export interface CommunityCommentRecord {
    id: string;
    communityBuildId: string;
    parentId?: string | null;
    accountId: string;
    authorUsername: string;
    authorDisplayName: string;
    content: string;
    gifUrl?: string | null;
    createdAt: string | Date;
    likes: number;
    likedByMe: boolean;
}

export type NotificationType = "build_comment" | "comment_reply" | "build_like" | "comment_like";

export interface AccountNotificationRecord {
    id: string;
    accountId: string;
    actorId: string;
    actorUsername: string;
    actorDisplayName: string;
    type: string;
    title: string;
    message: string;
    href: string;
    read: boolean;
    createdAt: string | Date;
}
