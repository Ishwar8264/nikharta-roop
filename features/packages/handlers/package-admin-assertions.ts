import {
  PACKAGE_CODES,
  PACKAGE_MESSAGES,
} from "@/features/packages/constants/package.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  activePackageBranchExists,
  assertPackageCategory,
  canUsePackageSlug,
} from "./package-admin.helpers";
import { PackageVisibleError } from "./package.shared";

/**
 * Verifies branch, category scope, and slug uniqueness for package writes.
 */
export async function assertPackageBasics(
  branchId: string,
  categoryId: string | undefined,
  slug: string,
  ignoredPackageId?: string,
) {
  if (!(await activePackageBranchExists(branchId))) {
    throw new PackageVisibleError(
      PACKAGE_CODES.BRANCH_NOT_FOUND,
      PACKAGE_MESSAGES.BRANCH_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
  await assertPackageCategory(categoryId, branchId);
  if (!(await canUsePackageSlug(branchId, slug, ignoredPackageId))) {
    throw new PackageVisibleError(
      PACKAGE_CODES.PACKAGE_DUPLICATE,
      PACKAGE_MESSAGES.PACKAGE_DUPLICATE,
      HTTP_STATUS.CONFLICT,
    );
  }
}
