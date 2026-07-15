"use client";

// Load the global browser session and real logout action.
import { useAuth } from "@/src/components/auth/providers/auth-provider";
// Load the shared error copy helper so backend and network messages stay consistent.
import { getAuthErrorMessage } from "@/src/components/auth/utils/auth-flow";
// Load the shared application toast used for logout feedback.
import { showAppToast } from "@/src/components/shared/toast/app-toast";
// Load the shared button so the account trigger follows existing interaction styles.
import { Button } from "@/src/components/ui/button";
// Load the reusable accessible dropdown pieces used by the account menu.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
// Load focused icons that make each account action easy to scan.
import {
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
// Load client navigation for the unauthenticated sign-in fallback.
import Link from "next/link";
// Load focused local state for the logout request only.
import { useState } from "react";

// Render the private navigation account menu from the restored browser session.
export function UserMenu() {
  // Read the current safe user, restore state, and server-backed logout action.
  const { isLoading, logout, user } = useAuth();

  // Prevent repeated logout requests while refresh or revocation is in progress.
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Revoke the server session and preserve an actionable failure message.
  const handleLogout = async () => {
    // Ignore repeated selection while one logout request is already running.
    if (isLoggingOut) {
      return;
    }

    // Disable the destructive action until the complete request settles.
    setIsLoggingOut(true);

    try {
      // Revoke the session, clear cookies, and navigate to the login route.
      await logout();

      // Confirm successful server-backed logout through the shared toast system.
      showAppToast({
        description: "Your session has been closed safely.",
        heading: "Logged out",
        variant: "success",
      });
    } catch (error) {
      // Preserve the backend or network error without pretending logout succeeded.
      showAppToast({
        description: getAuthErrorMessage(error),
        heading: "Logout failed",
        variant: "error",
      });
    } finally {
      // Re-enable logout when the current request completes without navigation.
      setIsLoggingOut(false);
    }
  };

  // Keep the account area stable while me and optional refresh requests resolve.
  if (isLoading) {
    return (
      <Button
        aria-label="Loading user session"
        disabled
        size="sm"
        type="button"
        variant="ghost"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <UserRound aria-hidden="true" className="size-4" />
        </span>
      </Button>
    );
  }

  // Offer login instead of rendering private user actions without a live session.
  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  // Prefer the optional profile name before falling back to a verified identity.
  const accountLabel = user.name ?? user.email ?? user.mobile ?? "Account";

  // Format the trusted role once for a readable account fallback.
  const roleLabel = user.role.replaceAll("_", " ");

  // Avoid repeating the same identity when no optional profile name exists.
  const accountDetail = user.name
    ? (user.email ?? user.mobile ?? roleLabel)
    : roleLabel;

  // Keep all account actions inside one keyboard-accessible dropdown.
  return (
    <DropdownMenu>
      {/* Use the shared button as the accessible menu trigger. */}
      <DropdownMenuTrigger asChild>
        {/* Show a compact account control that still has a clear screen-reader label. */}
        <Button
          aria-label="Open user menu"
          size="sm"
          type="button"
          variant="ghost"
        >
          {/* Use the safe profile icon without exposing raw authentication tokens. */}
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <UserRound aria-hidden="true" className="size-4" />
          </span>
          {/* Show the restored user identity only when the navbar has enough room. */}
          <span className="hidden max-w-36 truncate xl:inline">
            {accountLabel}
          </span>
          {/* Indicate that the account control opens additional options. */}
          <ChevronDown
            aria-hidden="true"
            className="hidden size-3.5 text-muted-foreground xl:block"
          />
        </Button>
      </DropdownMenuTrigger>

      {/* Align the account panel with the right edge of its trigger. */}
      <DropdownMenuContent align="end" className="w-52">
        {/* Show only safe profile data returned by OTP verification or me. */}
        <DropdownMenuLabel className="space-y-1">
          <span className="block truncate">{accountLabel}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {accountDetail}
          </span>
        </DropdownMenuLabel>
        {/* Separate account context from its available actions. */}
        <DropdownMenuSeparator />

        {/* Present the future profile destination as a UI-only menu action. */}
        <DropdownMenuItem disabled>
          <UserRound aria-hidden="true" className="size-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        {/* Present account preferences without attaching a route prematurely. */}
        <DropdownMenuItem disabled>
          <Settings aria-hidden="true" className="size-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        {/* Visually isolate the future session-ending action from regular navigation. */}
        <DropdownMenuSeparator />

        {/* Call the real endpoint while preventing the menu from closing mid-request. */}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          disabled={isLoggingOut}
          onSelect={(event) => {
            // Keep request feedback visible until logout finishes or reports an error.
            event.preventDefault();

            // Start the asynchronous logout action without returning a promise to Radix.
            void handleLogout();
          }}
        >
          <LogOut aria-hidden="true" className="size-4" />
          <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
