import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthUser } from "@/features/auth/actions/auth-action.types";
import { handleMe } from "@/features/auth/handlers/auth.handlers";
import { CustomerHeader } from "@/features/navigation/components/customer-header";
import { CustomerBottomNav } from "@/features/navigation/components/customer-bottom-nav";

type AuthMePayload = {
  data?: {
    user?: AuthUser;
  } | null;
  success?: boolean;
};

export default async function CustomerAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCustomerUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-[#fffaf6] pb-20 text-stone-950 md:pb-0">
      <CustomerHeader user={user} />
      <main>{children}</main>
      <CustomerBottomNav />
    </div>
  );
}

async function getCustomerUser() {
  const requestHeaders = await createAuthRequestHeaders();

  if (!requestHeaders.has("cookie")) {
    return null;
  }

  const response = await handleMe(
    new Request("http://nikharta-roop.local/account-layout", {
      headers: requestHeaders,
      method: "GET",
    }),
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as
    | AuthMePayload
    | null;

  return payload?.success ? payload.data?.user ?? null : null;
}

async function createAuthRequestHeaders() {
  const incomingHeaders = await headers();
  const cookieStore = await cookies();
  const requestHeaders = new Headers();

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");

  if (cookieHeader) {
    requestHeaders.set("cookie", cookieHeader);
  }

  const userAgent = incomingHeaders.get("user-agent");
  const forwardedFor = incomingHeaders.get("x-forwarded-for");
  const realIp = incomingHeaders.get("x-real-ip");

  if (userAgent) {
    requestHeaders.set("user-agent", userAgent);
  }

  if (forwardedFor) {
    requestHeaders.set("x-forwarded-for", forwardedFor);
  }

  if (realIp) {
    requestHeaders.set("x-real-ip", realIp);
  }

  return requestHeaders;
}
