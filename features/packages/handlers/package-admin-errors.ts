import { packageError } from "@/features/packages/responses/package.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { PackageVisibleError } from "./package.shared";

/**
 * Maps expected package write failures into user-safe API responses.
 */
export function handlePackageWriteError(
  error: unknown,
  input: { failureCode: string; failureMessage: string; handler: string },
) {
  if (error instanceof PackageVisibleError) {
    return packageError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.failureCode, { error, handler: input.handler });
  return packageError({
    code: input.failureCode,
    message: input.failureMessage,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}
