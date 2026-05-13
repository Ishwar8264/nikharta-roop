import { z, type ZodError } from "zod";

import { getDb } from "@/db";
import { STAFF_CODES, STAFF_MESSAGES } from "@/features/staff/constants/staff.constants";
import { toPublicStaff } from "@/features/staff/helpers/staff.mapper";
import { staffSelect } from "@/features/staff/helpers/staff.selectors";
import { staffError, staffJson } from "@/features/staff/responses/staff.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  getStaffQuerySchema,
  type GetStaffQueryInput,
  listStaffQuerySchema,
  type ListStaffQueryInput,
} from "@/schema/staff/schema.staff";

/**
 * Handles public staff listing for branch/service discovery.
 */
export async function handleListStaff(request: Request) {
  const parsedQuery = parseStaffQuery(request, listStaffQuerySchema);

  if (parsedQuery.error) {
    return parsedQuery.error;
  }

  return listStaff(parsedQuery.data);
}

/**
 * Handles public staff detail loading.
 */
export async function handleGetStaff(request: Request, staffId: string) {
  const parsedQuery = parseStaffQuery(request, getStaffQuerySchema);

  if (parsedQuery.error) {
    return parsedQuery.error;
  }

  return getStaff(staffId, parsedQuery.data);
}

/**
 * Lists active staff for a branch, optionally filtered by service.
 */
async function listStaff(input: ListStaffQueryInput) {
  try {
    if (!(await activeBranchExists(input.branchId))) {
      return notFound(STAFF_CODES.BRANCH_NOT_FOUND, STAFF_MESSAGES.BRANCH_NOT_FOUND);
    }

    const staff = await getDb().staff.findMany({
      orderBy: [{ rating: "desc" }, { id: "asc" }],
      select: staffSelect(),
      where: {
        branchId: input.branchId,
        isAvailable: true,
        services: input.serviceId ? { some: { serviceId: input.serviceId } } : undefined,
      },
    });

    return staffJson({
      code: STAFF_CODES.STAFF_LISTED,
      data: { staff: staff.map(toPublicStaff) },
      message: STAFF_MESSAGES.STAFF_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(STAFF_CODES.STAFF_LIST_LOAD_FAILED, {
      branchId: input.branchId,
      error,
      handler: "listStaff",
    });

    return staffError({
      code: STAFF_CODES.STAFF_LIST_LOAD_FAILED,
      message: STAFF_MESSAGES.STAFF_LIST_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Loads one active staff member by branch.
 */
async function getStaff(staffId: string, input: GetStaffQueryInput) {
  try {
    const staff = await getDb().staff.findFirst({
      select: staffSelect(),
      where: { branchId: input.branchId, id: staffId, isAvailable: true },
    });

    if (!staff) {
      return notFound(STAFF_CODES.STAFF_NOT_FOUND, STAFF_MESSAGES.STAFF_NOT_FOUND);
    }

    return staffJson({
      code: STAFF_CODES.STAFF_LOADED,
      data: { staff: toPublicStaff(staff) },
      message: STAFF_MESSAGES.STAFF_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(STAFF_CODES.STAFF_LOAD_FAILED, { error, handler: "getStaff", staffId });

    return staffError({
      code: STAFF_CODES.STAFF_LOAD_FAILED,
      message: STAFF_MESSAGES.STAFF_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Parses query parameters with staff-owned validation error codes.
 */
function parseStaffQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));

  if (!parsed.success) {
    return {
      data: null,
      error: staffError({
        code: STAFF_CODES.VALIDATION_ERROR,
        message: getStaffValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return { data: parsed.data as z.output<TSchema>, error: null };
}

/**
 * Checks active branch existence for public discovery.
 */
async function activeBranchExists(branchId: string) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });

  return Boolean(branch);
}

/**
 * Creates a standard not-found staff response.
 */
function notFound(code: string, message: string) {
  return staffError({ code, message, status: HTTP_STATUS.NOT_FOUND });
}

/**
 * Keeps validation responses focused on the first actionable staff field.
 */
function getStaffValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? STAFF_MESSAGES.VALIDATION_ERROR;
}
