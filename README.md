# Nikharta Roop — Salon Booking Platform

Premium salon discovery & booking platform for India. Customers browse salons, services, and products, book appointments with real-time staff availability, and pay, review, and earn loyalty points. Salon owners manage their catalogue, staff, schedules, and bookings through a role-gated dashboard.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19, Server Components) |
| Language | TypeScript 5.9 (strict) |
| Database | PostgreSQL via [Prisma 7](https://www.prisma.io) (`@prisma/adapter-pg`) |
| Auth | JWT access tokens (`jose`) + rotating opaque refresh tokens (SHA-256 hashed, DB-backed), OTP (email/phone/WhatsApp), OAuth (Google, Apple, Facebook) |
| Validation | Zod 4 |
| Rate limiting | Upstash Redis (sliding window) with in-memory dev fallback |
| Media | Cloudinary (signed deletion, per-user folders) |
| Email | Resend |
| SMS/WhatsApp | Twilio / WhatsApp Cloud API |
| UI | Tailwind CSS 4, shadcn-style components (currently React Aria; [UI guidelines](docs/ui-guidelines.md) prefer Radix for future work), Tiptap rich text, Leaflet maps |
| AI | AI SDK (OpenAI-compatible) with per-user quota tracking |
| Package manager | pnpm 10 |

## Features

- **Salon directory** — city/category/search filters, public profiles with services, products, gallery, working hours
- **Booking** — 30-min slot availability across salon hours + staff schedules + leaves + existing bookings; double-booking prevented with a serializable transaction
- **Payments** — cash/card/UPI records, coupon validation with atomic usage-limit reservation
- **Loyalty** — points earned on completed appointments, redemption flow
- **Reviews & ratings** — services, products, staff (per-appointment)
- **Blog** — categories, tags, comments, SEO metadata
- **Admin** — platform stats, user role/quota management, coupon management, audit log
- **API** — versioned REST API (`/api/v1`) with OpenAPI spec + gated Swagger UI
- **Cron jobs** — appointment reminders, notification retry, OTP/token cleanup, coupon expiry (Vercel Cron, secret-protected)
- **SEO** — sitemap, robots, JSON-LD, Open Graph, canonical URLs

## Workspace

```text
apps/web/     # Next.js frontend, API, business logic, and integration tests
apps/mobile/  # Reserved; no mobile app or dependencies yet
packages/
  api-client/        # Reserved for shared HTTP clients
  db/                # Prisma schema, migrations, seed, and server-only client
  shared/            # Platform-independent schemas, types, and contracts
  theme/             # Reserved for shared design tokens
  typescript-config/ # Reserved for shared TypeScript configuration
```

Run workspace commands from the repository root. Web environment files live in
`apps/web/.env*`. Prisma CLI and seed load `apps/web/.env` explicitly, while
hosting-provided environment variables take precedence. Web runtime env loading
continues to use Next.js conventions. `apps/mobile` remains clean.

The web app consumes `@nikharta-roop/shared` for validation/contracts and
`@nikharta-roop/db` for server-only Prisma access. API client and theme packages
remain scaffolds; their extraction is separate.

## Getting Started

Prerequisites: Node.js ≥ 20.9, pnpm 10, PostgreSQL (with `gen_random_uuid()` support, i.e. PG 13+).

```bash
cp apps/web/.env.example apps/web/.env # fill in values (see Environment)
pnpm install          # also runs database package `prisma generate`
pnpm db:deploy        # explicitly apply existing database migrations
pnpm db:seed
pnpm dev              # http://localhost:3000
```

## Environment

Required for local dev:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (supports `sslmode`) |
| `JWT_SECRET` | ≥ 32 bytes; signs access tokens |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (optional in dev; in-memory fallback) |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_API_URL` | Public URLs (defaults to localhost) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Media uploads from the browser |

Production-only services (fail-fast checks exist for email, JWT, and rate limits):

| Variable | Purpose |
| --- | --- |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Signed media deletion |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_SMS_FROM` | OTP via SMS |
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | OTP via WhatsApp |
| `GOOGLE_OAUTH_*` / `APPLE_OAUTH_*` / `FACEBOOK_OAUTH_*` | OAuth providers |
| `OAUTH_SUCCESS_REDIRECT` / `OAUTH_FAILURE_REDIRECT` / `APP_ORIGIN` | OAuth & CSRF origin checks |
| `OPENAI_API_KEY` / `AI_MODEL` / `AI_PROVIDER` | AI assistant |
| `FCM_SERVER_KEY` | Push notifications |
| `CRON_SECRET` | Protects `/api/v1/cron/*` endpoints |
| `API_DOCS_ENABLED` | Enables the Swagger UI page |

## Architecture

```
apps/web/src/
  proxy.ts          # Edge proxy: CSRF, rate limiting, JWT auth, admin gate (Next "middleware")
  app/
    (public)/       # Pages (server components)
    api/v1/         # REST route handlers (thin: parse → validate → service → respond)
    swagger-ui/     # OpenAPI docs (env-gated)
  server/
    auth/           # JWT, refresh rotation, OTP, OAuth, CSRF, cookies
    modules/<x>/    # Feature modules: service (business rules),
                    # repository (Prisma), authorization, errors, types
    cron/           # Shared cron runner + jobs
    openapi/        # OpenAPI spec builders
  features/<x>/     # Client-side feature code (components, hooks, API client, actions)
  lib/              # Cross-cutting: DB import boundary, email, cloudinary, rate-limit, SEO
```

Conventions worth knowing:

- **Routes stay thin.** HTTP parsing, status codes, and error mapping live in route handlers; business rules in services; SQL in repositories.
- **Authorization is layered.** The proxy proves identity/role; each service re-checks resource ownership/roles close to the data (defense in depth against IDOR).
- **CSRF** uses a double-submit cookie for cookie-authenticated mutations; bearer clients are exempt. Public mutation endpoints are an explicit allow-list.
- **Errors** are typed classes per module, mapped to HTTP statuses at the route boundary; public responses never leak infrastructure details.
- **Soft delete** is used for users, salons, services, products, and media.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint (Next config) |
| `pnpm typecheck` | Typecheck |
| `pnpm db:migrate` | Create/apply migrations |
| `pnpm db:seed` | Seed service categories & admin |

## API

REST API is versioned under `/api/v1`. Set `API_DOCS_ENABLED=true` and open `/swagger-ui` for the interactive OpenAPI spec. Auth: `Authorization: Bearer <accessToken>` for API clients; httpOnly cookies for browsers (refresh at `/api/v1/auth/refresh`).

## Monorepo commands and deployment

- `pnpm dev:web`: start only the web app.
- `pnpm test`: run web tests through Turbo; database suites remain opt-in.
- `pnpm db:generate`: regenerate the web Prisma client without changing the database.
- `pnpm --filter @nikharta-roop/web exec <command>`: run a tool from the web directory.
- Prisma schema, migration history, and seed live in `packages/db/prisma`.
- For Vercel, set the project Root Directory to `apps/web` and allow workspace files
  outside that directory. Keep installation at the workspace root; use
  `pnpm --dir ../.. build` as the build command to run the Turbo build. Configure
  the existing production environment variables on the hosting project.

Turbo caches web build output and lint results. Environment files and declared
environment variables participate in build hashing. Prisma generation, tests,
and type checks always run; migrations and seeds are explicit commands and are
never part of build or development tasks.

## Shared package boundaries

- `packages/typescript-config/base.json`: strict defaults for future shared packages.
  The existing web TypeScript settings remain unchanged.
- `packages/shared`: platform-independent schemas, types, and constants. Import
  specific entries such as `@nikharta-roop/shared/schemas/salon` or
  `@nikharta-roop/shared/types/client/salon`. Server projection types and JSON-facing
  types remain separate to preserve existing date representations.
- `packages/api-client`: shared HTTP clients; browser cookie/CSRF handling and native
  token handling must use separate entries when implemented.
- `packages/db`: server-only Prisma singleton, schema, migration history, and seed.
  Generated client imports use `@nikharta-roop/db/client`. Shared domain enum types
  are checked against Prisma enum types during `pnpm typecheck`. Never import the
  DB package into mobile or browser runtime code.
- `packages/theme/theme.css`: empty token stylesheet, not imported by the web app.

`pnpm typecheck` includes shared packages and database enum contract checks. `pnpm format:check` checks formatting;
`pnpm format` rewrites files and should only be used intentionally, since existing
application code has not been reformatted as part of this migration.

Validation rules, DTO shapes, and existing database migrations were preserved during
extraction. Browser upload state (`File`) and web-specific coupon presentation
validation remain in the web app. `pnpm db:validate` validates the schema without
applying migrations. Database mutation commands remain explicit opt-in actions.
