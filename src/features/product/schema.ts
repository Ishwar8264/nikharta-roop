import { z } from "zod";

import { createProductSchema } from "@/server/modules/product/product.schema";

/** Reuses the API's product schema so client and server rules stay aligned. */
export const productFormSchema = createProductSchema;
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

/** Suggests a URL-safe slug while the name is being typed. */
export function slugifyProductName(value: string): string | undefined {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug.length >= 2 ? slug : undefined;
}
