/**
 * Purpose: Staff mapper utilities for API-safe response shapes.
 * Responsibilities: convert Prisma rows into serializable public/admin staff objects.
 * Important notes: Prisma Decimal and @db.Time fields are converted to strings for UI use.
 */
type DecimalLike = {
  toString(): string;
};

type StaffRow = {
  bioEn: string | null;
  bioHi: string | null;
  branch: {
    city: string;
    id: string;
    nameEn: string | null;
    nameHi: string;
  };
  branchId: string;
  createdAt: Date;
  experienceYears: number | null;
  id: string;
  isAvailable: boolean;
  photoUrl: string | null;
  rating: DecimalLike;
  services?: Array<{
    service: {
      id: string;
      nameEn: string;
      nameHi: string;
    };
  }>;
  specialization: string[];
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
  };
  workDays: unknown;
  workEnd: Date;
  workStart: Date;
};

/**
 * Converts a staff row into the public staff API shape.
 */
export function toPublicStaff(staff: StaffRow) {
  return {
    bioEn: staff.bioEn,
    bioHi: staff.bioHi,
    branch: staff.branch,
    branchId: staff.branchId,
    createdAt: staff.createdAt,
    experienceYears: staff.experienceYears,
    id: staff.id,
    isAvailable: staff.isAvailable,
    name: staff.user.name,
    photoUrl: staff.photoUrl,
    rating: staff.rating.toString(),
    services: staff.services?.map((row) => row.service) ?? [],
    specialization: staff.specialization,
    updatedAt: staff.updatedAt,
    userId: staff.user.id,
    workDays: staff.workDays,
    workEnd: toTimeString(staff.workEnd),
    workStart: toTimeString(staff.workStart),
  };
}

/**
 * Formats Prisma @db.Time values as HH:mm:ss.
 */
function toTimeString(value: Date) {
  return `${String(value.getUTCHours()).padStart(2, "0")}:${String(
    value.getUTCMinutes(),
  ).padStart(2, "0")}:00`;
}
