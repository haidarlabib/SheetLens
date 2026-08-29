import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BrandMark } from "@/components/ui/BrandMark";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WarningCircle, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

function getErrorMessage(code?: string): string | null {
  if (!code) return null;
  switch (code) {
    case "access_denied":
      return "Google sign-in was cancelled. Please authorize permissions to continue.";
    case "state_mismatch":
      return "Security validation failed (state mismatch). Please try again.";
    case "missing_oauth_cookie":
      return "Authentication session expired or cookies blocked across redirect. Please try again.";
    case "missing_code":
    case "missing_state":
    case "missing_oauth_parameters":
      return "Invalid response received from Google authentication.";
    case "token_exchange_failed":
      return "Failed to exchange authorization code with Google. Please try again.";
    case "profile_fetch_failed":
      return "Failed to retrieve user profile from Google. Please try again.";
    case "auth_callback_failed":
      return "Unable to establish an authenticated session. Please try again.";
    default:
      return decodeURIComponent(code).replace(/_/g, " ");
  }
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session?.user) {
    redirect("/home");
  }

  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between overflow-x-hidden bg-background text-foreground transition-colors duration-200 selection:bg-accent/20">
      {/* Quiet Top Utility Bar */}
      <header className="w-full max-w-4xl mx-auto px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrandMark size={24} />
          <span className="text-sm font-semibold tracking-tight text-foreground font-sans">
            SheetLens
          </span>
        </div>

        <ThemeToggle />
      </header>

      {/* Editorial, Confident Center Canvas */}
      <main className="flex-1 max-w-md mx-auto px-6 py-12 w-full flex flex-col items-center justify-center text-center">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-8 w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5 text-left"
          >
            <WarningCircle size={16} className="text-rose-500 shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Hero Geometric Presence */}
        <div className="mb-8 p-4 rounded-3xl bg-surface-inner border border-border flex items-center justify-center shadow-sm">
          <BrandMark size={48} />
        </div>

        {/* Wordmark & Pure Minimal Tagline */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans mb-2">
          SheetLens
        </h1>

        <p className="text-sm font-mono text-muted mb-8 tracking-tight">
          Documents <span className="text-accent">→</span> Data
        </p>

        {/* Tactical Understated Google Action */}
        <div className="w-full max-w-xs space-y-3">
          <GoogleLoginButton autoFocus />
          <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-muted font-mono">
            <ShieldCheck size={13} className="text-accent shrink-0" />
            <span>OAuth 2.0 · Least-Privilege drive.file</span>
          </div>
        </div>
      </main>

      {/* Ultra-Quiet Footer with Subtle Creator Credit */}
      <footer className="w-full py-6 text-center text-[11px] text-muted font-mono border-t border-border flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
        <span>SheetLens · Visual Data Instrument</span>
        <span className="hidden sm:inline">·</span>
        <span className="text-muted/80">Made by Izza</span>
      </footer>
    </div>
  );
}
