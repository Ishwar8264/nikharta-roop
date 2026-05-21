/**
 * Purpose: Admin package update handler.
 * Responsibilities: authenticate admins, validate package patches, preserve branch scope, and update packages.
 * Important notes: independent package basics and existing service checks run together before the write.
 */
import { getDb } from "@/db";
import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import { toPackageUpdateData } from "@/features/packages/helpers/package.data";
import { toPublicPackageDetail } from "@/features/packages/helpers/package.mapper";
import { packageDetailSelect } from "@/features/packages/helpers/package.selectors";
import { packageJson } from "@/features/packages/responses/package.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  updatePackageSchema,
  type UpdatePackageInput,
} from "@/schema/packages/schema.package";
import { assertPackageBasics } from "./package-admin-assertions";
import { handlePackageWriteError } from "./package-admin-errors";
import { loadManageablePackage } from "./package-admin.helpers";
import { assertExistingPackageServicesMatchBranch } from "./package-service-guards";
import {
  assertCanManagePackageBranch,
  parsePackageBody,
  requirePackageAdmin,
  type PackageAdminUser,
} from "./package.shared";

/**
 * Handles admin package updates.
 */
export async function handleUpdateAdminPackage(
  request: Request,
  packageId: string,
) {
  const auth = await requirePackageAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parsePackageBody(request, updatePackageSchema);
  if (body.error) return body.error;
  return updateAdminPackage(packageId, body.data, auth.session.user);
}

async function updateAdminPackage(
  packageId: string,
  input: UpdatePackageInput,
  admin: PackageAdminUser,
) {
  try {
    const current = await loadManageablePackage(packageId, admin);
    const branchId = input.branchId ?? current.branchId;
    const categoryId = input.categoryId ?? current.categoryId ?? undefined;
    const slug = input.slug ?? current.slug;
    assertCanManagePackageBranch(admin, branchId);
    await Promise.all([
      assertPackageBasics(branchId, categoryId, slug, packageId),
      assertExistingPackageServicesMatchBranch(packageId, branchId),
    ]);
    const pkg = await getDb().package.update({
      data: toPackageUpdateData(input),
      select: packageDetailSelect(false),
      where: { id: packageId },
    });
    return packageJson({
      code: PACKAGE_CODES.PACKAGE_UPDATED,
      data: { package: toPublicPackageDetail(pkg) },
      message: PACKAGE_MESSAGES.PACKAGE_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handlePackageWriteError(error, {
      failureCode: PACKAGE_CODES.PACKAGE_UPDATE_FAILED,
      failureMessage: PACKAGE_MESSAGES.PACKAGE_UPDATE_FAILED,
      handler: "updateAdminPackage",
    });
  }
}
