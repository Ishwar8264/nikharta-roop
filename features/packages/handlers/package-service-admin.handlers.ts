/**
 * Purpose: Admin package-service assignment handlers.
 * Responsibilities: authenticate package admins, validate service assignment payloads, and update package composition.
 * Important notes: writes wait for package ownership and service-branch validation.
 */
import { getDb } from "@/db";
import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import { toPublicPackageDetail } from "@/features/packages/helpers/package.mapper";
import { packageDetailSelect } from "@/features/packages/helpers/package.selectors";
import { packageJson } from "@/features/packages/responses/package.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { assignPackageServiceSchema } from "@/schema/packages/schema.package";
import {
  assertPackageServices,
  loadManageablePackage,
} from "./package-admin.helpers";
import { handlePackageWriteError } from "./package-admin-errors";
import { parsePackageBody, requirePackageAdmin } from "./package.shared";

/**
 * Handles admin package-service assignment.
 */
export async function handleAssignPackageService(
  request: Request,
  packageId: string,
) {
  const auth = await requirePackageAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parsePackageBody(request, assignPackageServiceSchema);
  if (body.error) return body.error;

  try {
    // Upserting service composition must wait until package ownership and service scope are confirmed.
    // react-doctor-disable-next-line react-doctor/async-parallel
    const pkg = await loadManageablePackage(packageId, auth.session.user);
    await assertPackageServices([body.data], pkg.branchId);
    const updated = await getDb().package.update({
      data: {
        services: {
          upsert: {
            create: body.data,
            update: {
              quantity: body.data.quantity,
              sortOrder: body.data.sortOrder,
            },
            where: {
              packageId_serviceId: {
                packageId,
                serviceId: body.data.serviceId,
              },
            },
          },
        },
      },
      select: packageDetailSelect(false),
      where: { id: packageId },
    });
    return packageJson({
      code: PACKAGE_CODES.PACKAGE_SERVICE_ASSIGNED,
      data: { package: toPublicPackageDetail(updated) },
      message: PACKAGE_MESSAGES.PACKAGE_SERVICE_ASSIGNED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handlePackageWriteError(error, {
      failureCode: PACKAGE_CODES.PACKAGE_SERVICE_ASSIGN_FAILED,
      failureMessage: PACKAGE_MESSAGES.PACKAGE_SERVICE_ASSIGN_FAILED,
      handler: "handleAssignPackageService",
    });
  }
}

/**
 * Handles admin package-service removal.
 */
export async function handleRemovePackageService(
  request: Request,
  packageId: string,
  serviceId: string,
) {
  const auth = await requirePackageAdmin(request);
  if (!auth.success) return auth.error;

  try {
    await loadManageablePackage(packageId, auth.session.user);
    await getDb().packageService.delete({
      where: { packageId_serviceId: { packageId, serviceId } },
    });
    return packageJson({
      code: PACKAGE_CODES.PACKAGE_SERVICE_REMOVED,
      data: { packageId, serviceId },
      message: PACKAGE_MESSAGES.PACKAGE_SERVICE_REMOVED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handlePackageWriteError(error, {
      failureCode: PACKAGE_CODES.PACKAGE_SERVICE_REMOVE_FAILED,
      failureMessage: PACKAGE_MESSAGES.PACKAGE_SERVICE_REMOVE_FAILED,
      handler: "handleRemovePackageService",
    });
  }
}
