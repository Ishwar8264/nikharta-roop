import {
  EXPENSE_CODES,
  EXPENSE_MESSAGES,
} from "@/features/expenses/constants/expense.constants";
import { expenseError } from "@/features/expenses/responses/expense.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ExpenseVisibleError } from "./expense.shared";

/**
 * Converts expected and unexpected expense failures into safe responses.
 */
export function handleExpenseError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof ExpenseVisibleError) {
    return expenseError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return expenseError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws an expense not-found error.
 */
export function throwExpenseNotFound(): never {
  throw new ExpenseVisibleError(
    EXPENSE_CODES.EXPENSE_NOT_FOUND,
    EXPENSE_MESSAGES.EXPENSE_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
