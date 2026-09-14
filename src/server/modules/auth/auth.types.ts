import type { z } from "zod";

import type { registerUserSchema } from "./auth.schema";

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export interface UserIdentifiers {
  email?: string;
  phone?: string;
}

export interface ExistingIdentifiers {
  email: string | null;
  phone: string | null;
}

export interface CreateUserRecord extends UserIdentifiers {
  name: string;
  passwordHash: string;
}

export interface RegisteredUser extends ExistingIdentifiers {
  id: string;
  name: string | null;
  createdAt: Date;
}
