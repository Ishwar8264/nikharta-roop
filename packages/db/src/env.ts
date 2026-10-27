import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Prisma CLI and seeds share the web environment; injected variables take precedence.
config({ path: fileURLToPath(new URL("../../../apps/web/.env", import.meta.url)), quiet: true });
