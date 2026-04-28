# Prisma Model Map

This schema is designed for a Hindi-first beauty parlour platform with web, mobile, admin, booking, payment, and branch operations.

## Core Identity

- `User`: customer, staff, admin, and super admin accounts.
- `AuthOtp`: OTP lifecycle for login, signup, and phone verification.
- `AuthSession`: JWT/session tracking and token revocation.
- `AuthEvent`: audit trail for signup, login, logout, OTP, and suspension events.

## Parlour Operations

- `Branch`, `BranchHoliday`: multi-branch locations, timings, holidays, and local operations.
- `ServiceCategory`, `Service`, `ServiceVariant`: service catalog with Hindi/English names, variants such as basic/gold/diamond facial, and pricing.
- `ServiceAddOn`, `BookingAddOn`: optional extras such as hair wash, premium products, nail art, draping, and other add-ons.
- `Package`, `PackageService`: bridal and premium combo packages, including custom packages.
- `Consultation`: bride-to-be and pre-service consultation workflow.
- `PortfolioItem`, `MediaAsset`: before/after photos, bridal gallery, staff work, service images, Cloudinary/S3 metadata, and SEO alt text.

## Booking And Revenue

- `Booking`, `BookingStatusHistory`: appointment lifecycle, status changes, slot timing, assigned staff, service/package selection, and audit history.
- `Payment`, `Refund`: Razorpay/cash/offline payment tracking, webhook payloads, refunds, and cancellation recovery.
- `Offer`, `OfferService`, `OfferRedemption`: promo codes, seasonal offers, usage limits, and discount application.
- `LoyaltyTransaction`: points earned, redeemed, adjusted, or deducted.
- `RevenueSnapshot`: daily branch revenue rollups for admin dashboards.

## Staff And Admin

- `Staff`, `StaffService`, `StaffLeave`: staff profiles, specializations, schedules, service eligibility, and leave periods.
- `StaffCommission`: booking/product-sale commission payout tracking.
- `Expense`: branch expenses such as rent, salary, product purchase, utilities, marketing, and maintenance.

## Products And Inventory

- `ProductCategory`, `Product`, `ProductSale`, `ProductSaleItem`: beauty product catalog and in-parlour product sales.
- `InventoryItem`, `InventoryTransaction`: stock, service consumption, sale consumption, wastage, adjustments, and purchase entries.

## Growth And Content

- `Review`: one review per booking, with staff/service/package linkage and moderation support.
- `Notification`: WhatsApp, SMS, email, and push delivery audit.
- `BlogCategory`, `BlogPost`: Hindi SEO blog content.
- `CustomerAddress`: future home-service and delivery-ready address support.

## Rich Editor Storage

For editable descriptions, keep three fields when rich formatting is needed:

- `*Hi`: plain Hindi text summary for search, snippets, SMS, WhatsApp, and fallback display.
- `*Json`: canonical rich editor document, for example TipTap JSON.
- `*Html`: sanitized cached HTML for fast rendering and SEO.

This pattern is used for service descriptions, variants, add-ons, packages, offers, blogs, reviews, notes, portfolio descriptions, media alt text, products, inventory notes, expenses, refunds, and staff bios.

Never render user/admin-provided HTML without sanitizing it first.

## Slug Policy

- Branch-owned records use branch-aware slugs, for example `Service`, `Package`, and `Product`: `@@unique([branchId, slug])`.
- Optional branch/global categories use `slugScope` plus `slug`: `@@unique([slugScope, slug])`.
- Use `slugScope = "global"` for shared categories.
- Use `slugScope = branchId` for branch-specific categories.
- SEO content such as `BlogCategory` and `BlogPost` keeps globally unique slugs.

## Validation

Validated with:

```bash
DATABASE_URL='postgresql://user:pass@localhost:5432/nikharta_roop?schema=public' pnpm dlx prisma@6 validate --schema prisma/schema.prisma
```
