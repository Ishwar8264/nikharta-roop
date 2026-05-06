import { getDb } from "@/db";
import {
  EXPENSE_CODES,
  EXPENSE_MESSAGES,
} from "@/features/expenses/constants/expense.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ExpenseVisibleError, type ExpenseAdminUser } from "./expense.shared";

/**
 * Ensures branch admins only manage their assigned branch.
 */
export function assertCanManageExpenseBranch(
  admin: ExpenseAdminUser,
  branchId: string,
) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;
  throw new ExpenseVisibleError(
    EXPENSE_CODES.FORBIDDEN,
    EXPENSE_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Verifies the target branch is active before expense writes.
 */
export async function assertActiveExpenseBranch(branchId: string) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });
  if (branch) return;
  throw new ExpenseVisibleError(
    EXPENSE_CODES.BRANCH_NOT_FOUND,
    EXPENSE_MESSAGES.BRANCH_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Loads one expense and validates branch ownership.
 */
export async function loadManageableExpense(
  expenseId: string,
  admin: ExpenseAdminUser,
) {
  const expense = await getDb().expense.findUnique({
    select: { branchId: true, id: true },
    where: { id: expenseId },
  });
  if (!expense) return null;
  assertCanManageExpenseBranch(admin, expense.branchId);
  return expense;
}
