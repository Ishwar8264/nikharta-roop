# Salon verification

The current policy uses manual official-source review. File uploads, valid PAN-like text, OCR and document labels do not establish authenticity. No automatic approval or external identity verification integration is enabled.

## Required proofs

Each submission needs distinct private uploads for PAN, applicable shop registration/licence, salon entrance with signboard, and salon interior. GST is optional. "Shop license" includes the applicable registration/intimation or municipal licence for that jurisdiction; it is a platform proof category, not a claim that the same licence is mandatory everywhere in India.

The reviewer verifies the applicant's identity and authority to represent the business, business registration with its issuer, salon address and premises photos. Differences between a brand name and a legal entity name require supporting evidence. Do not approve based only on a visual resemblance to an identity document.

## Private upload contract

- The owner requests a signed, non-overwritable Cloudinary authenticated upload in a reserved owner/salon namespace.
- The server queries Cloudinary directly before registration. Only decoded image resources in JPG, PNG, WebP or AVIF, with positive dimensions and at most 5 MB, are registered.
- Submissions contain `{ kind, mediaId }`, never an arbitrary URL. The database rechecks current ownership, salon attachment, private purpose and deletion state.
- Verification assets are excluded from the general media library and cannot be registered or deleted through the general media service.
- Owner/manager and super admin viewers access an application document route. That route authorizes every request and returns a no-store redirect to a download URL expiring in 60 seconds. Private previews bypass Next.js image optimization.
- Existing public uploads are not made private retroactively. Legacy submissions must be replaced with private proofs before approval.

## Publication gate

Approval requires a SUPER_ADMIN who is not a member of the salon, a complete pending submission, the exact `expectedUpdatedAt` timestamp from the reviewed version, all five review attestations, identity lookup source/reference, business issuing authority/reference and meaningful review notes. Avoid full PAN/Aadhaar numbers in notes.

Submission, review and salon identity/location edits lock the same salon row. Stale or repeated approval fails instead of publishing a different submission. Review evidence and the exact document snapshot are stored in `SalonVerificationReview` in the same transaction as the decision and publication change.

Identity or location changes clear the existing submission, hide the salon and require updated proofs. A suspended salon stays suspended. Normal description/gallery edits preserve verification.

These controls prevent approval without recorded review, untrusted file references and accidental stale decisions. Review attestations remain assertions by a trusted reviewer; they do not cryptographically establish authenticity. An authorised verification provider or issuer integration is needed before implementing automated approval. Provider failure or an inconclusive match must remain pending/manual review.

## Deployment

Run `pnpm exec prisma migrate deploy` and regenerate the Prisma client. Existing Cloudinary environment variables are used; the API credentials need authenticated-image upload, resource lookup and private-download access. Test private delivery and a complete four-proof submission in the deployed environment before onboarding users.

Run the opt-in transaction tests against a local database with `RUN_VERIFICATION_DATABASE_TESTS=1 pnpm exec vitest run tests/verification-database.test.ts`. They create isolated synthetic fixtures and remove them afterward; they refuse a non-local database. A live synthetic Cloudinary check confirmed unsigned delivery and expired links return 401, while the authorised expiring download returns 200. Cloudinary's upload response itself includes a signed URL, so anonymous-access checks must remove that signature first.

## Official references

- [Income Tax PAN verification](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/verify-your-pan)
- [GST taxpayer lookup](https://tutorial.gst.gov.in/userguide/taxpayersdashboard/Search_Taxpayer_manual.htm)
- [Cloudinary authenticated media](https://cloudinary.com/documentation/control_access_to_media)
- [Cloudinary upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Cloudinary resource lookup](https://cloudinary.com/documentation/admin_api)
- [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
