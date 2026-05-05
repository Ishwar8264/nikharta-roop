import { getDb } from "@/db";
import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import {
  toPublicPackage,
  toPublicPackageDetail,
} from "@/features/packages/helpers/package.mapper";
import {
  packageDetailSelect,
  packageSelect,
} from "@/features/packages/helpers/package.selectors";
import {
  packageError,
  packageJson,
} from "@/features/packages/responses/package.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  getPackageQuerySchema,
  type GetPackageQueryInput,
  listPackagesQuerySchema,
  type ListPackagesQueryInput,
} from "@/schema/packages/schema.package";
import {
  handlePublicPackageError,
  parsePackageQuery,
} from "./package-public.shared";

/**
 * Handles public package listing for a selected branch.
 */
export async function handleListPackages(request: Request) {
  const query = parsePackageQuery(request, listPackagesQuerySchema);
  if (query.error) return query.error;
  return listPackages(query.data);
}

export async function handleGetPackage(request: Request, packageId: string) {
  const query = parsePackageQuery(request, getPackageQuerySchema);
  if (query.error) return query.error;
  return getPackage(packageId, query.data);
}

async function listPackages(input: ListPackagesQueryInput) {
  try {
    const packages = await getDb().package.findMany({
      orderBy: [{ price: "asc" }, { nameHi: "asc" }],
      select: packageSelect(),
      take: input.limit,
      where: {
        OR: hasCategoryFilter(input)
          ? undefined
          : [{ categoryId: null }, { category: { isActive: true } }],
        branch: { isActive: true },
        branchId: input.branchId,
        category: hasCategoryFilter(input)
          ? { id: input.categoryId, isActive: true, slug: input.categorySlug }
          : undefined,
        isActive: true,
      },
    });
    return packageJson({
      code: PACKAGE_CODES.PACKAGES_LISTED,
      data: { limit: input.limit, packages: packages.map(toPublicPackage) },
      message: PACKAGE_MESSAGES.PACKAGES_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handlePublicPackageError(error, PACKAGE_CODES.PACKAGES_LOAD_FAILED);
  }
}

async function getPackage(packageId: string, input: GetPackageQueryInput) {
  try {
    const pkg = await getDb().package.findFirst({
      select: packageDetailSelect(),
      where: {
        OR: [{ categoryId: null }, { category: { isActive: true } }],
        branch: { isActive: true },
        branchId: input.branchId,
        id: packageId,
        isActive: true,
      },
    });
    if (!pkg) {
      return packageError({
        code: PACKAGE_CODES.PACKAGE_NOT_FOUND,
        message: PACKAGE_MESSAGES.PACKAGE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }
    return packageJson({
      code: PACKAGE_CODES.PACKAGE_LOADED,
      data: { package: toPublicPackageDetail(pkg) },
      message: PACKAGE_MESSAGES.PACKAGE_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handlePublicPackageError(error, PACKAGE_CODES.PACKAGE_LOAD_FAILED);
  }
}

function hasCategoryFilter(input: ListPackagesQueryInput) {
  return Boolean(input.categoryId || input.categorySlug);
}
