import { canCreateSalon, isOnboardingComplete } from "@/features/onboarding/policy";
import { Mail, Pencil, Phone, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { UserBadge } from "@/components/shared/user-badge";
import { CoverImage } from "@/components/shared/cover-image";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";

export const metadata: Metadata = {
  title: "Profile | Nikharta Roop",
  description:
    "View your Nikharta Roop profile and account details.",
};

/** Displays the signed-in customer’s saved profile and contact details. */
export default async function ProfilePage() {
  const user = await getSession();
  if (!user) return null; // layout already redirects to /login

  return (
    <main className="w-full">
      <Card className="gap-0 rounded-2xl py-0">
        <CoverImage
          src={user.coverImage} alt="Profile cover" aspect="auto" rounded="none"
          priority unoptimized fallback={null}
          className="h-48 bg-linear-to-br from-secondary/40 via-primary/20 to-accent/30 sm:h-64"
          overlayClassName="bg-linear-to-t from-black/20 to-transparent"
        />
        <div className="px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href={routes.profile} className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <UserBadge
              name={user.name} email={user.email} avatar={user.avatar} size="lg"
              fallbackName="Your profile" nameAs="h1"
              className="flex w-full items-center gap-3 sm:gap-4"
              avatarClassName="size-24 bg-card ring-4 ring-card sm:size-28"
              fallbackClassName="text-2xl leading-none sm:text-3xl"
              contentClassName="w-full"
              nameClassName="font-heading text-xl leading-tight font-semibold sm:text-2xl"
            />
            </Link>
            <Button render={<Link href={routes.profileEdit} />} className="h-11 px-5">
              <Pencil aria-hidden="true" /> Edit profile
            </Button>
          </div>
        </div>
      </Card>
      <Card className="mt-6 rounded-2xl">
        <CardHeader>
          <CardTitle>Account setup</CardTitle>
          <CardDescription>
            {user.accountType === "SALON_PARTNER" ? "Salon partner" : user.accountType === "CUSTOMER" ? "Customer" : "Account type not selected"}
            {isOnboardingComplete(user) ? " · 100% complete" : " · Setup incomplete"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" render={<Link href={routes.onboarding} />}>
            {isOnboardingComplete(user) ? "Account preferences" : "Complete setup"}
          </Button>
          <Button render={<Link href={canCreateSalon(user) ? routes.salonCreate : routes.partnerOnboarding} />}>
            {canCreateSalon(user) ? "Add salon" : "Become a salon partner"}
          </Button>
        </CardContent>
      </Card>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="rounded-2xl">
          <CardHeader className="px-5 sm:px-7"><CardTitle>About you</CardTitle></CardHeader>
          <CardContent className="px-5 pb-3 sm:px-7">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
              {user.bio?.trim() || "Add a short bio to share a little about yourself and your style preferences."}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-2">
            <ShieldCheck className="mb-2 size-5 text-primary" aria-hidden="true" />
            <CardTitle>Contact details</CardTitle>
            <CardDescription>The email and phone number linked to your account.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-2">
            <dl className="divide-y">
              <div className="pb-5">
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="size-4" aria-hidden="true" /> Email address
                </dt>
                <dd className="mt-2 break-words font-medium">{user.email ?? "Not added"}</dd>
                {user.email ? (
                  <dd className={`mt-2 text-xs ${user.emailVerified ? "text-success" : "text-muted-foreground"}`}>
                    {user.emailVerified ? "Verified" : "Not verified"}
                  </dd>
                ) : null}
              </div>
              <div className="py-5">
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="size-4" aria-hidden="true" /> Phone number
                </dt>
                <dd className="mt-2 break-words font-medium">{user.phone ?? "Not added"}</dd>
                {user.phone ? (
                  <dd className={`mt-2 text-xs ${user.phoneVerified ? "text-success" : "text-muted-foreground"}`}>
                    {user.phoneVerified ? "Verified" : "Not verified"}
                  </dd>
                ) : null}
              </div>
            </dl>
            <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              Email and phone cannot be edited here. Contact support if you need to change them.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
