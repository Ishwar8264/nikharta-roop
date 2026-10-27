import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Keep the current web environment location during the workspace migration.
// Hosting-provided variables take precedence over local values.
config({ path: fileURLToPath(new URL("../../../apps/web/.env", import.meta.url)), quiet: true });
