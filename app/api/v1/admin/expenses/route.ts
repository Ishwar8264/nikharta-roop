export const runtime = "nodejs";

/**
 * Routes admin expense list and create requests to feature handlers.
 */
export {
  handleCreateExpense as POST,
  handleListExpenses as GET,
} from "@/features/expenses/handlers/expense.handlers";
