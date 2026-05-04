import { BookingStatus, Prisma } from "@prisma/client";
import type { ZodError, ZodType } from "zod";

import { getDb } from "@/db";
import {
  getAuthenticatedSession,
  touchSession,
} from "@/features/auth/handlers/auth.handlers";
import {
  BOOKING_CODES,
  BOOKING_MESSAGES,
} from "@/features/bookings/constants/booking.constants";
import {
  toPublicBooking,
  toPublicBookingSlot,
} from "@/features/bookings/helpers/booking.mapper";
import {
  bookingError,
  bookingJson,
} from "@/features/bookings/responses/booking.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";
import {
  cancelBookingSchema,
  type CancelBookingInput,
  createBookingSchema,
  type CreateBookingInput,
  listBookingsQuerySchema,
  type ListBookingSlotsQueryInput,
  type ListBookingsQueryInput,
  listBookingSlotsQuerySchema,
  rescheduleBookingSchema,
  type RescheduleBookingInput,
} from "@/schema/bookings/schema.booking";

const BOOKING_SLOT_STEP_MINUTES = 30;
const BOOKING_MIN_ADVANCE_MINUTES = 120;
const BOOKING_MAX_ADVANCE_DAYS = 60;
const BOOKING_PENDING_HOLD_MINUTES = 15;
const BLOCKING_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
];
const CUSTOMER_EDITABLE_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
] as BookingStatus[];

/**
 * Handles current-user booking list loading.
 */
export async function handleListBookings(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedQuery = parseBookingQuery(request, listBookingsQuerySchema);

  if (parsedQuery.error) {
    return parsedQuery.error;
  }

  return listBookings(auth.session.id, auth.session.userId, parsedQuery.data);
}

/**
 * Handles customer booking creation after validating the requested slot.
 */
export async function handleCreateBooking(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseBookingBody(request, createBookingSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createBooking(auth.session.id, auth.session.userId, parsedBody.data);
}

/**
 * Handles current-user booking detail loading.
 */
export async function handleGetBooking(request: Request, bookingId: string) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  return getBooking(auth.session.id, auth.session.userId, bookingId);
}

/**
 * Handles customer cancellation for pending or confirmed bookings.
 */
export async function handleCancelBooking(request: Request, bookingId: string) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseBookingBody(request, cancelBookingSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return cancelBooking(
    auth.session.id,
    auth.session.userId,
    bookingId,
    parsedBody.data,
  );
}

/**
 * Handles customer rescheduling after re-checking slot availability.
 */
export async function handleRescheduleBooking(
  request: Request,
  bookingId: string,
) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseBookingBody(request, rescheduleBookingSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return rescheduleBooking(
    auth.session.id,
    auth.session.userId,
    bookingId,
    parsedBody.data,
  );
}

/**
 * Handles public booking slot listing for the selected service/date.
 */
export async function handleListBookingSlots(request: Request) {
  const parsedQuery = parseBookingQuery(request, listBookingSlotsQuerySchema);

  if (parsedQuery.error) {
    return parsedQuery.error;
  }

  return listBookingSlots(parsedQuery.data);
}

/**
 * Loads bookings owned by the current authenticated user.
 */
async function listBookings(
  sessionId: string,
  userId: string,
  input: ListBookingsQueryInput,
) {
  try {
    const bookings = await getDb().booking.findMany({
      orderBy: [{ bookingDate: "desc" }, { slotStart: "desc" }],
      select: bookingSelect(),
      take: input.limit,
      where: {
        status: input.status,
        userId,
      },
    });

    await touchSession(sessionId);

    return bookingJson({
      code: BOOKING_CODES.BOOKING_LIST_LOADED,
      data: {
        bookings: bookings.map(toPublicBooking),
        limit: input.limit,
      },
      message: BOOKING_MESSAGES.BOOKING_LIST_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(BOOKING_CODES.BOOKING_LIST_LOAD_FAILED, {
      error,
      handler: "listBookings",
      userId,
    });

    return bookingError({
      code: BOOKING_CODES.BOOKING_LIST_LOAD_FAILED,
      message: BOOKING_MESSAGES.BOOKING_LIST_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Creates a pending booking inside a serializable transaction.
 */
async function createBooking(
  sessionId: string,
  userId: string,
  input: CreateBookingInput,
) {
  try {
    const booking = await getDb().$transaction(
      async (tx) => {
        const prepared = await prepareBookingSlot(tx, input, {
          excludedBookingId: null,
        });

        return tx.booking.create({
          data: {
            addOns: {
              create: prepared.addOns.map((addOn) => ({
                addOnId: addOn.addOnId,
                lineTotal: addOn.lineTotal,
                quantity: addOn.quantity,
                unitPrice: addOn.unitPrice,
              })),
            },
            advanceAmount: prepared.advanceAmount,
            bookingDate: prepared.bookingDate,
            branchId: input.branchId,
            displayId: createDisplayId(),
            notes: input.notes ?? null,
            pendingExpiresAt: new Date(
              Date.now() + BOOKING_PENDING_HOLD_MINUTES * 60 * 1000,
            ),
            serviceId: input.serviceId,
            serviceVariantId: input.serviceVariantId ?? null,
            slotEnd: toTimeDate(prepared.slotEndMinutes),
            slotStart: toTimeDate(prepared.slotStartMinutes),
            staffId: prepared.staffId,
            status: BookingStatus.PENDING,
            statusHistory: {
              create: {
                toStatus: BookingStatus.PENDING,
              },
            },
            totalAmount: prepared.totalAmount,
            userId,
          },
          select: bookingSelect(),
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await touchSession(sessionId);

    return bookingJson({
      code: BOOKING_CODES.BOOKING_CREATED,
      data: {
        booking: toPublicBooking(booking),
      },
      message: BOOKING_MESSAGES.BOOKING_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleBookingWriteError(error, {
      failureCode: BOOKING_CODES.BOOKING_CREATE_FAILED,
      failureMessage: BOOKING_MESSAGES.BOOKING_CREATE_FAILED,
      handler: "createBooking",
      userId,
    });
  }
}

/**
 * Loads one booking if it belongs to the authenticated user.
 */
async function getBooking(sessionId: string, userId: string, bookingId: string) {
  try {
    const booking = await getDb().booking.findFirst({
      select: bookingSelect(),
      where: {
        id: bookingId,
        userId,
      },
    });

    if (!booking) {
      return bookingError({
        code: BOOKING_CODES.BOOKING_NOT_FOUND,
        message: BOOKING_MESSAGES.BOOKING_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    await touchSession(sessionId);

    return bookingJson({
      code: BOOKING_CODES.BOOKING_DETAIL_LOADED,
      data: {
        booking: toPublicBooking(booking),
      },
      message: BOOKING_MESSAGES.BOOKING_DETAIL_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(BOOKING_CODES.BOOKING_DETAIL_LOAD_FAILED, {
      bookingId,
      error,
      handler: "getBooking",
      userId,
    });

    return bookingError({
      code: BOOKING_CODES.BOOKING_DETAIL_LOAD_FAILED,
      message: BOOKING_MESSAGES.BOOKING_DETAIL_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Marks a customer booking as cancelled and records status history.
 */
async function cancelBooking(
  sessionId: string,
  userId: string,
  bookingId: string,
  input: CancelBookingInput,
) {
  try {
    const booking = await getDb().$transaction(async (tx) => {
      const currentBooking = await tx.booking.findFirst({
        select: {
          id: true,
          status: true,
        },
        where: {
          id: bookingId,
          userId,
        },
      });

      if (!currentBooking) {
        throw new BookingVisibleError(
          BOOKING_CODES.BOOKING_NOT_FOUND,
          BOOKING_MESSAGES.BOOKING_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      assertCustomerEditableStatus(currentBooking.status);

      return tx.booking.update({
        data: {
          cancellationReason: input.reason ?? null,
          cancelledAt: new Date(),
          status: BookingStatus.CANCELLED,
          statusHistory: {
            create: {
              fromStatus: currentBooking.status,
              reason: input.reason ?? null,
              toStatus: BookingStatus.CANCELLED,
            },
          },
        },
        select: bookingSelect(),
        where: {
          id: currentBooking.id,
        },
      });
    });

    await touchSession(sessionId);

    return bookingJson({
      code: BOOKING_CODES.BOOKING_CANCELLED,
      data: {
        booking: toPublicBooking(booking),
      },
      message: BOOKING_MESSAGES.BOOKING_CANCELLED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleBookingWriteError(error, {
      failureCode: BOOKING_CODES.BOOKING_CANCEL_FAILED,
      failureMessage: BOOKING_MESSAGES.BOOKING_CANCEL_FAILED,
      handler: "cancelBooking",
      userId,
    });
  }
}

/**
 * Moves a customer booking to a new slot after validating the same service load.
 */
async function rescheduleBooking(
  sessionId: string,
  userId: string,
  bookingId: string,
  input: RescheduleBookingInput,
) {
  try {
    const booking = await getDb().$transaction(
      async (tx) => {
        const currentBooking = await tx.booking.findFirst({
          select: {
            addOns: {
              select: {
                addOnId: true,
                quantity: true,
              },
            },
            branchId: true,
            id: true,
            serviceId: true,
            serviceVariantId: true,
            status: true,
          },
          where: {
            id: bookingId,
            userId,
          },
        });

        if (!currentBooking || !currentBooking.serviceId) {
          throw new BookingVisibleError(
            BOOKING_CODES.BOOKING_NOT_FOUND,
            BOOKING_MESSAGES.BOOKING_NOT_FOUND,
            HTTP_STATUS.NOT_FOUND,
          );
        }

        assertCustomerEditableStatus(currentBooking.status);

        const prepared = await prepareBookingSlot(
          tx,
          {
            addOns: currentBooking.addOns.map((addOn) => ({
              addOnId: addOn.addOnId,
              quantity: addOn.quantity,
            })),
            bookingDate: input.bookingDate,
            branchId: currentBooking.branchId,
            notes: undefined,
            serviceId: currentBooking.serviceId,
            serviceVariantId: currentBooking.serviceVariantId ?? undefined,
            slotStart: input.slotStart,
            staffId: input.staffId,
          },
          {
            excludedBookingId: currentBooking.id,
          },
        );

        return tx.booking.update({
          data: {
            bookingDate: prepared.bookingDate,
            pendingExpiresAt:
              currentBooking.status === BookingStatus.PENDING
                ? new Date(
                    Date.now() + BOOKING_PENDING_HOLD_MINUTES * 60 * 1000,
                  )
                : undefined,
            slotEnd: toTimeDate(prepared.slotEndMinutes),
            slotStart: toTimeDate(prepared.slotStartMinutes),
            staffId: prepared.staffId,
          },
          select: bookingSelect(),
          where: {
            id: currentBooking.id,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await touchSession(sessionId);

    return bookingJson({
      code: BOOKING_CODES.BOOKING_RESCHEDULED,
      data: {
        booking: toPublicBooking(booking),
      },
      message: BOOKING_MESSAGES.BOOKING_RESCHEDULED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleBookingWriteError(error, {
      failureCode: BOOKING_CODES.BOOKING_RESCHEDULE_FAILED,
      failureMessage: BOOKING_MESSAGES.BOOKING_RESCHEDULE_FAILED,
      handler: "rescheduleBooking",
      userId,
    });
  }
}

/**
 * Calculates available slots from branch hours, service duration, and staff load.
 */
async function listBookingSlots(input: ListBookingSlotsQueryInput) {
  try {
    const bookingDate = toDateOnly(input.date);
    const now = new Date();

    const branch = await getDb().branch.findFirst({
      select: {
        closeTime: true,
        id: true,
        openTime: true,
      },
      where: {
        id: input.branchId,
        isActive: true,
      },
    });

    if (!branch) {
      return bookingError({
        code: BOOKING_CODES.BRANCH_NOT_FOUND,
        message: BOOKING_MESSAGES.BRANCH_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const service = await getDb().service.findFirst({
      select: {
        durationMinutes: true,
        id: true,
      },
      where: {
        branchId: input.branchId,
        category: {
          isActive: true,
        },
        id: input.serviceId,
        isActive: true,
      },
    });

    if (!service) {
      return bookingError({
        code: BOOKING_CODES.SERVICE_NOT_FOUND,
        message: BOOKING_MESSAGES.SERVICE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const variant = input.serviceVariantId
      ? await getDb().serviceVariant.findFirst({
          select: {
            durationMinutes: true,
            id: true,
          },
          where: {
            id: input.serviceVariantId,
            isActive: true,
            serviceId: input.serviceId,
          },
        })
      : null;

    if (input.serviceVariantId && !variant) {
      return bookingError({
        code: BOOKING_CODES.VARIANT_NOT_FOUND,
        message: BOOKING_MESSAGES.VARIANT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const durationMinutes = variant?.durationMinutes ?? service.durationMinutes;
    const horizonEnd = new Date(now);
    horizonEnd.setUTCDate(horizonEnd.getUTCDate() + BOOKING_MAX_ADVANCE_DAYS);

    if (bookingDate > toDateOnly(toIsoDate(horizonEnd))) {
      return bookingJson({
        code: BOOKING_CODES.BOOKING_SLOTS_LISTED,
        data: emptySlotsPayload(input, {
          closedReason: "BOOKING_HORIZON_EXCEEDED",
          durationMinutes,
          isClosed: true,
        }),
        message: BOOKING_MESSAGES.BOOKING_SLOTS_LISTED,
        status: HTTP_STATUS.OK,
        success: true,
      });
    }

    const holiday = await getDb().branchHoliday.findUnique({
      select: {
        isClosed: true,
        reasonEn: true,
        reasonHi: true,
      },
      where: {
        branchId_date: {
          branchId: input.branchId,
          date: bookingDate,
        },
      },
    });

    if (holiday?.isClosed) {
      return bookingJson({
        code: BOOKING_CODES.BOOKING_SLOTS_LISTED,
        data: emptySlotsPayload(input, {
          closedReason: holiday.reasonHi ?? holiday.reasonEn ?? "BRANCH_CLOSED",
          durationMinutes,
          isClosed: true,
        }),
        message: BOOKING_MESSAGES.BOOKING_SLOTS_LISTED,
        status: HTTP_STATUS.OK,
        success: true,
      });
    }

    const staff = await getDb().staff.findMany({
      orderBy: [{ rating: "desc" }, { id: "asc" }],
      select: staffSelect(),
      where: {
        branchId: input.branchId,
        id: input.staffId,
        isAvailable: true,
        services: {
          some: {
            serviceId: input.serviceId,
          },
        },
      },
    });

    if (input.staffId && staff.length === 0) {
      return bookingError({
        code: BOOKING_CODES.STAFF_NOT_FOUND,
        message: BOOKING_MESSAGES.STAFF_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const bookings = await getDb().booking.findMany({
      select: {
        slotEnd: true,
        slotStart: true,
        staffId: true,
      },
      where: {
        bookingDate,
        branchId: input.branchId,
        status: {
          in: BLOCKING_BOOKING_STATUSES,
        },
      },
    });

    const leaveWindow = getDayWindow(bookingDate);
    const leaves = await getDb().staffLeave.findMany({
      select: {
        endsAt: true,
        staffId: true,
        startsAt: true,
      },
      where: {
        staffId: {
          in: staff.map((staffMember) => staffMember.id),
        },
        startsAt: {
          lt: leaveWindow.end,
        },
        endsAt: {
          gt: leaveWindow.start,
        },
      },
    });

    const slots = buildSlots({
      bookings,
      branchCloseMinutes: toTimeMinutes(branch.closeTime),
      branchOpenMinutes: toTimeMinutes(branch.openTime),
      bookingDate,
      durationMinutes,
      hasPreferredStaff: Boolean(input.staffId),
      leaves,
      now,
      staff,
    });

    return bookingJson({
      code: BOOKING_CODES.BOOKING_SLOTS_LISTED,
      data: {
        branchId: input.branchId,
        closedReason: null,
        date: input.date,
        durationMinutes,
        isClosed: false,
        serviceId: input.serviceId,
        serviceVariantId: input.serviceVariantId ?? null,
        staffId: input.staffId ?? null,
        slots: slots.map(toPublicBookingSlot),
      },
      message: BOOKING_MESSAGES.BOOKING_SLOTS_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(BOOKING_CODES.BOOKING_SLOTS_LOAD_FAILED, {
      branchId: input.branchId,
      date: input.date,
      error,
      handler: "listBookingSlots",
      serviceId: input.serviceId,
    });

    return bookingError({
      code: BOOKING_CODES.BOOKING_SLOTS_LOAD_FAILED,
      message: BOOKING_MESSAGES.BOOKING_SLOTS_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

type NormalizedBookingAddOn = {
  addOnId: string;
  quantity: number;
};

type PreparedBookingAddOn = NormalizedBookingAddOn & {
  durationMinutes: number;
  lineTotal: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
};

type PreparedBookingSlot = {
  addOns: PreparedBookingAddOn[];
  advanceAmount: Prisma.Decimal | null;
  bookingDate: Date;
  slotEndMinutes: number;
  slotStartMinutes: number;
  staffId: string;
  totalAmount: Prisma.Decimal;
};

type StaffRow = {
  id: string;
  workDays: Prisma.JsonValue;
  workEnd: Date;
  workStart: Date;
};

type BlockingBookingRow = {
  slotEnd: Date;
  slotStart: Date;
  staffId: string | null;
};

type StaffLeaveRow = {
  endsAt: Date;
  staffId: string;
  startsAt: Date;
};

/**
 * Prepares and validates all data needed to create or reschedule a booking.
 */
async function prepareBookingSlot(
  tx: Prisma.TransactionClient,
  input: CreateBookingInput,
  options: {
    excludedBookingId: string | null;
  },
): Promise<PreparedBookingSlot> {
  const bookingDate = toDateOnly(input.bookingDate);
  const now = new Date();
  const slotStartMinutes = parseTimeMinutes(input.slotStart);

  const branch = await tx.branch.findFirst({
    select: {
      closeTime: true,
      id: true,
      openTime: true,
    },
    where: {
      id: input.branchId,
      isActive: true,
    },
  });

  if (!branch) {
    throw new BookingVisibleError(
      BOOKING_CODES.BRANCH_NOT_FOUND,
      BOOKING_MESSAGES.BRANCH_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }

  const service = await tx.service.findFirst({
    select: {
      advanceAmount: true,
      durationMinutes: true,
      id: true,
      price: true,
    },
    where: {
      branchId: input.branchId,
      category: {
        isActive: true,
      },
      id: input.serviceId,
      isActive: true,
    },
  });

  if (!service) {
    throw new BookingVisibleError(
      BOOKING_CODES.SERVICE_NOT_FOUND,
      BOOKING_MESSAGES.SERVICE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }

  const variant = input.serviceVariantId
    ? await tx.serviceVariant.findFirst({
        select: {
          advanceAmount: true,
          durationMinutes: true,
          id: true,
          price: true,
        },
        where: {
          id: input.serviceVariantId,
          isActive: true,
          serviceId: input.serviceId,
        },
      })
    : null;

  if (input.serviceVariantId && !variant) {
    throw new BookingVisibleError(
      BOOKING_CODES.VARIANT_NOT_FOUND,
      BOOKING_MESSAGES.VARIANT_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }

  const addOns = await prepareBookingAddOns(tx, input);
  const baseDurationMinutes = variant?.durationMinutes ?? service.durationMinutes;
  const addOnDurationMinutes = addOns.reduce(
    (sum, addOn) => sum + addOn.durationMinutes * addOn.quantity,
    0,
  );
  const slotEndMinutes =
    slotStartMinutes + baseDurationMinutes + addOnDurationMinutes;

  assertBookableTime({
    bookingDate,
    branchCloseMinutes: toTimeMinutes(branch.closeTime),
    branchOpenMinutes: toTimeMinutes(branch.openTime),
    now,
    slotEndMinutes,
    slotStartMinutes,
  });

  await assertBranchOpenOnDate(tx, input.branchId, bookingDate);

  const staff = await tx.staff.findMany({
    orderBy: [{ rating: "desc" }, { id: "asc" }],
    select: staffSelect(),
    where: {
      branchId: input.branchId,
      id: input.staffId,
      isAvailable: true,
      services: {
        some: {
          serviceId: input.serviceId,
        },
      },
    },
  });

  if (input.staffId && staff.length === 0) {
    throw new BookingVisibleError(
      BOOKING_CODES.STAFF_NOT_FOUND,
      BOOKING_MESSAGES.STAFF_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }

  const bookings = await tx.booking.findMany({
    select: {
      slotEnd: true,
      slotStart: true,
      staffId: true,
    },
    where: {
      bookingDate,
      branchId: input.branchId,
      id: options.excludedBookingId
        ? {
            not: options.excludedBookingId,
          }
        : undefined,
      status: {
        in: BLOCKING_BOOKING_STATUSES,
      },
    },
  });

  const leaveWindow = getDayWindow(bookingDate);
  const leaves = await tx.staffLeave.findMany({
    select: {
      endsAt: true,
      staffId: true,
      startsAt: true,
    },
    where: {
      staffId: {
        in: staff.map((staffMember) => staffMember.id),
      },
      startsAt: {
        lt: leaveWindow.end,
      },
      endsAt: {
        gt: leaveWindow.start,
      },
    },
  });

  const staffId = chooseStaffForSlot({
    bookings,
    bookingDate,
    hasPreferredStaff: Boolean(input.staffId),
    leaves,
    slotEndMinutes,
    slotStartMinutes,
    staff,
  });

  const basePrice = variant?.price ?? service.price;
  const totalAmount = addOns.reduce(
    (total, addOn) => total.plus(addOn.lineTotal),
    basePrice,
  );

  return {
    addOns,
    advanceAmount: variant?.advanceAmount ?? service.advanceAmount,
    bookingDate,
    slotEndMinutes,
    slotStartMinutes,
    staffId,
    totalAmount,
  };
}

/**
 * Loads, validates, and prices requested booking add-ons.
 */
async function prepareBookingAddOns(
  tx: Prisma.TransactionClient,
  input: CreateBookingInput,
) {
  const normalizedAddOns = normalizeBookingAddOns(input.addOns);

  if (normalizedAddOns.length === 0) {
    return [];
  }

  const addOns = await tx.serviceAddOn.findMany({
    select: {
      durationMinutes: true,
      id: true,
      price: true,
    },
    where: {
      branchId: input.branchId,
      id: {
        in: normalizedAddOns.map((addOn) => addOn.addOnId),
      },
      isActive: true,
      OR: [
        {
          serviceId: null,
        },
        {
          serviceId: input.serviceId,
        },
      ],
    },
  });

  if (addOns.length !== normalizedAddOns.length) {
    throw new BookingVisibleError(
      BOOKING_CODES.VALIDATION_ERROR,
      "One or more booking add-ons are invalid.",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }

  return normalizedAddOns.map((inputAddOn) => {
    const addOn = addOns.find((item) => item.id === inputAddOn.addOnId);

    if (!addOn) {
      throw new BookingVisibleError(
        BOOKING_CODES.VALIDATION_ERROR,
        "One or more booking add-ons are invalid.",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
      );
    }

    return {
      addOnId: inputAddOn.addOnId,
      durationMinutes: addOn.durationMinutes,
      lineTotal: addOn.price.mul(inputAddOn.quantity),
      quantity: inputAddOn.quantity,
      unitPrice: addOn.price,
    };
  });
}

/**
 * Combines duplicate add-on rows before DB validation and pricing.
 */
function normalizeBookingAddOns(addOns: CreateBookingInput["addOns"]) {
  const byAddOnId = new Map<string, NormalizedBookingAddOn>();

  for (const addOn of addOns) {
    const quantity = addOn.quantity ?? 1;
    const existing = byAddOnId.get(addOn.addOnId);

    byAddOnId.set(addOn.addOnId, {
      addOnId: addOn.addOnId,
      quantity: (existing?.quantity ?? 0) + quantity,
    });
  }

  return Array.from(byAddOnId.values());
}

/**
 * Throws when a requested slot is outside branch and booking policy limits.
 */
function assertBookableTime(input: {
  bookingDate: Date;
  branchCloseMinutes: number;
  branchOpenMinutes: number;
  now: Date;
  slotEndMinutes: number;
  slotStartMinutes: number;
}) {
  const horizonEnd = new Date(input.now);
  horizonEnd.setUTCDate(horizonEnd.getUTCDate() + BOOKING_MAX_ADVANCE_DAYS);
  const slotStartAt = withMinutes(input.bookingDate, input.slotStartMinutes);

  if (input.bookingDate > toDateOnly(toIsoDate(horizonEnd))) {
    throw new BookingVisibleError(
      BOOKING_CODES.SLOT_UNAVAILABLE,
      BOOKING_MESSAGES.SLOT_UNAVAILABLE,
      HTTP_STATUS.CONFLICT,
    );
  }

  if (
    slotStartAt.getTime() <
    input.now.getTime() + BOOKING_MIN_ADVANCE_MINUTES * 60 * 1000
  ) {
    throw new BookingVisibleError(
      BOOKING_CODES.SLOT_UNAVAILABLE,
      BOOKING_MESSAGES.SLOT_UNAVAILABLE,
      HTTP_STATUS.CONFLICT,
    );
  }

  if (
    input.slotStartMinutes < input.branchOpenMinutes ||
    input.slotEndMinutes > input.branchCloseMinutes
  ) {
    throw new BookingVisibleError(
      BOOKING_CODES.SLOT_UNAVAILABLE,
      BOOKING_MESSAGES.SLOT_UNAVAILABLE,
      HTTP_STATUS.CONFLICT,
    );
  }
}

/**
 * Throws when the selected branch has a closed holiday for the date.
 */
async function assertBranchOpenOnDate(
  tx: Prisma.TransactionClient,
  branchId: string,
  bookingDate: Date,
) {
  const holiday = await tx.branchHoliday.findUnique({
    select: {
      isClosed: true,
    },
    where: {
      branchId_date: {
        branchId,
        date: bookingDate,
      },
    },
  });

  if (holiday?.isClosed) {
    throw new BookingVisibleError(
      BOOKING_CODES.SLOT_UNAVAILABLE,
      BOOKING_MESSAGES.SLOT_UNAVAILABLE,
      HTTP_STATUS.CONFLICT,
    );
  }
}

/**
 * Picks a qualified staff member for the slot, respecting existing capacity.
 */
function chooseStaffForSlot(input: {
  bookings: BlockingBookingRow[];
  bookingDate: Date;
  hasPreferredStaff: boolean;
  leaves: StaffLeaveRow[];
  slotEndMinutes: number;
  slotStartMinutes: number;
  staff: StaffRow[];
}) {
  const availableStaff = input.staff.filter((staffMember) =>
    canStaffServeSlot(staffMember, {
      bookings: input.bookings,
      bookingDate: input.bookingDate,
      endMinutes: input.slotEndMinutes,
      leaves: input.leaves,
      startMinutes: input.slotStartMinutes,
    }),
  );
  const unassignedHoldCount = input.hasPreferredStaff
    ? 0
    : countUnassignedBookingConflicts(input.bookings, {
        bookingDate: input.bookingDate,
        endMinutes: input.slotEndMinutes,
        startMinutes: input.slotStartMinutes,
      });

  if (availableStaff.length <= unassignedHoldCount) {
    throw new BookingVisibleError(
      BOOKING_CODES.SLOT_UNAVAILABLE,
      BOOKING_MESSAGES.SLOT_UNAVAILABLE,
      HTTP_STATUS.CONFLICT,
    );
  }

  const selectedStaff = availableStaff[0];

  if (!selectedStaff) {
    throw new BookingVisibleError(
      BOOKING_CODES.SLOT_UNAVAILABLE,
      BOOKING_MESSAGES.SLOT_UNAVAILABLE,
      HTTP_STATUS.CONFLICT,
    );
  }

  return selectedStaff.id;
}

/**
 * Builds branch-level slots and counts staff who can serve each slot.
 */
function buildSlots(input: {
  bookings: BlockingBookingRow[];
  branchCloseMinutes: number;
  branchOpenMinutes: number;
  bookingDate: Date;
  durationMinutes: number;
  hasPreferredStaff: boolean;
  leaves: StaffLeaveRow[];
  now: Date;
  staff: StaffRow[];
}) {
  const slots = [];
  const latestStartMinutes = input.branchCloseMinutes - input.durationMinutes;

  for (
    let startMinutes = input.branchOpenMinutes;
    startMinutes <= latestStartMinutes;
    startMinutes += BOOKING_SLOT_STEP_MINUTES
  ) {
    const endMinutes = startMinutes + input.durationMinutes;
    const slotStartAt = withMinutes(input.bookingDate, startMinutes);

    if (
      slotStartAt.getTime() <
      input.now.getTime() + BOOKING_MIN_ADVANCE_MINUTES * 60 * 1000
    ) {
      continue;
    }

    const staffAvailableCount = input.staff.filter((staffMember) =>
      canStaffServeSlot(staffMember, {
        bookings: input.bookings,
        bookingDate: input.bookingDate,
        endMinutes,
        leaves: input.leaves,
        startMinutes,
      }),
    ).length;
    const unassignedHoldCount = input.hasPreferredStaff
      ? 0
      : countUnassignedBookingConflicts(input.bookings, {
          bookingDate: input.bookingDate,
          endMinutes,
          startMinutes,
        });
    const availableStaffCount = Math.max(
      0,
      staffAvailableCount - unassignedHoldCount,
    );

    slots.push({
      availableStaffCount,
      endMinutes,
      startMinutes,
    });
  }

  return slots;
}

/**
 * Counts branch-level holds that do not have a staff member assigned yet.
 */
function countUnassignedBookingConflicts(
  bookings: BlockingBookingRow[],
  input: {
    bookingDate: Date;
    endMinutes: number;
    startMinutes: number;
  },
) {
  const slotStartAt = withMinutes(input.bookingDate, input.startMinutes);
  const slotEndAt = withMinutes(input.bookingDate, input.endMinutes);

  return bookings.filter(
    (booking) =>
      !booking.staffId &&
      rangesOverlap(
        slotStartAt,
        slotEndAt,
        withMinutes(input.bookingDate, toTimeMinutes(booking.slotStart)),
        withMinutes(input.bookingDate, toTimeMinutes(booking.slotEnd)),
      ),
  ).length;
}

/**
 * Checks work schedule, leave, and existing bookings for one staff member.
 */
function canStaffServeSlot(
  staffMember: StaffRow,
  input: {
    bookings: BlockingBookingRow[];
    bookingDate: Date;
    endMinutes: number;
    leaves: StaffLeaveRow[];
    startMinutes: number;
  },
) {
  if (!isStaffWorkingDay(staffMember.workDays, input.bookingDate)) {
    return false;
  }

  const staffStart = toTimeMinutes(staffMember.workStart);
  const staffEnd = toTimeMinutes(staffMember.workEnd);

  if (input.startMinutes < staffStart || input.endMinutes > staffEnd) {
    return false;
  }

  const slotStartAt = withMinutes(input.bookingDate, input.startMinutes);
  const slotEndAt = withMinutes(input.bookingDate, input.endMinutes);

  const hasLeaveConflict = input.leaves.some(
    (leave) =>
      leave.staffId === staffMember.id &&
      rangesOverlap(slotStartAt, slotEndAt, leave.startsAt, leave.endsAt),
  );

  if (hasLeaveConflict) {
    return false;
  }

  return !input.bookings.some(
    (booking) =>
      booking.staffId === staffMember.id &&
      rangesOverlap(
        slotStartAt,
        slotEndAt,
        withMinutes(input.bookingDate, toTimeMinutes(booking.slotStart)),
        withMinutes(input.bookingDate, toTimeMinutes(booking.slotEnd)),
      ),
  );
}

/**
 * Parses flexible Staff.workDays JSON while treating empty schedules as daily.
 */
function isStaffWorkingDay(workDays: Prisma.JsonValue, bookingDate: Date) {
  const dayIndex = bookingDate.getUTCDay();
  const dayName = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][dayIndex];

  if (!workDays || typeof workDays !== "object") {
    return true;
  }

  if (Array.isArray(workDays)) {
    return (
      workDays.length === 0 ||
      workDays.some((value) => value === dayIndex || value === dayName)
    );
  }

  const values = Object.entries(workDays);

  if (values.length === 0) {
    return true;
  }

  return Boolean(
    workDays[dayName] ??
      workDays[String(dayIndex)] ??
      workDays[dayName.slice(0, 3)],
  );
}

/**
 * Parses query parameters with booking-owned validation error codes.
 */
function parseBookingQuery<T>(request: Request, schema: ZodType<T>) {
  const url = new URL(request.url);
  const parsed = schema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return {
      data: null,
      error: bookingError({
        code: BOOKING_CODES.VALIDATION_ERROR,
        message: getBookingValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return {
    data: parsed.data,
    error: null,
  };
}

/**
 * Parses JSON bodies with booking-owned validation error codes.
 */
async function parseBookingBody<T>(request: Request, schema: ZodType<T>) {
  const body = await readJsonBody(request);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      data: null,
      error: bookingError({
        code: BOOKING_CODES.VALIDATION_ERROR,
        message: getBookingValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return {
    data: parsed.data,
    error: null,
  };
}

/**
 * Reads JSON safely so malformed bodies become validation responses.
 */
async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Keeps validation responses focused on the first actionable booking field.
 */
function getBookingValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? BOOKING_MESSAGES.VALIDATION_ERROR;
}

/**
 * Selects all fields needed for the public booking resource.
 */
function bookingSelect() {
  return {
    addOns: {
      select: {
        addOn: {
          select: {
            id: true,
            nameEn: true,
            nameHi: true,
          },
        },
        lineTotal: true,
        quantity: true,
        unitPrice: true,
      },
    },
    advanceAmount: true,
    bookingDate: true,
    branch: {
      select: {
        city: true,
        id: true,
        nameEn: true,
        nameHi: true,
      },
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
    service: {
      select: {
        id: true,
        nameEn: true,
        nameHi: true,
      },
    },
    serviceVariant: {
      select: {
        id: true,
        nameEn: true,
        nameHi: true,
      },
    },
    slotEnd: true,
    slotStart: true,
    staff: {
      select: {
        id: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    },
    status: true,
    totalAmount: true,
    updatedAt: true,
  } satisfies Prisma.BookingSelect;
}

/**
 * Selects schedule fields required for slot calculation.
 */
function staffSelect() {
  return {
    id: true,
    workDays: true,
    workEnd: true,
    workStart: true,
  } satisfies Prisma.StaffSelect;
}

/**
 * Creates the empty slot payload used for closed or out-of-horizon days.
 */
function emptySlotsPayload(
  input: ListBookingSlotsQueryInput,
  options: {
    closedReason: string;
    durationMinutes: number;
    isClosed: boolean;
  },
) {
  return {
    branchId: input.branchId,
    closedReason: options.closedReason,
    date: input.date,
    durationMinutes: options.durationMinutes,
    isClosed: options.isClosed,
    serviceId: input.serviceId,
    serviceVariantId: input.serviceVariantId ?? null,
    staffId: input.staffId ?? null,
    slots: [],
  };
}

/**
 * Ensures customers change only bookings that are still operationally editable.
 */
function assertCustomerEditableStatus(status: BookingStatus) {
  if (CUSTOMER_EDITABLE_STATUSES.includes(status)) {
    return;
  }

  throw new BookingVisibleError(
    BOOKING_CODES.INVALID_STATUS_TRANSITION,
    BOOKING_MESSAGES.INVALID_STATUS_TRANSITION,
    HTTP_STATUS.CONFLICT,
  );
}

/**
 * Converts expected booking write failures into user-safe API responses.
 */
function handleBookingWriteError(
  error: unknown,
  input: {
    failureCode: string;
    failureMessage: string;
    handler: string;
    userId: string;
  },
) {
  if (error instanceof BookingVisibleError) {
    return bookingError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }

  console.error(input.failureCode, {
    error,
    handler: input.handler,
    userId: input.userId,
  });

  return bookingError({
    code: input.failureCode,
    message: input.failureMessage,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Creates a compact human-facing booking identifier.
 */
function createDisplayId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `NR${date}${suffix}`;
}

/**
 * Converts a Date-only string into the UTC date shape used by Prisma @db.Date.
 */
function toDateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

/**
 * Extracts UTC HH:mm from Prisma @db.Time values.
 */
function toTimeMinutes(value: Date) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

/**
 * Parses HH:mm or HH:mm:ss into minutes after midnight.
 */
function parseTimeMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");

  return Number(hours) * 60 + Number(minutes);
}

/**
 * Converts minutes after midnight into a Prisma @db.Time-compatible Date.
 */
function toTimeDate(minutes: number) {
  const date = new Date("1970-01-01T00:00:00.000Z");
  date.setUTCMinutes(minutes);

  return date;
}

/**
 * Combines a date-only value and minutes after midnight into a Date.
 */
function withMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Creates the absolute UTC day window for leave overlap queries.
 */
function getDayWindow(date: Date) {
  return {
    end: withMinutes(date, 24 * 60),
    start: date,
  };
}

/**
 * Returns true when two absolute time ranges overlap.
 */
function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  return startA < endB && startB < endA;
}

/**
 * Formats a Date as YYYY-MM-DD for date-only comparisons.
 */
function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Carries expected booking errors across transaction boundaries.
 */
class BookingVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
