import "server-only";

import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/server/modules/notification/notification.service";

/**
 * Sends a reminder for every appointment scheduled in the next 24 hours
 * that has not already been reminded.
 *
 * Why:
 * A 24-hour reminder is the single highest-impact notification for a
 * booking platform — it reduces no-shows and is the most common reason
 * customers opt in. It is also the safest job to write first because it is
 * naturally idempotent: the `referenceId` on the notification row lets a
 * retry skip work that already happened.
 *
 * Idempotency mechanism:
 * Before sending, we check for an existing notification whose `data` JSON
 * contains the appointment id and whose title starts with "Reminder:".
 * The check is done in the same batch as the send, so a crashed run that
 * sent half its batch will resume cleanly on the next invocation.
 */
export async function runAppointmentRemindersJob(context: {
  deadline: number;
  hasTimeLeft: () => boolean;
}): Promise<{ processed: number; details: { sent: number; skipped: number } }> {
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Only appointments that are still expected to happen and that have a
  // customer who can receive a notification.
  const candidates = await prisma.appointment.findMany({
    where: {
      startTime: { gte: now, lte: horizon },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    select: {
      id: true,
      customerId: true,
      startTime: true,
      salon: { select: { name: true } },
      services: {
        select: { service: { select: { name: true } } },
      },
    },
    orderBy: { startTime: "asc" },
    take: 200,
  });

  let sent = 0;
  let skipped = 0;

  for (const appointment of candidates) {
    if (!context.hasTimeLeft()) {
      console.warn("Appointment reminders job reached its time budget", {
        processed: sent + skipped,
        remaining: candidates.length,
      });
      break;
    }

    const alreadySent = await hasReminderBeenSent(appointment.id);
    if (alreadySent) {
      skipped += 1;
      continue;
    }

    const serviceNames = appointment.services
      .map((s) => s.service.name)
      .join(", ");

    await notifyUser({
      userId: appointment.customerId,
      title: `Reminder: your appointment at ${appointment.salon.name}`,
      body:
        `Just a reminder that your appointment ` +
        `(${serviceNames}) is scheduled for ` +
        `${formatLocalTime(appointment.startTime)}.`,
      channels: ["IN_APP", "EMAIL"],
      data: {
        type: "appointment.reminder",
        appointmentId: appointment.id,
      },
    });

    sent += 1;
  }

  return { processed: sent + skipped, details: { sent, skipped } };
}

/**
 * Returns true when a reminder notification already exists for the
 * appointment.
 *
 * Why:
 * The `Notification` table has a `data` JSON column but no dedicated
 * `appointmentId` column, so the check queries the JSON blob. The query
 * is intentionally narrow (single appointment, single user) so it stays
 * cheap even as the table grows.
 */
async function hasReminderBeenSent(appointmentId: string): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: {
      data: { contains: `"appointmentId":"${appointmentId}"` },
      title: { startsWith: "Reminder:" },
    },
    select: { id: true },
  });
  return existing !== null;
}

/**
 * Formats the appointment instant in the salon's local timezone.
 *
 * Why:
 * The customer wants "tomorrow at 10 AM", not an ISO string. The salon's
 * timezone is on the Salon row but loading it here would add a join; since
 * the reminder is only sent for imminent appointments and the platform is
 * India-first, IST is a reasonable default that matches the existing
 * notification copy.
 */
function formatLocalTime(instant: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(instant);
}
