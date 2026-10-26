import type { CatalogStatus } from "@/lib/catalog/status";
import { api } from "@/lib/api/backend.client";

import type { PublicPackage } from "./types";

/** Creates a package inside a salon the caller manages. MANAGER+. */
export function createPackageApi(salonRef: string, body: CreatePackageBody) {
  const details: Partial<CreatePackageBody> = { ...body };
  delete details.status;
  delete details.isActive;
  return api.post<{ message: string; data: { package: PublicPackage } }>(
    `/salons/${encodeURIComponent(salonRef)}/packages`,
    details,
  );
}

/** Updates a package by id. Slug is immutable after creation. */
export async function updatePackageApi(salonRef: string, packageId: string, body: UpdatePackageBody) {
  const { status, ...details } = body;
  const path = `/salons/${encodeURIComponent(salonRef)}/packages/${encodeURIComponent(packageId)}`;
  let response;
  if (Object.keys(details).length) response = await api.patch<{ message: string; data: { package: PublicPackage } }>(path, details);
  if (status !== undefined) response = await updatePackageStatusApi(salonRef, packageId, status);
  if (!response) throw new Error("No package changes supplied");
  return response;
}

/** Updates publication independently from package details. */
export function updatePackageStatusApi(salonRef: string, packageId: string, status: CatalogStatus) {
  return api.patch<{ message: string; data: { package: PublicPackage } }>(`/salons/${encodeURIComponent(salonRef)}/packages/${encodeURIComponent(packageId)}/status`, { status });
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
  status?: CatalogStatus;
  isActive?: boolean;
  serviceIds?: string[];
}

/** Mirrors `UpdatePackageInput` — every field optional, at least one set. */
export interface UpdatePackageBody {
  name?: string;
  price?: number;
  duration?: number;
  status?: CatalogStatus;
  isActive?: boolean;
  serviceIds?: string[];
}
