import { getDb } from "@/db";
import {
  SERVICE_CODES,
  SERVICE_MESSAGES,
} from "@/features/services/constants/service.constants";
import { toPublicServiceDetail } from "@/features/services/helpers/service.mapper";
import { serviceDetailSelect } from "@/features/services/helpers/service.selectors";
import {
  serviceError,
  serviceJson,
} from "@/features/services/responses/service.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createServiceSchema,
  type CreateServiceInput,
  updateServiceSchema,
  type UpdateServiceInput,
} from "@/schema/services/schema.service";
import {
  activeBranchExists,
  assertCanManageBranch,
  canUseServiceSlug,
  handleServiceWriteError,
  parseServiceJsonBody,
  requireServiceAdmin,
  toServiceCreateData,
  toServiceUpdateData,
  type ServiceAdminUser,
} from "./service-admin.shared";

/**
 * Handles admin service creation.
 */
export async function handleCreateAdminService(request: Request) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(request, createServiceSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createAdminService(parsedBody.data, auth.session.user);
}

/**
 * Handles admin service updates.
 */
export async function handleUpdateAdminService(
  request: Request,
  serviceId: string,
) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(request, updateServiceSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return updateAdminService(serviceId, parsedBody.data, auth.session.user);
}

/**
 * Creates a service under an active branch/category pair.
 */
async function createAdminService(
  input: CreateServiceInput,
  adminUser: ServiceAdminUser,
) {
  try {
    assertCanManageBranch(adminUser, input.branchId);

    const category = await getDb().serviceCategory.findFirst({
      select: {
        id: true,
      },
      where: {
        id: input.categoryId,
        isActive: true,
        OR: [{ branchId: null }, { branchId: input.branchId }],
      },
    });

    if (!category || !(await activeBranchExists(input.branchId))) {
      return serviceError({
        code: category ? SERVICE_CODES.BRANCH_NOT_FOUND : SERVICE_CODES.CATEGORY_NOT_FOUND,
        message: category
          ? SERVICE_MESSAGES.BRANCH_NOT_FOUND
          : SERVICE_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (!(await canUseServiceSlug(input.branchId, input.slug))) {
      return serviceError({
        code: SERVICE_CODES.SERVICE_DUPLICATE,
        message: SERVICE_MESSAGES.SERVICE_DUPLICATE,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    const service = await getDb().service.create({
      data: toServiceCreateData(input),
      select: serviceDetailSelect(false),
    });

    return serviceJson({
      code: SERVICE_CODES.SERVICE_CREATED,
      data: {
        service: toPublicServiceDetail(service),
      },
      message: SERVICE_MESSAGES.SERVICE_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.SERVICE_CREATE_FAILED,
      failureMessage: SERVICE_MESSAGES.SERVICE_CREATE_FAILED,
      handler: "createAdminService",
    });
  }
}

/**
 * Updates one service while enforcing branch ownership and slug uniqueness.
 */
async function updateAdminService(
  serviceId: string,
  input: UpdateServiceInput,
  adminUser: ServiceAdminUser,
) {
  try {
    const existingService = await getDb().service.findUnique({
      select: {
        branchId: true,
        categoryId: true,
        id: true,
        slug: true,
      },
      where: {
        id: serviceId,
      },
    });

    if (!existingService) {
      return serviceError({
        code: SERVICE_CODES.SERVICE_NOT_FOUND,
        message: SERVICE_MESSAGES.SERVICE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    assertCanManageBranch(adminUser, existingService.branchId);

    const nextBranchId = input.branchId ?? existingService.branchId;
    const nextCategoryId = input.categoryId ?? existingService.categoryId;
    const nextSlug = input.slug ?? existingService.slug;

    assertCanManageBranch(adminUser, nextBranchId);

    const category = await getDb().serviceCategory.findFirst({
      select: {
        id: true,
      },
      where: {
        id: nextCategoryId,
        isActive: true,
        OR: [{ branchId: null }, { branchId: nextBranchId }],
      },
    });

    if (!category || !(await activeBranchExists(nextBranchId))) {
      return serviceError({
        code: category ? SERVICE_CODES.BRANCH_NOT_FOUND : SERVICE_CODES.CATEGORY_NOT_FOUND,
        message: category
          ? SERVICE_MESSAGES.BRANCH_NOT_FOUND
          : SERVICE_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (!(await canUseServiceSlug(nextBranchId, nextSlug, serviceId))) {
      return serviceError({
        code: SERVICE_CODES.SERVICE_DUPLICATE,
        message: SERVICE_MESSAGES.SERVICE_DUPLICATE,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    const service = await getDb().service.update({
      data: toServiceUpdateData(input),
      select: serviceDetailSelect(false),
      where: {
        id: serviceId,
      },
    });

    return serviceJson({
      code: SERVICE_CODES.SERVICE_UPDATED,
      data: {
        service: toPublicServiceDetail(service),
      },
      message: SERVICE_MESSAGES.SERVICE_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.SERVICE_UPDATE_FAILED,
      failureMessage: SERVICE_MESSAGES.SERVICE_UPDATE_FAILED,
      handler: "updateAdminService",
    });
  }
}
