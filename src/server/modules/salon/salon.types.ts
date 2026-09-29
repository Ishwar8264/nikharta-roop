import type { z } from "zod";

import type { SalonCategory, SalonMemberRole } from "@/generated/prisma/client";

import type {
  addSalonMemberSchema,
  createSalonSchema,
  listSalonsQuerySchema,
  updateSalonSchema,
} from "./salon.schema";

export type ListSalonsQuery = z.infer<typeof listSalonsQuerySchema>;
export type CreateSalonInput = z.infer<typeof createSalonSchema>;
export type UpdateSalonInput = z.infer<typeof updateSalonSchema>;
export type AddSalonMemberInput = z.infer<typeof addSalonMemberSchema>;

/** Salon row shape returned to public clients. */
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
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Salon row that includes the caller's role, used for management views. */
export interface SalonWithViewerRole extends PublicSalon {
  viewerRole: SalonMemberRole;
}

/** Cursor-paginated list response. */
export interface PaginatedSalons {
  items: PublicSalon[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Public shape of a salon member. */
export interface PublicSalonMember {
  id: string;
  userId: string;
  salonId: string;
  role: SalonMemberRole;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}
