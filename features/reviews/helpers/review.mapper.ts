type ReviewRow = {
  bookingId: string;
  commentHi: string | null;
  createdAt: Date;
  id: string;
  isApproved: boolean;
  photoUrls: string[];
  rating: number;
  service: { id: string; nameEn: string; nameHi: string } | null;
  staff: { id: string; user: { name: string | null } } | null;
  updatedAt: Date;
  user: { id: string; name: string | null };
};

/**
 * Converts a review row into the public review API shape.
 */
export function toPublicReview(review: ReviewRow) {
  return {
    bookingId: review.bookingId,
    commentHi: review.commentHi,
    createdAt: review.createdAt,
    id: review.id,
    isApproved: review.isApproved,
    photoUrls: review.photoUrls,
    rating: review.rating,
    service: review.service,
    staff: review.staff
      ? { id: review.staff.id, name: review.staff.user.name }
      : null,
    updatedAt: review.updatedAt,
    user: review.user,
  };
}
