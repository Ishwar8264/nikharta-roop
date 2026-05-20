/**
 * Purpose: Shared TypeScript types for package catalog screens.
 * Responsibilities: align query, action, and component contracts with package mapper response shapes.
 * Important notes: detail packages include attached services while public list packages may not.
 */
import type {
  toPublicPackage,
  toPublicPackageDetail,
} from "@/features/packages/helpers/package.mapper";

export type PublicPackage = ReturnType<typeof toPublicPackage>;
export type PublicPackageDetail = ReturnType<typeof toPublicPackageDetail>;

export type PackageListResult = {
  error: string | null;
  packages: PublicPackageDetail[];
};

export type PublicPackageListResult = {
  error: string | null;
  packages: PublicPackage[];
};

export type PackageServiceOption = {
  branchId: string;
  id: string;
  nameHi: string;
};
