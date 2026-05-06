import { ExpenseCategory } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by expense endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Validates money amounts stored by expense rows.
 */
const moneySchema = z.coerce.number().min(0).max(999999.99);

export const listExpensesQuerySchema = z.object({
  branchId: optionalIdSchema,
  category: z.enum(ExpenseCategory).optional(),
  from: z.string().trim().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  to: z.string().trim().date().optional(),
});

const expenseBodySchema = z.object({
  amount: moneySchema,
  branchId: idSchema,
  category: z.enum(ExpenseCategory),
  expenseDate: z.coerce.date(),
  notes: z.string().trim().max(2000).nullable().optional(),
  receiptUrl: z.string().trim().url().max(1000).nullable().optional(),
  titleHi: z.string().trim().min(2).max(200),
  vendorName: z.string().trim().max(200).nullable().optional(),
});

export const createExpenseSchema = expenseBodySchema;
export const updateExpenseSchema = expenseBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one expense field to update." },
);

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ListExpensesQueryInput = z.infer<typeof listExpensesQuerySchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
