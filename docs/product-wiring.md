# Product catalogue wiring

Public product pages call the local service layer in Server Components. Browser mutations use the existing `/api/v1` client with its session refresh and CSRF handling.

| Method | Endpoint | UI | Access |
| --- | --- | --- | --- |
| GET | `/products/categories` | Product form selector and category list | Public |
| POST | `/products/categories` | Global category management | SUPER_ADMIN |
| GET | `/salons/{salonId}/products` | Public salon product catalogue | Public |
| POST | `/salons/{salonId}/products` | Product create form | Salon manager or owner |
| GET | `/salons/{salonId}/products/{productId}` | Public product detail | Public |
| PATCH | `/salons/{salonId}/products/{productId}` | Product edit form | Salon manager or owner |
| DELETE | `/salons/{salonId}/products/{productId}` | Product edit delete action | Salon manager or owner |

All paths above have the `/api/v1` prefix. The public detail route looks up a product by **slug**, despite the OpenAPI placeholder `productId`. PATCH and DELETE use the internal **product id**. Salon references accept a slug or internal id. Public list and detail include only active, non-deleted products. The manager list includes inactive products, so a manager can reactivate them. Deletion is soft.

The create and edit forms reuse shared fields, rich text, media, and category controls. Product validation uses the same Zod schema as the API. Edits send only changed fields; clearing optional descriptions or a category sends `null`. API messages and field errors are displayed as returned. Global service and product category forms share one UI component while keeping their separate API calls and role-gated pages.

The public catalogue and manager list use cursor pagination. Product forms load all category pages so the selector does not silently omit later categories. No purchase action is shown because this endpoint group exposes catalogue management, not a checkout API.

## Manual verification

1. Open a salon as a visitor and confirm only active products appear. Open an active product by slug.
2. As a manager, create a product, edit price and stock, deactivate it, then reactivate it from **Manage products**.
3. Delete a disposable product and confirm it disappears from both public and manager lists.
4. As SUPER_ADMIN, create a global category and select it in a product form.
5. Confirm backend validation and conflict messages appear unchanged.

Automated checks: `pnpm exec tsc --noEmit`, targeted ESLint, and `pnpm build`. Live authenticated API checks require seeded users and a database.
