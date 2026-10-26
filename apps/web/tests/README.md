# Tests

Unit tests for the Nikharta Roop codebase, run via [Vitest](https://vitest.dev/).

## Run

```bash
pnpm test          # one-shot — exits non-zero on any failure
pnpm test:watch    # watch mode for iterative development
pnpm exec vitest --coverage   # emits a coverage report (v8 provider)
```

The `test` script maps to `vitest run`, which is what CI should invoke.

## Conventions

### Relative imports only

Test files import the unit under test via a **relative path** (`../src/...`),
not the `@/` tsconfig alias. This keeps each test's intent explicit and avoids
a hard dependency on the alias resolver for the test entrypoint.

> Note: the code under test still uses `@/` internally — that path is
> resolved by an alias declared in `vitest.config.ts`. The "relative
> imports" rule applies only to what the tests themselves write.

### Node environment

All tests run with `test.environment: "node"`. No DOM, no jsdom. Functions
that need browser globals are out of scope for this suite — the units under
test are pure server-side helpers.

### Pure units only

The first wave of tests targets pure functions:

- `computeDiscount` (`src/server/modules/coupon/coupon.service.ts`) —
  coupon math, no DB.
- `computeAvailableSlots` (`src/server/modules/appointment/appointment.availability.ts`)
  — availability math, no DB.

If a unit under test transitively loads Prisma, the test file mocks `@/lib/prisma`
to a stub object (`vi.mock("@/lib/prisma", () => ({ prisma: {} }))`). The
function itself never queries — the mock only exists so the module can be
loaded without `DATABASE_URL` set.

### The `server-only` marker

Server-side modules start with `import "server-only"`. The package isn't
installed as a real dependency (Next.js replaces it at build time), so
`vitest.config.ts` aliases it to an empty stub at `tests/stubs/server-only.ts`.
In the Vitest environment, every module is server-side by definition, so the
marker is a no-op.

### Test-file independence

Each test file is self-contained: it declares its own mocks and shares no
state with other files. `beforeEach`/`afterEach` hooks reset spy state
within a single file.

## Layout

```
tests/
├── stubs/
│   └── server-only.ts           # no-op stub for the server-only marker
├── coupon.test.ts               # computeDiscount
└── appointment-availability.test.ts   # computeAvailableSlots + helpers
```

## Adding a new test

1. Create `tests/<area>.test.ts`.
2. Import the unit under test via a relative path:
   ```ts
   import { fn } from "../src/server/modules/<area>/<area>.service";
   ```
3. If the module transitively loads Prisma, mock it at the top:
   ```ts
   vi.mock("@/lib/prisma", () => ({ prisma: {} }));
   ```
4. Use `describe`/`it`/`expect` from `vitest`. No shared state between
   files.
