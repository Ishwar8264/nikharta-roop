import "server-only";

import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleAdminGetBranch,
  handleAdminListBranches,
} from "@/features/branches/handlers/branch.handlers";
import type {
  BranchListResult,
  PublicBranch,
} from "@/features/branches/types/branch.types";

type AdminBranchListPayload = {
  data?: {
    branches?: PublicBranch[];
  };
  message?: string;
  success?: boolean;
};

type AdminBranchPayload = {
  data?: {
    branch?: PublicBranch;
  };
  message?: string;
  success?: boolean;
};

// Wires the admin branch screen to GET /api/v1/admin/branches.
export async function listAdminBranches(): Promise<BranchListResult> {
  const response = await handleAdminListBranches(
    new Request("http://nikharta-roop.local/api/v1/admin/branches", {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
  );
  const payload = (await response.json().catch(() => null)) as
    | AdminBranchListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      branches: [],
      error: payload?.message ?? "Could not load admin branches.",
    };
  }

  return {
    branches: payload.data?.branches ?? [],
    error: null,
  };
}

// Wires edit screens to GET /api/v1/admin/branches/:branchId.
export async function getAdminBranch(branchId: string) {
  const response = await handleAdminGetBranch(
    new Request(`http://nikharta-roop.local/api/v1/admin/branches/${branchId}`, {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
    branchId,
  );
  const payload = (await response.json().catch(() => null)) as
    | AdminBranchPayload
    | null;

  if (!response.ok || payload?.success !== true || !payload.data?.branch) {
    return {
      branch: null,
      error: payload?.message ?? "Could not load branch.",
    };
  }

  return {
    branch: payload.data.branch,
    error: null,
  };
}
