# Database fixtures

Run `pnpm --filter @nikharta-roop/db test:schema` to discover the database fixtures. They skip unless their dedicated test URLs are explicitly supplied:

- `ACCOUNT_TEST_DATABASE_URL`: account migration preservation fixture.
- `SCHEMA_TEST_DATABASE_URL`: schema and migration-plan invariants.

Only local disposable databases are supported. Each fixture creates and removes its own isolated schema. Neither fixture reads the application's environment file or connects to its database by default.

Migration plans are separate from deployable migration history. Tests use them as design fixtures; do not move them into `prisma/migrations` or apply them as part of cleanup.
