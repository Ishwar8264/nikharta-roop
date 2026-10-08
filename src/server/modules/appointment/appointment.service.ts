import "server-only";

import { hasRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { resolveSalonId } from "@/server/modules/service/service.repository";

import { writeAuditLog } from "@/server/modules/audit/audit.writer";
import { CouponUsageLimitReachedError } from "@/server/modules/coupon/coupon.errors";
import {
  releaseCouponSlot,
  tryReserveCouponSlot,
} from "@/server/modules/coupon/coupon.repository";
import { assertCouponUsable } from "@/server/modules/coupon/coupon.service";
import {
  notifyAppointmentCancelled,
  notifyAppointmentConfirmed,
} from "@/server/modules/notification/notification.service";
import { awardPointsForCompletedAppointment } from "../loyalty/loyalty.service";
import {
  assertCanManagePayment,
  assertCanRecordPayment,
  assertCanTransitionStatus,
  assertCanViewAppointment,
  buildAppointmentViewerContext,
} from "./appointment.authorization";
import {
  buildLocalDateTime,
  computeAvailableSlots,
  getDayOfWeek,
  timeToMinutes,
  timezoneOffsetMinutes,
  toLocalDateString,
  toLocalMinutesSinceMidnight,
} from "./appointment.availability";
import {
  AppointmentAccessDeniedError,
  AppointmentInvalidTransitionError,
  AppointmentNotFoundError,
  AppointmentOutsideSalonHoursError,
  AppointmentOutsideStaffHoursError,
  AppointmentServiceMismatchError,
  AppointmentServiceUnavailableError,
  AppointmentSlotTakenError,
  AppointmentStaffNotFoundError,
  AppointmentStaffOnLeaveError,
  AppointmentStaffSkillMismatchError,
  AppointmentStartTimeInPastError,
  AppointmentTerminalStateError,
  PaymentAlreadyExistsError,
  PaymentAmountMismatchError,
  PaymentNotFoundError,
} from "./appointment.errors";
import { toPublicAppointment, toPublicPayment } from "./appointment.mapper";
import {
  createAppointmentWithServices,
  createPayment,
  findAppointmentById,
  findOverlappingAppointments,
  findPaymentByAppointmentId,
  getActiveSalonTimezone,
  getSalonHoursForDay,
  getStaffScheduleForDay,
  isStaffOnLeaveAt,
  listCustomerAppointments,
  listSalonAppointments,
  loadBookableServices,
  loadStaffSkillsForServices,
  updateAppointment,
  updatePayment,
} from "./appointment.repository";
import type {
  AvailabilityQuery,
  AvailabilityResult,
  CancelAppointmentInput,
  CreateAppointmentInput,
  CreatePaymentInput,
  ListMyAppointmentsQuery,
  ListSalonAppointmentsQuery,
  PaginatedAppointments,
  PublicAppointment,
  PublicPayment,
  RescheduleAppointmentInput,
  UpdateAppointmentStatusInput,
  UpdatePaymentInput,
} from "./appointment.types";

/** Statuses from which no further transition is allowed. */
const TERMINAL_STATUSES = new Set([
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "RESCHEDULED",
]);

/** Allowed transitions per current status. */
const ALLOWED_TRANSITIONS: Record<string, Set<string>> = {
  SCHEDULED: new Set(["CONFIRMED", "CANCELLED"]),
  CONFIRMED: new Set(["IN_PROGRESS", "CANCELLED", "NO_SHOW"]),
  IN_PROGRESS: new Set(["COMPLETED", "CANCELLED"]),
  COMPLETED: new Set(),
  CANCELLED: new Set(),
  NO_SHOW: new Set(),
  RESCHEDULED: new Set(),
};

/**
 * Lists the caller's own appointments as a customer.
 */
export async function listMyAppointments(
  customerId: string,
  query: ListMyAppointmentsQuery,
): Promise<PaginatedAppointments> {
  const result = await listCustomerAppointments(customerId, {
    cursor: query.cursor,
    limit: query.limit,
    status: query.status,
    upcoming: query.upcoming,
  });

  return {
    items: result.items.map(toPublicAppointment),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Lists appointments for a salon. MANAGER+ only.
 */
export async function listAppointmentsForSalon(
  callerId: string,
  salonRef: string,
  query: ListSalonAppointmentsQuery,
): Promise<PaginatedAppointments> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const membership = await findSalonForViewer({ salonId, userId: callerId });
  if (!membership) throw new SalonNotFoundError();
  if (!hasRoleAtLeast(membership.viewerRole, "MANAGER")) {
    throw new AppointmentAccessDeniedError();
  }

  const result = await listSalonAppointments(salonId, {
    cursor: query.cursor,
    limit: query.limit,
    status: query.status,
    staffId: query.staffId,
    from: query.from,
    to: query.to,
  });

  return {
    items: result.items.map(toPublicAppointment),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Loads a single appointment with authorization.
 */
export async function getAppointment(
  callerId: string,
  appointmentId: string,
): Promise<PublicAppointment> {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppointmentNotFoundError();

  const context = await buildAppointmentViewerContext({
    userId: callerId,
    customerId: appointment.customerId,
    salonId: appointment.salonId,
    assignedStaffUserId: appointment.staffId,
  });
  assertCanViewAppointment(context);

  return toPublicAppointment(appointment);
}

/**
 * Creates an appointment after validating every cross-cutting rule.
 *
 * Why:
 * The create path has the most invariants: salon membership, customer
 * identity, service ownership, staff skills, working hours, schedule, leave,
 * coupon validity, and slot conflict. Wrapping them in one function keeps
 * the rules in one place and makes the route trivial.
 */
export async function createAppointment(
  callerId: string,
  input: CreateAppointmentInput,
): Promise<PublicAppointment> {
  const salonId = await resolveSalonId(input.salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const callerMembership = await findSalonForViewer({
    salonId,
    userId: callerId,
  });

  // Determine the customer: self-booking when omitted, or staff booking for
  // someone else when caller is MANAGER+.
  const customerId = input.customerId ?? callerId;
  const isSelfBooking = customerId === callerId;

  if (!isSelfBooking) {
    if (
      !callerMembership ||
      !hasRoleAtLeast(callerMembership.viewerRole, "MANAGER")
    ) {
      throw new AppointmentAccessDeniedError();
    }
  }

  const startTime = new Date(input.startTime);
  if (startTime.getTime() <= Date.now()) {
    throw new AppointmentStartTimeInPastError();
  }

  const serviceIds = input.services.map((line) => line.serviceId);
  const uniqueServiceIds = Array.from(new Set(serviceIds));
  const bookable = await loadBookableServices(salonId, uniqueServiceIds);

  if (bookable.length !== uniqueServiceIds.length) {
    throw new AppointmentServiceMismatchError();
  }
  if (bookable.some((s) => !s.isActive || s.deletedAt)) {
    throw new AppointmentServiceUnavailableError();
  }

  const totalDuration = input.services.reduce((sum, line) => {
    const service = bookable.find((s) => s.id === line.serviceId);
    return sum + (service?.duration ?? 0);
  }, 0);

  const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000);

  // Determine per-line staff assignments.
  const lines = input.services.map((line) => {
    const service = bookable.find((s) => s.id === line.serviceId)!;
    return {
      serviceId: line.serviceId,
      staffUserId: line.staffId ?? input.staffId ?? null,
      price: Number(service.price),
      duration: service.duration,
    };
  });

  // Validate each assigned staff actually has the skill.
  for (const line of lines) {
    if (!line.staffUserId) continue;
    const skills = await loadStaffSkillsForServices(line.staffUserId, [
      line.serviceId,
    ]);
    if (skills.length === 0) {
      throw new AppointmentStaffSkillMismatchError();
    }
  }

  // The primary staff on the appointment — used for the overlap check.
  const primaryStaffUserId =
    input.staffId ?? lines.find((l) => l.staffUserId)?.staffUserId ?? null;

  if (primaryStaffUserId) {
    await validateStaffAvailability({
      salonId,
      staffUserId: primaryStaffUserId,
      startTime,
      endTime,
    });
  }

  // Secondary staff (per-line assignments) are validated against their own
  // service window. The DB exclusion constraint only covers the primary
  // `Appointment.staffId`, so without this a secondary staff member could be
  // booked into two overlapping appointments.
  let lineOffsetMs = 0;
  for (const line of lines) {
    const lineStart = new Date(startTime.getTime() + lineOffsetMs);
    lineOffsetMs += line.duration * 60 * 1000;

    if (!line.staffUserId || line.staffUserId === primaryStaffUserId) continue;

    await validateStaffAvailability({
      salonId,
      staffUserId: line.staffUserId,
      startTime: lineStart,
      endTime: new Date(lineStart.getTime() + line.duration * 60 * 1000),
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price, 0);

  // Evaluate the coupon before opening the transaction. The result carries
  // the exact discount amount; failure paths throw typed errors the route
  // maps to specific statuses.
  let couponId: string | null = null;
  let discount = 0;
  if (input.couponCode) {
    const coupon = await assertCouponUsable({
      code: input.couponCode,
      subtotal,
      userId: customerId,
      // Salon-scoped coupons must match the salon being booked.
      salonId,
    });
    couponId = coupon.couponId;
    discount = coupon.discountAmount;
  }
  const totalPrice = subtotal - discount;

  try {
    const id = await createAppointmentWithServices({
      customerId,
      salonId,
      staffId: primaryStaffUserId,
      startTime,
      endTime,
      subtotal,
      discount,
      totalPrice,
      couponId,
      notes: input.notes ?? null,
      services: lines.map((l) => ({
        serviceId: l.serviceId,
        staffId: l.staffUserId,
        price: l.price,
      })),
      // Reserve a coupon slot inside the same transaction. If the limit was
      // reached between evaluation and the write, this throws and the whole
      // booking rolls back — no phantom appointment. The per-user limit is
      // enforced here too, under the same serializable transaction.
      onAfterCreate: couponId
        ? async (transaction) => {
            const reserved = await tryReserveCouponSlot(
              transaction,
              couponId!,
              customerId,
            );
            if (!reserved) {
              const err = new Error("COUPON_LIMIT_REACHED") as Error & {
                code?: string;
              };
              err.code = "COUPON_LIMIT_REACHED";
              throw err;
            }
          }
        : undefined,
    });

    const created = await findAppointmentById(id);
    if (!created) throw new AppointmentNotFoundError();
    return toPublicAppointment(created);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      ["SLOT_TAKEN", "P2034"].includes(
        String((error as { code?: string }).code),
      )
    ) {
      throw new AppointmentSlotTakenError();
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "COUPON_LIMIT_REACHED"
    ) {
      // Surface as the same typed error the coupon module uses so the route
      // maps it to 409 without special-casing the appointment path.
      throw new CouponUsageLimitReachedError();
    }
    throw error;
  }
}

/**
 * Cancels an appointment with a reason.
 */
export async function cancelAppointment(
  callerId: string,
  appointmentId: string,
  input: CancelAppointmentInput,
): Promise<PublicAppointment> {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppointmentNotFoundError();

  const context = await buildAppointmentViewerContext({
    userId: callerId,
    customerId: appointment.customerId,
    salonId: appointment.salonId,
    assignedStaffUserId: appointment.staffId,
  });

  // Cancellation is a transition to CANCELLED; use the same rules.
  assertCanTransitionStatus(context, "CANCELLED");

  if (TERMINAL_STATUSES.has(appointment.status)) {
    throw new AppointmentTerminalStateError();
  }

  const updated = await updateAppointment(appointmentId, {
    status: "CANCELLED",
    cancelReason: input.reason,
  });

  // Release the coupon slot if the appointment had one. Failures here must
  // not fail the cancellation — the customer's appointment is already
  // cancelled, and a stale slot count is preferable to a phantom error.
  if (appointment.couponId) {
    releaseCouponSlot(appointment.couponId).catch((error) => {
      console.error(
        "Failed to release coupon slot for appointment",
        appointmentId,
        error,
      );
    });
  }

  // Fire the cancellation notification. Failures here must not fail the
  // cancellation itself — the DB is the source of truth.
  notifyAppointmentCancelled({
    userId: appointment.customerId,
    salonName: appointment.salonId,
    startTime: appointment.startTime.toISOString(),
    reason: input.reason,
  }).catch((error) => {
    console.error("Cancellation notification failed", error);
  });

  writeAuditLog({
    userId: callerId,
    action: "UPDATE",
    entity: "Appointment",
    entityId: appointmentId,
    oldData: {
      status: appointment.status,
      cancelReason: appointment.cancelReason,
    },
    newData: { status: "CANCELLED", cancelReason: input.reason },
  });

  return toPublicAppointment(updated);
}

/**
 * Reschedules an appointment to a new start time.
 *
 * Why:
 * Modelled as "mark old RESCHEDULED, create new with rescheduledFrom" so the
 * historical chain is preserved. The new appointment goes through the same
 * availability rules as a fresh booking and preserves the original coupon
 * assignment — a reschedule must not silently re-apply a coupon or release
 * the slot.
 */
export async function rescheduleAppointment(
  callerId: string,
  appointmentId: string,
  input: RescheduleAppointmentInput,
): Promise<PublicAppointment> {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppointmentNotFoundError();

  const context = await buildAppointmentViewerContext({
    userId: callerId,
    customerId: appointment.customerId,
    salonId: appointment.salonId,
    assignedStaffUserId: appointment.staffId,
  });

  // Customers can move their own appointment; staff/managers can move any.
  assertCanViewAppointment(context);

  if (TERMINAL_STATUSES.has(appointment.status)) {
    throw new AppointmentTerminalStateError();
  }

  const newStart = new Date(input.startTime);
  if (newStart.getTime() <= Date.now()) {
    throw new AppointmentStartTimeInPastError();
  }

  const durationMs =
    appointment.endTime.getTime() - appointment.startTime.getTime();
  const newEnd = new Date(newStart.getTime() + durationMs);

  const staffUserId = input.staffId ?? appointment.staffId;

  if (staffUserId) {
    await validateStaffAvailability({
      salonId: appointment.salonId,
      staffUserId,
      startTime: newStart,
      endTime: newEnd,
      excludeAppointmentId: appointmentId,
    });
  }

  const subtotal = appointment.services.reduce(
    (sum, s) => sum + Number(s.price),
    0,
  );

  // Preserve the original pricing and coupon assignment. A reschedule is a
  // move, not a new booking — the customer keeps the same total they agreed
  // to, and the coupon slot stays reserved on the new row.
  const discount = Number(appointment.discount);
  const totalPrice = Number(appointment.totalPrice);
  const couponId = appointment.couponId;

  let newId: string;
  try {
    newId = await createAppointmentWithServices({
      customerId: appointment.customerId,
      salonId: appointment.salonId,
      staffId: staffUserId,
      startTime: newStart,
      endTime: newEnd,
      subtotal,
      discount,
      totalPrice,
      couponId,
      notes: appointment.notes,
      rescheduledFrom: appointmentId,
      replacesAppointmentId: appointmentId,
      services: appointment.services.map((s) => ({
        serviceId: s.serviceId,
        staffId: s.staffId ?? staffUserId,
        price: Number(s.price),
      })),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      ["SLOT_TAKEN", "P2034"].includes(
        String((error as { code?: string }).code),
      )
    ) {
      throw new AppointmentSlotTakenError();
    }
    throw error;
  }

  const created = await findAppointmentById(newId);
  if (!created) throw new AppointmentNotFoundError();
  return toPublicAppointment(created);
}

/**
 * Transitions an appointment through its lifecycle.
 */
export async function updateAppointmentStatus(
  callerId: string,
  appointmentId: string,
  input: UpdateAppointmentStatusInput,
): Promise<PublicAppointment> {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppointmentNotFoundError();

  const context = await buildAppointmentViewerContext({
    userId: callerId,
    customerId: appointment.customerId,
    salonId: appointment.salonId,
    assignedStaffUserId: appointment.staffId,
  });
  assertCanTransitionStatus(context, input.status);

  if (TERMINAL_STATUSES.has(appointment.status)) {
    throw new AppointmentTerminalStateError();
  }

  const allowed = ALLOWED_TRANSITIONS[appointment.status] ?? new Set();
  if (!allowed.has(input.status)) {
    throw new AppointmentInvalidTransitionError(
      appointment.status,
      input.status,
    );
  }

  const updated = await updateAppointment(appointmentId, {
    status: input.status,
    ...(input.status === "CANCELLED" && input.reason
      ? { cancelReason: input.reason }
      : {}),
  });

  // If this transition is a cancellation, release any reserved coupon slot.
  // Failures here are logged and swallowed — the status change is already
  // committed and a stale counter is preferable to a phantom error.
  if (input.status === "CANCELLED" && appointment.couponId) {
    releaseCouponSlot(appointment.couponId).catch((error) => {
      console.error(
        "Failed to release coupon slot for appointment",
        appointmentId,
        error,
      );
    });
  }

  // Only CONFIRMED fires the email — the customer doesn't need one for
  // IN_PROGRESS or COMPLETED transitions.
  if (input.status === "CONFIRMED") {
    notifyAppointmentConfirmed({
      userId: appointment.customerId,
      salonName: appointment.salonId,
      startTime: appointment.startTime.toISOString(),
      services: appointment.services.map((s) => s.service.name),
    }).catch((error) => {
      console.error("Confirmation notification failed", error);
    });
  }

  // Fire-and-forget audit trail. Status transitions are the highest-value
  // events to log on appointments — they drive billing, reviews, and loyalty.
  writeAuditLog({
    userId: callerId,
    action: "UPDATE",
    entity: "Appointment",
    entityId: appointmentId,
    oldData: { status: appointment.status },
    newData: { status: input.status, reason: input.reason ?? null },
  });

  // Award loyalty points the moment a booking is marked COMPLETED.
  // Failures here must not roll back the status change — the ledger is
  // idempotent, so a later retry (or backfill job) will still credit.
  if (input.status === "COMPLETED") {
    try {
      await awardPointsForCompletedAppointment({
        userId: appointment.customerId,
        totalPrice: Number(appointment.totalPrice),
        appointmentId,
      });
    } catch (error) {
      console.error(
        "Loyalty award failed for appointment",
        appointmentId,
        error,
      );
    }
  }

  return toPublicAppointment(updated);
}

/**
 * Records a payment for an appointment.
 */
export async function recordPayment(
  callerId: string,
  appointmentId: string,
  input: CreatePaymentInput,
): Promise<PublicPayment> {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppointmentNotFoundError();

  const context = await buildAppointmentViewerContext({
    userId: callerId,
    customerId: appointment.customerId,
    salonId: appointment.salonId,
    assignedStaffUserId: appointment.staffId,
  });
  assertCanRecordPayment(context);

  const existing = await findPaymentByAppointmentId(appointmentId);
  if (existing) throw new PaymentAlreadyExistsError();

  // Until a payment gateway lands, the amount is derived server-side. Trusting
  // a client-supplied amount would let a customer mark a full-price
  // appointment PAID with amount 0 (or any value) for CASH.
  const expectedAmount = Number(appointment.totalPrice);
  if (input.amount !== expectedAmount) {
    throw new PaymentAmountMismatchError();
  }

  // Online payments arrive pending until a gateway callback confirms them.
  // Cash is captured immediately.
  const status = input.method === "CASH" ? "PAID" : "PENDING";

  const payment = await createPayment({
    appointmentId,
    amount: input.amount,
    method: input.method,
    status,
    transactionId: input.transactionId ?? null,
    gatewayRef: input.gatewayRef ?? null,
  });

  return toPublicPayment(payment);
}

/**
 * Updates an existing payment (refunds, status reconciliation).
 */
export async function patchPayment(
  callerId: string,
  appointmentId: string,
  input: UpdatePaymentInput,
): Promise<PublicPayment> {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppointmentNotFoundError();

  const context = await buildAppointmentViewerContext({
    userId: callerId,
    customerId: appointment.customerId,
    salonId: appointment.salonId,
    assignedStaffUserId: appointment.staffId,
  });
  assertCanManagePayment(context);

  const existing = await findPaymentByAppointmentId(appointmentId);
  if (!existing) throw new PaymentNotFoundError();

  const data: Record<string, unknown> = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.refundAmount !== undefined) data.refundAmount = input.refundAmount;
  if (input.transactionId !== undefined)
    data.transactionId = input.transactionId;
  if (input.gatewayRef !== undefined) data.gatewayRef = input.gatewayRef;

  const payment = await updatePayment(appointmentId, data);
  return toPublicPayment(payment);
}

/**
 * Public availability query — slots for a staff member on a given day.
 */
export async function getAvailability(
  salonRef: string,
  query: AvailabilityQuery,
): Promise<AvailabilityResult> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const timezone = await getActiveSalonTimezone(salonId);
  if (!timezone) throw new SalonNotFoundError();
  const offset = timezoneOffsetMinutes(timezone);

  const day = getDayOfWeek(query.date);

  const [salonHours, staffSchedule, onLeave] = await Promise.all([
    getSalonHoursForDay(salonId, day),
    getStaffScheduleForDay(query.staffId, salonId, day),
    isStaffOnLeaveAt(
      query.staffId,
      salonId,
      buildLocalDateTime(query.date, "00:00", offset),
    ),
  ]);

  const bookable = await loadBookableServices(salonId, query.serviceIds);
  if (bookable.length !== query.serviceIds.length) {
    throw new AppointmentServiceMismatchError();
  }
  if (bookable.some((service) => !service.isActive || service.deletedAt)) {
    throw new AppointmentServiceUnavailableError();
  }

  const skills = await loadStaffSkillsForServices(
    query.staffId,
    query.serviceIds,
  );
  if (skills.length !== query.serviceIds.length) {
    throw new AppointmentStaffSkillMismatchError();
  }

  const totalDuration = bookable.reduce((sum, s) => sum + s.duration, 0);

  const busy = await findOverlappingAppointments(
    query.staffId,
    salonId,
    buildLocalDateTime(query.date, "00:00", offset),
    buildLocalDateTime(query.date, "23:59", offset),
  );

  const now = new Date();
  const slots = computeAvailableSlots({
    date: query.date,
    salon:
      salonHours && !salonHours.isClosed
        ? { openTime: salonHours.openTime, closeTime: salonHours.closeTime }
        : null,
    staff:
      staffSchedule && !staffSchedule.isOff
        ? { startTime: staffSchedule.startTime, endTime: staffSchedule.endTime }
        : null,
    staffOnLeave: onLeave,
    totalDurationMinutes: totalDuration,
    busy: busy.map((a) => ({
      startMinutes: toLocalMinutesSinceMidnight(a.startTime, offset),
      endMinutes: toLocalMinutesSinceMidnight(a.endTime, offset),
    })),
    now: {
      date: toLocalDateString(now, offset),
      minutesSinceMidnight: toLocalMinutesSinceMidnight(now, offset),
    },
  });

  return { date: query.date, timezone, slots };
}

/**
 * Internal helper — checks salon hours, staff schedule, leave, and slot
 * conflict for the given window.
 */
async function validateStaffAvailability(input: {
  salonId: string;
  staffUserId: string;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: string;
}): Promise<void> {
  const salonRow = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.salon.findUnique({
      where: { id: input.salonId },
      select: { timezone: true },
    }),
  );
  const offset = timezoneOffsetMinutes(salonRow?.timezone ?? "Asia/Kolkata");

  const dateStr = toLocalDateString(input.startTime, offset);
  const day = getDayOfWeek(dateStr);

  const [salonHours, staffSchedule, onLeave] = await Promise.all([
    getSalonHoursForDay(input.salonId, day),
    getStaffScheduleForDay(input.staffUserId, input.salonId, day),
    isStaffOnLeaveAt(input.staffUserId, input.salonId, input.startTime),
  ]);

  if (!salonHours || salonHours.isClosed) {
    throw new AppointmentOutsideSalonHoursError();
  }

  const startMin = toLocalMinutesSinceMidnight(input.startTime, offset);
  const endMin = toLocalMinutesSinceMidnight(input.endTime, offset);
  const salonOpen = timeToMinutes(salonHours.openTime);
  const salonClose = timeToMinutes(salonHours.closeTime);

  if (startMin < salonOpen || endMin > salonClose) {
    throw new AppointmentOutsideSalonHoursError();
  }

  if (!staffSchedule || staffSchedule.isOff) {
    throw new AppointmentOutsideStaffHoursError();
  }

  const staffStart = timeToMinutes(staffSchedule.startTime);
  const staffEnd = timeToMinutes(staffSchedule.endTime);
  if (startMin < staffStart || endMin > staffEnd) {
    throw new AppointmentOutsideStaffHoursError();
  }

  if (onLeave) throw new AppointmentStaffOnLeaveError();

  const overlaps = await findOverlappingAppointments(
    input.staffUserId,
    input.salonId,
    input.startTime,
    input.endTime,
    input.excludeAppointmentId,
  );
  if (overlaps.length > 0) throw new AppointmentSlotTakenError();
}

/** Re-export for the cancel route. */
export { AppointmentStaffNotFoundError };
