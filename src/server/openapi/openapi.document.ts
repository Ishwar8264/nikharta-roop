import "server-only";

import type { OpenAPIV3_1 } from "openapi-types";

import { adminPaths, adminSchemas } from "./admin.openapi";
import { aiPaths, aiSchemas } from "./ai.openapi";
import { appointmentPaths, appointmentSchemas } from "./appointment.openapi";
import { auditPaths, auditSchemas } from "./audit.openapi";
import { authPaths, authSchemas } from "./auth.openapi";
import { blogPaths, blogSchemas } from "./blog.openapi";
import { catalogPaths, catalogSchemas } from "./catalog.openapi";
import {
  commonParameters,
  commonResponses,
  commonSchemas,
  commonSecuritySchemes,
} from "./common.openapi";
import { couponPaths, couponSchemas } from "./coupon.openapi";
import {
  customerNotePaths,
  customerNoteSchemas,
} from "./customer-note.openapi";
import { favoritePaths, favoriteSchemas } from "./favorite.openapi";
import { loyaltyPaths, loyaltySchemas } from "./loyalty.openapi";
import { mediaPaths, mediaSchemas } from "./media.openapi";
import { notificationPaths, notificationSchemas } from "./notification.openapi";
import { oauthPaths, oauthSchemas } from "./oauth.openapi";
import { packagePaths, packageSchemas } from "./package.openapi";
import { paymentPaths, paymentSchemas } from "./payment.openapi";
import { productPaths, productSchemas } from "./product.openapi";
import { reviewPaths, reviewSchemas } from "./review.openapi";
import { salonPaths, salonSchemas } from "./salon.openapi";
import { servicePaths, serviceSchemas } from "./service.openapi";
import { settingsPaths, settingsSchemas } from "./settings.openapi";
import { staffPaths, staffSchemas } from "./staff.openapi";
import { systemPaths, systemSchemas } from "./system.openapi";
import {
  verificationPaths,
  verificationSchemas,
} from "./verification.openapi";

/**
 * Builds the public OpenAPI contract consumed by Swagger UI and API clients.
 *
 * Why:
 * Keeping the contract in one server-only module prevents the interactive UI
 * and the machine-readable `/api-docs` response from drifting apart. Each
 * resource area owns its paths + schemas in its own module file and is
 * assembled here, so this file stays a small, auditable index.
 */
export function getOpenApiDocument(): OpenAPIV3_1.Document {
  return {
    openapi: "3.1.0",
    info: {
      title: "Nikharta Roop API",
      version: "1.0.0",
      description:
        "Salon marketplace API — discover salons, book appointments, manage " +
        "catalog, packages, coupons, payments, and verification.\n\n" +
        "**Quick start**\n" +
        "- Public endpoints (salon directory, catalog, packages) need no auth.\n" +
        "- For everything else, sign in via `/api/v1/auth/login` and use the " +
        "returned `accessToken` (Authorize button → bearerAuth), or rely on " +
        "the httpOnly cookie for browser flows.\n" +
        "- Cookie-authenticated mutations additionally require the " +
        "`x-csrf-token` header copied from the `csrfToken` cookie.\n" +
        "- All lists are cursor-paginated (`meta.nextCursor`).",
      contact: {
        name: "Nikharta Roop",
        email: "nikharta.roop.salon@gmail.com",
      },
    },
    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],
    tags: [
      { name: "Authentication", description: "User identity operations" },
      { name: "System", description: "Service availability operations" },
      { name: "Salons", description: "Salon directory and management" },
      { name: "Services", description: "Salon service catalogue" },
      { name: "Products", description: "Salon product catalogue" },
      {
        name: "Staff",
        description: "Salon staff, schedules, leaves, and skills",
      },
      {
        name: "Salon Working Hours",
        description: "Weekly opening hours for a salon",
      },
      {
        name: "Appointments",
        description: "Booking, availability, lifecycle, and payment operations",
      },
      {
        name: "Reviews & Ratings",
        description: "Service, product, and staff feedback",
      },
      {
        name: "Favorites",
        description: "Saved salons, services, and products",
      },
      {
        name: "Loyalty",
        description: "Points ledger, balance, and redemption",
      },
      {
        name: "Notifications",
        description: "User inbox and delivery attempts",
      },
      {
        name: "Media",
        description: "Private media library and Cloudinary asset metadata",
      },
      {
        name: "Blog",
        description: "Blog posts, comments, categories, and tags",
      },
      { name: "Audit", description: "Platform audit trail (SUPER_ADMIN only)" },
      { name: "AI", description: "Chat with the AI assistant" },
      {
        name: "Admin",
        description: "Platform administration (SUPER_ADMIN only)",
      },
      { name: "Coupons", description: "Discount coupons and validation" },
      {
        name: "OAuth",
        description: "Social sign-in via Google, Apple, and Facebook",
      },
      {
        name: "Catalog & Activation",
        description:
          "Platform service/package templates and salon activation (5-minute onboarding)",
      },
      {
        name: "Packages",
        description: "Salon combos and bridal packages",
      },
      {
        name: "Verification",
        description:
          "Salon KYC — owner submits documents, SUPER_ADMIN approves",
      },
      {
        name: "Payments",
        description:
          "Advance / final / refund transactions with idempotent retries",
      },
      {
        name: "Salon Settings",
        description:
          "Buffer time, advance booking window, cancellation rules, walk-ins",
      },
      {
        name: "Customer Notes",
        description: "Internal staff notes about customers",
      },
    ],
    paths: {
      ...authPaths,
      ...salonPaths,
      ...servicePaths,
      ...productPaths,
      ...staffPaths,
      ...systemPaths,
      ...oauthPaths,
      ...couponPaths,
      ...catalogPaths,
      ...packagePaths,
      ...verificationPaths,
      ...paymentPaths,
      ...settingsPaths,
      ...customerNotePaths,
      ...adminPaths,
      ...aiPaths,
      ...auditPaths,
      ...blogPaths,
      ...notificationPaths,
      ...loyaltyPaths,
      ...appointmentPaths,
      ...reviewPaths,
      ...favoritePaths,
      ...mediaPaths,
    },
    components: {
      securitySchemes: {
        ...commonSecuritySchemes,
      },
      responses: {
        ...commonResponses,
      },
      parameters: {
        ...commonParameters,
      },
      schemas: {
        ...commonSchemas,
        ...authSchemas,
        ...salonSchemas,
        ...serviceSchemas,
        ...productSchemas,
        ...staffSchemas,
        ...systemSchemas,
        ...oauthSchemas,
        ...couponSchemas,
        ...catalogSchemas,
        ...packageSchemas,
        ...verificationSchemas,
        ...paymentSchemas,
        ...settingsSchemas,
        ...customerNoteSchemas,
        ...adminSchemas,
        ...aiSchemas,
        ...auditSchemas,
        ...blogSchemas,
        ...notificationSchemas,
        ...loyaltySchemas,
        ...appointmentSchemas,
        ...reviewSchemas,
        ...favoriteSchemas,
        ...mediaSchemas,
      },
    },
  };
}
