# Authentication

Nikharta Roop uses Better Auth 1.7.10 with a Prisma/PostgreSQL adapter and Upstash Redis, following the connected Improve India implementation. All auth endpoints are under `/api/v1/auth` and return Better Auth native responses and cookies.

## Boundaries

- `apps/web/src/server/auth.ts`: auth policy, email/password, verification OTP, sessions, and rate limits.
- `apps/web/src/server/redis.ts`: namespaced Redis cache and atomic one-time reads/rate counters. Missing Redis configuration fails requests rather than falling back to process memory.
- `packages/db/src/queries/auth.ts`: Prisma adapter factory and account lifecycle queries.
- `apps/web/src/server/db.ts`: the web import boundary for DB queries.
- `apps/web/src/server/auth-guard.ts`: reads the session and current database account state. Future protected APIs must use this guard and add resource permissions; cookie existence alone is insufficient.
- `apps/web/src/lib/auth-client.ts`: browser client configured with the same versioned base path and email OTP plugin.

## Enabled flows

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/sign-up/email` | Register name, email, and password; send verification OTP |
| POST | `/api/v1/auth/sign-in/email` | Password login for verified, active accounts |
| GET | `/api/v1/auth/get-session` | Native session lookup |
| POST | `/api/v1/auth/sign-out` | Revoke current session |
| POST | `/api/v1/auth/email-otp/send-verification-otp` | Send/resend email verification; `type: email-verification` |
| POST | `/api/v1/auth/email-otp/verify-email` | Verify `{ email, otp }`; sign in afterwards |
| POST | `/api/v1/auth/request-password-reset` | Send a reset link; supply an allowed `redirectTo` URL |
| GET | `/api/v1/auth/reset-password/:token` | Validate the emailed link and redirect with a reset token |
| POST | `/api/v1/auth/reset-password` | Consume `{ token, newPassword }`; revoke existing sessions |
| POST | `/api/v1/auth/change-password` | Change password after current-password verification |
| GET | `/api/v1/auth/list-sessions` | List the authenticated account's sessions |
| POST | `/api/v1/auth/revoke-session` | Revoke an owned session using its token |
| POST | `/api/v1/auth/revoke-other-sessions` | Revoke other sessions |

No phone login, OAuth providers, passwordless OTP login, or OTP password recovery is enabled. Authentication screens are outside this API setup; the preserved UI remains independent.

## Persistence and security

Sessions last 30 days and renew on use after one day. Postgres persists them; Redis caches them and stores shared rate counters. Cookie caching is disabled. Clearing Redis can recover sessions from Postgres. The account guard rechecks `status`, `deletedAt`, and `emailVerified` so cached account data cannot grant domain access after suspension.

Signup cannot set `role` or `status`. Email verification activates only `PENDING_VERIFICATION` accounts that have not been deleted; it never reactivates suspended/banned accounts. Verification codes are hashed, expire after 5 minutes, and allow 5 attempts. Passwords require 8–128 characters. Reset tokens last one hour; password reset revokes sessions. Origin checks and HttpOnly session cookies are owned by Better Auth. Redis rate limiting is per request IP; it is not an identifier lockout policy.

## Configuration and rollout

Copy the required variable names from `apps/web/.env.example`: `DATABASE_URL`, `BETTER_AUTH_SECRET` (at least 32 random bytes), canonical app/auth URLs, both Upstash REST credentials, and Resend sender/API key. Never commit real credentials. Use one stable secret across instances.

The SQL migration `20261027160000_better_auth_sessions` is prepared, not applied to the application database. It adds auth user fields, account token metadata, `Session` and `Verification`, maps `credentials` providers to `credential`, and preserves password hashes and OAuth identities. It initializes auth display names from existing personal profiles. It assumes the deployed database already matches the repository's pre-auth Prisma schema, including `Account` and `Profile`; inspect deployment state and pending migration plans before applying it. It does not apply the older design plans automatically.

Old custom password hashes are preserved but cannot be verified by Better Auth's native format. Existing password users must complete password recovery. Old refresh-token cookies do not become new sessions; users sign in again. Existing verified accounts still marked `PENDING_VERIFICATION` require lifecycle review rather than automatic activation by migration.

Password-reset links need a consuming UI at the caller's allowed `redirectTo` URL. Resend delivery and hosted Upstash behavior require configured-environment validation; local flow verification can stub delivery and bridge the Redis REST adapter to an isolated Redis server.

## References

- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)
- [Better Auth storage and database hooks](https://better-auth.com/docs/concepts/database)
- [Email verification OTP plugin](https://better-auth.com/docs/plugins/email-otp)

## Health and common API rate limiting

`GET /api/v1/health` is a public, uncached readiness check. It checks PostgreSQL with `SELECT 1` and Redis with `PING`, returns 200 when both respond, and 503 with generic dependency states on failure. Dependency checks have a two-second response budget.

`apps/web/src/server/rate-limit.ts` follows Improve India's shared sliding-window policy: 10 requests per 10 seconds per route-scoped client identifier, using a separate Redis key prefix. Health applies this budget before any database work. Exhausted budgets return 429 with `Retry-After` and rate-limit headers; Redis failures or limiter timeouts return 503. Deploy behind a trusted proxy that replaces forwarding headers. Future non-auth API handlers must call `checkRateLimit`; Better Auth endpoints retain their own Redis-backed limits.

## Shared JSON API client

`API_BASE_PATH` (`/api/v1`) and `AUTH_BASE_PATH` (`/api/v1/auth`) live in shared constants. Non-auth routes use `ApiResponse<T>`: `{ ok: true, data, message? }` or `{ ok: false, error: { code, message, details? } }`. The web `jsonOk`, `jsonError`, and `handleApiError` helpers implement that contract without exposing infrastructure errors.

`@nikharta-roop/api-client` follows Improve India's typed HTTP transport. Use `api` for same-origin browser requests or `createApiClient({ baseUrl })` for an explicit origin. Methods support caller headers, cancellation, cache and credentials options. They validate the envelope, return its `data`, and throw `ApiClientError` with code/status/details on API failures. `api.health()` consumes `/api/v1/health`; dependency failures return `DEPENDENCY_UNAVAILABLE` with the health summary in error details. Rate limiting preserves `Retry-After` and rate-limit response headers.

Authentication always uses `authClient`, not the generic JSON client, because Better Auth responses are native. The optional generic client's `getToken` only adds an Authorization header; it does not enable a bearer authentication scheme on the server. Native/mobile auth is not implemented by this transport setup.

## Scalar documentation

Browse `/api/v1/docs` for the interactive reference, backed by `/api/v1/openapi`. The specification combines Better Auth's generated operations (respecting disabled paths) with health response/error schemas. Auth URLs use `/api/v1/auth`; health uses `/api/v1/health`. Relative server URLs keep requests on the current origin. Scalar's browser renderer is pinned to version 1.75.0, matching the Improve India reference.

Specification generation calls Better Auth's server API directly, so browsing docs does not require a Redis rate-limit request or live DB query. Running the documented operations still requires the configured services and, for protected operations, a valid session.

Reference: [Scalar Next.js integration](https://scalar.com/products/api-references/integrations/nextjs).
