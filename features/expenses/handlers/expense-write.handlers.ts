import { getDb } from "@/db";
import {
  EXPENSE_CODES,
  EXPENSE_MESSAGES,
} from "@/features/expenses/constants/expense.constants";
import { expenseSelect } from "@/features/expenses/helpers/expense.selectors";
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "@/schema/expenses/schema.expense";
import { handleExpenseError, throwExpenseNotFound } from "./expense.errors";
import {
  assertActiveExpenseBranch,
  assertCanManageExpenseBranch,
  loadManageableExpense,
} from "./expense.guards";
import {
  parseExpenseBody,
  requireExpenseAdmin,
  type ExpenseAdminUser,
} from "./expense.shared";
import { expenseWriteResponse } from "./expense-write.responses";

/**
 * Handles admin expense creation requests.
 */
export async function handleCreateExpense(request: Request) {
  const auth = await requireExpenseAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseExpenseBody(request, createExpenseSchema);
  if (body.error) return body.error;
  return createExpense(body.data, auth.session.user);
}

/**
 * Handles admin expense patch requests.
 */
export async function handleUpdateExpense(request: Request, expenseId: string) {
  const auth = await requireExpenseAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseExpenseBody(request, updateExpenseSchema);
  if (body.error) return body.error;
  return updateExpense(expenseId, body.data, auth.session.user);
}

/**
 * Creates one expense after branch ownership validation.
 */
async function createExpense(input: CreateExpenseInput, admin: ExpenseAdminUser) {
  try {
    assertCanManageExpenseBranch(admin, input.branchId);
    await assertActiveExpenseBranch(input.branchId);
    const expense = await getDb().expense.create({
      data: { ...input, createdById: admin.id },
      select: expenseSelect(),
    });
    return expenseWriteResponse(expense, EXPENSE_CODES.EXPENSE_CREATED);
  } catch (error) {
    return handleExpenseError(error, {
      code: EXPENSE_CODES.EXPENSE_CREATE_FAILED,
      handler: "createExpense",
      message: EXPENSE_MESSAGES.EXPENSE_CREATE_FAILED,
    });
  }
}

/**
 * Updates one expense while preserving branch ownership.
 */
async function updateExpense(
  expenseId: string,
  input: UpdateExpenseInput,
  admin: ExpenseAdminUser,
) {
  try {
    const current = await loadManageableExpense(expenseId, admin);
    if (!current) throwExpenseNotFound();
    const branchId = input.branchId ?? current.branchId;
    assertCanManageExpenseBranch(admin, branchId);
    await assertActiveExpenseBranch(branchId);
    const expense = await getDb().expense.update({
      data: input,
      select: expenseSelect(),
      where: { id: expenseId },
    });
    return expenseWriteResponse(expense, EXPENSE_CODES.EXPENSE_UPDATED);
  } catch (error) {
    return handleExpenseError(error, {
      code: EXPENSE_CODES.EXPENSE_UPDATE_FAILED,
      handler: "updateExpense",
      message: EXPENSE_MESSAGES.EXPENSE_UPDATE_FAILED,
    });
  }
}
