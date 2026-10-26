import "client-only";

import { api } from "@/lib/api/backend.client";

import type { RegisterInput, RegisterResponse } from "../../shared/types";

/**
 * Posts to the register endpoint.
 *
 * Why a thin wrapper:
 * The `api` util is transport-only. Naming the endpoint, its input shape,
 * and its response envelope in one place means the form and hook never have
 * to know URL strings or response structure — a URL change is a one-line edit.
 *
 * Why not mark it "use client":
 * It's a pure function that calls fetch. It has no React, no hooks, no state.
 * Marking it client-only would be a lie. The client boundary is established
 * by whichever client component imports it — not by this file.
 */
export function registerApi(input: RegisterInput): Promise<RegisterResponse> {
  return api.post<RegisterResponse>("/auth/register", input);
}
