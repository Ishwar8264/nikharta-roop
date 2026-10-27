import type { PlatformRole } from "../enums";

/** Safe current-account fields. Credentials, session tokens, and internal lifecycle data are excluded. */
export type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string | null;
    emailVerified: boolean;
    image: string | null;
    role: PlatformRole;
  };
};
