import type { z } from "zod";

import type {
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/client";

import type {
  availabilityQuerySchema,
  cancelAppointmentSchema,
  createAppointmentSchema,
  createPaymentSchema,
  listMyAppointmentsQuerySchema,
  listSalonAppointmentsQuerySchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
  updatePaymentSchema,
} from "./appointment.schema";

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ListMyAppointmentsQuery = z.infer<
  typeof listMyAppointmentsQuerySchema
>;
export type ListSalonAppointmentsQuery = z.infer<
  typeof listSalonAppointmentsQuerySchema
>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentSchema
>;
export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema
>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

/** Public shape of an appointment service line. */
export interface PublicAppointmentService {
  serviceId: string;
  staffId: string | null;
  price: number;
  service: {
    id: string;
    name: string;
    slug: string;
    duration: number;
    images: string[];
  };
  staff: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
}

/** Public shape of a payment. */
export interface PublicPayment {
  id: string;
  appointmentId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId: string | null;
  gatewayRef: string | null;
  refundAmount: number | null;
  createdAt: Date;
}

/** Public shape of an appointment. */
export interface PublicAppointment {
  id: string;
  customerId: string;
  salonId: string;
  staffId: string | null;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  subtotal: number;
  discount: number;
  tax: number;
  totalPrice: number;
  notes: string | null;
  cancelReason: string | null;
  rescheduledFrom: string | null;
  services: PublicAppointmentService[];
  payment: PublicPayment | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Cursor-paginated appointments. */
export interface PaginatedAppointments {
  items: PublicAppointment[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** A single availability slot. */
export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

/** Result of an availability query. */
export interface AvailabilityResult {
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
}
