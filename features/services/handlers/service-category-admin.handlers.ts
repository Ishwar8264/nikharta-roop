import { getDb } from "@/db";
import {
  SERVICE_CODES,
  SERVICE_MESSAGES,
} from "@/features/services/constants/service.constants";
import { toPublicServiceCategory } from "@/features/services/helpers/service.mapper";
import { serviceCategorySelect } from "@/features/services/helpers/service.selectors";
import {
  serviceError,
  serviceJson,
} from "@/features/services/responses/service.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createServiceCategorySchema,
  type CreateServiceCategoryInput,
  updateServiceCategorySchema,
  type UpdateServiceCategoryInput,
} from "@/schema/services/schema.service";
import {
  activeBranchExists,
  canUseCategorySlug,
  getCategorySlugScope,
  handleServiceWriteError,
  parseServiceJsonBody,
  requireServiceAdmin,
  resolveAdminBranchId,
  assertCanManageBranch,
  ServiceVisibleError,
  type ServiceAdminUser,
} from "./service-admin.shared";

/**
 * Handles admin service category creation.
 */
export async function handleCreateServiceCategory(request: Request) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(
    request,
    createServiceCategorySchema,
  );

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createServiceCategory(parsedBody.data, auth.session.user);
}

/**
 * Handles admin service category updates.
 */
export async function handleUpdateServiceCategory(
  request: Request,
  categoryId: string,
) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(
    request,
    updateServiceCategorySchema,
  );

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return updateServiceCategory(categoryId, parsedBody.data, auth.session.user);
}

/**
 * Creates a service category within the admin user's allowed branch scope.
 */
async function createServiceCategory(
  input: CreateServiceCategoryInput,
  adminUser: ServiceAdminUser,
) {
  try {
    const branchId = resolveAdminBranchId(input.branchId ?? null, adminUser);

    if (branchId && !(await activeBranchExists(branchId))) {
      return serviceError({
        code: SERVICE_CODES.BRANCH_NOT_FOUND,
        message: SERVICE_MESSAGES.BRANCH_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (!(await canUseCategorySlug(branchId, input.slug))) {
      return serviceError({
        code: SERVICE_CODES.CATEGORY_DUPLICATE,
        message: SERVICE_MESSAGES.CATEGORY_DUPLICATE,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    const category = await getDb().serviceCategory.create({
      data: {
        branchId,
        description: input.description ?? null,
        isActive: input.isActive ?? true,
        nameEn: input.nameEn,
        nameHi: input.nameHi,
        slug: input.slug,
        slugScope: getCategorySlugScope(branchId),
        sortOrder: input.sortOrder ?? 0,
      },
      select: serviceCategorySelect(),
    });

    return serviceJson({
      code: SERVICE_CODES.CATEGORY_CREATED,
      data: {
        category: toPublicServiceCategory(category),
      },
      message: SERVICE_MESSAGES.CATEGORY_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    if (error instanceof ServiceVisibleError) {
      return serviceError({
        code: error.code,
        message: error.message,
        status: error.status,
      });
    }

    console.error(SERVICE_CODES.CATEGORY_CREATE_FAILED, {
      error,
      handler: "createServiceCategory",
    });

    return serviceError({
      code: SERVICE_CODES.CATEGORY_CREATE_FAILED,
      message: SERVICE_MESSAGES.CATEGORY_CREATE_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Updates a service category without crossing the admin user's branch scope.
 */
async function updateServiceCategory(
  categoryId: string,
  input: UpdateServiceCategoryInput,
  adminUser: ServiceAdminUser,
) {
  try {
    const existingCategory = await getDb().serviceCategory.findUnique({
      select: {
        branchId: true,
        id: true,
        slug: true,
      },
      where: {
        id: categoryId,
      },
    });

    if (!existingCategory) {
      return serviceError({
        code: SERVICE_CODES.CATEGORY_NOT_FOUND,
        message: SERVICE_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    assertCanManageBranch(adminUser, existingCategory.branchId);

    const nextBranchId =
      input.branchId !== undefined ? input.branchId : existingCategory.branchId;
    const branchId = resolveAdminBranchId(nextBranchId ?? null, adminUser);
    const nextSlug = input.slug ?? existingCategory.slug;

    if (branchId && !(await activeBranchExists(branchId))) {
      return serviceError({
        code: SERVICE_CODES.BRANCH_NOT_FOUND,
        message: SERVICE_MESSAGES.BRANCH_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    if (!(await canUseCategorySlug(branchId, nextSlug, categoryId))) {
      return serviceError({
        code: SERVICE_CODES.CATEGORY_DUPLICATE,
        message: SERVICE_MESSAGES.CATEGORY_DUPLICATE,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    const category = await getDb().serviceCategory.update({
      data: {
        branchId,
        description: input.description,
        isActive: input.isActive,
        nameEn: input.nameEn,
        nameHi: input.nameHi,
        slug: input.slug,
        slugScope: input.branchId !== undefined ? getCategorySlugScope(branchId) : undefined,
        sortOrder: input.sortOrder,
      },
      select: serviceCategorySelect(),
      where: {
        id: categoryId,
      },
    });

    return serviceJson({
      code: SERVICE_CODES.CATEGORY_UPDATED,
      data: {
        category: toPublicServiceCategory(category),
      },
      message: SERVICE_MESSAGES.CATEGORY_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.CATEGORY_UPDATE_FAILED,
      failureMessage: SERVICE_MESSAGES.CATEGORY_UPDATE_FAILED,
      handler: "updateServiceCategory",
    });
  }
}
