import {
  EXPENSE_CODES,
  EXPENSE_MESSAGES,
} from "@/features/expenses/constants/expense.constants";
import { toPublicExpense } from "@/features/expenses/helpers/expense.mapper";
import { expenseJson } from "@/features/expenses/responses/expense.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Wraps an expense write result in the shared response shape.
 */
export function expenseWriteResponse(
  expense: Parameters<typeof toPublicExpense>[0],
  code: string,
) {
  const created = code === EXPENSE_CODES.EXPENSE_CREATED;
  return expenseJson({
    code,
    data: { expense: toPublicExpense(expense) },
    message: created
      ? EXPENSE_MESSAGES.EXPENSE_CREATED
      : EXPENSE_MESSAGES.EXPENSE_UPDATED,
    status: created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK,
    success: true,
  });
}
