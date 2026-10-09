import { api } from "@/lib/api/backend.client";

import type {
  CreateStaffRatingBody,
  StaffRatingListResponse,
  StaffRatingMutationResponse,
  UpdateStaffRatingBody,
} from "./types";

export type {
  CreateStaffRatingBody,
  PublicStaffRating,
  RateableStaffMember,
  StaffRatingListResponse,
  StaffRatingMutationResponse,
  UpdateStaffRatingBody,
} from "./types";

/**
 * Client wrappers for the appointment-scoped staff rating endpoints.
 *
 * Why a separate file from `./api.ts`:
 * The service/product review helpers talk to `/services/{id}/reviews` and
 * `/products/{id}/reviews`; staff ratings live under `/appointments/{id}/
 * staff-ratings` and `/staff-ratings/{id}`. Splitting keeps each file's
 * path surface small and mirrors the server's review vs. staff-rating split.
 *
 * The staff being rated is implied by the appointment — the create endpoint
 * binds the rating to the appointment's primary staff server-side, so the
 * client never sends a `staffId`.
 */

/** Lists the caller's staff ratings for one appointment. */
export function listStaffRatingsApi(appointmentId: string) {
  return api
    .get<StaffRatingListResponse>(
      `/appointments/${encodeURIComponent(appointmentId)}/staff-ratings`,
    )
    .then((response) => response.data);
}

/**
 * Creates a staff rating for a completed appointment.
 *
 * The server enforces three invariants: the caller is the appointment
 * customer, the appointment is COMPLETED, and no rating exists yet. Each
 * surfaces as a distinct error status — the card maps them to user-facing
 * copy.
 */
export function createStaffRatingApi(
  appointmentId: string,
  body: CreateStaffRatingBody,
) {
  return api
    .post<StaffRatingMutationResponse>(
      `/appointments/${encodeURIComponent(appointmentId)}/staff-ratings`,
      body,
    )
    .then((response) => response.data.rating);
}

/** Patches the caller's own staff rating. */
export function updateStaffRatingApi(
  ratingId: string,
  body: UpdateStaffRatingBody,
) {
  return api
    .patch<StaffRatingMutationResponse>(
      `/staff-ratings/${encodeURIComponent(ratingId)}`,
      body,
    )
    .then((response) => response.data.rating);
}

/** Deletes the caller's own staff rating. */
export function deleteStaffRatingApi(ratingId: string) {
  return api.delete<{ message: string; data: null }>(
    `/staff-ratings/${encodeURIComponent(ratingId)}`,
  );
}
