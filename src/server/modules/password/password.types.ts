import type { z } from "zod";

import type {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./password.schema";

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export interface ForgotPasswordResult {
  expiresAt: Date;
  resendAvailableInSeconds: number;
}
