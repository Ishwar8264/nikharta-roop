type BookingSlotInput = {
  availableStaffCount: number;
  endMinutes: number;
  startMinutes: number;
};

type DecimalLike = {
  toString(): string;
};

type BookingAddOnRow = {
  addOn: {
    id: string;
    nameEn: string | null;
    nameHi: string;
  };
  lineTotal: DecimalLike;
  quantity: number;
  unitPrice: DecimalLike;
};

type BookingRow = {
  addOns?: BookingAddOnRow[];
  advanceAmount: DecimalLike | null;
  bookingDate: Date;
  branch: {
    city: string;
    id: string;
    nameEn: string | null;
    nameHi: string;
  };
  cancellationReason: string | null;
  cancelledAt: Date | null;
  checkedInAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  displayId: string;
  discountAmount: DecimalLike;
  id: string;
  notes: string | null;
  pendingExpiresAt: Date | null;
  service: {
    id: string;
    nameEn: string;
    nameHi: string;
  } | null;
  serviceVariant: {
    id: string;
    nameEn: string | null;
    nameHi: string;
  } | null;
  slotEnd: Date;
  slotStart: Date;
  staff: {
    id: string;
    user: {
      name: string | null;
    };
  } | null;
  status: string;
  totalAmount: DecimalLike;
  updatedAt: Date;
};

/**
 * Converts calculated slot minutes into the public slot grid API shape.
 */
export function toPublicBookingSlot(slot: BookingSlotInput) {
  return {
    available: slot.availableStaffCount > 0,
    availableStaffCount: slot.availableStaffCount,
    endTime: toTimeString(slot.endMinutes),
    startTime: toTimeString(slot.startMinutes),
  };
}

/**
 * Converts a booking row into the customer-facing booking resource.
 */
export function toPublicBooking(booking: BookingRow) {
  return {
    addOns: booking.addOns?.map(toPublicBookingAddOn) ?? [],
    advanceAmount: booking.advanceAmount?.toString() ?? null,
    bookingDate: booking.bookingDate,
    branch: booking.branch,
    cancellationReason: booking.cancellationReason,
    cancelledAt: booking.cancelledAt,
    checkedInAt: booking.checkedInAt,
    completedAt: booking.completedAt,
    createdAt: booking.createdAt,
    discountAmount: booking.discountAmount.toString(),
    displayId: booking.displayId,
    id: booking.id,
    notes: booking.notes,
    pendingExpiresAt: booking.pendingExpiresAt,
    service: booking.service,
    serviceVariant: booking.serviceVariant,
    slotEnd: booking.slotEnd,
    slotStart: booking.slotStart,
    staff: booking.staff
      ? {
          id: booking.staff.id,
          name: booking.staff.user.name,
        }
      : null,
    status: booking.status,
    totalAmount: booking.totalAmount.toString(),
    updatedAt: booking.updatedAt,
  };
}

/**
 * Converts a booked add-on row into an API-safe shape.
 */
function toPublicBookingAddOn(addOn: BookingAddOnRow) {
  return {
    addOn: addOn.addOn,
    lineTotal: addOn.lineTotal.toString(),
    quantity: addOn.quantity,
    unitPrice: addOn.unitPrice.toString(),
  };
}

/**
 * Formats minutes after midnight as HH:mm:ss for API consumers.
 */
function toTimeString(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(
    2,
    "0",
  )}:00`;
}
