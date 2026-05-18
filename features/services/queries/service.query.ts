/**
 * Purpose: Server-side query helpers for public and admin service catalog screens.
 * Responsibilities: call the same handlers used by API routes so UI wiring matches API behavior.
 * Important notes: admin helpers forward server auth headers because management data is protected.
 */
import "server-only";

import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleListServiceCategories,
  handleListServices,
} from "@/features/services/handlers/service.handlers";
import { handleListAdminServices } from "@/features/services/handlers/service-admin.handlers";
import type {
  PublicServiceCategory,
  PublicServiceDetail,
  ServiceCategoryListResult,
  ServiceListResult,
} from "@/features/services/types/service.types";

type ServiceListPayload = {
  data?: {
    services?: PublicServiceDetail[];
  };
  message?: string;
  success?: boolean;
};

type ServiceCategoryListPayload = {
  data?: {
    categories?: PublicServiceCategory[];
  };
  message?: string;
  success?: boolean;
};

type PublicServiceListOptions = {
  branchId: string;
  categorySlug?: string;
  limit?: number;
};

type AdminServiceListOptions = {
  branchId?: string;
  categoryId?: string;
  limit?: number;
  status?: "active" | "inactive" | "all";
};

/**
 * Loads public service categories for branch filter chips.
 */
export async function listPublicServiceCategories(
  branchId?: string,
): Promise<ServiceCategoryListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/services/categories");

  if (branchId) {
    url.searchParams.set("branchId", branchId);
  }

  const response = await handleListServiceCategories(
    new Request(url, { method: "GET" }),
  );

  return readServiceCategoryPayload(response, "Could not load service categories.");
}

/**
 * Loads active public services for the selected branch and category.
 */
export async function listPublicServices(
  options: PublicServiceListOptions,
): Promise<ServiceListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/services");

  url.searchParams.set("branchId", options.branchId);
  url.searchParams.set("limit", String(options.limit ?? 50));

  if (options.categorySlug) {
    url.searchParams.set("categorySlug", options.categorySlug);
  }

  const response = await handleListServices(new Request(url, { method: "GET" }));

  return readServiceListPayload(response, "Could not load services.");
}

/**
 * Loads admin services through the protected management handler.
 */
export async function listAdminServices(
  options: AdminServiceListOptions = {},
): Promise<ServiceListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/admin/services");

  url.searchParams.set("limit", String(options.limit ?? 100));
  url.searchParams.set("status", options.status ?? "all");

  if (options.branchId) {
    url.searchParams.set("branchId", options.branchId);
  }

  if (options.categoryId) {
    url.searchParams.set("categoryId", options.categoryId);
  }

  const response = await handleListAdminServices(
    new Request(url, {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
  );

  return readServiceListPayload(response, "Could not load admin services.");
}

/**
 * Normalizes service list API responses for pages.
 */
async function readServiceListPayload(
  response: Response,
  fallbackMessage: string,
): Promise<ServiceListResult> {
  const payload = (await response.json().catch(() => null)) as
    | ServiceListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      error: payload?.message ?? fallbackMessage,
      services: [],
    };
  }

  return {
    error: null,
    services: payload.data?.services ?? [],
  };
}

/**
 * Normalizes service category API responses for pages.
 */
async function readServiceCategoryPayload(
  response: Response,
  fallbackMessage: string,
): Promise<ServiceCategoryListResult> {
  const payload = (await response.json().catch(() => null)) as
    | ServiceCategoryListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      categories: [],
      error: payload?.message ?? fallbackMessage,
    };
  }

  return {
    categories: payload.data?.categories ?? [],
    error: null,
  };
}
