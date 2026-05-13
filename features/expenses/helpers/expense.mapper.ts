import type { Prisma } from "@prisma/client";

import { expenseSelect } from "./expense.selectors";

export type ExpenseRow = Prisma.ExpenseGetPayload<{
  select: ReturnType<typeof expenseSelect>;
}>;

/**
 * Converts an expense row into the admin API shape.
 */
export function toPublicExpense(expense: ExpenseRow) {
  return {
    ...expense,
    amount: expense.amount.toString(),
  };
}
