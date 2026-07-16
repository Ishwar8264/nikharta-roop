import { z } from "zod";

import { createApiResponseSchema } from "@/src/validations/api.validation";

// Validate and preserve the existing ten-digit Indian mobile format.
const mobileSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{10}$/, "Invalid Indian mobile number (10 digits)");

// Normalize email casing so database uniqueness and login lookup stay consistent.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(150, "Email must be 150 characters or fewer");

// Reuse the same optional identity fields across send and verify endpoints.
const authIdentifierShape = {
  mobile: mobileSchema.optional(),
  email: emailSchema.optional(),
};

// Require exactly one identity so clients cannot send ambiguous auth requests.
const requireExactlyOneIdentifier = (
  value: { mobile?: string; email?: string },
  context: z.RefinementCtx,
) => {
  // Count the provided identifiers after Zod has normalized their values.
  const providedIdentifierCount = Number(Boolean(value.mobile)) + Number(Boolean(value.email));

  // Accept the input only when mobile or email is present, but never both.
  if (providedIdentifierCount === 1) {
    return;
  }

  // Attach one clear validation error to the whole request payload.
  context.addIssue({
    code: "custom",
    message: "Provide exactly one of mobile or email",
  });
};

// Validate the dedicated login endpoint without accepting a client-controlled purpose.
export const loginSchema = z
  .object(authIdentifierShape)
  .superRefine(requireExactlyOneIdentifier);

// Allow registration through exactly one supported mobile or email identity.
export const registerSchema = z
  .object(authIdentifierShape)
  .superRefine(requireExactlyOneIdentifier);

// Validate the reusable message returned after an OTP request succeeds.
export const otpSentDataSchema = z.object({
  message: z.string().min(1),
});

// Validate every login or signup OTP delivery response through one shared contract.
export const authOtpSentResponseSchema =
  createApiResponseSchema(otpSentDataSchema);

// Validate generic OTP requests used by existing API clients and documentation tools.
export const sendOtpSchema = z
  .object({
    ...authIdentifierShape,
    purpose: z.enum(["LOGIN", "SIGNUP"]).default("LOGIN"),
  })
  .superRefine(requireExactlyOneIdentifier);

// Reuse one six-digit OTP rule across the verification form and API payload.
const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, "OTP must be 6 digits");

// Validate the visible OTP field without duplicating the complete API payload.
export const otpInputSchema = z.object({
  otp: otpCodeSchema,
});

// Validate OTP verification for either login channel while keeping purpose explicit.
export const verifyOtpSchema = z
  .object({
    ...authIdentifierShape,
    otp: otpCodeSchema,
    purpose: z.enum(["LOGIN", "SIGNUP"]),
  })
  .superRefine(requireExactlyOneIdentifier);

// Validate the safe user fields shared by OTP verification and session restoration.
export const authenticatedUserSchema = z.object({
  id: z.string().min(1),
  mobile: z.string().nullable(),
  email: z.string().email().nullable(),
  role: z.enum(["USER", "STAFF", "ADMIN", "SUPER_ADMIN"]),
  isMobileVerified: z.boolean(),
  isEmailVerified: z.boolean(),
  // Accept an optional profile name because OTP responses return only core identity fields.
  name: z.string().max(100).nullable().optional(),
  // Accept an optional avatar because the me endpoint enriches the core auth user.
  avatarUrl: z.string().nullable().optional(),
});

// Validate the token pair returned to non-browser clients after rotation.
export const authTokensDataSchema = z.object({
  // Require the short-lived access token retained for external API compatibility.
  accessToken: z.string().min(1),
  // Require the rotating refresh token retained for external API compatibility.
  refreshToken: z.string().min(1),
});

// Validate the complete session payload while cookies protect browser persistence.
export const authSessionDataSchema = authTokensDataSchema.extend({
  user: authenticatedUserSchema,
});

// Validate the complete safe profile returned by the authenticated me endpoint.
export const currentUserDataSchema = authenticatedUserSchema.extend({
  // Require the nullable profile name because me always returns this selected field.
  name: z.string().max(100).nullable(),
  // Require the nullable avatar because me always returns this selected field.
  avatarUrl: z.string().nullable(),
  // Validate every supported optional profile gender from the Prisma enum.
  gender: z
    .enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"])
    .nullable(),
  // Validate serialized nullable dates returned through the JSON route response.
  dateOfBirth: z.string().datetime().nullable(),
  // Confirm the protected endpoint returns the selected account status.
  isActive: z.boolean(),
  // Keep onboarding progress within its non-negative database contract.
  onboardingStep: z.number().int().nonnegative(),
  // Validate the serialized account creation timestamp returned by me.
  createdAt: z.string().datetime(),
});

// Validate OTP verification responses before the signup UI trusts session creation.
export const verifyOtpResponseSchema = createApiResponseSchema(
  authSessionDataSchema,
);

// Validate the current user response before restoring client authentication state.
export const currentUserResponseSchema = createApiResponseSchema(
  currentUserDataSchema,
);

// Validate rotated tokens even though browser clients keep them in HttpOnly cookies.
export const refreshAuthResponseSchema = createApiResponseSchema(
  authTokensDataSchema,
);

// Validate the logout confirmation returned after session revocation.
export const logoutResponseSchema = createApiResponseSchema(otpSentDataSchema);

// Accept an optional body token because browsers can use the HttpOnly cookie.
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required").optional(),
});
