import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import {
  ADMIN_DASHBOARD_CODES,
  ADMIN_DASHBOARD_MESSAGES,
} from "@/features/admin-dashboard/constants/admin-dashboard.constants";
import {
  adminDashboardError,
  adminDashboardJson,
} from "@/features/admin-dashboard/responses/admin-dashboard.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { dashboardMetrics } from "./admin-dashboard.metrics";

/**
 * Handles admin dashboard summary requests.
 */
export async function handleGetAdminDashboard(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth.error;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return adminDashboardError({
      code: ADMIN_DASHBOARD_CODES.FORBIDDEN,
      message: ADMIN_DASHBOARD_MESSAGES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    });
  }
  return getAdminDashboard(auth.session.user);
}

/**
 * Loads today-focused operational dashboard metrics.
 */
async function getAdminDashboard(admin: { branchId?: string | null; role: string }) {
  try {
    const branchId = admin.role === "SUPER_ADMIN" ? undefined : admin.branchId ?? "";
    const metrics = await dashboardMetrics(branchId);
    return adminDashboardJson({
      code: ADMIN_DASHBOARD_CODES.DASHBOARD_LOADED,
      data: metrics,
      message: ADMIN_DASHBOARD_MESSAGES.DASHBOARD_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(ADMIN_DASHBOARD_CODES.DASHBOARD_LOAD_FAILED, {
      error,
      handler: "getAdminDashboard",
    });
    return adminDashboardError({
      code: ADMIN_DASHBOARD_CODES.DASHBOARD_LOAD_FAILED,
      message: ADMIN_DASHBOARD_MESSAGES.DASHBOARD_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
