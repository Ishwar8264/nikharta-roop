"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { logoutAction } from "../actions/logout-action";

/**
 * Ends the session via a Server Action and navigates home.
 *
 * Why a Server Action instead of a fetch to the route handler:
 * The action calls revalidatePath("/", "layout"), which purges the client
 * Router Cache. A route handler cannot do that — the signed-in RSC payload
 * for "/" would remain cached, and router.push("/") would render a stale
 * header. This is the documented Next.js behaviour and the reason the
 * window.location workaround existed at all.
 *
 * Why router.replace, not router.push:
 * Logout should not leave the previous (authenticated) page in the history
 * stack. replace() drops it so a Back press cannot restore a signed-in view.
 */
export function useLogout(): { logout: () => void; isLoading: boolean } {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await logoutAction();
      router.replace("/");
    });
  }

  return { logout, isLoading: isPending };
}
