import {
  NotificationChannel,
  NotificationStatus,
  NotificationTrigger,
} from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by notification endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

export const listNotificationsQuerySchema = z.object({
  branchId: optionalIdSchema,
  channel: z.enum(NotificationChannel).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(NotificationStatus).optional(),
  trigger: z.enum(NotificationTrigger).optional(),
  userId: optionalIdSchema,
});

export const listMyNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const notificationBodySchema = z.object({
  bookingId: optionalIdSchema,
  branchId: optionalIdSchema,
  channel: z.enum(NotificationChannel),
  errorMessage: z.string().trim().max(2000).nullable().optional(),
  messageHi: z.string().trim().min(1).max(2000),
  provider: z.string().trim().max(80).nullable().optional(),
  providerMessageId: z.string().trim().max(500).nullable().optional(),
  recipient: z.string().trim().min(2).max(200),
  retryCount: z.coerce.number().int().min(0).max(100).optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
  status: z.enum(NotificationStatus).optional(),
  templateKey: z.string().trim().max(120).nullable().optional(),
  trigger: z.enum(NotificationTrigger),
  userId: optionalIdSchema,
});

export const createNotificationSchema = notificationBodySchema;
export const updateNotificationSchema = notificationBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one notification field to update." },
);

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListMyNotificationsQueryInput = z.infer<typeof listMyNotificationsQuerySchema>;
export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
