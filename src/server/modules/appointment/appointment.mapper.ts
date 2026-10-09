import "server-only";

import type {
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/client";

import type {
  PublicAppointment,
  PublicAppointmentService,
  PublicPayment,
} from "./appointment.types";

/** Helper for converting Prisma Decimal | number | null to plain number. */
function num(
  value: { toNumber(): number } | number | null | undefined,
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

interface PaymentRow {
  id: string;
  appointmentId: string;
  amount: { toNumber(): number } | number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId: string | null;
  gatewayRef: string | null;
  refundAmount: { toNumber(): number } | number | null;
  createdAt: Date;
}

interface AppointmentServiceRow {
  serviceId: string;
  staffId: string | null;
  price: { toNumber(): number } | number;
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

interface AppointmentRow {
  id: string;
  customerId: string;
  salonId: string;
  staffId: string | null;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  subtotal: { toNumber(): number } | number;
  discount: { toNumber(): number } | number;
  tax: { toNumber(): number } | number;
  totalPrice: { toNumber(): number } | number;
  notes: string | null;
  cancelReason: string | null;
  rescheduledFrom: string | null;
  services: AppointmentServiceRow[];
  payment: PaymentRow | null;
  createdAt: Date;
  updatedAt: Date;
  salon: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  customer: {
    id: string;
    name: string | null;
    phone: string | null;
    avatar: string | null;
  };
}

/** Converts a Prisma appointment row into the public API shape. */
export function toPublicAppointment(row: AppointmentRow): PublicAppointment {
  return {
    id: row.id,
    customerId: row.customerId,
    salonId: row.salonId,
    staffId: row.staffId,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
    subtotal: num(row.subtotal),
    discount: num(row.discount),
    tax: num(row.tax),
    totalPrice: num(row.totalPrice),
    notes: row.notes,
    cancelReason: row.cancelReason,
    rescheduledFrom: row.rescheduledFrom,
    services: row.services.map(toPublicAppointmentService),
    payment: row.payment ? toPublicPayment(row.payment) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    salon: row.salon,
    customer: row.customer,
  };
}

/** Converts a nested service line. */
function toPublicAppointmentService(
  row: AppointmentServiceRow,
): PublicAppointmentService {
  return {
    serviceId: row.serviceId,
    staffId: row.staffId,
    price: num(row.price),
    service: row.service,
    staff: row.staff,
  };
}

/** Converts a Prisma payment row into the public API shape. */
export function toPublicPayment(row: PaymentRow): PublicPayment {
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    amount: num(row.amount),
    status: row.status,
    method: row.method,
    transactionId: row.transactionId,
    gatewayRef: row.gatewayRef,
    refundAmount: row.refundAmount === null ? null : num(row.refundAmount),
    createdAt: row.createdAt,
  };
}
