import { z } from "zod";

import {
  EXPENSE_CODES,
  EXPENSE_MESSAGES,
} from "@/features/expenses/constants/expense.constants";
import type { ExpenseRow } from "@/features/expenses/helpers/expense.mapper";
import { toPublicExpense } from "@/features/expenses/helpers/expense.mapper";
import { expenseError, expenseJson } from "@/features/expenses/responses/expense.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses expense query strings with feature-owned validation errors.
 */
export function parseExpenseQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: expenseError({
      code: EXPENSE_CODES.VALIDATION_ERROR,
      message: EXPENSE_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps an expense collection in the shared response shape.
 */
export function expenseListResponse(expenses: ExpenseRow[], limit: number) {
  return expenseJson({
    code: EXPENSE_CODES.EXPENSE_LISTED,
    data: { expenses: expenses.map(toPublicExpense), limit },
    message: EXPENSE_MESSAGES.EXPENSE_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
