import { getDb } from "@/db";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
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
import {
  createBranchSchema,
  type CreateBranchInput,
  updateBranchSchema,
  type UpdateBranchInput,
} from "@/schema/branches/schema.branch";
import { z, type ZodError } from "zod";

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
 * Handles admin branch creation.
 */
export async function handleCreateBranch(request: Request) {
  const auth = await requireBranchAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseBranchJsonBody(request, createBranchSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createBranch(parsedBody.data);
}

/**
 * Handles admin branch listing including inactive records.
 */
export async function handleAdminListBranches(request: Request) {
  const auth = await requireBranchAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  return adminListBranches(auth.session.user);
}

/**
 * Handles admin branch detail loading including inactive records.
 */
export async function handleAdminGetBranch(request: Request, branchId: string) {
  const auth = await requireBranchAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  return adminGetBranch(branchId, auth.session.user);
}

/**
 * Handles admin branch updates.
 */
export async function handleUpdateBranch(request: Request, branchId: string) {
  const auth = await requireBranchAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseBranchJsonBody(request, updateBranchSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return updateBranch(branchId, parsedBody.data, auth.session.user);
}

/**
 * Lists branches visible to the authenticated admin.
 */
async function adminListBranches(adminUser: BranchAdminUser) {
  try {
    const branches = await getDb().branch.findMany({
      orderBy: [{ city: "asc" }, { nameHi: "asc" }],
      select: branchSelect(),
      where: branchAdminWhere(adminUser),
    });

    return branchJson({
      code: BRANCH_CODES.BRANCHES_LISTED,
      data: { branches: branches.map(toPublicBranch) },
      message: BRANCH_MESSAGES.BRANCHES_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(BRANCH_CODES.BRANCHES_LOAD_FAILED, {
      error,
      handler: "adminListBranches",
    });

    return branchError({
      code: BRANCH_CODES.BRANCHES_LOAD_FAILED,
      message: BRANCH_MESSAGES.BRANCHES_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Loads one branch after validating admin branch scope.
 */
async function adminGetBranch(branchId: string, adminUser: BranchAdminUser) {
  try {
    if (!canManageBranch(adminUser, branchId)) {
      return branchError({
        code: BRANCH_CODES.FORBIDDEN,
        message: BRANCH_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      });
    }

    const branch = await getDb().branch.findUnique({
      select: branchSelect(),
      where: { id: branchId },
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
      data: { branch: toPublicBranch(branch) },
      message: BRANCH_MESSAGES.BRANCH_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(BRANCH_CODES.BRANCH_LOAD_FAILED, {
      branchId,
      error,
      handler: "adminGetBranch",
    });

    return branchError({
      code: BRANCH_CODES.BRANCH_LOAD_FAILED,
      message: BRANCH_MESSAGES.BRANCH_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
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
 * Creates a branch and returns the generated branch id.
 */
async function createBranch(input: CreateBranchInput) {
  try {
    const duplicateBranch = await findDuplicateBranch(input);

    if (duplicateBranch) {
      return branchError({
        code: BRANCH_CODES.BRANCH_DUPLICATE,
        message: BRANCH_MESSAGES.BRANCH_DUPLICATE,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    const branch = await getDb().branch.create({
      data: input,
      select: branchSelect(),
    });

    return branchJson({
      code: BRANCH_CODES.BRANCH_CREATED,
      data: {
        branchId: branch.id,
        branch: toPublicBranch(branch),
      },
      message: BRANCH_MESSAGES.BRANCH_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    console.error(BRANCH_CODES.BRANCH_CREATE_FAILED, {
      error,
      handler: "createBranch",
    });

    return branchError({
      code: BRANCH_CODES.BRANCH_CREATE_FAILED,
      message: BRANCH_MESSAGES.BRANCH_CREATE_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Updates one branch by id.
 */
async function updateBranch(
  branchId: string,
  input: UpdateBranchInput,
  adminUser: BranchAdminUser,
) {
  try {
    const existingBranch = await getDb().branch.findUnique({
      select: {
        city: true,
        closeTime: true,
        id: true,
        nameHi: true,
        openTime: true,
        phone: true,
      },
      where: {
        id: branchId,
      },
    });

    if (!existingBranch) {
      return branchError({
        code: BRANCH_CODES.BRANCH_NOT_FOUND,
        message: BRANCH_MESSAGES.BRANCH_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (!canManageBranch(adminUser, existingBranch.id)) {
      return branchError({
        code: BRANCH_CODES.FORBIDDEN,
        message: BRANCH_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      });
    }

    const nextOpenTime = input.openTime ?? existingBranch.openTime;
    const nextCloseTime = input.closeTime ?? existingBranch.closeTime;

    if ((input.openTime || input.closeTime) && nextOpenTime >= nextCloseTime) {
      return branchError({
        code: BRANCH_CODES.BRANCH_UPDATE_FAILED,
        message: "Open time must be before close time.",
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      });
    }

    const duplicateBranch = await findDuplicateBranch(
      {
        city: input.city ?? existingBranch.city,
        nameHi: input.nameHi ?? existingBranch.nameHi,
        phone: input.phone ?? existingBranch.phone,
      },
      branchId,
    );

    if (duplicateBranch) {
      return branchError({
        code: BRANCH_CODES.BRANCH_DUPLICATE,
        message: BRANCH_MESSAGES.BRANCH_DUPLICATE,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    const branch = await getDb().branch.update({
      data: input,
      select: branchSelect(),
      where: {
        id: branchId,
      },
    });

    return branchJson({
      code: BRANCH_CODES.BRANCH_UPDATED,
      data: {
        branch: toPublicBranch(branch),
      },
      message: BRANCH_MESSAGES.BRANCH_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(BRANCH_CODES.BRANCH_UPDATE_FAILED, {
      branchId,
      error,
      handler: "updateBranch",
    });

    return branchError({
      code: BRANCH_CODES.BRANCH_UPDATE_FAILED,
      message: BRANCH_MESSAGES.BRANCH_UPDATE_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Parses branch request JSON with branch-owned validation error codes.
 */
async function parseBranchJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const body = await readJsonBody(request);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      data: null,
      error: branchError({
        code: BRANCH_CODES.VALIDATION_ERROR,
        message: getBranchValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return {
    data: parsed.data as z.output<TSchema>,
    error: null,
  };
}

/**
 * Keeps validation responses focused on the first actionable branch field.
 */
function getBranchValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? BRANCH_MESSAGES.VALIDATION_ERROR;
}

/**
 * Finds branches that would create confusing duplicate admin records.
 */
async function findDuplicateBranch(
  input: Pick<CreateBranchInput, "city" | "nameHi" | "phone">,
  ignoredBranchId?: string,
) {
  return getDb().branch.findFirst({
    select: {
      id: true,
    },
    where: {
      id: ignoredBranchId
        ? {
            not: ignoredBranchId,
          }
        : undefined,
      OR: [
        {
          city: {
            equals: input.city,
            mode: "insensitive",
          },
          nameHi: {
            equals: input.nameHi,
            mode: "insensitive",
          },
        },
        {
          phone: input.phone,
        },
      ],
    },
  });
}

/**
 * Allows only admin roles to reach branch management handlers.
 */
async function requireBranchAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth;
  }

  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: branchError({
        code: BRANCH_CODES.FORBIDDEN,
        message: BRANCH_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }

  return auth;
}

/**
 * Branch admins stay limited to their assigned branch; super admins are global.
 */
function canManageBranch(adminUser: BranchAdminUser, branchId: string) {
  return (
    adminUser.role === "SUPER_ADMIN" ||
    !adminUser.branchId ||
    adminUser.branchId === branchId
  );
}

/**
 * Assigned branch admins see one branch; unassigned admins can manage all.
 */
function branchAdminWhere(adminUser: BranchAdminUser) {
  if (adminUser.role === "SUPER_ADMIN" || !adminUser.branchId) return {};

  return { id: adminUser.branchId };
}

type BranchAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Keeps public branch responses from exposing operational relations.
 */
function branchSelect() {
  return {
    address: true,
    city: true,
    closeTime: true,
    createdAt: true,
    googleMapsUrl: true,
    id: true,
    isActive: true,
    latitude: true,
    longitude: true,
    nameEn: true,
    nameHi: true,
    openTime: true,
    phone: true,
    placeId: true,
    updatedAt: true,
  } as const;
}
