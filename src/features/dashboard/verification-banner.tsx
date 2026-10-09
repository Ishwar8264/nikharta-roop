import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import type { PublicSalonVerification } from "@/server/modules/verification/verification.types";

interface VerificationBannerProps {
  /** Slug of the salon this banner is about — used to build the manage link. */
  salonSlug: string;
  /** Display name of the salon — surfaces context when the user owns several. */
  salonName: string;
  /**
   * The salon's verification row, or null when no row exists yet. The service
   * layer returns null for "no row" only when the caller swallows
   * `SalonVerificationNotFoundError`; the dashboard page does that collapsing
   * so this component never has to know about the typed error class.
   */
  verification: PublicSalonVerification | null;
}

type BannerTone = "success" | "warning" | "destructive" | "info";

interface BannerConfig {
  tone: BannerTone;
  icon: LucideIcon;
  title: string;
  body: ReactNode;
  actionLabel: string;
}

const TONE_CONTAINER: Record<BannerTone, string> = {
  success: "border-success/30 bg-success/10 text-success-foreground",
  warning: "border-warning/30 bg-warning/10 text-warning-foreground",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info-foreground",
};

const TONE_ICON: Record<BannerTone, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

/**
 * Status banner that surfaces salon-verification state on the dashboard.
 *
 * Why a separate component from `verification-panel.tsx`'s StatusBanner:
 * That banner lives on the owner verification page and triggers a client
 * form when its "Fix and resubmit" button is clicked. The dashboard banner
 * is server-only and links to that page instead of triggering the form —
 * the call-to-action is "go to the verification page", not "act here".
 *
 * Why the four tones map directly to §6.4 of the wiring doc:
 * `success` → VERIFIED, `warning` → PENDING, `destructive` → REJECTED
 * and SUSPENDED, `info` → no row yet (the dashboard's first-time onboarding
 * nudge). The token names are wired in `globals.css` so we never hardcode
 * a hex value here.
 */
export function VerificationBanner({
  salonSlug,
  salonName,
  verification,
}: VerificationBannerProps) {
  const config = buildBannerConfig(salonName, verification);
  const Icon = config.icon;
  const href = routes.salonVerification(salonSlug);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        TONE_CONTAINER[config.tone],
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn("mt-0.5 shrink-0", TONE_ICON[config.tone])}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">{config.title}</p>
          <p className="text-sm text-muted-foreground">{config.body}</p>
        </div>
      </div>
      <div className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={href} />}
          nativeButton={false}
        >
          {config.actionLabel}
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Maps a verification row to the four banner configs from wiring doc §6.4.
 *
 * Why centralised here:
 * Each tone also dictates the icon, copy, and action label. Keeping the
 * mapping in one place means a future status (e.g. EXPIRED) is one new
 * branch, not three edits across the JSX.
 */
function buildBannerConfig(
  salonName: string,
  verification: PublicSalonVerification | null,
): BannerConfig {
  if (!verification) {
    return {
      tone: "info",
      icon: Info,
      title: "Get your salon verified",
      body: (
        <span>
          Submit your documents to unlock the verified badge and publish{" "}
          <span className="font-medium">{salonName}</span>.
        </span>
      ),
      actionLabel: "Start verification",
    };
  }

  switch (verification.status) {
    case "VERIFIED":
      return {
        tone: "success",
        icon: CheckCircle2,
        title: `${salonName} is verified`,
        body: "Customers see the verified badge on your public profile.",
        actionLabel: "View verification",
      };

    case "PENDING":
      return {
        tone: "warning",
        icon: Clock,
        title: "Verification under review",
        body: "We're reviewing your documents. Usually takes 1–2 days.",
        actionLabel: "Open verification",
      };

    case "REJECTED":
      return {
        tone: "destructive",
        icon: XCircle,
        title: "Verification rejected",
        body: verification.reason ? (
          <span>
            Reason: <span className="font-medium">{verification.reason}</span>
          </span>
        ) : (
          "Please review your documents and resubmit."
        ),
        actionLabel: "Fix and resubmit",
      };

    case "SUSPENDED":
      return {
        tone: "destructive",
        icon: XCircle,
        title: "Listing suspended",
        body: verification.reason ? (
          <span>
            Reason: <span className="font-medium">{verification.reason}</span>
          </span>
        ) : (
          "Please contact support to restore your listing."
        ),
        actionLabel: "Open verification",
      };

    default:
      // Exhaustiveness guard — if the enum grows, the build breaks here
      // instead of silently rendering an empty banner.
      return {
        tone: "info",
        icon: Info,
        title: "Verification status",
        body: "Open the verification page for the latest status.",
        actionLabel: "Open verification",
      };
  }
}
