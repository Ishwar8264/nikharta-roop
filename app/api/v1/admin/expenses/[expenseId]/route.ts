import { handleUpdateExpense } from "@/features/expenses/handlers/expense.handlers";

export const runtime = "nodejs";

type AdminExpenseRouteContext = {
  params: Promise<{ expenseId: string }>;
};

/**
 * Routes admin expense patch requests to the expenses feature handler.
 */
export async function PATCH(request: Request, context: AdminExpenseRouteContext) {
  const { expenseId } = await context.params;
  return handleUpdateExpense(request, expenseId);
}
