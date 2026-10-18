# Accounts and platform permissions

`User` is the person. `Account` stores their login methods. A credentials account
uses provider `credentials`, the stable user ID as `providerUserId`, and a scrypt
`passwordHash`. OAuth accounts retain their existing provider subject and ID.
Each user has at most one account per provider; provider subjects are globally
unique within a provider. Provider tokens are not stored because current login
flows do not need ongoing access to external services.

`RefreshToken` and CSRF protection retain their existing behavior. Salon roles
remain in `SalonMember`; platform administration does not confer salon ownership.
Onboarding preferences and partner consent remain separate from platform roles.

| Permission | USER | CONTENT_ADMIN | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- | --- |
| Editorial content | No | Yes | Yes | Yes |
| Salon verification | No | No | Yes | Yes |
| User listing and AI moderation | No | No | Ordinary users only for mutations | Yes |
| Assign platform roles | No | No | No | Yes |
| Coupons, global catalog, audit and AI analytics | No | No | No | Yes |

The shared policy is `src/lib/auth/permissions.ts`. API authentication reloads
the current user role so demotion takes effect before token expiry. Protected
operations also check permissions in their route/service. Content management is
currently exposed through the existing blog APIs; a content editor dashboard is
not introduced by this migration.

## Deployment

Migration `20261018180000_unify_accounts_and_platform_roles` renames the OAuth
table, copies password hashes without rehashing, and then removes the old password
column in one transaction. Existing user IDs, OAuth IDs and refresh sessions stay
intact. Duplicate provider links cause migration failure rather than data loss.

Back up the database and pause auth writes during deployment. Run the migration,
generate the Prisma client, deploy the matching application, and restart existing
application processes before resuming traffic. Old application versions are not
compatible with the new credential storage. Rollback requires restoring the
matching database backup and application version; do not run a database reset.

Verification includes permission boundaries, current-role authentication, JWT roles,
CSRF, password recovery, staff activation and a fixture-based migration test.
Run the optional database checks only against a local database:

```sh
RUN_ACCOUNT_DATABASE_TESTS=1 pnpm exec vitest run tests/account-migration.test.ts
RUN_STAFF_DATABASE_TESTS=1 pnpm exec vitest run tests/staff-invitation-database.test.ts
```
