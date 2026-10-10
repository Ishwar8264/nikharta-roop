/** Browser-safe contract shared by slug fields and the availability endpoint. */
export const slugResources = [
  "salon", "service", "product", "package", "service-category",
  "product-category", "blog-post", "blog-category", "blog-tag",
] as const;

export type SlugResource = typeof slugResources[number];

export type SlugScope =
  | { resource: "service" | "product" | "package"; salonId: string }
  | { resource: Exclude<SlugResource, "service" | "product" | "package">; salonId?: never };

export type SlugAvailabilityQuery = SlugScope & { slug: string };

export interface SlugAvailabilityResult {
  resource: SlugResource;
  slug: string;
  salonId?: string;
  available: boolean;
  reason: "taken" | "reserved" | null;
}

export function slugMaxLength(resource: SlugResource): number {
  return resource.startsWith("blog-") ? 120 : 80;
}

/** Avoid requests for incomplete or malformed input; the server remains authoritative. */
export function slugValidationMessage(slug: string, maxLength: number): string | null {
  if (!slug) return null;
  if (slug.length < 2) return "Use at least 2 characters.";
  if (slug.length > maxLength) return `Use no more than ${maxLength} characters.`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Use lowercase letters, numbers, and single hyphens between words.";
  }
  return null;
}
