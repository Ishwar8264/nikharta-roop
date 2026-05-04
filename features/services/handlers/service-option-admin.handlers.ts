import { Prisma } from "@prisma/client";

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
  createServiceAddOnSchema,
  type CreateServiceAddOnInput,
  createServiceVariantSchema,
  type CreateServiceVariantInput,
  updateServiceAddOnSchema,
  type UpdateServiceAddOnInput,
  updateServiceVariantSchema,
  type UpdateServiceVariantInput,
} from "@/schema/services/schema.service";
import {
  assertManageableService,
  handleServiceWriteError,
  parseServiceJsonBody,
  requireServiceAdmin,
  toServiceAddOnUpdateData,
  toServiceVariantUpdateData,
  type ServiceAdminUser,
} from "./service-admin.shared";

/**
 * Handles admin service variant creation.
 */
export async function handleCreateServiceVariant(
  request: Request,
  serviceId: string,
) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(
    request,
    createServiceVariantSchema,
  );

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createServiceVariant(serviceId, parsedBody.data, auth.session.user);
}

/**
 * Handles admin service variant updates.
 */
export async function handleUpdateServiceVariant(
  request: Request,
  serviceId: string,
  variantId: string,
) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(
    request,
    updateServiceVariantSchema,
  );

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return updateServiceVariant(
    serviceId,
    variantId,
    parsedBody.data,
    auth.session.user,
  );
}

/**
 * Handles admin service add-on creation.
 */
export async function handleCreateServiceAddOn(
  request: Request,
  serviceId: string,
) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(
    request,
    createServiceAddOnSchema,
  );

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createServiceAddOn(serviceId, parsedBody.data, auth.session.user);
}

/**
 * Handles admin service add-on updates.
 */
export async function handleUpdateServiceAddOn(
  request: Request,
  serviceId: string,
  addOnId: string,
) {
  const auth = await requireServiceAdmin(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseServiceJsonBody(
    request,
    updateServiceAddOnSchema,
  );

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return updateServiceAddOn(
    serviceId,
    addOnId,
    parsedBody.data,
    auth.session.user,
  );
}

/**
 * Creates a variant under a manageable service.
 */
async function createServiceVariant(
  serviceId: string,
  input: CreateServiceVariantInput,
  adminUser: ServiceAdminUser,
) {
  try {
    const manageableService = await assertManageableService(serviceId, adminUser);
    await getDb().serviceVariant.create({
      data: {
        advanceAmount:
          input.advanceAmount === undefined || input.advanceAmount === null
            ? null
            : new Prisma.Decimal(input.advanceAmount),
        descriptionHi: input.descriptionHi ?? null,
        durationMinutes: input.durationMinutes,
        isActive: input.isActive ?? true,
        nameEn: input.nameEn ?? null,
        nameHi: input.nameHi,
        price: new Prisma.Decimal(input.price),
        serviceId: manageableService.id,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    const service = await getDb().service.findUniqueOrThrow({
      select: serviceDetailSelect(false),
      where: {
        id: serviceId,
      },
    });

    return serviceJson({
      code: SERVICE_CODES.VARIANT_CREATED,
      data: {
        service: toPublicServiceDetail(service),
      },
      message: SERVICE_MESSAGES.VARIANT_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.VARIANT_CREATE_FAILED,
      failureMessage: SERVICE_MESSAGES.VARIANT_CREATE_FAILED,
      handler: "createServiceVariant",
    });
  }
}

/**
 * Updates one variant under a manageable service.
 */
async function updateServiceVariant(
  serviceId: string,
  variantId: string,
  input: UpdateServiceVariantInput,
  adminUser: ServiceAdminUser,
) {
  try {
    await assertManageableService(serviceId, adminUser);

    const variant = await getDb().serviceVariant.findFirst({
      select: {
        id: true,
      },
      where: {
        id: variantId,
        serviceId,
      },
    });

    if (!variant) {
      return serviceError({
        code: SERVICE_CODES.VARIANT_NOT_FOUND,
        message: SERVICE_MESSAGES.VARIANT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const service = await getDb().serviceVariant.update({
      data: toServiceVariantUpdateData(input),
      select: {
        service: {
          select: serviceDetailSelect(false),
        },
      },
      where: {
        id: variantId,
      },
    });

    return serviceJson({
      code: SERVICE_CODES.VARIANT_UPDATED,
      data: {
        service: toPublicServiceDetail(service.service),
      },
      message: SERVICE_MESSAGES.VARIANT_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.VARIANT_UPDATE_FAILED,
      failureMessage: SERVICE_MESSAGES.VARIANT_UPDATE_FAILED,
      handler: "updateServiceVariant",
    });
  }
}

/**
 * Creates a service add-on under a manageable service.
 */
async function createServiceAddOn(
  serviceId: string,
  input: CreateServiceAddOnInput,
  adminUser: ServiceAdminUser,
) {
  try {
    const service = await assertManageableService(serviceId, adminUser);
    await getDb().serviceAddOn.create({
      data: {
        branchId: service.branchId,
        descriptionHi: input.descriptionHi ?? null,
        durationMinutes: input.durationMinutes ?? 0,
        isActive: input.isActive ?? true,
        nameEn: input.nameEn ?? null,
        nameHi: input.nameHi,
        price: new Prisma.Decimal(input.price),
        serviceId,
      },
    });
    const serviceWithAddOn = await getDb().service.findUniqueOrThrow({
      select: serviceDetailSelect(false),
      where: {
        id: serviceId,
      },
    });

    return serviceJson({
      code: SERVICE_CODES.ADD_ON_CREATED,
      data: {
        service: toPublicServiceDetail(serviceWithAddOn),
      },
      message: SERVICE_MESSAGES.ADD_ON_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.ADD_ON_CREATE_FAILED,
      failureMessage: SERVICE_MESSAGES.ADD_ON_CREATE_FAILED,
      handler: "createServiceAddOn",
    });
  }
}

/**
 * Updates one service add-on under a manageable service.
 */
async function updateServiceAddOn(
  serviceId: string,
  addOnId: string,
  input: UpdateServiceAddOnInput,
  adminUser: ServiceAdminUser,
) {
  try {
    await assertManageableService(serviceId, adminUser);

    const addOn = await getDb().serviceAddOn.findFirst({
      select: {
        id: true,
      },
      where: {
        id: addOnId,
        serviceId,
      },
    });

    if (!addOn) {
      return serviceError({
        code: SERVICE_CODES.ADD_ON_NOT_FOUND,
        message: SERVICE_MESSAGES.ADD_ON_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    await getDb().serviceAddOn.update({
      data: toServiceAddOnUpdateData(input),
      where: {
        id: addOnId,
      },
    });
    const serviceWithAddOn = await getDb().service.findUniqueOrThrow({
      select: serviceDetailSelect(false),
      where: {
        id: serviceId,
      },
    });

    return serviceJson({
      code: SERVICE_CODES.ADD_ON_UPDATED,
      data: {
        service: toPublicServiceDetail(serviceWithAddOn),
      },
      message: SERVICE_MESSAGES.ADD_ON_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleServiceWriteError(error, {
      failureCode: SERVICE_CODES.ADD_ON_UPDATE_FAILED,
      failureMessage: SERVICE_MESSAGES.ADD_ON_UPDATE_FAILED,
      handler: "updateServiceAddOn",
    });
  }
}
