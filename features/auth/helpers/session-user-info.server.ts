import "server-only";

import { getCurrentUserFromRequest } from "@/features/auth/helpers/auth-session.server";
import { buildSessionUserInfo } from "@/features/auth/helpers/session-user-info.shared";

export async function getSessionUserInfo() {
  const user = await getCurrentUserFromRequest();

  return buildSessionUserInfo(user);
}
