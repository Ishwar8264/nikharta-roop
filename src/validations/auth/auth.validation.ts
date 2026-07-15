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

// Validate the full register response before the signup UI consumes it.
export const registerResponseSchema = createApiResponseSchema(otpSentDataSchema);

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

// Validate the safe user fields returned after successful OTP verification.
const authenticatedUserSchema = z.object({
  id: z.string().min(1),
  mobile: z.string().nullable(),
  email: z.string().email().nullable(),
  role: z.enum(["USER", "STAFF", "ADMIN", "SUPER_ADMIN"]),
  isMobileVerified: z.boolean(),
  isEmailVerified: z.boolean(),
});

// Validate the complete session payload while cookies protect browser persistence.
export const authSessionDataSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: authenticatedUserSchema,
});

// Validate OTP verification responses before the signup UI trusts session creation.
export const verifyOtpResponseSchema = createApiResponseSchema(
  authSessionDataSchema,
);

// Accept an optional body token because browsers can use the HttpOnly cookie.
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required").optional(),
});
