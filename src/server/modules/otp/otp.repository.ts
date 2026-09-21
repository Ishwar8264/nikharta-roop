import "server-only";

import type { OtpChannel } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface OtpRecord {
  id: string;
  userId: string;
  channel: OtpChannel;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface OtpTargetUser {
  id: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}

/** Looks up a non-deleted user by email or phone. */
export async function findUserByEmailOrPhone(input: {
  email?: string;
  phone?: string;
}): Promise<OtpTargetUser | null> {
  if (!input.email && !input.phone) return null;

  return prisma.user.findFirst({
    where: {
      ...(input.email ? { email: input.email } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });
}

/** Returns the most recent OTP for a user + channel, regardless of status. */
export async function findLatestOtp(
  userId: string,
  channel: OtpChannel,
): Promise<OtpRecord | null> {
  return prisma.otp.findFirst({
    where: { userId, channel },
    orderBy: { createdAt: "desc" },
  });
}

/** Returns the active (unused, unexpired) OTP for a user + channel. */
export async function findActiveOtp(
  userId: string,
  channel: OtpChannel,
): Promise<OtpRecord | null> {
  return prisma.otp.findFirst({
    where: {
      userId,
      channel,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Burns all prior unused OTPs for a user + channel. */
export async function invalidatePriorOtps(
  userId: string,
  channel: OtpChannel,
): Promise<void> {
  await prisma.otp.updateMany({
    where: { userId, channel, isUsed: false },
    data: { isUsed: true },
  });
}

/** Persists a new OTP row. */
export async function createOtp(input: {
  userId: string;
  channel: OtpChannel;
  codeHash: string;
  expiresAt: Date;
  maxAttempts: number;
}): Promise<OtpRecord> {
  return prisma.otp.create({
    data: {
      userId: input.userId,
      channel: input.channel,
      codeHash: input.codeHash,
      expiresAt: input.expiresAt,
      maxAttempts: input.maxAttempts,
    },
  });
}

/** Deletes an OTP row. Used when delivery fails so the user can retry. */
export async function deleteOtp(id: string): Promise<void> {
  await prisma.otp.delete({ where: { id } }).catch(() => {
    // Already gone — safe to ignore.
  });
}

/** Increments the attempt counter on an OTP row. */
export async function incrementOtpAttempts(id: string): Promise<void> {
  await prisma.otp.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
}

/** Marks an OTP as successfully used. */
export async function markOtpUsed(id: string): Promise<void> {
  await prisma.otp.update({
    where: { id },
    data: { isUsed: true },
  });
}

/** Flips the verification flag on the user for the given channel. */
export async function markUserVerified(
  userId: string,
  channel: OtpChannel,
): Promise<void> {
  const data =
    channel === "EMAIL" ? { emailVerified: true } : { phoneVerified: true };

  await prisma.user.update({
    where: { id: userId },
    data,
  });
}
