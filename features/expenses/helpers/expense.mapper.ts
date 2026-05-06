type DecimalLike = { toString(): string };

export type ExpenseRow = {
  amount: DecimalLike;
  branch: Record<string, unknown>;
  branchId: string;
  category: string;
  createdAt: Date;
  createdBy: Record<string, unknown> | null;
  createdById: string | null;
  expenseDate: Date;
  id: string;
  notes: string | null;
  receiptUrl: string | null;
  titleHi: string;
  updatedAt: Date;
  vendorName: string | null;
};

/**
 * Converts an expense row into the admin API shape.
 */
export function toPublicExpense(expense: ExpenseRow) {
  return {
    ...expense,
    amount: expense.amount.toString(),
  };
}
