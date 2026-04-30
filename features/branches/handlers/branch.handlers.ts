import { getDb } from "@/db";
import {
  BRANCH_CODES,
  BRANCH_MESSAGES,
} from "@/features/branches/constants/branch.constants";
import { toPublicBranch } from "@/features/branches/helpers/branch.mapper";
import {
  branchError,
  branchJson,
} from "@/features/branches/responses/branch.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Handles public active branch listing for discovery screens.
 */
export async function handleListBranches(request: Request) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city")?.trim();

  return listBranches(city || null);
}

/**
 * Handles public branch detail loading for branch selection.
 */
export async function handleGetBranch(branchId: string) {
  return getBranch(branchId);
}

/**
 * Lists active branches, optionally filtered by city.
 */
async function listBranches(city: string | null) {
  try {
    const branches = await getDb().branch.findMany({
      orderBy: [{ city: "asc" }, { nameHi: "asc" }],
      select: branchSelect(),
      where: {
        city: city
          ? {
              equals: city,
              mode: "insensitive",
            }
          : undefined,
        isActive: true,
      },
    });

    return branchJson({
      code: BRANCH_CODES.BRANCHES_LISTED,
      data: {
        branches: branches.map(toPublicBranch),
      },
      message: BRANCH_MESSAGES.BRANCHES_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(BRANCH_CODES.BRANCHES_LOAD_FAILED, {
      city,
      error,
      handler: "listBranches",
    });

    return branchError({
      code: BRANCH_CODES.BRANCHES_LOAD_FAILED,
      message: BRANCH_MESSAGES.BRANCHES_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Loads one active branch by id.
 */
async function getBranch(branchId: string) {
  try {
    const branch = await getDb().branch.findFirst({
      select: branchSelect(),
      where: {
        id: branchId,
        isActive: true,
      },
    });

    if (!branch) {
      return branchError({
        code: BRANCH_CODES.BRANCH_NOT_FOUND,
        message: BRANCH_MESSAGES.BRANCH_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    return branchJson({
      code: BRANCH_CODES.BRANCH_LOADED,
      data: {
        branch: toPublicBranch(branch),
      },
      message: BRANCH_MESSAGES.BRANCH_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(BRANCH_CODES.BRANCH_LOAD_FAILED, {
      branchId,
      error,
      handler: "getBranch",
    });

    return branchError({
      code: BRANCH_CODES.BRANCH_LOAD_FAILED,
      message: BRANCH_MESSAGES.BRANCH_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Keeps public branch responses from exposing operational relations.
 */
function branchSelect() {
  return {
    address: true,
    city: true,
    closeTime: true,
    googleMapsUrl: true,
    id: true,
    nameEn: true,
    nameHi: true,
    openTime: true,
    phone: true,
    updatedAt: true,
  } as const;
}
