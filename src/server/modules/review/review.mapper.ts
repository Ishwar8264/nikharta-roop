import "server-only";

import type { PublicReview, PublicStaffRating } from "./review.types";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

interface StaffRatingRow {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  appointmentId: string | null;
  customer: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

/** Converts a Prisma service/product review row into the public API shape. */
export function toPublicReview(row: ReviewRow): PublicReview {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    images: row.images,
    createdAt: row.createdAt,
    author: row.user,
  };
}

/** Converts a Prisma staff rating row into the public API shape. */
export function toPublicStaffRating(row: StaffRatingRow): PublicStaffRating {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    appointmentId: row.appointmentId,
    customer: row.customer,
  };
}
