import { getDb } from "@/db";
import {
  PORTFOLIO_CODES,
  PORTFOLIO_MESSAGES,
} from "@/features/portfolio/constants/portfolio.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import type {
  CreatePortfolioInput,
  UpdatePortfolioInput,
} from "@/schema/portfolio/schema.portfolio";
import { PortfolioVisibleError } from "./portfolio.shared";

type PortfolioRelationsInput = Pick<
  CreatePortfolioInput | UpdatePortfolioInput,
  "packageId" | "serviceId" | "staffId"
>;

/**
 * Verifies optional linked records belong to the selected branch.
 */
export async function assertPortfolioRelations(
  input: PortfolioRelationsInput,
  branchId: string,
) {
  await Promise.all([
    assertPortfolioStaff(input.staffId, branchId),
    assertPortfolioService(input.serviceId, branchId),
    assertPortfolioPackage(input.packageId, branchId),
  ]);
}

/**
 * Ensures selected staff is available inside the selected branch.
 */
async function assertPortfolioStaff(
  staffId: string | null | undefined,
  branchId: string,
) {
  if (!staffId) return;
  const staff = await getDb().staff.findFirst({
    select: { id: true },
    where: { branchId, id: staffId, isAvailable: true },
  });
  if (staff) return;
  throw new PortfolioVisibleError(
    PORTFOLIO_CODES.STAFF_NOT_FOUND,
    PORTFOLIO_MESSAGES.STAFF_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Ensures selected service is active inside the selected branch.
 */
async function assertPortfolioService(
  serviceId: string | null | undefined,
  branchId: string,
) {
  if (!serviceId) return;
  const service = await getDb().service.findFirst({
    select: { id: true },
    where: { branchId, id: serviceId, isActive: true },
  });
  if (service) return;
  throw new PortfolioVisibleError(
    PORTFOLIO_CODES.SERVICE_NOT_FOUND,
    PORTFOLIO_MESSAGES.SERVICE_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Ensures selected package is active inside the selected branch.
 */
async function assertPortfolioPackage(
  packageId: string | null | undefined,
  branchId: string,
) {
  if (!packageId) return;
  const pkg = await getDb().package.findFirst({
    select: { id: true },
    where: { branchId, id: packageId, isActive: true },
  });
  if (pkg) return;
  throw new PortfolioVisibleError(
    PORTFOLIO_CODES.PACKAGE_NOT_FOUND,
    PORTFOLIO_MESSAGES.PACKAGE_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
