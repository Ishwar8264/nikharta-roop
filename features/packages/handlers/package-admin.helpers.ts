import { getDb } from "@/db";
import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import type { AssignPackageServiceInput } from "@/schema/packages/schema.package";
import {
  assertCanManagePackageBranch,
  type PackageAdminUser,
  PackageVisibleError,
} from "./package.shared";

/**
 * Checks branch existence without exposing inactive branches to writes.
 */
export async function activePackageBranchExists(branchId: string) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });
  return Boolean(branch);
}

/**
 * Checks package slug uniqueness inside one branch.
 */
export async function canUsePackageSlug(
  branchId: string,
  slug: string,
  ignoredPackageId?: string,
) {
  const pkg = await getDb().package.findFirst({
    select: { id: true },
    where: {
      branchId,
      id: ignoredPackageId ? { not: ignoredPackageId } : undefined,
      slug,
    },
  });
  return !pkg;
}

/**
 * Verifies package category can be used in the selected branch.
 */
export async function assertPackageCategory(
  categoryId: string | undefined,
  branchId: string,
) {
  if (!categoryId) return;
  const category = await getDb().serviceCategory.findFirst({
    select: { id: true },
    where: {
      id: categoryId,
      isActive: true,
      OR: [{ branchId: null }, { branchId }],
    },
  });
  if (!category) {
    throw new PackageVisibleError(
      PACKAGE_CODES.CATEGORY_NOT_FOUND,
      PACKAGE_MESSAGES.CATEGORY_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
}

/**
 * Verifies all package services belong to the selected active branch.
 */
export async function assertPackageServices(
  services: Array<Pick<AssignPackageServiceInput, "serviceId">>,
  branchId: string,
) {
  if (services.length === 0) return;
  const serviceIds = [...new Set(services.map((service) => service.serviceId))];
  const count = await getDb().service.count({
    where: { branchId, id: { in: serviceIds }, isActive: true },
  });
  if (count !== serviceIds.length) {
    throw new PackageVisibleError(
      PACKAGE_CODES.SERVICE_NOT_FOUND,
      PACKAGE_MESSAGES.SERVICE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
}

/**
 * Loads a package and verifies admin branch ownership.
 */
export async function loadManageablePackage(
  packageId: string,
  admin: PackageAdminUser,
) {
  const pkg = await getDb().package.findUnique({
    select: { branchId: true, categoryId: true, id: true, slug: true },
    where: { id: packageId },
  });
  if (!pkg) {
    throw new PackageVisibleError(
      PACKAGE_CODES.PACKAGE_NOT_FOUND,
      PACKAGE_MESSAGES.PACKAGE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
  assertCanManagePackageBranch(admin, pkg.branchId);
  return pkg;
}
