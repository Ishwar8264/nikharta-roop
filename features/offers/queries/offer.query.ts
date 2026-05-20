/**
 * Purpose: Server-side query helpers for offer admin and public screens.
 * Responsibilities: call existing offer handlers and load create-form service options.
 * Important notes: protected admin calls forward server request headers for auth-aware scope checks.
 */
import "server-only";

import { getDb } from "@/db";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleListAdminOffers,
  handleListOffers,
} from "@/features/offers/handlers/offer.handlers";
import type {
  OfferListResult,
  OfferServiceOption,
  PublicOffer,
} from "@/features/offers/types/offer.types";

type OfferListPayload = {
  data?: {
    offers?: PublicOffer[];
  };
  message?: string;
  success?: boolean;
};

type AdminOfferListOptions = {
  branchId?: string;
  limit?: number;
  status?: "active" | "inactive" | "all";
};

type PublicOfferListOptions = {
  branchId?: string;
  limit?: number;
};

/**
 * Loads admin offers through the protected management handler.
 */
export async function listAdminOffers(
  options: AdminOfferListOptions = {},
): Promise<OfferListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/admin/offers");

  url.searchParams.set("limit", String(options.limit ?? 100));
  url.searchParams.set("status", options.status ?? "all");
  if (options.branchId) url.searchParams.set("branchId", options.branchId);

  const response = await handleListAdminOffers(
    new Request(url, {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
  );

  return readOfferListPayload(response, "Could not load admin offers.");
}

/**
 * Loads active public offers, optionally for a selected branch.
 */
export async function listPublicOffers(
  options: PublicOfferListOptions = {},
): Promise<OfferListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/offers");

  url.searchParams.set("limit", String(options.limit ?? 50));
  if (options.branchId) url.searchParams.set("branchId", options.branchId);

  const response = await handleListOffers(new Request(url, { method: "GET" }));

  return readOfferListPayload(response, "Could not load offers.");
}

/**
 * Loads active services grouped by branch for offer restrictions.
 */
export async function listOfferServiceOptions(): Promise<OfferServiceOption[]> {
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

/**
 * Normalizes offer list API responses for pages.
 */
async function readOfferListPayload(
  response: Response,
  fallbackMessage: string,
): Promise<OfferListResult> {
  const payload = (await response.json().catch(() => null)) as
    | OfferListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      error: payload?.message ?? fallbackMessage,
      offers: [],
    };
  }

  return {
    error: null,
    offers: payload.data?.offers ?? [],
  };
}
