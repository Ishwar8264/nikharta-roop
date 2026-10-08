# Nikharta Roop — Frontend Wiring & UI/UX Implementation Spec (Phase A)

> **Purpose:** This is the AI-implementable blueprint for wiring the Phase A marketplace UI. Follow it top-to-bottom: design system → conventions → page specs → acceptance checks. Implement nothing that contradicts this document.
>
> **Grounding:** Verified against [Booking App UX patterns (Appy Pie)](https://www.appypie.com/blog/booking-app-ux-patterns), [India D2C checkout conversion patterns (Shiprocket)](https://checkout.shiprocket.in/blog/ayurvedic-d2c-brand-achieved-47-percent-checkout-conversion-using-fastrr/), [Next.js SEO rendering strategies (Arc)](https://arc.dev/employer-blog/next-js-seo-rendering-strategies/), and the Next 16 docs shipped in `node_modules/next/dist/docs/01-app/` (server/client components, metadata, caching).

---

## 1. Design System (already in the codebase — reuse, never invent)

**Tokens** (`src/app/globals.css`, oklch-based, light theme warm ivory + dark theme):

| Token | Value | Use |
| --- | --- | --- |
| `--background` | warm ivory | page background |
| `--primary` | confident warm rose | primary buttons, links, active states |
| `--secondary` | deep plum | depth elements, secondary headers |
| `--accent` | warm gold | highlights, premium badges, rating stars |
| `--success` / `--warning` / `--info` / `--destructive` | semantic | status pills, banners, form feedback |
| `--rating`, `--available`, `--booked`, `--blocked` | salon-specific | booking UI only |
| `--radius-*`, `--font-sans` (Inter), `--font-heading` (Playfair Display) | | |

**Rules:**
- Always use Tailwind token classes (`bg-primary text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-card`). Never hardcode hex/oklch in components.
- Headings: `font-heading` (Playfair). Body: default Inter.
- Buttons: `src/components/ui/button.tsx` variants — `default` (primary), `outline`, `secondary`, `ghost`, `destructive`, `link`; sizes `sm`, `default`, `lg`, `icon`.
- Cards: `rounded-xl border border-border bg-card p-5` (existing manage pages use this).
- **Reuse existing components** — `components/ui/*` (dialog, select, switch, tabs, skeleton, badge, sonner toasts, avatar, tooltip, sheet) and `components/shared/*` (`empty-state`, `form-header`, `section-heading`, `pagination`, `nav-link`, `filter-chips`, `search-input`, `rich-text-editor`, `clear-link`, `coming-soon`). Do not create duplicates.

---

## 2. India-First UX Principles (apply to EVERY screen)

1. **Mobile-first.** Salon owners run their shop on a phone. Every manage screen must be fully usable at 360px width. Desktop gets wider grids, never different flows.
2. **₹ formatting everywhere.** Use `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })` (see `appointmentPriceFormatter` in `src/features/appointment/format.ts`). Format as `₹1,299`, not `Rs. 1299`.
3. **UPI-first payment language.** Show "UPI" before card options. "Advance token" (token booking) is a familiar Indian concept — label it clearly: "Book with ₹200 advance".
4. **Low-data friendly.** No autoplaying video, no giant hero images on manage pages, lazy-load images, skeleton loaders instead of spinners.
5. **Zero dead ends.** Every empty state gets one primary action ("Add your first package", "Submit documents", "Browse templates").
6. **Confirm destructive actions.** Deactivate/delete always gets a dialog with the item name and a typed consequence ("Customers will no longer see this package").
7. **Feedback on every action.** Use `sonner` toasts (`toast.success` / `toast.error`) for mutations; inline field errors for validation.
8. **Optimistic UI only where safe.** Toggle switches (active/inactive) may optimistically flip and roll back on error; money-moving actions never.
9. **Trust signals.** Verification status is shown as a colored badge everywhere the salon owner acts: `PENDING` (warning), `VERIFIED` (success), `REJECTED` (destructive), `SUSPENDED` (destructive).
10. **Progress over perfection.** Multi-step flows (verification submit, package create) show a clear step indicator.

---

## 3. Content Guidelines (English, grammatically correct)

- Tone: warm, direct, second person ("Add your services"). No slang, no ALL-CAPS, no exclamation spam.
- Title case for headings and buttons ("Submit Documents"), sentence case for descriptions.
- Currency always INR, dates `d MMM yyyy, h:mm a` (e.g. "12 Oct 2026, 4:30 pm"), timezone Asia/Kolkata.
- Every page `title` + `description` in metadata; every form input has a `<Label>` and helper text.
- Error copy must say what happened + what to do: "This code has expired. Request a new one."

---

## 4. Architecture Conventions (follow the existing codebase exactly)

| Concern | Convention |
| --- | --- |
| Public pages | Server Components in `src/app/(public)/salons/...` — call the service layer directly (see `salons/page.tsx`), never self-fetch `/api/v1`. |
| Manage pages | Server Components in `src/app/(public)/salons/[slug]/manage/...` — same direct service calls; mutations via Client Components using `api` from `@/lib/api/backend.client` (CSRF + refresh handled automatically). |
| Feature code | `src/features/<name>/{api,hooks,components,types,schemas,constants,index.ts}` — mirror `features/salon` and `features/appointment`. |
| Forms | `react-hook-form` + zod resolver; reuse the zod schemas from `src/server/modules/*/*.schema.ts` via shared exports (see `features/auth/shared/schemas.ts` pattern). |
| Routes | Add every new path to `src/config/routes.ts` as a function; never hardcode URLs in components. |
| Loading/Error | Every async page gets `loading.tsx` (skeletons) and `error.tsx` (branded retry — copy `salons/[slug]/error.tsx`). |
| SEO | `export const metadata` per page; canonical via `alternates`; JSON-LD via `src/lib/seo/json-ld.tsx`; keep `robots.ts` / `sitemap.ts` updated with new public routes. |
| Empty/stub pages | Replace `coming-soon.tsx` usages as features land; never leave a wired feature on a coming-soon page. |

---

## 5. Route Map (new pages)

Add to `src/config/routes.ts`:

```ts
// Salon manage — Phase A
salonPackages: (slug) => `/salons/${slug}/packages`,                    // public
salonPackagesManage: (slug) => `/salons/${slug}/manage/packages`,
salonPackageEdit: (slug, id) => `/salons/${slug}/manage/packages/${id}`,
salonPackageCreate: (slug) => `/salons/${slug}/manage/packages/create`,
salonTemplatesManage: (slug) => `/salons/${slug}/manage/templates`,     // activation
salonVerification: (slug) => `/salons/${slug}/manage/verification`,
salonCouponsManage: (slug) => `/salons/${slug}/manage/coupons`,
salonSettingsManage: (slug) => `/salons/${slug}/manage/settings`,
salonCustomerNotes: (slug, customerId) => `/salons/${slug}/manage/customers/${customerId}/notes`,
// Admin
adminSalonVerification: "/admin/salons/verification",                    // review queue (admin layout)
```

---

## 6. Feature Specs

### 6.1 Catalog Activation (`/salons/[slug]/manage/templates`)

**Owner story:** "I joined, now give me my menu in 5 minutes."

**Layout (mobile-first):**
1. Header: "Activate your services" + explanation "Turn on what you offer and set your price. Customers see only active items."
2. Filter chips: All / Services / Packages + search box (filters client-side).
3. Card grid (1 col mobile → 2 col tablet → 3 col desktop). Each template card: icon, name, category, **price input (₹)** pre-filled with the platform's suggested city price, toggle switch.
4. Toggle ON with no price → show inline error and focus the price input (never block the whole card).
5. Progress hint: "You've activated 8 of 13 templates."

**Wiring:**
- Page (Server Component): `listCatalogTemplates()` from `catalog.service` + `listSalonActivatedTemplates(slug)` — merge client-side by `template.id`.
- Mutations (Client Component): `features/catalog/api.ts`
  - `activateTemplateApi(salonRef, { templateKey, price })` → `POST /salons/{ref}/templates`
  - `updateActivationApi(salonRef, templateKey, { price?, isActive? })` → `PATCH /salons/{ref}/templates/{key}`
  - `deactivateTemplateApi(salonRef, templateKey)` → `DELETE /salons/{ref}/templates/{key}`
- Optimistic toggle with rollback; price saves on blur (`onBlur`) with debounce + toast.

**Acceptance:** activating/deactivating updates the public salon page immediately (after `router.refresh()`); no duplicate template cards; price shows ₹ format.

---

### 6.2 Packages — Public (`/salons/[slug]/packages`)

**Customer story:** "Show me combos — bridal package with everything included."

**Layout:** section heading "Packages & Combos" → horizontal cards: name, "Includes: Hair, Makeup, Nails" (chips of linked services), duration ("2 hr 30 min"), **price + strikethrough savings** ("₹9,999 ₹12,499 — Save 20%") only when total of individual services > package price, CTA "Book this package" → links to `/salons/[slug]/book?package=ID` (booking page later reads the param).

**SEO:** canonical to salon page's package tab URL; JSON-LD `Offer`/`Product` for the top 5 packages; `metadata` per package not needed (client navigation), but keep URL shareable.

**Wiring:** Server Component calls `listSalonPackageCatalog(slug, { limit: 20 })`; `getPublicPackage` for detail. No client fetch.

**Acceptance:** soft-deleted/inactive packages never appear; empty state: "This salon hasn't added packages yet."

### 6.3 Packages — Manage (`/salons/[slug]/manage/packages[/...]`)

**Owner story:** "Create a bridal package, edit price, hide it off-season."

- **List page:** table on desktop / cards on mobile; columns: name, price, duration, status badge (Active/Inactive), actions (Edit, Deactivate/Activate). "New package" primary button.
- **Create/Edit page:** form fields — name, slug (auto-suggested from name, editable), price (₹, numeric), duration (minutes with "hr min" helper), isActive switch, **service multi-select** (searchable checkbox list of the salon's active services, grouped by category; reuse `select`/`sheet`). On create, show live total of selected services vs package price + computed savings badge.
- **Delete:** dialog "Remove this package? Customers will no longer see it." → soft delete via API.

**Wiring:** `features/package/api.ts` — `createPackageApi(salonRef, body)`, `updatePackageApi(salonRef, id, body)`, `deletePackageApi(salonRef, id)` → `POST/PATCH/DELETE /salons/{ref}/packages[/{id}]`. List page calls service directly with `includeInactive: true` (manager view).

**Acceptance:** slug conflict shows 409 message inline; serviceIds must belong to the salon (400 shows "One or more services do not belong to this salon").

### 6.4 Verification (`/salons/[slug]/manage/verification`)

**Owner story:** "Submit my license and photos, see why I got rejected, resubmit."

**Status banner (top):** colored per status with next action.
- `PENDING`: "We're reviewing your documents. Usually takes 1–2 days." (warning)
- `VERIFIED`: "Your salon is verified ✓" (success)
- `REJECTED`: reason from API + "Fix and resubmit" button (destructive)
- `SUSPENDED`: reason + "Contact support" mailto link (destructive)
- No row yet: onboarding step.

**Submit flow (2 steps):** Step 1 — upload documents: Shop license (required), PAN (optional), 2 salon photos (required) via existing media uploader (`features/media`). Step 2 — review + submit. After submit → PENDING banner + toast.

**Admin review UI** (`/admin/salons/verification`): queue list of PENDING salons (name, city, submittedAt, docs preview links) → review sheet: document thumbnails, Approve / Reject+reason (textarea required) / Suspend+reason. Post → toast + remove from queue.

**Wiring:** `features/verification/api.ts` — `getVerificationApi(salonRef)`, `submitVerificationApi(salonRef, { documents })`, `reviewVerificationApi(salonRef, { status, reason? })` → the three verification endpoints. Owner pages are Server Components (direct service); admin queue likewise; mutations client-side.

**Acceptance:** after admin approves, salon's public pages show the "Verified" badge and `isActive` becomes true (verify via API response).

### 6.5 Salon Coupons (`/salons/[slug]/manage/coupons`)

**Owner story:** "Run a Diwali offer: GLOW20 — 20% off above ₹999, max 200 off, 100 uses."

- **List:** code (monospace uppercase), discount summary ("20% off · min ₹999 · max ₹200 off"), validity window, usage "23/100 used", active switch, edit, deactivate dialog.
- **Create/Edit form:** code (uppercase auto, min 3 chars), discount type radio (Percentage/Flat), discountValue, minOrderAmount, maxDiscount (only %), usageLimit, perUserLimit, validFrom/validUntil (date-time inputs), isActive.
- Show validation errors inline from the shared `createCouponSchema` messages.

**Wiring:** `features/coupon/api.ts` (extend existing if present) — salon-scoped endpoints `GET/POST /salons/{ref}/coupons`, `PATCH/DELETE /salons/{ref}/coupons/{id}`. List via server component (`listSalonCoupons`).

**Acceptance:** a salon coupon applies only at that salon (booking validate with wrong salon → "This coupon is not valid for this salon").

### 6.6 Payment Transactions (appointment detail ledger)

**Customer story:** "I paid ₹200 advance online, ₹800 at the salon — show me the record."

**UI on `/appointments/[id]`** (extend existing page): "Payments" card listing transactions (type badge: Advance/Final/Refund, amount, method, date) + running totals: Paid so far, Balance due (totalPrice − collected), Refunded.

**Salon side** (later manage screen): "Record payment" dialog on the appointment — type select (Advance/Final/Refund), amount (₹), method (UPI/Cash/Card), optional gateway ref; sends a generated `idempotencyKey` (kept for retries: on 409, show "This payment was already recorded" and refresh instead of erroring). Refund amount capped at collected (400 message shown).

**Wiring:** `features/payment/api.ts` — `listTransactionsApi(appointmentId)`, `recordTransactionApi(appointmentId, body)` → `/appointments/{id}/transactions`.

**Acceptance:** double-click on "Record" creates exactly one transaction (409 handled gracefully).

### 6.7 Salon Settings (`/salons/[slug]/manage/settings`)

**Owner story:** "Keep 10 minutes between appointments, take ₹200 advance, no walk-ins on Sundays."

**Form (single card, grouped sections):**
- Booking: bufferMinutes (5-step slider 0–30 + number), advanceBookingDays (number), cancellationWindowHours (number).
- Payments: acceptsAdvancePayments switch + noShowFee (₹, nullable — clear button sets null).
- Walk-ins: walkInsAllowed switch.
- Save button (sticky bottom on mobile) → toast. Show current defaults when the row is freshly created (create-on-read means the page always renders values).

**Wiring:** `features/salon-settings/api.ts` — `getSettingsApi`, `updateSettingsApi` → `GET/PATCH /salons/{ref}/settings`. Page is a Server Component; the form is a Client Component receiving the settings as props.

**Acceptance:** every field persists independently; PATCH with no fields is blocked by schema (client disables Save when untouched).

### 6.8 Customer Notes (`/salons/[slug]/manage/customers/[customerId]/notes`)

**Owner story:** "This customer is allergic to ammonia color — remind my staff."

**UI:** linked from an appointment's customer row. Timeline list (newest first) of notes with author name + time; composer textarea (2k chars) + "Add note"; delete (trash icon) with confirm dialog, visible only to the author or managers.

**Wiring:** `features/customer-note/api.ts` — `listNotesApi(salonRef, customerId)`, `createNoteApi(salonRef, customerId, { note })`, `deleteNoteApi(salonRef, customerId, noteId)`.

**Acceptance:** staff cannot delete another staff's note (403 → toast "You do not have permission to delete this note").

---

## 7. SEO Plan (public pages only)

| Page | metadata | canonical | JSON-LD |
| --- | --- | --- | --- |
| `/salons/[slug]/packages` | "{Salon} Packages & Combos in {City} | Nikharta Roop" | self | `Offer` list |
| `/salons/[slug]` (updated) | add packages + services in description | self | `LocalBusiness` (exists in `json-ld.tsx`) |
| `/salons` (listing) | unchanged | self | — |

- Update `src/app/sitemap.ts` to include package URLs once public pages exist.
- Keep all public detail pages `force-dynamic` today (root layout session fetch); do not add `revalidate` until the session is moved out of the root layout (see `docs/future-plan.md`).

## 8. Accessibility & Performance Checklist

- Every interactive element is keyboard-reachable; dialogs focus-trap (base-ui handles).
- Color contrast: use `text-muted-foreground` for secondary text only; never pure gray on ivory.
- Images: `next/image` with `sizes`; uploads go through the media library with compression.
- Skeletons for all async content (`components/ui/skeleton.tsx`).
- No layout shift: reserve space for images (aspect ratios on cards).
- `aria-label` on icon-only buttons (delete, edit, toggle).

## 9. Implementation Order (wire in this sequence)

1. `routes.ts` additions + `features/*/api.ts` modules (pure wiring, no UI).
2. Catalog activation page (highest onboarding value).
3. Packages (public + manage) — flagship revenue feature.
4. Verification (owner + admin queue).
5. Salon coupons.
6. Payment transactions ledger (extend appointment detail).
7. Salon settings.
8. Customer notes.
9. Remove each feature from `coming-soon` config as it lands; update `sitemap.ts`; final SEO pass.

## 10. Done-Definition (per feature)

- [ ] Routes added to `src/config/routes.ts`; no hardcoded URLs.
- [ ] `features/<name>/api.ts` uses the existing `api` client (CSRF/refresh automatic).
- [ ] Page has `loading.tsx` and `error.tsx`; empty state has an action.
- [ ] `metadata` export on public pages; canonical set.
- [ ] Mutations have toasts; destructive actions have dialogs.
- [ ] `tsc --noEmit`, `pnpm lint`, `pnpm build` all pass.
- [ ] Manual checks from each feature's Acceptance section verified with seeded data.
