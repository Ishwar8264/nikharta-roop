# Nikharta Roop

The web app is a clean UI foundation for the next implementation. Existing APIs, authentication, feature flows, and backend services have been removed. The root page renders a static placeholder; deleted routes return 404.

## What remains

- `apps/web/src/components`: reusable UI, homepage sections, layout, navigation, and legal components.
- `apps/web/src/config`: static brand details, homepage copy, and link targets required by those components. Link targets do not imply that feature pages exist.
- `apps/web/src/hooks`: UI-only hooks.
- `apps/web/src/lib`: class-name and structured-data helpers.
- `apps/web/src/app`: minimal layout, placeholder page, error states, metadata routes, and global styles.
- `apps/web/public`: brand assets.
- `packages/db`: unchanged Prisma schema, migrations, seed, and client. `src/queries` is reserved for the replacement query layer.
- `packages/shared`: platform-independent schemas, types, and constants retained for future implementation.
- `packages/api-client`, `packages/theme`, `packages/typescript-config`: workspace scaffolds.
- `apps/mobile`: reserved workspace.

The header accepts optional account controls. AI description generation and slug availability checks accept callbacks and make no requests by default. No API client, session provider, proxy, cron handler, or server action remains in the web app.

Older documents describing API and feature wiring are historical references, not current contracts. Database schema, migrations, and data were preserved during cleanup; no database migration was applied.

## Development

Requires Node.js 20.9 or newer and pnpm 10.

```bash
pnpm install
pnpm dev:web
```

Web environment files live in `apps/web/.env*`. `NEXT_PUBLIC_APP_URL` controls the site's canonical URL and defaults to `http://localhost:3000`. The static web shell does not connect to a database. Prisma commands load `apps/web/.env` and require `DATABASE_URL`.

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
