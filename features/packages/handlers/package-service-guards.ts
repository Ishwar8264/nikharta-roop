import { getDb } from "@/db";
import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { PackageVisibleError } from "./package.shared";

/**
 * Blocks branch moves that would leave attached services from another branch.
 */
export async function assertExistingPackageServicesMatchBranch(
  packageId: string,
  branchId: string,
) {
  const mismatched = await getDb().packageService.findFirst({
    select: { serviceId: true },
    where: {
      packageId,
      service: { branchId: { not: branchId } },
    },
  });
  if (mismatched) {
    throw new PackageVisibleError(
      PACKAGE_CODES.SERVICE_NOT_FOUND,
      PACKAGE_MESSAGES.SERVICE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
}
