/**
 * Purpose: Admin package listing and detail handlers.
 * Responsibilities: expose protected package management reads with branch scope and status filters.
 * Important notes: list responses include attached services so admin cards can show package composition.
 */
import { getDb } from "@/db";
import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import { toPublicPackageDetail } from "@/features/packages/helpers/package.mapper";
import { packageDetailSelect } from "@/features/packages/helpers/package.selectors";
import {
  packageError,
  packageJson,
} from "@/features/packages/responses/package.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  listAdminPackagesQuerySchema,
  type ListAdminPackagesQueryInput,
} from "@/schema/packages/schema.package";
import { handlePackageWriteError } from "./package-admin-errors";
import {
  requirePackageAdmin,
  resolvePackageAdminBranchFilter,
  type PackageAdminUser,
} from "./package.shared";

/**
 * Handles admin package listing including inactive packages.
 */
export async function handleListAdminPackages(request: Request) {
  const auth = await requirePackageAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseAdminPackageQuery(request);
  if (query.error) return query.error;
  return listAdminPackages(query.data, auth.session.user);
}

/**
 * Lists packages visible to the authenticated admin.
 */
async function listAdminPackages(
  input: ListAdminPackagesQueryInput,
  admin: PackageAdminUser,
) {
  try {
    const branchId = resolvePackageAdminBranchFilter(input.branchId, admin);
    const packages = await getDb().package.findMany({
      orderBy: [{ branch: { city: "asc" } }, { price: "asc" }, { nameHi: "asc" }],
      select: packageDetailSelect(false),
      take: input.limit,
      where: {
        branchId,
        isActive:
          input.status === "active"
            ? true
            : input.status === "inactive"
              ? false
              : undefined,
      },
    });

    return packageJson({
      code: PACKAGE_CODES.PACKAGES_LISTED,
      data: {
        limit: input.limit,
        packages: packages.map(toPublicPackageDetail),
      },
      message: PACKAGE_MESSAGES.PACKAGES_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handlePackageWriteError(error, {
      failureCode: PACKAGE_CODES.PACKAGES_LOAD_FAILED,
      failureMessage: PACKAGE_MESSAGES.PACKAGES_LOAD_FAILED,
      handler: "listAdminPackages",
    });
  }
}

/**
 * Parses admin package query strings with package-owned validation errors.
 */
function parseAdminPackageQuery(request: Request) {
  const parsed = listAdminPackagesQuerySchema.safeParse(
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
