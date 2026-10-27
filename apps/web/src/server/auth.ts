import "server-only";

import { AUTH_BASE_PATH, passwordSchema, registerSchema } from "@nikharta-roop/shared";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, openAPI } from "better-auth/plugins";

import { activateVerifiedAccount, createAuthDatabase, findAuthAccount } from "@/server/db";
import { sendAuthEmail } from "@/server/email";
import { authStorage } from "@/server/redis";

export const auth = betterAuth({
  appName: "Nikharta Roop",
  basePath: AUTH_BASE_PATH,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: createAuthDatabase(),
  advanced: { database: { generateId: false } },
  account: {
    fields: { providerId: "provider", accountId: "providerUserId", password: "passwordHash" },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, input: false },
      status: { type: "string", required: false, input: false },
    },
  },
  secondaryStorage: authStorage,
  session: {
    storeSessionInDatabase: true,
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  verification: { storeInDatabase: true },
  rateLimit: {
    enabled: true,
    storage: "secondary-storage",
    window: 60,
    max: 100,
    customRules: {
      "/sign-up/email": { window: 60, max: 5 },
      "/sign-in/email": { window: 60, max: 10 },
      "/request-password-reset": { window: 60, max: 3 },
      "/email-otp/send-verification-otp": { window: 60, max: 1 },
      "/email-otp/verify-email": { window: 60, max: 5 },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    password: {
      // Legacy custom hashes need password recovery; do not throw or misinterpret their format.
      verify: async ({ hash, password }) =>
        /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(hash) ? verifyPassword({ hash, password }) : false,
    },
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail(
        user.email,
        "Reset your password",
        `This link expires in one hour:\n${url}`,
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    afterEmailVerification: async (user) => {
      await activateVerifiedAccount(user.id);
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await findAuthAccount(session.userId);
          if (!user || user.deletedAt || user.status !== "ACTIVE" || !user.emailVerified) {
            throw new APIError("FORBIDDEN", { message: "This account cannot sign in." });
          }
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/email-otp/send-verification-otp" &&
        ctx.body?.type !== "email-verification"
      ) {
        throw new APIError("FORBIDDEN", { message: "Only email verification OTPs are enabled." });
      }
      let result;
      if (ctx.path === "/sign-up/email") result = registerSchema.safeParse(ctx.body);
      else if (ctx.path === "/reset-password" || ctx.path === "/change-password") {
        result = passwordSchema.safeParse(ctx.body?.newPassword);
      }
      if (result && !result.success) {
        throw new APIError("BAD_REQUEST", {
          message: result.error.issues[0]?.message ?? "Invalid input",
        });
      }
    }),
  },
  disabledPaths: [
    "/sign-in/email-otp",
    "/email-otp/check-verification-otp",
    "/email-otp/request-password-reset",
    "/forget-password/email-otp",
    "/email-otp/reset-password",
    "/email-otp/request-email-change",
    "/email-otp/change-email",
    "/send-verification-email",
    "/verify-email",
  ],
  plugins: [
    openAPI({ disableDefaultReference: true }),
    emailOTP({
      overrideDefaultEmailVerification: true,
      disableSignUp: true,
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== "email-verification")
          throw new Error("Only email verification OTPs are enabled");
        await sendAuthEmail(
          email,
          "Verify your email",
          `Your code is ${otp}. It expires in 5 minutes.`,
        );
      },
    }),
    nextCookies(),
  ],
});
