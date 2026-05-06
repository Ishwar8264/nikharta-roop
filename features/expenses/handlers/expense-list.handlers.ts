import { getDb } from "@/db";
import {
  EXPENSE_CODES,
  EXPENSE_MESSAGES,
} from "@/features/expenses/constants/expense.constants";
import { expenseSelect } from "@/features/expenses/helpers/expense.selectors";
import {
  listExpensesQuerySchema,
  type ListExpensesQueryInput,
} from "@/schema/expenses/schema.expense";
import { handleExpenseError } from "./expense.errors";
import { expenseListResponse, parseExpenseQuery } from "./expense-list.shared";
import { requireExpenseAdmin } from "./expense.shared";
import { resolveExpenseBranch } from "./expense.relations";

/**
 * Handles admin expense listing requests.
 */
export async function handleListExpenses(request: Request) {
  const auth = await requireExpenseAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseExpenseQuery(request, listExpensesQuerySchema);
  if (!query.success) return query.error;
  return listExpenses(query.data, auth.session.user);
}

/**
 * Lists expenses with branch-admin scoping and date filters.
 */
async function listExpenses(
  input: ListExpensesQueryInput,
  admin: { branchId?: string | null; role: string },
) {
  try {
    const branchId = resolveExpenseBranch(input.branchId, admin);
    const expenses = await getDb().expense.findMany({
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      select: expenseSelect(),
      take: input.limit,
      where: {
        branchId,
        category: input.category,
        expenseDate: expenseDateRange(input),
      },
    });
    return expenseListResponse(expenses, input.limit);
  } catch (error) {
    return handleExpenseError(error, {
      code: EXPENSE_CODES.EXPENSE_LOAD_FAILED,
      handler: "listExpenses",
      message: EXPENSE_MESSAGES.EXPENSE_LOAD_FAILED,
    });
  }
}

/**
 * Builds optional expense date range filters.
 */
function expenseDateRange(input: ListExpensesQueryInput) {
  return {
    gte: input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined,
    lte: input.to ? new Date(`${input.to}T00:00:00.000Z`) : undefined,
  };
}
