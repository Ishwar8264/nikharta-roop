import { z } from "zod";

export const sendOtpSchema = z.object({
  mobile: z
    .string()
    .regex(/^[0-9]{10}$/, "Invalid Indian mobile number (10 digits)"),
  purpose: z.enum(["LOGIN", "SIGNUP"]).default("LOGIN"),
});

export const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[0-9]{10}$/),
  otp: z.string().length(6, "OTP must be 6 digits"),
  purpose: z.enum(["LOGIN", "SIGNUP"]),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});
