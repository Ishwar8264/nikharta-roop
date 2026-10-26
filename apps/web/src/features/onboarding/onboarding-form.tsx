"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Mail,
  ShieldCheck,
  Scissors,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Field } from "@/features/auth/shared/components/field";
import type { CurrentUser } from "@/features/auth/shared/types";
import { api, ApiError } from "@/lib/api/backend.client";
import { onboardingSchema } from "@nikharta-roop/shared/schemas/forms/onboarding";
import { PARTNER_TERMS_URL, PARTNER_TERMS_VERSION } from "./policy";

type AccountType = "CUSTOMER" | "SALON_PARTNER";

/** A short, resumable setup: choosing intent alone never completes partner onboarding. */
export function OnboardingForm({
  user,
  partnerRequested,
  destination,
}: {
  user: CurrentUser;
  partnerRequested: boolean;
  destination: string;
}) {
  const router = useRouter();
  // Entry parameters are already resolved by the server; keep the visible URL clean.
  useEffect(() => {
    if (window.location.pathname === "/onboarding" && window.location.search) {
      window.history.replaceState(window.history.state, "", "/onboarding");
    }
  }, []);
  const [accountType, setAccountType] = useState<AccountType | null>(
    partnerRequested
      ? "SALON_PARTNER"
      : user.accountType === "CUSTOMER" || user.accountType === "SALON_PARTNER"
        ? user.accountType
        : null,
  );
  const [step, setStep] = useState(partnerRequested ? 2 : 1);
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [authorised, setAuthorised] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [skipFailed, setSkipFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState({ name: false, phone: false });
  const partner = accountType === "SALON_PARTNER";
  // Keep readable phone formatting in the input; send the existing API format.
  const normalizedPhone = phone.replace(/[\s()-]/g, "");
  const input = {
    accountType,
    name,
    ...(partner && normalizedPhone ? { phone: normalizedPhone } : {}),
    authorised,
    acceptTerms,
    termsVersion: PARTNER_TERMS_VERSION,
  };
  const parsed = onboardingSchema.safeParse(input);
  const validationErrors = parsed.success
    ? {}
    : Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]),
      );

  const phoneError = errors.phone || (touched.phone ? validationErrors.phone : undefined);

  function leave(path: string) {
    router.replace(path);
    router.refresh();
  }

  async function saveIntent(skip: boolean) {
    setError(null);
    setSkipFailed(false);
    if (!accountType) {
      if (skip) leave(destination);
      return;
    }
    setBusy(true);
    try {
      await api.patch("/auth/onboarding", {
        accountType,
        ...(name.trim().length >= 2 && name.trim().length <= 100
          ? { name: name.trim() }
          : {}),
        ...(partner && /^\+[1-9]\d{7,14}$/.test(normalizedPhone)
          ? { phone: normalizedPhone }
          : {}),
      });
      if (skip) leave(destination);
      else setStep(2);
    } catch (e) {
      setSkipFailed(skip);
      setError(
        e instanceof ApiError
          ? e.message
          : "Unable to save your preference. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function complete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/onboarding", parsed.data);
      leave(partner ? "/salons/create" : destination);
    } catch (e) {
      if (e instanceof ApiError) {
        const data = e.data as {
          errors?: { field: string; message: string }[];
        } | null;
        setErrors(
          Object.fromEntries(
            (data?.errors ?? []).map((issue) => [issue.field, issue.message]),
          ),
        );
        setError(e.message);
      } else
        setError(
          "Unable to save setup. Your details are still here; please try again.",
        );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      data-form-rounded="true"
      className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10"
      style={{ fontFamily: "var(--font-sans, Arial, sans-serif)" }}
    >
      {skipFailed && (
        <div className="mb-4 rounded-xl border p-4 text-sm">
          <p>
            Your preference could not be saved. You can retry or keep browsing.
          </p>
          <Button
            variant="link"
            className="mt-2"
            onPress={() => leave(destination)}
          >
            Continue without saving
          </Button>
        </div>
      )}
      <Card className="gap-6 rounded-2xl py-5 sm:py-7">
        <CardHeader className="gap-2 px-5 sm:px-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              Step {step} of 2 · Account setup
            </span>
            <Button
              variant="ghost"
              disabled={busy}
              onPress={() => void saveIntent(true)}
            >
              Skip for now
            </Button>
          </div>

          <CardTitle className="font-heading text-2xl leading-tight text-balance sm:text-3xl">
            {step === 1
              ? "What brings you here?"
              : partner
                ? "Your partner account"
                : "A little about you"}
          </CardTitle>
          <CardDescription className="max-w-lg leading-relaxed">
            {step === 1
              ? "Book your next visit or manage your salon. Salon partners can do both."
              : partner
                ? "Confirm your details to start adding your salon."
                : "Check your name, then you're ready to explore and book."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-7">
          {step === 1 ? (
            <div className="space-y-5">
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">Choose an account type</legend>
                {(
                  [
                    [
                      "CUSTOMER",
                      "Customer",
                      "Find salons and book services.",
                      Scissors,
                    ],
                    [
                      "SALON_PARTNER",
                      "Salon partner",
                      "List your salon and manage your business.",
                      Store,
                    ],
                  ] as const
                ).map(([value, title, description, Icon]) => (
                  <label
                    key={value}
                    className={`relative flex h-full cursor-pointer flex-col rounded-xl border-2 p-4 transition-colors sm:p-5 focus-within:ring-2 focus-within:ring-ring ${accountType === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                  >
                    <input
                      type="radio"
                      name="account-type"
                      value={value}
                      checked={accountType === value}
                      onChange={() => {
                        setAccountType(value);
                        setError(null);
                      }}
                      disabled={busy}
                      className="sr-only"
                    />
                    <Icon
                      className="mb-3 size-6 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </span>
                    {accountType === value && (
                      <Check
                        className="absolute right-4 top-4 size-4 text-primary"
                        aria-hidden="true"
                      />
                    )}
                  </label>
                ))}
              </fieldset>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              {!accountType && (
                <p className="text-xs text-muted-foreground">
                  Choose an option to continue. You can also set this up later.
                </p>
              )}
              <Button
                size="lg"
                className="w-full"
                disabled={!accountType || busy}
                onPress={() => void saveIntent(false)}
              >
                {busy ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={complete} noValidate className="space-y-5">
              {partner && user.email && (
                <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                  <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-all">Signed in as {user.email}</span>
                </div>
              )}
              <Field
                id="onboarding-name"
                label="Your name"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((current) => ({ ...current, name: "" }));
                }}
                onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                error={errors.name || (touched.name ? validationErrors.name : undefined)}
                required
                disabled={busy}
              />
              {partner && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="onboarding-phone" required>Business contact phone</Label>
                    <PhoneInput
                      value={phone}
                      initialCountry="in"
                      onValueChange={(value) => {
                        setPhone(value);
                        setErrors((current) => ({ ...current, phone: "" }));
                      }}
                      disabled={busy}
                      inputProps={{
                        id: "onboarding-phone",
                        required: true,
                        autoComplete: "tel",
                        placeholder: "98765 43210",
                        onBlur: () => setTouched((current) => ({ ...current, phone: true })),
                        "aria-invalid": phoneError ? true : undefined,
                        "aria-describedby": `onboarding-phone-description${phoneError ? " onboarding-phone-error" : ""}`,
                      }}
                    />
                    <p id="onboarding-phone-description" className="text-xs leading-relaxed text-muted-foreground">
                      Country code is included. Saving your number does not verify it.
                    </p>
                    {phoneError && (
                      <p id="onboarding-phone-error" className="text-xs text-destructive">{phoneError}</p>
                    )}
                  </div>
                  <fieldset className="space-y-3 border-t border-border pt-4">
                    <legend className="sr-only">Partner confirmations</legend>
                    <div className="space-y-1.5">
                      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                        <input
                          type="checkbox"
                          checked={authorised}
                          onChange={(e) => setAuthorised(e.target.checked)}
                          disabled={busy}
                          aria-describedby={
                            errors.authorised ? "authority-error" : undefined
                          }
                          className="mt-0.5 size-4 shrink-0 accent-primary"
                        />
                        <span>
                          I own the salon or am authorised to represent it.
                        </span>
                      </label>
                      {errors.authorised && (
                        <p
                          id="authority-error"
                          className="text-xs text-destructive"
                        >
                          {errors.authorised}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          disabled={busy}
                          aria-describedby={
                            errors.acceptTerms ? "consent-error" : undefined
                          }
                          className="mt-0.5 size-4 shrink-0 accent-primary"
                        />
                        <span>
                          I accept the{" "}
                          <Link
                            href={PARTNER_TERMS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            Terms of Service, including Salon Partners
                          </Link>{" "}
                          <span className="mt-0.5 block text-xs text-muted-foreground">Version {PARTNER_TERMS_VERSION}</span>
                        </span>
                      </label>
                      {errors.acceptTerms && (
                        <p
                          id="consent-error"
                          className="text-xs text-destructive"
                        >
                          {errors.acceptTerms}
                        </p>
                      )}
                    </div>
                  </fieldset>
                  <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Next: salon details & document review</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Your salon goes live after document approval. You can still book services.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              {!parsed.success && (
                <p className="text-xs text-muted-foreground">
                  {partner
                    ? "To continue, add your name and phone number, then tick both confirmations."
                    : "Enter a name with 2–100 characters to continue."}
                </p>
              )}
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <Button
                  variant="ghost"
                  disabled={busy}
                  onPress={() => {
                    setStep(1);
                    setErrors({});
                    setError(null);
                  }}
                >
                  <ArrowLeft /> Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  disabled={busy || !parsed.success}
                >
                  {busy ? (
                    <>
                      <Loader2 className="animate-spin" /> Saving…
                    </>
                  ) : partner ? (
                    <>
                      Complete & add salon <ArrowRight />
                    </>
                  ) : (
                    <>
                      Start exploring <ArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
