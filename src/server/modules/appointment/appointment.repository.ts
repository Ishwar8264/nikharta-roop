import "server-only";

import type { DayOfWeek, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Columns and relations safe to return on every appointment response.
 *
 * Why:
 * Every appointment surface (customer detail, salon list, staff calendar)
 * needs the same nested shape. Centralizing the select here keeps those
 * surfaces from drifting apart.
 */
export const PUBLIC_APPOINTMENT_SELECT = {
  id: true,
  customerId: true,
  salonId: true,
  staffId: true,
  startTime: true,
  endTime: true,
  status: true,
  subtotal: true,
  discount: true,
  tax: true,
  totalPrice: true,
  couponId: true,
  notes: true,
  cancelReason: true,
  rescheduledFrom: true,
  createdAt: true,
  updatedAt: true,
  salon: {
    select: { id: true, name: true, slug: true, timezone: true },
  },
  services: {
    select: {
      serviceId: true,
      staffId: true,
      price: true,
      service: {
        select: {
          id: true,
          name: true,
          slug: true,
          duration: true,
          images: true,
        },
      },
      staff: {
        select: { id: true, name: true, avatar: true },
      },
    },
  },
  payment: {
    select: {
      id: true,
      appointmentId: true,
      amount: true,
      status: true,
      method: true,
      transactionId: true,
      gatewayRef: true,
      refundAmount: true,
      createdAt: true,
    },
  },
} as const satisfies Prisma.AppointmentSelect;

/**
 * Cursor-paginated appointment list for a customer.
 *
 * Why:
 * Ordered by `startTime` desc so the most recent/upcoming bookings appear
 * first. Fetches one extra row to know if a next page exists.
 */
export async function listCustomerAppointments(
  customerId: string,
  input: {
    cursor?: string;
    limit: number;
    status?: string;
    upcoming?: boolean;
  },
) {
  const where: Prisma.AppointmentWhereInput = {
    customerId,
    ...(input.status ? { status: input.status as never } : {}),
    ...(input.upcoming
      ? {
          startTime: { gte: new Date() },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        }
      : {}),
  };

  const rows = await prisma.appointment.findMany({
    where,
    select: PUBLIC_APPOINTMENT_SELECT,
    orderBy: [{ startTime: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Cursor-paginated appointment list for a salon (manager view). */
export async function listSalonAppointments(
  salonId: string,
  input: {
    cursor?: string;
    limit: number;
    status?: string;
    staffId?: string;
    from?: string;
    to?: string;
  },
) {
  const where: Prisma.AppointmentWhereInput = {
    salonId,
    ...(input.status ? { status: input.status as never } : {}),
    ...(input.staffId ? { staffId: input.staffId } : {}),
    ...(input.from || input.to
      ? {
          startTime: {
            ...(input.from ? { gte: new Date(input.from) } : {}),
            ...(input.to ? { lte: new Date(input.to) } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.appointment.findMany({
    where,
    select: PUBLIC_APPOINTMENT_SELECT,
    orderBy: [{ startTime: "asc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a single appointment by primary key with relations. */
export async function findAppointmentById(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    select: PUBLIC_APPOINTMENT_SELECT,
  });
}

/**
 * Loads a small set of services with the data needed for pricing and
 * duration, plus their salon ownership.
 *
 * Why:
 * The booking flow needs `salonId`, `isActive`, `deletedAt`, `price`, and
 * `duration` — everything else is irrelevant. A narrow select keeps the
 * initial validation step cheap.
 */
export async function loadBookableServices(
  salonId: string,
  serviceIds: string[],
) {
  if (serviceIds.length === 0) return [];

  return prisma.service.findMany({
    where: { id: { in: serviceIds }, salonId },
    select: {
      id: true,
      salonId: true,
      price: true,
      duration: true,
      isActive: true,
      deletedAt: true,
    },
  });
}

/**
 * Returns the salon's working hours for a specific day, or null when the
 * salon is closed that day.
 */
export async function getSalonHoursForDay(salonId: string, day: DayOfWeek) {
  return prisma.salonWorkingHours.findUnique({
    where: { salonId_day: { salonId, day } },
    select: { openTime: true, closeTime: true, isClosed: true },
  });
}

/** Returns a staff member's scheduled hours for a specific day. */
export async function getStaffScheduleForDay(
  staffUserId: string,
  salonId: string,
  day: DayOfWeek,
) {
  return prisma.staffSchedule.findUnique({
    where: { staffId_salonId_day: { staffId: staffUserId, salonId, day } },
    select: { startTime: true, endTime: true, isOff: true },
  });
}

/** Loads the timezone for an active salon used by public availability. */
export async function getActiveSalonTimezone(
  salonId: string,
): Promise<string | null> {
  const salon = await prisma.salon.findFirst({
    where: { id: salonId, isActive: true, deletedAt: null },
    select: { timezone: true },
  });

  return salon?.timezone ?? null;
}

/** Returns true when an approved leave covers the given instant. */
export async function isStaffOnLeaveAt(
  staffUserId: string,
  salonId: string,
  instant: Date,
): Promise<boolean> {
  const leave = await prisma.staffLeave.findFirst({
    where: {
      staffId: staffUserId,
      salonId,
      approved: true,
      startDate: { lte: instant },
      endDate: { gte: instant },
    },
    select: { id: true },
  });
  return leave !== null;
}

/** Returns existing appointments for a staff member overlapping a window. */
export async function findOverlappingAppointments(
  staffUserId: string,
  salonId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string,
  bufferMinutes = 0,
) {
  return prisma.appointment.findMany({
    where: {
      staffId: staffUserId,
      salonId,
      status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
      // The window is widened by the salon's buffer on both sides, so a
      // booking too close to an existing one is treated as a conflict.
      startTime: { lt: new Date(endTime.getTime() + bufferMinutes * 60_000) },
      endTime: { gt: new Date(startTime.getTime() - bufferMinutes * 60_000) },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, startTime: true, endTime: true },
  });
}

/** Returns the StaffServiceSkill rows for a set of (staffId, serviceId) pairs. */
export async function loadStaffSkillsForServices(
  staffUserId: string,
  serviceIds: string[],
) {
  if (serviceIds.length === 0) return [];

  return prisma.staffServiceSkill.findMany({
    where: { staffId: staffUserId, serviceId: { in: serviceIds } },
    select: { serviceId: true },
  });
}

/**
 * Creates an appointment, its service lines, and confirms no competing
 * booking slipped in during the transaction.
 *
 * Why:
 * Two overlapping requests from different customers could both pass the
 * overlap check if it runs outside a serializable transaction. Wrapping the
 * check and the insert in one serializable transaction makes the database
 * the arbiter of who wins.
 *
 * Pricing fields (`discount`, `totalPrice`, `couponId`) are computed by the
 * service layer and passed in so this function stays a pure persistence
 * boundary. The optional `onAfterCreate` callback runs inside the same
 * transaction — used by the coupon flow to atomically reserve a usage slot.
 * If the callback throws, the whole booking rolls back.
 */
export async function createAppointmentWithServices(input: {
  customerId: string;
  salonId: string;
  staffId: string | null;
  startTime: Date;
  endTime: Date;
  subtotal: number;
  discount: number;
  totalPrice: number;
  couponId: string | null;
  notes: string | null;
  rescheduledFrom?: string;
  replacesAppointmentId?: string;
  /** Salon's minimum gap between bookings — widens the conflict window. */
  bufferMinutes?: number;
  services: Array<{
    serviceId: string;
    staffId: string | null;
    price: number;
  }>;
  onAfterCreate?: (transaction: Prisma.TransactionClient) => Promise<void>;
}) {
  return prisma.$transaction(
    async (transaction) => {
      // Re-run the overlap check inside the transaction. If another writer
      // committed between our outer check and now, this is where we find out.
      // The buffer widens the window on both sides, matching the outer check.
      if (input.staffId) {
        const bufferMs = (input.bufferMinutes ?? 0) * 60_000;
        const conflict = await transaction.appointment.findFirst({
          where: {
            staffId: input.staffId,
            salonId: input.salonId,
            status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
            startTime: {
              lt: new Date(input.endTime.getTime() + bufferMs),
            },
            endTime: {
              gt: new Date(input.startTime.getTime() - bufferMs),
            },
            ...(input.replacesAppointmentId
              ? { id: { not: input.replacesAppointmentId } }
              : {}),
          },
          select: { id: true },
        });
        if (conflict) {
          const err = new Error("SLOT_TAKEN") as Error & { code?: string };
          err.code = "SLOT_TAKEN";
          throw err;
        }
      }

      const appointment = await transaction.appointment.create({
        data: {
          customerId: input.customerId,
          salonId: input.salonId,
          staffId: input.staffId,
          startTime: input.startTime,
          endTime: input.endTime,
          subtotal: input.subtotal,
          discount: input.discount,
          tax: 0,
          totalPrice: input.totalPrice,
          couponId: input.couponId,
          notes: input.notes,
          rescheduledFrom: input.rescheduledFrom,
        },
        select: { id: true },
      });

      await transaction.appointmentService.createMany({
        data: input.services.map((line) => ({
          appointmentId: appointment.id,
          serviceId: line.serviceId,
          staffId: line.staffId,
          price: line.price,
        })),
      });

      if (input.replacesAppointmentId) {
        await transaction.appointment.update({
          where: { id: input.replacesAppointmentId },
          data: { status: "RESCHEDULED" },
        });
      }

      // Coupon reservation runs last, still inside the transaction. If the
      // reserve throws (limit reached), the entire booking rolls back.
      if (input.onAfterCreate) {
        await input.onAfterCreate(transaction);
      }

      return appointment.id;
    },
    { isolationLevel: "Serializable" },
  );
}

/** Applies a partial update to an appointment. */
export async function updateAppointment(
  id: string,
  data: Prisma.AppointmentUncheckedUpdateInput,
) {
  return prisma.appointment.update({
    where: { id },
    data,
    select: PUBLIC_APPOINTMENT_SELECT,
  });
}

/** Loads the payment for an appointment, or null. */
export async function findPaymentByAppointmentId(appointmentId: string) {
  return prisma.payment.findUnique({
    where: { appointmentId },
    select: {
      id: true,
      appointmentId: true,
      amount: true,
      status: true,
      method: true,
      transactionId: true,
      gatewayRef: true,
      refundAmount: true,
      createdAt: true,
    },
  });
}

/** Persists a new payment row. */
export async function createPayment(data: {
  appointmentId: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string | null;
  gatewayRef: string | null;
}) {
  return prisma.payment.create({
    data: {
      appointmentId: data.appointmentId,
      amount: data.amount,
      method: data.method as never,
      status: data.status as never,
      transactionId: data.transactionId,
      gatewayRef: data.gatewayRef,
    },
    select: {
      id: true,
      appointmentId: true,
      amount: true,
      status: true,
      method: true,
      transactionId: true,
      gatewayRef: true,
      refundAmount: true,
      createdAt: true,
    },
  });
}

/** Updates an existing payment. */
export async function updatePayment(
  appointmentId: string,
  data: Prisma.PaymentUncheckedUpdateInput,
) {
  return prisma.payment.update({
    where: { appointmentId },
    data,
    select: {
      id: true,
      appointmentId: true,
      amount: true,
      status: true,
      method: true,
      transactionId: true,
      gatewayRef: true,
      refundAmount: true,
      createdAt: true,
    },
  });
}
