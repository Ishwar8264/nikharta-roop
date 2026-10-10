"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/components/authProvider";
import { isOnboardingComplete } from "./policy";

/** A dismissible reminder leaves browsing and booking available after skipping setup. */
export function OnboardingReminder() {
  const { user } = useAuth();
  const path = usePathname();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  if (
    !user ||
    dismissedFor === user.id ||
    isOnboardingComplete(user) ||
    path === "/onboarding" ||
    path.startsWith("/api/") ||
    ["/login", "/register", "/verify-otp", "/session-refresh"].includes(path)
  )
    return null;
  const partner = user.accountType === "SALON_PARTNER";
  return (
    <aside
      aria-label="Account setup reminder"
      className="border-b bg-primary/5 px-4 py-3"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {partner
              ? "Your salon partner setup is incomplete"
              : "Finish setting up your account"}
          </p>
          <p className="text-xs text-muted-foreground">
            {partner
              ? "Complete your details and consent before adding a salon. You can keep browsing and booking."
              : "You can keep exploring and complete your profile whenever you're ready."}
          </p>
        </div>
        <Button
          render={
            <Link href={partner ? "/onboarding?type=partner" : "/onboarding"} />
          }
        >
          Complete now
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dismiss account setup reminder"
          onPress={() => setDismissedFor(user.id)}
        >
          <X />
        </Button>
      </div>
    </aside>
  );
}
