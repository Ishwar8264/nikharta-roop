"use client";

import { GlobalCategoryManager } from "@/components/shared/global-category-manager";

import { createServiceCategoryApi } from "./api";

/** Uses the shared category form with the service icon field enabled. */
export function ServiceCategoryManager() {
  return (
    <GlobalCategoryManager createCategory={createServiceCategoryApi} withIcon />
  );
}
