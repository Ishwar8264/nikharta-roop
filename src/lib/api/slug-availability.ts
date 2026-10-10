import type { SlugAvailabilityQuery, SlugAvailabilityResult } from "@/lib/slug-availability";

import { api, type RequestOptions } from "./backend.client";

/** Uses the existing authenticated client, including session refresh and cancellation. */
export async function checkSlugAvailability(
  query: SlugAvailabilityQuery,
  options?: RequestOptions,
): Promise<SlugAvailabilityResult> {
  const params = new URLSearchParams({ resource: query.resource, slug: query.slug });
  if (query.salonId) params.set("salonId", query.salonId);
  const response = await api.get<{ message: string; data: SlugAvailabilityResult }>(
    `/slugs/availability?${params}`, options,
  );
  return response.data;
}

/** Check bounded batches and return up to four verified alternatives in the same namespace. */
export async function findAvailableSlugSuggestions(
  query: SlugAvailabilityQuery,
  options: { signal: AbortSignal; maxLength: number },
  checker: (query: SlugAvailabilityQuery, options: { signal: AbortSignal }) => Promise<SlugAvailabilityResult> = checkSlugAvailability,
): Promise<string[]> {
  const available: string[] = [];
  for (let start = 2; start < 18 && available.length < 4; start += 4) {
    if (options.signal.aborted) return [];
    const candidates = Array.from({ length: 4 }, (_, index) => {
      const suffix = `-${start + index}`;
      const base = query.slug.slice(0, options.maxLength - suffix.length).replace(/-+$/, "");
      return `${base}${suffix}`;
    });
    const results = await Promise.all(candidates.map((slug) => checker({ ...query, slug }, { signal: options.signal })));
    if (options.signal.aborted) return [];
    for (const [index, result] of results.entries()) {
      if (result.available) available.push(candidates[index]);
    }
  }
  return available.slice(0, 4);
}
