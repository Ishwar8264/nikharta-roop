import "server-only";

import type {
  OtpChannel,
  OtpPurpose,
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type OtpDatabase = Prisma.TransactionClient | PrismaClient;

export interface OtpRecord {
  id: string;
  userId: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
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

/** Returns the most recent OTP for a user + channel + purpose. */
export async function findLatestOtp(
  userId: string,
  channel: OtpChannel,
  purpose: OtpPurpose,
  database: OtpDatabase = prisma,
): Promise<OtpRecord | null> {
  return database.otp.findFirst({
    where: { userId, channel, purpose },
    orderBy: { createdAt: "desc" },
  });
}

/** Returns the newest unused OTP, including expired rows for precise errors. */
export async function findOtpForVerification(
  userId: string,
  channel: OtpChannel,
  purpose: OtpPurpose,
): Promise<OtpRecord | null> {
  return prisma.otp.findFirst({
    where: {
      userId,
      channel,
      purpose,
      isUsed: false,
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Burns all prior unused OTPs for a user + channel + purpose. */
export async function invalidatePriorOtps(
  userId: string,
  channel: OtpChannel,
  purpose: OtpPurpose,
  database: OtpDatabase = prisma,
): Promise<void> {
  await database.otp.updateMany({
    where: { userId, channel, purpose, isUsed: false },
    data: { isUsed: true },
  });
}

/** Persists a new OTP row. */
export async function createOtp(input: {
  userId: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  maxAttempts: number;
}, database: OtpDatabase = prisma): Promise<OtpRecord> {
  return database.otp.create({
    data: {
      userId: input.userId,
      channel: input.channel,
      purpose: input.purpose,
      codeHash: input.codeHash,
      expiresAt: input.expiresAt,
      maxAttempts: input.maxAttempts,
    },
  });
}

/** Deletes an OTP row. Used when delivery fails so the user can retry. */
export async function deleteOtp(id: string): Promise<void> {
  await prisma.otp.delete({ where: { id } }).catch(() => {});
}

/** Atomically increments the counter without crossing the configured limit. */
export async function incrementOtpAttempts(
  id: string,
  maxAttempts: number,
): Promise<boolean> {
  const result = await prisma.otp.updateMany({
    where: { id, isUsed: false, attempts: { lt: maxAttempts } },
    data: { attempts: { increment: 1 } },
  });

  return result.count === 1;
}

/** Burns an OTP if it has not already been consumed. */
export async function markOtpUsed(id: string): Promise<void> {
  await prisma.otp.updateMany({
    where: { id, isUsed: false },
    data: { isUsed: true },
  });
}

/**
 * Atomically claims an OTP after its hash has been verified.
 *
 * Why:
 * Matching the attempt count prevents a correct request from succeeding if a
 * concurrent wrong request changed the security state after verification.
 */
export async function claimOtp(
  id: string,
  expectedAttempts: number,
  database: OtpDatabase = prisma,
): Promise<boolean> {
  const result = await database.otp.updateMany({
    where: {
      id,
      isUsed: false,
      attempts: expectedAttempts,
      expiresAt: { gt: new Date() },
    },
    data: { isUsed: true },
  });

  return result.count === 1;
}

/** Flips the verification flag on the user for the given channel. */
export async function markUserVerified(
  userId: string,
  channel: OtpChannel,
  database: OtpDatabase = prisma,
): Promise<void> {
  const data =
    channel === "EMAIL" ? { emailVerified: true } : { phoneVerified: true };

  await database.user.update({
    where: { id: userId },
    data,
  });
}
