import type { ApiError, ApiSuccess } from "../types/api";

export const ok = <T>(data: T, message?: string): ApiSuccess<T> => ({
  ok: true,
  data,
  ...(message !== undefined ? { message } : {}),
});

export const fail = (code: string, message: string, details?: unknown): ApiError => ({
  ok: false,
  error: { code, message, ...(details !== undefined ? { details } : {}) },
});
