# Authentication status

Authentication and feature flows have been removed during the cleanup. No login, registration, OTP, password reset, OAuth, session provider, or authentication proxy currently exists in the web app.

The preserved header accepts account controls as a prop. This is a UI extension point, not an authentication implementation.

Database schema, migration history, and data are unchanged. `packages/db/src/queries` is reserved for replacement queries. New authentication requires a separate implementation task.
