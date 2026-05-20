/**
 * Purpose: Server-side query helpers for package admin and public catalog screens.
 * Responsibilities: call existing package handlers and load create-form service options.
 * Important notes: protected admin calls forward server headers for auth-aware scope checks.
 */
import "server-only";

import { getDb } from "@/db";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleListAdminPackages,
  handleListPackages,
} from "@/features/packages/handlers/package.handlers";
import type {
  PackageListResult,
  PackageServiceOption,
  PublicPackage,
  PublicPackageListResult,
  PublicPackageDetail,
} from "@/features/packages/types/package.types";

type AdminPackageListPayload = {
  data?: {
    packages?: PublicPackageDetail[];
  };
  message?: string;
  success?: boolean;
};

type PublicPackageListPayload = {
  data?: {
    packages?: PublicPackage[];
  };
  message?: string;
  success?: boolean;
};

type AdminPackageListOptions = {
  branchId?: string;
  limit?: number;
  status?: "active" | "inactive" | "all";
};

type PublicPackageListOptions = {
  branchId: string;
  limit?: number;
};

/**
 * Loads admin packages through the protected package handler.
 */
export async function listAdminPackages(
  options: AdminPackageListOptions = {},
): Promise<PackageListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/admin/packages");

  url.searchParams.set("limit", String(options.limit ?? 100));
  url.searchParams.set("status", options.status ?? "all");
  if (options.branchId) url.searchParams.set("branchId", options.branchId);

  const response = await handleListAdminPackages(
    new Request(url, {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
  );
  const payload = (await response.json().catch(() => null)) as
    | AdminPackageListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      error: payload?.message ?? "Could not load admin packages.",
      packages: [],
    };
  }

  return {
    error: null,
    packages: payload.data?.packages ?? [],
  };
}

/**
 * Loads public active packages for a selected branch.
 */
export async function listPublicPackages(
  options: PublicPackageListOptions,
): Promise<PublicPackageListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/packages");

  url.searchParams.set("branchId", options.branchId);
  url.searchParams.set("limit", String(options.limit ?? 50));

  const response = await handleListPackages(new Request(url, { method: "GET" }));
  const payload = (await response.json().catch(() => null)) as
    | PublicPackageListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      error: payload?.message ?? "Could not load packages.",
      packages: [],
    };
  }

  return {
    error: null,
    packages: payload.data?.packages ?? [],
  };
}

/**
 * Loads active services grouped by branch for package composition.
 */
export async function listPackageServiceOptions(): Promise<PackageServiceOption[]> {
  return getDb().service.findMany({
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
}
