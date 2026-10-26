import "server-only";

import { cache } from "react";

import type { CurrentUser } from "@nikharta-roop/shared/types/server/auth";

/** Returns no session until the replacement authentication design is implemented. */
export const getSession = cache(async (): Promise<CurrentUser | null> => null);
