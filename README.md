# Nikharta Roop

The web app is a clean UI foundation for the next implementation. Legacy APIs and feature flows have been removed. The replacement Better Auth + Redis API is available under `/api/v1/auth`; see [auth setup](docs/auth-system.md) for configuration and rollout. The root page renders a static placeholder; deleted routes return 404.

## What remains

- `apps/web/src/components`: reusable UI, homepage sections, layout, navigation, and legal components.
- `apps/web/src/config`: static brand details, homepage copy, and link targets required by those components. Link targets do not imply that feature pages exist.
- `apps/web/src/hooks`: UI-only hooks.
- `apps/web/src/lib`: class-name and structured-data helpers.
- `apps/web/src/app`: minimal layout, placeholder page, error states, metadata routes, and global styles.
- `apps/web/public`: brand assets.
- `packages/db`: unchanged Prisma schema, migrations, seed, and client. `src/queries` is reserved for the replacement query layer.
- `packages/shared`: platform-independent schemas, types, and constants retained for future implementation.
- `packages/api-client`: typed JSON API transport aligned with Improve India; `packages/theme` and `packages/typescript-config`: workspace foundations.
- `apps/mobile`: reserved workspace.

The header accepts optional account controls. AI description generation and slug availability checks accept callbacks and make no requests by default. The auth client and versioned auth handler are implemented. There are no legacy API clients, session providers, proxies, cron handlers, or server actions.

Older documents describing API and feature wiring are historical references, not current contracts. Legacy database records are preserved. An additive auth migration is prepared; no migration has been applied to the application database.

## Development

Requires Node.js 20.9 or newer and pnpm 10.

```bash
pnpm install
pnpm dev:web
```

Web environment files live in `apps/web/.env*`. `NEXT_PUBLIC_APP_URL` controls the site's canonical URL and defaults to `http://localhost:3000`. The static web shell does not connect to a database; auth requests require PostgreSQL, Upstash Redis, and email configuration. Prisma commands load `apps/web/.env` and require `DATABASE_URL`.

```bash
pnpm --filter @nikharta-roop/web typecheck
pnpm --filter @nikharta-roop/web lint
pnpm --filter @nikharta-roop/web test
pnpm --filter @nikharta-roop/web build
```

Root workspace commands (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`) run through Turbo. Prisma generation can run as a prerequisite; migrations and seeding remain explicit commands.

## Database commands

```bash
pnpm db:generate  # Regenerate Prisma client without changing the database
pnpm db:validate  # Validate schema
pnpm db:deploy    # Apply existing migrations only when explicitly intended
pnpm db:seed     # Write seed data only when explicitly intended
```

Database imports remain server-only. Future API work should add query modules to `packages/db/src/queries` and keep `packages/shared` free of framework and platform imports.
