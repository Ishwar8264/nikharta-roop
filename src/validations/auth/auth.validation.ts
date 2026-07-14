import { z } from "zod";

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

// Reject email signup until registration can create an email-only user end-to-end.
const validateOtpIdentityAndPurpose = (
  value: { mobile?: string; email?: string; purpose: "LOGIN" | "SIGNUP" },
  context: z.RefinementCtx,
) => {
  // Apply the shared exactly-one-identity rule first.
  requireExactlyOneIdentifier(value, context);

  // Stop clients from entering the unsupported email registration path.
  if (value.email && value.purpose === "SIGNUP") {
    context.addIssue({
      code: "custom",
      path: ["email"],
      message: "Email signup is not supported yet",
    });
  }
};

// Validate the dedicated login endpoint without accepting a client-controlled purpose.
export const loginSchema = z
  .object(authIdentifierShape)
  .superRefine(requireExactlyOneIdentifier);

// Keep registration mobile-only because the current User model requires a mobile number.
export const registerSchema = z.object({
  mobile: mobileSchema,
});

// Validate generic OTP requests used by existing API clients and documentation tools.
export const sendOtpSchema = z
  .object({
    ...authIdentifierShape,
    purpose: z.enum(["LOGIN", "SIGNUP"]).default("LOGIN"),
  })
  .superRefine(validateOtpIdentityAndPurpose);

// Validate OTP verification for either login channel while keeping purpose explicit.
export const verifyOtpSchema = z
  .object({
    ...authIdentifierShape,
    otp: z.string().trim().regex(/^[0-9]{6}$/, "OTP must be 6 digits"),
    purpose: z.enum(["LOGIN", "SIGNUP"]),
  })
  .superRefine(validateOtpIdentityAndPurpose);

// Require a non-empty refresh token before JWT verification begins.
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});
