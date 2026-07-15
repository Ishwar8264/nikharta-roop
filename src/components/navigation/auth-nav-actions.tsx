"use client";

// Load the resolved browser session used to choose guest or account controls.
import { useAuth } from "@/src/components/auth/providers/auth-provider";
// Load the authenticated account menu used after session restoration.
import { UserMenu } from "@/src/components/navigation/user-menu";
// Load the shared button for public login, signup, and loading states.
import { Button } from "@/src/components/ui/button";
// Load the shared class utility for compact and expanded action layouts.
import { cn } from "@/src/lib/utils";
// Load recognizable icons for guest authentication and session loading.
import { LogIn, UserPlus, UserRound } from "lucide-react";
// Load optimized client navigation for public authentication destinations.
import Link from "next/link";

// Describe whether navigation actions should remain compact or show full labels.
type AuthNavActionsProps = {
  // Reveal labels inside drawers where enough horizontal space is available.
  showLabels?: boolean;
};

// Render account controls only after browser session restoration resolves.
export function AuthNavActions({ showLabels = false }: AuthNavActionsProps) {
  // Read the minimum session state required to choose public or private controls.
  const { isAuthenticated, isLoading } = useAuth();

  // Preserve a stable neutral control while the me and optional refresh flow runs.
  if (isLoading) {
    return (
      <Button
        aria-label="Loading user session"
        className={cn(showLabels && "w-full justify-start")}
        disabled
        size={showLabels ? "default" : "icon"}
        type="button"
        variant="ghost"
      >
        {/* Keep the loading control recognizable without showing guest actions early. */}
        <UserRound aria-hidden="true" className="size-4" />
        {/* Explain the neutral pending state inside the expanded drawer treatment. */}
        {showLabels ? <span>Loading account...</span> : null}
      </Button>
    );
  }

  // Replace public authentication actions with the real account menu after login.
  if (isAuthenticated) {
    return <UserMenu showLabel={showLabels} />;
  }

  // Keep both public authentication routes available to anonymous visitors.
  return (
    <div className={cn("flex items-center gap-2", showLabels && "grid w-full")}>
      {/* Open the public OTP login route without invoking private route protection. */}
      <Button
        asChild
        className={cn(showLabels && "w-full justify-start")}
        size="sm"
        variant="ghost"
      >
        <Link href="/login">
          {/* Pair the compact action with a recognizable login icon. */}
          <LogIn aria-hidden="true" className="size-4" />
          {/* Reveal the label in drawers and only on very wide desktop headers. */}
          <span className={cn(!showLabels && "hidden xl:inline")}>Log in</span>
          {/* Preserve a compact accessible name when the visible label is hidden. */}
          {!showLabels ? <span className="sr-only xl:hidden">Log in</span> : null}
        </Link>
      </Button>

      {/* Open the public account registration route without invoking private protection. */}
      <Button
        asChild
        className={cn(showLabels && "w-full justify-start")}
        size="sm"
      >
        <Link href="/signup">
          {/* Pair the primary guest action with a recognizable signup icon. */}
          <UserPlus aria-hidden="true" className="size-4" />
          {/* Reveal the label in drawers and only on very wide desktop headers. */}
          <span className={cn(!showLabels && "hidden xl:inline")}>Sign up</span>
          {/* Preserve a compact accessible name when the visible label is hidden. */}
          {!showLabels ? (
            <span className="sr-only xl:hidden">Sign up</span>
          ) : null}
        </Link>
      </Button>
    </div>
  );
}
