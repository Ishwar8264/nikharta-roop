/** Platform proof requirements; registry verification remains a separate review step. */
export const VERIFICATION_DOCUMENT_KINDS = [
  "Shop license",
  "PAN",
  "GST certificate",
  "Salon photo 1",
  "Salon photo 2",
] as const;
export const REQUIRED_DOCUMENT_KINDS = [
  "PAN",
  "Shop license",
  "Salon photo 1",
  "Salon photo 2",
] as const;
export const VERIFICATION_MAX_BYTES = 5 * 1024 * 1024;
export const VERIFICATION_FORMATS = ["jpg", "png", "webp", "avif"] as const;

export const REVIEW_CHECKS = [
  {
    key: "identityVerified",
    label:
      "PAN checked against an official source; identity matches the applicant.",
  },
  {
    key: "businessVerified",
    label:
      "Applicable registration checked with its issuing authority; business details match.",
  },
  {
    key: "authorityVerified",
    label:
      "Applicant is the owner or an authorised representative of this business.",
  },
  {
    key: "addressMatched",
    label: "Business records and premises evidence match the salon address.",
  },
  {
    key: "premisesVerified",
    label: "Entrance, signboard and interior photos match this salon.",
  },
] as const;
