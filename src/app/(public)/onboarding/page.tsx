import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/get-session";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import {
  canCreateSalon,
  isOnboardingComplete,
  onboardingDestination,
} from "@/features/onboarding/policy";

export const metadata: Metadata = {
  title: "Set up your account",
  robots: { index: false, follow: false },
};

/** Optional account setup; only salon creation requires completed partner eligibility. */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; redirect?: string; welcome?: string }>;
}) {
  const params = await searchParams;
  const user = await getSession();
  if (!user)
    redirect(
      "/login?redirect=" +
        encodeURIComponent(
          "/onboarding" + (params.type === "partner" ? "?type=partner" : ""),
        ),
    );
  const destination = onboardingDestination(params.redirect);
  if (params.type === "partner" && canCreateSalon(user))
    redirect("/salons/create");
  if (params.welcome === "1" && isOnboardingComplete(user)) {
    redirect(
      params.redirect
        ? destination
        : canCreateSalon(user)
          ? "/salons/create"
          : "/salons",
    );
  }
  return (
    <OnboardingForm
      user={user}
      partnerRequested={params.type === "partner"}
      destination={destination}
    />
  );
}
