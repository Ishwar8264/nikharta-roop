import type { z } from "zod";

import type { createCustomerNoteSchema } from "./customer-note.schema";

export type CreateCustomerNoteInput = z.infer<typeof createCustomerNoteSchema>;

/** Note row returned to salon staff. */
export interface PublicCustomerNote {
  id: string;
  customerId: string;
  salonId: string;
  note: string;
  createdBy: string;
  author: { id: string; name: string | null };
  createdAt: Date;
}
