import {
  PORTFOLIO_CODES,
  PORTFOLIO_MESSAGES,
} from "@/features/portfolio/constants/portfolio.constants";
import { portfolioError } from "@/features/portfolio/responses/portfolio.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { PortfolioVisibleError } from "./portfolio.shared";

/**
 * Converts expected and unexpected portfolio failures into user-safe responses.
 */
export function handlePortfolioError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof PortfolioVisibleError) {
    return portfolioError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return portfolioError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws a not-found error when an admin portfolio item cannot be loaded.
 */
export function throwPortfolioNotFound(): never {
  throw new PortfolioVisibleError(
    PORTFOLIO_CODES.PORTFOLIO_NOT_FOUND,
    PORTFOLIO_MESSAGES.PORTFOLIO_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
