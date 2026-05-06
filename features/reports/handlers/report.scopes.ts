import { getDb } from "@/db";
import {
  REPORT_CODES,
  REPORT_MESSAGES,
} from "@/features/reports/constants/report.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ReportVisibleError, type ReportAdminUser } from "./report.shared";

/**
 * Resolves branch scope for admin report queries.
 */
export async function resolveReportScope(
  requestedBranchId: string | undefined,
  admin: ReportAdminUser,
) {
  if (admin.role !== "SUPER_ADMIN") {
    if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
      return admin.branchId;
    }
    throwForbidden();
  }
  if (!requestedBranchId) return undefined;
  await assertReportBranch(requestedBranchId);
  return requestedBranchId;
}

/**
 * Builds created-at range filters for timestamped models.
 */
export function dateTimeRange(input: { from?: string; to?: string }) {
  return {
    gte: input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined,
    lte: input.to ? new Date(`${input.to}T23:59:59.999Z`) : undefined,
  };
}

/**
 * Builds date-only range filters for @db.Date fields.
 */
export function dateOnlyRange(input: { from?: string; to?: string }) {
  return {
    gte: input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined,
    lte: input.to ? new Date(`${input.to}T00:00:00.000Z`) : undefined,
  };
}

/**
 * Verifies a branch exists before super-admin report filtering.
 */
async function assertReportBranch(branchId: string) {
  const branch = await getDb().branch.findUnique({
    select: { id: true },
    where: { id: branchId },
  });
  if (branch) return;
  throw new ReportVisibleError(
    REPORT_CODES.REPORT_BRANCH_NOT_FOUND,
    REPORT_MESSAGES.REPORT_BRANCH_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Throws a forbidden report access error.
 */
function throwForbidden(): never {
  throw new ReportVisibleError(
    REPORT_CODES.FORBIDDEN,
    REPORT_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
