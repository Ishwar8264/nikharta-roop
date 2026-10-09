import { z } from "zod";

import { createPackageSchema } from "@/server/modules/package/package.schema";

/** Reuses the API's package schema so client and server rules stay aligned. */
export const packageFormSchema = createPackageSchema;
export type PackageFormInput = z.input<typeof packageFormSchema>;
export type PackageFormValues = z.output<typeof packageFormSchema>;

/** Suggests a URL-safe slug while the name is being typed. */
export function slugifyPackageName(value: string): string | undefined {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug.length >= 2 ? slug : undefined;
}

/** Formats minutes as "2 hr 30 min" (or "45 min" under an hour). */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}
