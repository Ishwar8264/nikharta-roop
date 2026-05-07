import { getDb } from "@/db";
import {
  ADMIN_USER_CODES,
  ADMIN_USER_MESSAGES,
} from "@/features/admin-users/constants/admin-user.constants";
import { adminUserSelect } from "@/features/admin-users/helpers/admin-user.selectors";
import {
  listAdminUsersQuerySchema,
  type ListAdminUsersQueryInput,
} from "@/schema/admin-users/schema.admin-user";
import { handleAdminUserError } from "./admin-user.errors";
import { resolveAdminUserBranch } from "./admin-user.guards";
import { adminUserListResponse, parseAdminUserQuery } from "./admin-user-list.shared";
import { requireAdminUserActor, type AdminUserActor } from "./admin-user.shared";

/**
 * Handles admin user listing requests.
 */
export async function handleListAdminUsers(request: Request) {
  const auth = await requireAdminUserActor(request);
  if (!auth.success) return auth.error;
  const query = parseAdminUserQuery(request, listAdminUsersQuerySchema);
  if (!query.success) return query.error;
  return listAdminUsers(query.data, auth.session.user);
}

/**
 * Lists users with branch, role, active, and text filters.
 */
async function listAdminUsers(input: ListAdminUsersQueryInput, admin: AdminUserActor) {
  try {
    const branchId = await resolveAdminUserBranch(input.branchId, admin);
    const users = await getDb().user.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: adminUserSelect(),
      take: input.limit,
      where: {
        branchId,
        isActive: input.isActive,
        role: input.role,
        OR: searchWhere(input.search),
      },
    });
    return adminUserListResponse(users, input.limit);
  } catch (error) {
    return handleAdminUserError(error, {
      code: ADMIN_USER_CODES.USER_LOAD_FAILED,
      handler: "listAdminUsers",
      message: ADMIN_USER_MESSAGES.USER_LOAD_FAILED,
    });
  }
}

/**
 * Builds optional mobile, name, and email search filters.
 */
function searchWhere(search?: string) {
  if (!search) return undefined;
  return [
    { mobile: { contains: search } },
    { name: { contains: search, mode: "insensitive" as const } },
    { email: { contains: search, mode: "insensitive" as const } },
  ];
}
