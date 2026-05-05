type BranchHolidayRow = {
  branchId: string;
  createdAt: Date;
  date: Date;
  id: string;
  isClosed: boolean;
  reasonEn: string | null;
  reasonHi: string | null;
};

/**
 * Converts a BranchHoliday row into the admin holiday API shape.
 */
export function toPublicBranchHoliday(holiday: BranchHolidayRow) {
  return {
    branchId: holiday.branchId,
    createdAt: holiday.createdAt,
    date: holiday.date,
    id: holiday.id,
    isClosed: holiday.isClosed,
    reasonEn: holiday.reasonEn,
    reasonHi: holiday.reasonHi,
  };
}
