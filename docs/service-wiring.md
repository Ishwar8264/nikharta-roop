# Service catalogue wiring

Public service pages render through the local service layer. Browser mutations use the existing `/api/v1` client, including its session refresh and CSRF handling.

| Method | Endpoint | UI | Access |
| --- | --- | --- | --- |
| GET | `/salons/{salonId}/services` | Public salon catalogue | Public |
| POST | `/salons/{salonId}/services` | Create service form | Salon manager or owner |
| GET | `/salons/{salonId}/services/{serviceId}` | Public service detail | Public |
| PATCH | `/salons/{salonId}/services/{serviceId}` | Edit service form | Salon manager or owner |
| DELETE | `/salons/{salonId}/services/{serviceId}` | Edit service delete action | Salon manager or owner |
| GET | `/services/categories` | Category selectors and admin list | Public |
| POST | `/services/categories` | Global category management | SUPER_ADMIN |

All endpoints above are prefixed with `/api/v1`. The public detail route uses a **service slug** even though its OpenAPI placeholder is `serviceId`. PATCH and DELETE use the service's internal **id**. The salon segment accepts either its slug or id. The management list includes inactive services, while public list and detail only show active services. Deletion is soft.

## UI flow

- Managers and owners can open **Manage services** from the public catalogue. This view lists active and inactive services with cursor pagination.
- The shared service form supports create and edit. Edit sends only changed fields; clearing optional text or category sends `null`. API error messages are displayed exactly as received, with field errors placed next to inputs.
- Category selectors load the complete paginated vocabulary, so categories beyond the first API page remain selectable.
- An inactive newly created service opens the management list, since the public detail intentionally returns 404 for inactive entries.
- SUPER_ADMIN users can open global category management from the service catalogue. The page checks the session role, and the API repeats that authorization check.

## Verification

Run `pnpm exec tsc --noEmit`, targeted ESLint, and `pnpm build`. With test accounts, verify manager create/edit/delete, inactive service reactivation, public 404 for inactive services, and SUPER_ADMIN category creation. Live authenticated API calls require seeded users and a database.
