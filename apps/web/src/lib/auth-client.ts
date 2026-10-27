"use client";

import { AUTH_BASE_PATH } from "@nikharta-roop/shared";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: AUTH_BASE_PATH,
  plugins: [emailOTPClient()],
});
