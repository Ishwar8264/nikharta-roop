"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Scissors,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { onboardingSchema } from "./schema";
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
  const partner = accountType === "SALON_PARTNER";
  const input = {
    accountType,
    name,
    ...(partner && phone.trim() ? { phone: phone.trim() } : {}),
    authorised,
    acceptTerms,
    termsVersion: PARTNER_TERMS_VERSION,
  };
  const parsed = onboardingSchema.safeParse(input);
  const requirements = partner
    ? [
        Boolean(accountType),
        name.trim().length >= 2 && name.trim().length <= 100,
        /^\+[1-9]\d{7,14}$/.test(phone.trim()),
        authorised,
        acceptTerms,
      ]
    : [
        Boolean(accountType),
        name.trim().length >= 2 && name.trim().length <= 100,
      ];
  const progress = Math.round(
    (requirements.filter(Boolean).length / (requirements.length + 1)) * 100,
  );

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
        ...(partner && /^\+[1-9]\d{7,14}$/.test(phone.trim())
          ? { phone: phone.trim() }
          : {}),
      });
      if (skip) leave(destination);
      else {
        setStep(2);
        router.refresh();
      }
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
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div className="mb-6 flex items-center justify-between gap-3 text-sm">
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
      <Card className="rounded-2xl">
        <CardHeader className="space-y-3 p-6 sm:p-8">
          <div className="flex justify-between gap-4 text-xs text-muted-foreground">
            <span>Save your setup to reach 100%. You can finish anytime.</span>
            <span>{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Account setup progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <CardTitle className="pt-3 font-heading text-2xl sm:text-3xl">
            {step === 1
              ? "How would you like to use Nikharta Roop?"
              : partner
                ? "Let's set up your partner account"
                : "A little about you"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Choose what brings you here. Salon partners can also book services."
              : partner
                ? "Complete your details to add a salon. Salon verification comes next."
                : "Check your name, then you're ready to explore and book."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
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
                    className={`relative cursor-pointer rounded-xl border-2 p-5 transition-colors focus-within:ring-2 focus-within:ring-ring ${accountType === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
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
                      className="mb-4 size-6 text-primary"
                      aria-hidden="true"
                    />
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
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
                  Select an option to continue, or skip for now.
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
              <Field
                id="onboarding-name"
                label="Your name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
                disabled={busy}
              />
              {partner && (
                <>
                  {user.email && (
                    <p className="text-sm text-muted-foreground">
                      Account email:{" "}
                      <span className="break-all text-foreground">
                        {user.email}
                      </span>
                    </p>
                  )}
                  <Field
                    id="onboarding-phone"
                    label="Business contact phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    description="Use your country code, e.g. +919876543210. This saves your contact number; it does not verify it."
                    error={errors.phone}
                    required
                    disabled={busy}
                  />
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={authorised}
                        onChange={(e) => setAuthorised(e.target.checked)}
                        disabled={busy}
                        aria-describedby={
                          errors.authorised ? "authority-error" : undefined
                        }
                        className="mt-1 size-4 accent-primary"
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
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        disabled={busy}
                        aria-describedby={
                          errors.acceptTerms ? "consent-error" : undefined
                        }
                        className="mt-1 size-4 accent-primary"
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
                        (version {PARTNER_TERMS_VERSION}).
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
                  <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                    Your salon stays private until its documents are reviewed
                    and approved. You can still browse and book services.
                  </p>
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
                    ? "Add your name and a valid phone number, then confirm your authority and accept the terms."
                    : "Enter a name with 2–100 characters to continue."}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
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
