import type { z } from "zod";

import type { OtpChannel } from "@nikharta-roop/shared/enums";

import type { sendOtpSchema, verifyOtpSchema } from "../../schemas/otp";

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export interface OtpSendResult {
  channel: OtpChannel;
  expiresAt: Date;
  resendAvailableInSeconds: number;
}

export interface OtpVerifyResult {
  userId: string;
  channel: OtpChannel;
}
