import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth";

// Better Auth clients require its native response bodies and Set-Cookie headers.
export const { GET, POST } = toNextJsHandler(auth);
