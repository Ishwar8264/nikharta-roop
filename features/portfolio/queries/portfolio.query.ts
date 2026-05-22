/**
 * Purpose: Server-side query helpers for portfolio admin and public screens.
 * Responsibilities: call portfolio handlers and normalize collection responses for pages.
 * Important notes: admin calls forward server request headers for auth-aware branch scoping.
 */
import "server-only";

import { getDb } from "@/db";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleListAdminPortfolio,
  handleListPortfolio,
} from "@/features/portfolio/handlers/portfolio.handlers";
import type {
  PortfolioListResult,
  PortfolioRelationOption,
  PublicPortfolioItem,
} from "@/features/portfolio/types/portfolio.types";

type PortfolioListPayload = {
  data?: {
    portfolio?: PublicPortfolioItem[];
  };
  message?: string;
  success?: boolean;
};

type AdminPortfolioListOptions = {
  branchId?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  limit?: number;
};

type PublicPortfolioListOptions = {
  branchId?: string;
  featured?: boolean;
  limit?: number;
};

/**
 * Loads admin portfolio items through the protected portfolio handler.
 */
export async function listAdminPortfolio(
  options: AdminPortfolioListOptions = {},
): Promise<PortfolioListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/admin/portfolio");

  url.searchParams.set("limit", String(options.limit ?? 100));
  setOptionalParam(url, "branchId", options.branchId);
  setOptionalBooleanParam(url, "isFeatured", options.isFeatured);
  setOptionalBooleanParam(url, "isPublished", options.isPublished);

  const response = await handleListAdminPortfolio(
    new Request(url, {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
  );

  return readPortfolioListPayload(response, "Could not load admin portfolio.");
}

/**
 * Loads published public portfolio items.
 */
export async function listPublicPortfolio(
  options: PublicPortfolioListOptions = {},
): Promise<PortfolioListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/portfolio");

  url.searchParams.set("limit", String(options.limit ?? 50));
  setOptionalParam(url, "branchId", options.branchId);
  setOptionalBooleanParam(url, "featured", options.featured);

  const response = await handleListPortfolio(new Request(url, { method: "GET" }));

  return readPortfolioListPayload(response, "Could not load portfolio.");
}

/**
 * Loads branch-scoped relation choices used by the portfolio create form.
 */
export async function listPortfolioRelationOptions() {
  const [services, packages, staff] = await Promise.all([
    listPortfolioServiceOptions(),
    listPortfolioPackageOptions(),
    listPortfolioStaffOptions(),
  ]);

  return { packages, services, staff };
}

/**
 * Loads active services that portfolio items can reference.
 */
async function listPortfolioServiceOptions(): Promise<PortfolioRelationOption[]> {
  const services = await getDb().service.findMany({
    orderBy: [{ branch: { city: "asc" } }, { nameHi: "asc" }],
    select: {
      branchId: true,
      id: true,
      nameHi: true,
    },
    where: {
      branch: { isActive: true },
      isActive: true,
    },
  });

  return services.map((service) => ({
    branchId: service.branchId,
    id: service.id,
    label: service.nameHi,
  }));
}

/**
 * Loads active packages that portfolio items can reference.
 */
async function listPortfolioPackageOptions(): Promise<PortfolioRelationOption[]> {
  const packages = await getDb().package.findMany({
    orderBy: [{ branch: { city: "asc" } }, { nameHi: "asc" }],
    select: {
      branchId: true,
      id: true,
      nameHi: true,
    },
    where: {
      branch: { isActive: true },
      isActive: true,
    },
  });

  return packages.map((portfolioPackage) => ({
    branchId: portfolioPackage.branchId,
    id: portfolioPackage.id,
    label: portfolioPackage.nameHi,
  }));
}

/**
 * Loads available staff that portfolio items can reference.
 */
async function listPortfolioStaffOptions(): Promise<PortfolioRelationOption[]> {
  const staff = await getDb().staff.findMany({
    orderBy: [{ branch: { city: "asc" } }, { user: { name: "asc" } }],
    select: {
      branchId: true,
      id: true,
      user: { select: { mobile: true, name: true } },
    },
    where: {
      branch: { isActive: true },
      isAvailable: true,
    },
  });

  return staff.map((staffMember) => ({
    branchId: staffMember.branchId,
    id: staffMember.id,
    label: staffMember.user.name ?? staffMember.user.mobile,
  }));
}

/**
 * Adds an optional string query param when a value exists.
 */
function setOptionalParam(url: URL, key: string, value?: string) {
  if (value) url.searchParams.set(key, value);
}

/**
 * Adds an optional boolean query param without converting undefined to false.
 */
function setOptionalBooleanParam(url: URL, key: string, value?: boolean) {
  if (typeof value === "boolean") url.searchParams.set(key, String(value));
}

/**
 * Normalizes portfolio list API responses for pages.
 */
async function readPortfolioListPayload(
  response: Response,
  fallbackMessage: string,
): Promise<PortfolioListResult> {
  const payload = (await response.json().catch(() => null)) as
    | PortfolioListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      error: payload?.message ?? fallbackMessage,
      items: [],
    };
  }

  return {
    error: null,
    items: payload.data?.portfolio ?? [],
  };
}
