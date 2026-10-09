import { api } from "@/lib/api/backend.client";

import type { PublicPackage } from "./types";

/** Creates a package inside a salon the caller manages. MANAGER+. */
export function createPackageApi(salonRef: string, body: CreatePackageBody) {
  return api.post<{ message: string; data: { package: PublicPackage } }>(
    `/salons/${encodeURIComponent(salonRef)}/packages`,
    body,
  );
}

/** Updates a package by id. Slug is immutable after creation. */
export function updatePackageApi(
  salonRef: string,
  packageId: string,
  body: UpdatePackageBody,
) {
  return api.patch<{ message: string; data: { package: PublicPackage } }>(
    `/salons/${encodeURIComponent(salonRef)}/packages/${encodeURIComponent(packageId)}`,
    body,
  );
}

/** Soft-deletes a package — customers stop seeing it immediately. */
export function deletePackageApi(salonRef: string, packageId: string) {
  return api.delete<{ message: string; data: null }>(
    `/salons/${encodeURIComponent(salonRef)}/packages/${encodeURIComponent(packageId)}`,
  );
}

/** Mirrors `CreatePackageInput` (z.output) without importing server code. */
export interface CreatePackageBody {
  name: string;
  slug: string;
  price: number;
  duration: number;
  isActive: boolean;
  serviceIds?: string[];
}

/** Mirrors `UpdatePackageInput` — every field optional, at least one set. */
export interface UpdatePackageBody {
  name?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
  serviceIds?: string[];
}
