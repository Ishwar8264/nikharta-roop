# Web tests

Run the retained component and shared-schema tests with Vitest:

```bash
pnpm --filter @nikharta-roop/web test
```

Tests for deleted pages, feature modules, server services, and API routes were removed during the cleanup. UI tests cover the preserved inputs, navigation, badges, and shared components. The account migration fixture is opt-in and is skipped unless its database-test environment is explicitly configured.

Tests import their subjects with relative paths. The `@/` alias and the `server-only` test stub are configured in `vitest.config.ts`. Tests do not require a running API server.
