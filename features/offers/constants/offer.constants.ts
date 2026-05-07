/**
 * Stable machine-readable codes returned by offer API responses.
 */
export const OFFER_CODES = {
  BRANCH_NOT_FOUND: "OFFER_BRANCH_NOT_FOUND",
  FORBIDDEN: "OFFER_FORBIDDEN",
  OFFER_CREATED: "OFFER_CREATED",
  OFFER_CREATE_FAILED: "OFFER_CREATE_FAILED",
  OFFER_DUPLICATE: "OFFER_DUPLICATE",
  OFFER_INVALID: "OFFER_INVALID",
  OFFER_REDEEMED: "OFFER_REDEEMED",
  OFFER_REDEEM_FAILED: "OFFER_REDEEM_FAILED",
  OFFER_REDEMPTION_DUPLICATE: "OFFER_REDEMPTION_DUPLICATE",
  OFFER_REDEMPTIONS_LISTED: "OFFER_REDEMPTIONS_LISTED",
  OFFER_REDEMPTIONS_LOAD_FAILED: "OFFER_REDEMPTIONS_LOAD_FAILED",
  OFFER_SERVICE_ASSIGNED: "OFFER_SERVICE_ASSIGNED",
  OFFER_SERVICE_ASSIGN_FAILED: "OFFER_SERVICE_ASSIGN_FAILED",
  OFFER_SERVICE_REMOVED: "OFFER_SERVICE_REMOVED",
  OFFER_SERVICE_REMOVE_FAILED: "OFFER_SERVICE_REMOVE_FAILED",
  OFFER_UPDATED: "OFFER_UPDATED",
  OFFER_UPDATE_FAILED: "OFFER_UPDATE_FAILED",
  OFFER_VALIDATED: "OFFER_VALIDATED",
  OFFERS_LISTED: "OFFERS_LISTED",
  OFFERS_LOAD_FAILED: "OFFERS_LOAD_FAILED",
  SERVICE_NOT_FOUND: "OFFER_SERVICE_NOT_FOUND",
  VALIDATION_ERROR: "OFFER_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with offer response codes.
 */
export const OFFER_MESSAGES = {
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  FORBIDDEN: "You do not have permission to manage this offer.",
  OFFER_CREATED: "Offer created successfully.",
  OFFER_CREATE_FAILED: "Could not create offer. Please try again later.",
  OFFER_DUPLICATE: "Offer code already exists.",
  OFFER_INVALID: "Offer is not valid for this request.",
  OFFER_REDEEMED: "Offer redeemed successfully.",
  OFFER_REDEEM_FAILED: "Could not redeem offer.",
  OFFER_REDEMPTION_DUPLICATE: "Offer has already been redeemed for this booking.",
  OFFER_REDEMPTIONS_LISTED: "Offer redemptions loaded successfully.",
  OFFER_REDEMPTIONS_LOAD_FAILED: "Could not load offer redemptions.",
  OFFER_SERVICE_ASSIGNED: "Offer service assigned successfully.",
  OFFER_SERVICE_ASSIGN_FAILED: "Could not assign offer service.",
  OFFER_SERVICE_REMOVED: "Offer service removed successfully.",
  OFFER_SERVICE_REMOVE_FAILED: "Could not remove offer service.",
  OFFER_UPDATED: "Offer updated successfully.",
  OFFER_UPDATE_FAILED: "Could not update offer. Please try again later.",
  OFFER_VALIDATED: "Offer validated successfully.",
  OFFERS_LISTED: "Offers loaded successfully.",
  OFFERS_LOAD_FAILED: "Could not load offers. Please try again later.",
  SERVICE_NOT_FOUND: "Selected service was not found for this offer branch.",
  VALIDATION_ERROR: "Please check the offer request and try again.",
} as const;
