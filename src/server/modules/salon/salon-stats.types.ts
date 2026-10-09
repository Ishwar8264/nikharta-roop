/**
 * At-a-glance stats surfaced to a salon owner on their dashboard.
 *
 * Why a dedicated type file:
 * The shape is consumed by both the server module (the stats service) and
 * the dashboard feature (the server component that renders it). Keeping the
 * type in its own file under `salon/` mirrors the other salon types
 * (`PublicSalon`, `SalonWithViewerRole`, etc.) and avoids a circular import
 * between the service and the feature layer — the feature imports the type
 * only, never the service module.
 */
export interface SalonOwnerStats {
  /** The salon the stats describe — never null when the caller owns one. */
  salon: {
    id: string;
    slug: string;
    name: string;
    city: string;
  };
  /** Today's appointment counts broken down by lifecycle state. */
  todaysAppointments: {
    /** Sum of upcoming + in-progress + completed today. */
    total: number;
    /** SCHEDULED or CONFIRMED with startTime in the future. */
    upcoming: number;
    inProgress: number;
    completed: number;
  };
  /**
   * Sum of `totalPrice` for COMPLETED appointments whose startTime falls in
   * the current ISO week (Monday 00:00 to Sunday 23:59, salon timezone).
   */
  thisWeekRevenue: number;
  /** True when verification status is PENDING or has never been submitted. */
  pendingVerification: boolean;
  /** Count of active (non-deleted, isActive=true) services. */
  activeServices: number;
  /** Count of active packages. */
  activePackages: number;
}
