import { Mail, Pencil, Phone, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const initials = (user.name ?? "").trim().split(/\s+/).slice(0, 2)
    .map((part) => part.charAt(0)).join("").toUpperCase() || "?";

  return (
    <main className="w-full">
      <Card className="rounded-2xl py-0">
        <div className="relative h-48 overflow-hidden bg-linear-to-br from-secondary/40 via-primary/20 to-accent/30 sm:h-64">
          {user.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.coverImage} alt="Profile cover" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Avatar size="lg" className="relative -mt-12 size-24 bg-card ring-4 ring-card sm:-mt-16 sm:size-32">
              {user.avatar ? <AvatarImage src={user.avatar} alt="Profile photo" /> : null}
              <AvatarFallback className="bg-primary/10 text-3xl font-semibold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <Button nativeButton={false} render={<Link href={routes.profileEdit} />} className="h-11 px-5">
              <Pencil aria-hidden="true" /> Edit profile
            </Button>
          </div>
          <p className="mt-5 text-xs font-medium uppercase tracking-widest text-primary">My profile</p>
          <h1 className="mt-2 break-words font-heading text-3xl font-semibold sm:text-4xl">{user.name || "Your profile"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your personal space at Nikharta Roop.</p>
        </div>
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
