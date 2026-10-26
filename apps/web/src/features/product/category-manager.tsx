"use client";

import { GlobalCategoryManager } from "@/components/shared/global-category-manager";

import { createProductCategoryApi } from "./api";

/** Uses the shared category form without the service-only icon field. */
export function ProductCategoryManager() {
  return <GlobalCategoryManager createCategory={createProductCategoryApi} />;
}
