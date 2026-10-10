/** The published terms version accepted by new salon partners. */
export const PARTNER_TERMS_VERSION = "2026-09-28";
export const PARTNER_TERMS_URL = "/terms#partners";

interface OnboardingState {
  accountType?: string | null;
  onboardingCompletedAt?: Date | string | null;
  partnerCompletedAt?: Date | string | null;
  partnerTermsVersion?: string | null;
  partnerTermsAcceptedAt?: Date | string | null;
  partnerEligibilityBackfilledAt?: Date | string | null;
}

/** Eligibility survives choosing a customer destination and never uses platform roles. */
export function canCreateSalon(user: OnboardingState): boolean {
  return Boolean(
    user.partnerEligibilityBackfilledAt ||
      (user.partnerCompletedAt &&
        user.partnerTermsAcceptedAt &&
        user.partnerTermsVersion),
  );
}

export function isOnboardingComplete(user: OnboardingState): boolean {
  return Boolean(
    user.onboardingCompletedAt &&
      user.accountType &&
      (user.accountType === "CUSTOMER" || canCreateSalon(user)),
  );
}

/** Allow local browsing, booking and account routes; destination pages enforce permissions. */
export function onboardingDestination(
  value: string | null | undefined,
): string {
  if (
    !value ||
    /[\\\s]/.test(value) ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return "/salons";
  try {
    const url = new URL(value, "https://local.invalid");
    if (url.origin !== "https://local.invalid") return "/salons";
    if (
      /^\/(dashboard|appointments|profile|settings|favorites|loyalty|admin)(?:\/|$)/.test(
        url.pathname,
      ) ||
      url.pathname === "/salons" ||
      /^\/salons\/[^/]+(?:\/book|\/services)?$/.test(url.pathname)
    ) {
      if (url.pathname === "/salons/create") return "/salons";
      return url.pathname + url.search + url.hash;
    }
  } catch {
    /* Invalid paths use the directory. */
  }
  return "/salons";
}

/** Preserves a protected action across registration, verification and optional setup. */
export function onboardingWelcomeUrl(requested?: string | null): string {
  if (
    requested === "/salons/create" ||
    requested === "/onboarding?type=partner"
  ) {
    return "/onboarding?welcome=1&type=partner";
  }
  if (!requested || requested === "/onboarding") return "/onboarding?welcome=1";
  return (
    "/onboarding?welcome=1&redirect=" +
    encodeURIComponent(onboardingDestination(requested))
  );
}
