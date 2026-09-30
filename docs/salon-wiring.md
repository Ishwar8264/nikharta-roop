# Salon API wiring

The public directory uses the salon service directly in Server Components. The create form and management page use the existing `/api/v1` browser client, including its session refresh and CSRF handling.

| Method | Path | Client surface | Access |
| --- | --- | --- | --- |
| GET | `/api/v1/salons` | Public directory service | Public |
| POST | `/api/v1/salons` | Create salon form | Signed in |
| GET | `/api/v1/salons/{slug}` | Public detail service | Public |
| PATCH | `/api/v1/salons/{id}` | Management details form | Manager or owner |
| DELETE | `/api/v1/salons/{id}` | Management delete action | Owner |
| GET | `/api/v1/salons/{id}/members` | Management roster | Manager or owner |
| POST | `/api/v1/salons/{id}/members` | Management add member form | Owner |
| DELETE | `/api/v1/salons/{id}/members/{memberId}` | Management remove action | Owner |

The public detail lookup takes a **slug**. All mutations and member routes take the salon's internal **id**. A member removal takes the membership id, not the user's id. `GET /salons` and public detail render through the local service to avoid a server self-request, while their API routes remain available to other clients.

The management page is gated on the server. Managers can edit details and view members. Owners can additionally add or remove members and delete the salon. The API routes repeat these checks; hiding controls is only a usability measure. The last owner cannot be removed. A salon deletion is soft, so historical relations remain intact.

The browser client exposes the response's `message` exactly when an API call fails. The form sends only changed salon fields. Optional text fields send `null` when cleared. Member creation requires the id of an existing user; there is no user search endpoint in this salon API group. The roster shows loading, empty, and error states. Salon updates refresh the current Server Component tree; member actions update the local roster after the server confirms success.

## Manual verification

1. Open a salon as a manager and as an owner. Confirm the management link appears and the page opens.
2. Edit an address, then reload the public detail page. Confirm it shows the saved address.
3. As an owner, add an existing user by id. Confirm the user appears in the roster. Remove the member and confirm the roster updates.
4. Try removing the last owner and confirm the API's conflict message is displayed.
5. Delete a disposable salon and confirm it disappears from the public directory.
