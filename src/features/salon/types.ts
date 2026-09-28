import type { SalonCategory } from "@/generated/prisma/client";

/**
 * Public salon shape returned by listSalons / getSalonBySlug.
 *
 * Why duplicated from server/modules/salon/salon.types:
 * That module is `server-only`; importing it from a client component would
 * crash. Keeping a client-safe copy here means components can be shared
 * across server and client boundaries without dragging Prisma's type graph
 * into the browser bundle.
 *
 * Shapes MUST stay in sync with server/modules/salon/salon.types.PublicSalon.
 */
export interface PublicSalon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: SalonCategory;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  timezone: string;
  lat: number;
  lng: number;
  placeId: string | null;
  phone: string | null;
  email: string | null;
  images: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  /** ISO string once JSON-serialized over HTTP; Date on the server. */
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginatedSalons {
  items: PublicSalon[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Filter + cursor state, kept in the URL for shareability. */
export interface SalonFilters {
  city?: string;
  category?: SalonCategory;
  search?: string;
  cursor?: string;
}

export const SALON_CATEGORIES: { value: SalonCategory; label: string }[] = [
  { value: "UNISEX", label: "Unisex" },
  { value: "MALE", label: "Men" },
  { value: "FEMALE", label: "Women" },
  { value: "KIDS", label: "Kids" },
];
