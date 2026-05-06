import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  EXPENSE_CODES,
  EXPENSE_MESSAGES,
} from "@/features/expenses/constants/expense.constants";
import { expenseError } from "@/features/expenses/responses/expense.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type ExpenseAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach expense handlers.
 */
export async function requireExpenseAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: expenseError({
        code: EXPENSE_CODES.FORBIDDEN,
        message: EXPENSE_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with expense-owned validation errors.
 */
export async function parseExpenseBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: expenseError({
        code: EXPENSE_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? EXPENSE_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected expense errors across helper boundaries.
 */
export class ExpenseVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
