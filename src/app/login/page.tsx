import LoginClient from "@/components/auth/login-client";
import { Footer } from "@/components/site-footer";

const ERROR_MESSAGES: Record<string, string> = {
    discord_cancelled: "Discord sign-in was cancelled.",
    discord_state_mismatch: "Security verification failed. Please try signing in with Discord again.",
    discord_not_configured: "Discord OAuth is not configured on this server.",
    discord_token_failed: "Could not verify Discord login token. Check your Discord Redirect URI settings.",
    discord_profile_failed: "Unable to read your Discord profile.",
    discord_failed: "Discord sign-in failed. Please try again.",
    discord_invalid_request: "Invalid Discord OAuth callback request.",
};

interface LoginPageProps {
    searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { error } = await searchParams;
    const initialError = error ? ERROR_MESSAGES[error] || "Authentication error." : null;

    return (
        <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col justify-between overflow-hidden bg-background">
            <div
                className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12)_0%,transparent_70%)] blur-3xl"
                aria-hidden="true"
            />

            <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
                <LoginClient initialError={initialError} />
            </main>

            <Footer />
        </div>
    );
}
