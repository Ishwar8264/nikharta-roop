import {
  EXPENSE_CODES,
  EXPENSE_MESSAGES,
} from "@/features/expenses/constants/expense.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ExpenseVisibleError } from "./expense.shared";

/**
 * Resolves admin branch scope for list endpoints.
 */
export function resolveExpenseBranch(
  requestedBranchId: string | undefined,
  admin: { branchId?: string | null; role: string },
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throw new ExpenseVisibleError(
    EXPENSE_CODES.FORBIDDEN,
    EXPENSE_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
