import "server-only";

import type { SalonMemberRole } from "@/generated/prisma/client";
import { hasRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";

import { AppointmentAccessDeniedError } from "./appointment.errors";

/** The caller's resolved context for an appointment action. */
export interface AppointmentViewerContext {
  userId: string;
  isCustomer: boolean;
  salonMemberRole: SalonMemberRole | null;
  isAssignedStaff: boolean;
}

/**
 * Builds the viewer context for an appointment.
 *
 * Why:
 * Appointment access is a union of three roles — the customer, the salon's
 * staff, and the assigned staff member. Computing all three in one place
 * avoids duplicating the membership lookup in every caller.
 */
export async function buildAppointmentViewerContext(input: {
  userId: string;
  customerId: string;
  salonId: string;
  assignedStaffUserId: string | null;
}): Promise<AppointmentViewerContext> {
  const isCustomer = input.userId === input.customerId;

  const membership = await findSalonForViewer({
    salonId: input.salonId,
    userId: input.userId,
  });

  return {
    userId: input.userId,
    isCustomer,
    salonMemberRole: membership?.viewerRole ?? null,
    isAssignedStaff: input.assignedStaffUserId === input.userId,
  };
}

/** True when the caller can read the appointment. */
export function canViewAppointment(context: AppointmentViewerContext): boolean {
  if (context.isCustomer) return true;
  if (context.isAssignedStaff) return true;
  if (
    context.salonMemberRole &&
    hasRoleAtLeast(context.salonMemberRole, "MANAGER")
  ) {
    return true;
  }
  return false;
}

/**
 * True when the caller can transition the appointment's status.
 *
 * Why:
 * Customers may only cancel their own bookings. Salon managers and the
 * assigned staff can drive the full lifecycle (confirm, in-progress,
 * complete, no-show). Splitting the rules here keeps the state machine in
 * the service layer easy to read.
 */
export function canTransitionStatus(
  context: AppointmentViewerContext,
  targetStatus: string,
): boolean {
  if (context.salonMemberRole) {
    if (
      hasRoleAtLeast(context.salonMemberRole, "MANAGER") ||
      context.isAssignedStaff
    ) {
      return true;
    }
  }
  // Customers may only cancel their own appointment.
  if (context.isCustomer && targetStatus === "CANCELLED") return true;
  return false;
}

/** Throws when the caller is not permitted to read the appointment. */
export function assertCanViewAppointment(
  context: AppointmentViewerContext,
): void {
  if (!canViewAppointment(context)) {
    throw new AppointmentAccessDeniedError();
  }
}

/** Throws when the caller is not permitted to transition the status. */
export function assertCanTransitionStatus(
  context: AppointmentViewerContext,
  targetStatus: string,
): void {
  if (!canTransitionStatus(context, targetStatus)) {
    throw new AppointmentAccessDeniedError();
  }
}

/** True when the caller may record a payment for the appointment. */
export function canRecordPayment(context: AppointmentViewerContext): boolean {
  if (context.isCustomer) return true;
  if (context.salonMemberRole) return true;
  return false;
}

/** Throws when the caller cannot record a payment. */
export function assertCanRecordPayment(
  context: AppointmentViewerContext,
): void {
  if (!canRecordPayment(context)) {
    throw new AppointmentAccessDeniedError();
  }
}

/** Throws unless the caller can reconcile or refund a payment. */
export function assertCanManagePayment(
  context: AppointmentViewerContext,
): void {
  if (
    !context.salonMemberRole ||
    !hasRoleAtLeast(context.salonMemberRole, "MANAGER")
  ) {
    throw new AppointmentAccessDeniedError();
  }
}
