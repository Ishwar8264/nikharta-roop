import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Columns returned for public service/product reviews. */
const PUBLIC_REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  images: true,
  createdAt: true,
  user: {
    select: { id: true, name: true, avatar: true },
  },
} as const;

/** Columns returned for public staff ratings. */
const PUBLIC_STAFF_RATING_SELECT = {
  id: true,
  staffId: true,
  rating: true,
  comment: true,
  createdAt: true,
  appointmentId: true,
  customer: {
    select: { id: true, name: true, avatar: true },
  },
} as const;

/** Confirms a service exists, is active, and was not soft-deleted. */
export async function serviceExists(serviceId: string): Promise<boolean> {
  const row = await prisma.service.findFirst({
    where: { id: serviceId, isActive: true, deletedAt: null },
    select: { id: true },
  });
  return row !== null;
}

/** Confirms a product exists and was not soft-deleted. */
export async function productExists(productId: string): Promise<boolean> {
  const row = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
    select: { id: true },
  });
  return row !== null;
}

/** Confirms an active user belongs to at least one salon team. */
export async function staffExists(userId: string): Promise<boolean> {
  const row = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      salonMemberships: { some: {} },
    },
    select: { id: true },
  });
  return row !== null;
}

/** Loads the appointment for staff rating with the fields we validate against. */
export async function findAppointmentForRating(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      customerId: true,
      staffId: true,
      salonId: true,
    },
  });
}

/**
 * Cursor-paginated reviews for a service.
 *
 * Why:
 * Sort options are exposed as enums rather than raw Prisma orderBy objects so
 * the caller cannot pass an arbitrary column through the API.
 */
export async function listServiceReviews(
  serviceId: string,
  input: {
    cursor?: string;
    limit: number;
    sort: "recent" | "rating_desc" | "rating_asc";
  },
) {
  const orderBy: Prisma.ServiceReviewOrderByWithRelationInput[] =
    input.sort === "rating_desc"
      ? [{ rating: "desc" }, { id: "asc" }]
      : input.sort === "rating_asc"
        ? [{ rating: "asc" }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "asc" }];

  const rows = await prisma.serviceReview.findMany({
    where: { serviceId },
    select: PUBLIC_REVIEW_SELECT,
    orderBy,
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Aggregated rating summary for a service. */
export async function serviceRatingSummary(serviceId: string) {
  const agg = await prisma.serviceReview.aggregate({
    where: { serviceId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return {
    average: agg._avg.rating ?? 0,
    count: agg._count._all,
  };
}

/** Loads a single review by id and returns it only if it belongs to the service. */
export async function findServiceReviewById(
  serviceId: string,
  reviewId: string,
) {
  return prisma.serviceReview.findFirst({
    where: { id: reviewId, serviceId },
    select: { id: true, userId: true },
  });
}

/** Upserts the caller's service review. */
export async function upsertServiceReview(input: {
  serviceId: string;
  userId: string;
  rating: number;
  comment: string | null;
  images: string[];
}) {
  return prisma.serviceReview.upsert({
    where: {
      serviceId_userId: { serviceId: input.serviceId, userId: input.userId },
    },
    update: {
      rating: input.rating,
      comment: input.comment,
      images: input.images,
    },
    create: {
      serviceId: input.serviceId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment,
      images: input.images,
    },
    select: { id: true },
  });
}

/** Partial update for the caller's service review. */
export async function updateServiceReview(
  reviewId: string,
  data: Prisma.ServiceReviewUpdateInput,
) {
  await prisma.serviceReview.update({
    where: { id: reviewId },
    data,
  });
}

/** Deletes a service review. */
export async function deleteServiceReview(reviewId: string): Promise<void> {
  await prisma.serviceReview.delete({ where: { id: reviewId } });
}

/** Loads a review with full author data for the response. */
export async function loadPublicServiceReview(reviewId: string) {
  return prisma.serviceReview.findUnique({
    where: { id: reviewId },
    select: PUBLIC_REVIEW_SELECT,
  });
}

// ---------- Product reviews ----------

export async function listProductReviews(
  productId: string,
  input: {
    cursor?: string;
    limit: number;
    sort: "recent" | "rating_desc" | "rating_asc";
  },
) {
  const orderBy: Prisma.ProductReviewOrderByWithRelationInput[] =
    input.sort === "rating_desc"
      ? [{ rating: "desc" }, { id: "asc" }]
      : input.sort === "rating_asc"
        ? [{ rating: "asc" }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "asc" }];

  const rows = await prisma.productReview.findMany({
    where: { productId },
    select: PUBLIC_REVIEW_SELECT,
    orderBy,
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

export async function productRatingSummary(productId: string) {
  const agg = await prisma.productReview.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return {
    average: agg._avg.rating ?? 0,
    count: agg._count._all,
  };
}

export async function findProductReviewById(
  productId: string,
  reviewId: string,
) {
  return prisma.productReview.findFirst({
    where: { id: reviewId, productId },
    select: { id: true, userId: true },
  });
}

export async function upsertProductReview(input: {
  productId: string;
  userId: string;
  rating: number;
  comment: string | null;
  images: string[];
}) {
  return prisma.productReview.upsert({
    where: {
      productId_userId: { productId: input.productId, userId: input.userId },
    },
    update: {
      rating: input.rating,
      comment: input.comment,
      images: input.images,
    },
    create: {
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment,
      images: input.images,
    },
    select: { id: true },
  });
}

export async function updateProductReview(
  reviewId: string,
  data: Prisma.ProductReviewUpdateInput,
) {
  await prisma.productReview.update({
    where: { id: reviewId },
    data,
  });
}

export async function deleteProductReview(reviewId: string): Promise<void> {
  await prisma.productReview.delete({ where: { id: reviewId } });
}

export async function loadPublicProductReview(reviewId: string) {
  return prisma.productReview.findUnique({
    where: { id: reviewId },
    select: PUBLIC_REVIEW_SELECT,
  });
}

// ---------- Staff ratings ----------

export async function listStaffRatings(
  staffId: string,
  input: {
    cursor?: string;
    limit: number;
    sort: "recent" | "rating_desc" | "rating_asc";
  },
) {
  const orderBy: Prisma.StaffRatingOrderByWithRelationInput[] =
    input.sort === "rating_desc"
      ? [{ rating: "desc" }, { id: "asc" }]
      : input.sort === "rating_asc"
        ? [{ rating: "asc" }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "asc" }];

  const rows = await prisma.staffRating.findMany({
    where: { staffId },
    select: PUBLIC_STAFF_RATING_SELECT,
    orderBy,
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/**
 * All ratings left for one appointment.
 *
 * Why no pagination:
 * The unique constraint on `(appointmentId, staffId)` caps this at one row
 * per staff member on the appointment — typically 0 or 1 row. A cursor would
 * be dead weight.
 */
export async function listStaffRatingsByAppointment(appointmentId: string) {
  return prisma.staffRating.findMany({
    where: { appointmentId },
    select: PUBLIC_STAFF_RATING_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

export async function staffRatingSummary(staffId: string) {
  const agg = await prisma.staffRating.aggregate({
    where: { staffId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return {
    average: agg._avg.rating ?? 0,
    count: agg._count._all,
  };
}

export async function findExistingStaffRating(
  appointmentId: string,
  staffId: string,
) {
  return prisma.staffRating.findUnique({
    where: { appointmentId_staffId: { appointmentId, staffId } },
    select: { id: true },
  });
}

export async function createStaffRating(input: {
  staffId: string;
  customerId: string;
  appointmentId: string;
  rating: number;
  comment: string | null;
}) {
  const row = await prisma.staffRating.create({
    data: {
      staffId: input.staffId,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      rating: input.rating,
      comment: input.comment,
    },
    select: { id: true },
  });
  return row.id;
}

export async function findStaffRatingById(ratingId: string) {
  return prisma.staffRating.findUnique({
    where: { id: ratingId },
    select: { id: true, customerId: true },
  });
}

export async function updateStaffRating(
  ratingId: string,
  data: Prisma.StaffRatingUpdateInput,
) {
  await prisma.staffRating.update({ where: { id: ratingId }, data });
}

export async function deleteStaffRating(ratingId: string): Promise<void> {
  await prisma.staffRating.delete({ where: { id: ratingId } });
}

export async function loadPublicStaffRating(ratingId: string) {
  return prisma.staffRating.findUnique({
    where: { id: ratingId },
    select: PUBLIC_STAFF_RATING_SELECT,
  });
}
