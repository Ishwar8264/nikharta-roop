import type { Prisma } from "@prisma/client";

/**
 * Selects all fields needed for the public booking resource.
 */
export const bookingSelect = () =>
  ({
    addOns: {
      select: {
        addOn: { select: { id: true, nameEn: true, nameHi: true } },
        lineTotal: true,
        quantity: true,
        unitPrice: true,
      },
    },
    advanceAmount: true,
    bookingDate: true,
    branch: {
      select: { city: true, id: true, nameEn: true, nameHi: true },
    },
    cancellationReason: true,
    cancelledAt: true,
    checkedInAt: true,
    completedAt: true,
    createdAt: true,
    discountAmount: true,
    displayId: true,
    id: true,
    notes: true,
    pendingExpiresAt: true,
    service: { select: { id: true, nameEn: true, nameHi: true } },
    serviceVariant: { select: { id: true, nameEn: true, nameHi: true } },
    slotEnd: true,
    slotStart: true,
    staff: { select: { id: true, user: { select: { name: true } } } },
    status: true,
    totalAmount: true,
    updatedAt: true,
  }) satisfies Prisma.BookingSelect;
