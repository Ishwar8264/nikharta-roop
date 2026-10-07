# Nikharta Roop — Analysis & Improvement Report

Date: 2026-10-07 · Scope: full-stack review (security, performance, code quality) of the cloned repository.

## Verdict

The codebase is **well above average**: strict TypeScript, layered architecture (route → service → repository), typed errors per module, centralized auth/CSRF/rate-limiting in `src/proxy.ts`, serializable-transaction booking with coupon reservation, and zero N+1 query patterns. The analysis confirmed the core design is sound; this report lists the gaps that were found and the fixes that were applied.

## Fixes applied in this session

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | BUILD | `RouteContext` type was referenced but never defined in `src/app/api/v1/auth/session/[id]/route.ts` — `next build` failed | Replaced with the project-wide `{ params: Promise<{ id: string }> }` convention |
| 2 | HIGH | `recordPayment` trusted a client-supplied `amount` — a customer could mark a full-price appointment PAID with `amount: 0` (CASH) | Amount is now compared against `appointment.totalPrice`; `PaymentAmountMismatchError` → 400 |
| 3 | MEDIUM | Coupon `perUserLimit` was checked outside the booking transaction — concurrent bookings by the same user could both pass | `tryReserveCouponSlot` now counts the user's usage inside the same serializable transaction |
| 4 | MEDIUM | OAuth redirect validated against the Host header (`requestUrl.origin`) — poisonable on self-hosted setups | Redirect is now validated against `APP_ORIGIN` when configured |
| 5 | MEDIUM | `clientIp()` blindly trusted `x-forwarded-for` — rate limits bypassable by header rotation | Platform-provided `request.ip` is preferred; forwarded headers are only a local-dev fallback |
| 6 | MEDIUM | AI quota counters had a check-then-increment race — concurrent streams could overshoot limits | `recordUsage` now uses conditional `updateMany` increments so counters are capped at their limits by the database |
| 7 | LOW | Login distinguished registered-but-unverified accounts (403) from unknown emails (401) — enumeration signal | Uniform 401 "Invalid email or password" for both; a fresh verification OTP is re-sent silently to the real owner |
| 8 | LOW | Cron secret compared with `===` (timing-sensitive) | Constant-time comparison via `crypto.timingSafeEqual` |
| 9 | LOW | AI chat schema accepted a client-supplied `role: "system"` (prompt injection) and unbounded content | `system` role rejected; content capped at 16,000 chars |
| 10 | LOW | Only the primary staff was availability-checked; per-line staff could be double-booked | Each line's staff is now validated against its own service window |
| 11 | PERF | `AiChat` (userId) and `AiMessage` (chatId) had no indexes — chat queries degrade linearly with table growth | Added indexes + migration `20261007122709_add_ai_chat_message_indexes` |
| 12 | PERF | Salon listing ordered by random hex `id` — no meaningful order, unstable pagination feel | Ordered by `createdAt desc, id asc` |
| 13 | PERF | Dashboard appointments pages self-fetched `/api/v1` over HTTP (round trip + re-serialization) | `features/appointment/api.server.ts` now calls the service layer directly |
| 14 | QUALITY | Root `error.tsx` / `not-found.tsx` missing — framework default screens on any unhandled error | Added branded root error + 404 pages |
| 15 | QUALITY | README was create-next-app boilerplate; no `.env.example` despite 30+ env vars | Wrote real README (stack, architecture, env table, conventions) + `.env.example`; gitignore exception added |
| 16 | QUALITY | Leftover debug `console.log("Image removed")` in the Tiptap hook | Removed |

## Recommendations (not applied — need product/architecture decisions)

1. **Static rendering is impossible today** — `getSession()` in the root layout calls `cookies()`, forcing every page dynamic. Move the session read into a client island (or PPR boundary) to unlock static/ISR for salons, blog, and marketing pages. This is the single biggest performance lever.
2. **Zero caching configs** — add `revalidate`/ISR and `generateStaticParams` for top salons and public pages once #1 is done.
3. **Fake reviews (MEDIUM)** — any authenticated user can review any service without a completed appointment. Decide whether reviews require a booking (staff ratings already require COMPLETED); if yes, mirror that check in `review.service.ts`.
4. **Payments gateway** — the payments module is a stub. When Razorpay/Stripe lands, replace the server-derived amount check with a verified gateway webhook/order amount.
5. **Tests — zero today.** Highest-value pure units: `computeDiscount` (coupon math), `computeAvailableSlots` (availability), OTP attempt/expiry logic, JWT rotation. Add Vitest and start with these.
6. **Shared cursor pagination** — the `take limit+1 → hasMore → slice → nextCursor` pattern is copy-pasted in ~15 repositories; extract one helper.
7. **Error-response consistency** — 91 of 96 routes hand-roll try/catch; `dev-response.ts` exists but is barely used. Standardize one envelope.
8. **Salon search `contains` is unindexed** — add a `pg_trgm` GIN index migration when the salon table grows.
9. **Login response body returns the access token** for non-browser clients — fine for bearer use, but document that browser clients must never store it in localStorage (cookies are httpOnly for that reason).
10. **Sanitization is render-time only** — `sanitize-html` runs at render, not storage. Any future renderer that forgets the sanitizer reopens stored XSS; consider sanitizing before persist.
11. **Timezone handling uses fixed offsets** — DST transitions in `America/New_York`/`Europe/London` will shift bookings by an hour. Use `Intl`/Temporal when multi-DST timezone support is needed.

## Verified secure (highlights)

- CSRF centrally enforced for every `/api/v1` mutation (double-submit cookie, `sec-fetch-site`, origin allow-list; bearer clients exempt)
- Rate limiting on all routes (auth 10/min/IP, standard 60, authenticated 120/user); OTP: 60s resend cooldown, 5 attempts, crypto-random, scrypt-hashed
- JWT: HS256 pinned, issuer/audience checks, ≥32-byte secret, 15-min TTL; refresh tokens SHA-256 hashed with rotation + theft detection (reuse revokes all sessions)
- IDOR checks in every service (appointments, salons, staff, media, favorites, AI chats, notifications, reviews, blog, audit); admin self-demotion/last-admin guards
- OAuth: provider-bound state + PKCE S256, single-use, constant-time cookie comparison
- XSS: strict `sanitize-html` allowlist at the render boundary; parameterized `$queryRaw` only; no hardcoded secrets; production-safe error responses
- Booking: overlap re-checked inside a `SERIALIZABLE` transaction; coupon slot reserved in the same transaction; status transitions whitelisted
