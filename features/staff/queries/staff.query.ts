/**
 * Purpose: Server-side query helpers for admin staff management screens.
 * Responsibilities: call staff API handlers for list data and load create-form options.
 * Important notes: protected handler calls forward server request headers for auth-aware scope checks.
 */
import "server-only";

import { UserRole } from "@prisma/client";

import { getDb } from "@/db";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleGetAdminStaff,
  handleListAdminStaff,
} from "@/features/staff/handlers/staff-admin.handlers";
import type {
  PublicStaff,
  StaffListResult,
  StaffServiceOption,
  StaffUserOption,
} from "@/features/staff/types/staff.types";

type StaffListPayload = {
  data?: {
    staff?: PublicStaff[];
  };
  message?: string;
  success?: boolean;
};

type StaffDetailPayload = {
  data?: {
    staff?: PublicStaff;
  };
  message?: string;
  success?: boolean;
};

type AdminStaffListOptions = {
  branchId?: string;
  limit?: number;
  serviceId?: string;
  status?: "available" | "unavailable" | "all";
};

/**
 * Loads admin staff through the protected management handler.
 */
export async function listAdminStaff(
  options: AdminStaffListOptions = {},
): Promise<StaffListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/admin/staff");

  url.searchParams.set("limit", String(options.limit ?? 100));
  url.searchParams.set("status", options.status ?? "all");

  if (options.branchId) url.searchParams.set("branchId", options.branchId);
  if (options.serviceId) url.searchParams.set("serviceId", options.serviceId);

  const response = await handleListAdminStaff(
    new Request(url, {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
  );

  return readStaffListPayload(response, "Could not load admin staff.");
}

/**
 * Loads one admin staff profile through the protected detail handler.
 */
export async function getAdminStaff(staffId: string) {
  const response = await handleGetAdminStaff(
    new Request(`http://nikharta-roop.local/api/v1/admin/staff/${staffId}`, {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
    staffId,
  );
  const payload = (await response.json().catch(() => null)) as
    | StaffDetailPayload
    | null;

  if (!response.ok || payload?.success !== true || !payload.data?.staff) {
    return {
      error: payload?.message ?? "Could not load staff profile.",
      staff: null,
    };
  }

  return {
    error: null,
    staff: payload.data.staff,
  };
}

/**
 * Loads active users without a staff profile for staff creation.
 */
export async function listStaffUserOptions(): Promise<StaffUserOption[]> {
  const users = await getDb().user.findMany({
    orderBy: [{ name: "asc" }, { mobile: "asc" }],
    select: {
      branchId: true,
      email: true,
      id: true,
      mobile: true,
      name: true,
    },
    where: {
      isActive: true,
      role: { in: [UserRole.USER, UserRole.STAFF] },
      staffProfile: null,
    },
  });

  return users.map((user) => ({
    branchId: user.branchId,
    id: user.id,
    label: `${user.name ?? "Unnamed user"} · ${user.mobile}${user.email ? ` · ${user.email}` : ""}`,
  }));
}

/**
 * Loads active services grouped by branch for initial staff assignment checkboxes.
 */
export async function listStaffServiceOptions(): Promise<StaffServiceOption[]> {
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

  return services;
}

/**
 * Normalizes staff list API responses for admin pages.
 */
async function readStaffListPayload(
  response: Response,
  fallbackMessage: string,
): Promise<StaffListResult> {
  const payload = (await response.json().catch(() => null)) as
    | StaffListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      error: payload?.message ?? fallbackMessage,
      staff: [],
    };
  }

  return {
    error: null,
    staff: payload.data?.staff ?? [],
  };
}
