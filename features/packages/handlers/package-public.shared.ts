import type { ZodType } from "zod";

import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import { packageError } from "@/features/packages/responses/package.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses public package query parameters.
 */
export function parsePackageQuery<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return {
      data: null,
      error: packageError({
        code: PACKAGE_CODES.VALIDATION_ERROR,
        message:
          parsed.error.issues[0]?.message ?? PACKAGE_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Converts unexpected public package failures into user-safe responses.
 */
export function handlePublicPackageError(error: unknown, code: string) {
  console.error(code, { error });
  return packageError({
    code,
    message:
      code === PACKAGE_CODES.PACKAGE_LOAD_FAILED
        ? PACKAGE_MESSAGES.PACKAGE_LOAD_FAILED
        : PACKAGE_MESSAGES.PACKAGES_LOAD_FAILED,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}
