export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export interface BookingService {
  id: string;
  name: string;
  slug: string;
  price: number;
  duration: number;
}

export interface BookingStaff {
  userId: string;
  user: { id: string; name: string | null; avatar: string | null };
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface PublicAppointment {
  id: string;
  customerId: string;
  salonId: string;
  staffId: string | null;
  startTime: string | Date;
  endTime: string | Date;
  status: AppointmentStatus;
  subtotal: number;
  discount: number;
  tax: number;
  totalPrice: number;
  notes: string | null;
  cancelReason: string | null;
  services: Array<{
    serviceId: string;
    staffId: string | null;
    price: number;
    // The price lives on the line (price-at-booking-time); the service shape
    // carries identity + duration only, matching the REST response shape.
    service: {
      id: string;
      name: string;
      slug: string;
      duration: number;
      images: string[];
    };
    staff: { id: string; name: string | null; avatar: string | null } | null;
  }>;
  payment: { status: string; method: string; amount: number } | null;
  salon: { id: string; name: string; slug: string; timezone: string };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateAppointmentInput {
  salonRef: string;
  staffId: string;
  startTime: string;
  services: Array<{ serviceId: string; staffId: string }>;
  couponCode?: string;
  notes?: string;
}
