import { getDb } from "@/db";
import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import { toPackageCreateData } from "@/features/packages/helpers/package.data";
import { toPublicPackageDetail } from "@/features/packages/helpers/package.mapper";
import { packageDetailSelect } from "@/features/packages/helpers/package.selectors";
import { packageJson } from "@/features/packages/responses/package.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createPackageSchema,
  type CreatePackageInput,
} from "@/schema/packages/schema.package";
import { assertPackageBasics } from "./package-admin-assertions";
import {
  assertPackageServices,
} from "./package-admin.helpers";
import { handlePackageWriteError } from "./package-admin-errors";
import {
  assertCanManagePackageBranch,
  parsePackageBody,
  requirePackageAdmin,
  type PackageAdminUser,
} from "./package.shared";

/**
 * Handles admin package creation.
 */
export async function handleCreateAdminPackage(request: Request) {
  const auth = await requirePackageAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parsePackageBody(request, createPackageSchema);
  if (body.error) return body.error;
  return createAdminPackage(body.data, auth.session.user);
}

async function createAdminPackage(
  input: CreatePackageInput,
  admin: PackageAdminUser,
) {
  try {
    assertCanManagePackageBranch(admin, input.branchId);
    await assertPackageBasics(input.branchId, input.categoryId, input.slug);
    await assertPackageServices(input.services, input.branchId);
    const pkg = await getDb().package.create({
      data: toPackageCreateData(input),
      select: packageDetailSelect(false),
    });
    return packageJson({
      code: PACKAGE_CODES.PACKAGE_CREATED,
      data: { package: toPublicPackageDetail(pkg) },
      message: PACKAGE_MESSAGES.PACKAGE_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handlePackageWriteError(error, {
      failureCode: PACKAGE_CODES.PACKAGE_CREATE_FAILED,
      failureMessage: PACKAGE_MESSAGES.PACKAGE_CREATE_FAILED,
      handler: "createAdminPackage",
    });
  }
}
