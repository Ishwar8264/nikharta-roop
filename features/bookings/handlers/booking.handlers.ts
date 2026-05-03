import { BookingStatus, type Prisma } from "@prisma/client";
import type { ZodError, ZodType } from "zod";

import { getDb } from "@/db";
import {
  BOOKING_CODES,
  BOOKING_MESSAGES,
} from "@/features/bookings/constants/booking.constants";
import { toPublicBookingSlot } from "@/features/bookings/helpers/booking.mapper";
import {
  bookingError,
  bookingJson,
} from "@/features/bookings/responses/booking.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  listBookingSlotsQuerySchema,
  type ListBookingSlotsQueryInput,
} from "@/schema/bookings/schema.booking";

const BOOKING_SLOT_STEP_MINUTES = 30;
const BOOKING_MIN_ADVANCE_MINUTES = 120;
const BOOKING_MAX_ADVANCE_DAYS = 60;
const BLOCKING_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
];

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
 * Keeps validation responses focused on the first actionable booking field.
 */
function getBookingValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? BOOKING_MESSAGES.VALIDATION_ERROR;
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
