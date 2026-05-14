import "server-only";

import { handleListBranches } from "@/features/branches/handlers/branch.handlers";
import type {
  BranchListResult,
  PublicBranch,
} from "@/features/branches/types/branch.types";

type BranchListPayload = {
  data?: {
    branches?: PublicBranch[];
  };
  message?: string;
  success?: boolean;
};

// Wires public branch screens to the same handler as GET /api/v1/branches.
export async function listPublicBranches(city?: string): Promise<BranchListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/branches");

  if (city) {
    url.searchParams.set("city", city);
  }

  const response = await handleListBranches(
    new Request(url, {
      method: "GET",
    }),
  );
  const payload = (await response.json().catch(() => null)) as
    | BranchListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      branches: [],
      error: payload?.message ?? "Could not load branches.",
    };
  }

  return {
    branches: payload.data?.branches ?? [],
    error: null,
  };
}
