import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ProfileForm } from "@/features/profile";
import type { UserProfile } from "@/features/profile";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";

export const metadata: Metadata = {
  title: "Edit profile | Nikharta Roop",
  description: "Update your name, profile photo, and bio.",
};

/** Keeps profile editing separate from the saved profile overview. */
export default async function EditProfilePage() {
  const user = await getSession();
  if (!user) return null; // The dashboard layout handles the login redirect.

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio,
    lat: user.lat,
    lng: user.lng,
    role: user.role,
    isOnboarded: user.isOnboarded,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    loyaltyPoints: user.loyaltyPoints,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href={routes.profile} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to profile
      </Link>
      <header className="mb-8 mt-4">
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Edit profile</h1>
        <p className="mt-3 text-sm text-muted-foreground">Update your photo, name, and a little about yourself.</p>
      </header>
      <ProfileForm initial={profile} />
    </main>
  );
}
