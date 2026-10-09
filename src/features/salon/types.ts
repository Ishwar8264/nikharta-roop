import type { DayOfWeek, SalonCategory } from "@/generated/prisma/client";

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
  shortDescription: string | null;
  description: string | null;
  descriptionHtml: string | null;
  descriptionJson: string | null;
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
  coverImage: string | null;
  bannerImage: string | null;
  images: string[];
  /** ISO string once JSON-serialized over HTTP; Date on the server. */
  createdAt: string | Date;
  updatedAt: string | Date;
}

/** Client-safe working-hours shape embedded in salon detail responses. */
export interface SalonWorkingHour {
  day: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/** Client-safe service preview shape embedded in salon detail responses. */
export interface SalonServicePreview {
  id: string;
  name: string;
  slug: string;
  price: number;
  duration: number;
  coverImage: string | null;
  images: string[];
  category: { name: string; slug: string } | null;
}

/** Detail response with the public relations required by the detail page. */
export interface PublicSalonDetail extends PublicSalon {
  workingHours: SalonWorkingHour[];
  services: SalonServicePreview[];
  _count: { services: number; products: number };
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

export type { SalonCategory };

export interface CreateSalonResponse {
  message: string;
  data: { salon: PublicSalon };
}

/** Field-level validation error from the backend's 400 response. */
export interface FieldError {
  field: string;
  message: string;
}
