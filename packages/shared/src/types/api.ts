/** JSON envelope for non-auth APIs. Better Auth endpoints keep their native contracts. */
export type ApiSuccess<T> = { ok: true; data: T; message?: string };
export type ApiError = { ok: false; error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type HealthStatus = {
  status: "ok" | "degraded";
  checks: { database: "up" | "down"; redis: "up" | "down" };
};
