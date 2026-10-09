import { api } from "@/lib/api/backend.client";

/** Mirrors `PublicCustomerNote` (dates serialize to strings over JSON). */
export interface CustomerNote {
  id: string;
  customerId: string;
  salonId: string;
  note: string;
  createdBy: string;
  author: { id: string; name: string | null };
  createdAt: string;
}

/** Lists a customer's notes, newest first. STAFF+. */
export function listNotesApi(salonRef: string, customerId: string) {
  return api.get<{ message: string; data: CustomerNote[] }>(
    `/salons/${encodeURIComponent(salonRef)}/customers/${encodeURIComponent(customerId)}/notes`,
  );
}

/** Creates a note about a customer. STAFF+. */
export function createNoteApi(
  salonRef: string,
  customerId: string,
  input: { note: string },
) {
  return api.post<{ message: string; data: { note: CustomerNote } }>(
    `/salons/${encodeURIComponent(salonRef)}/customers/${encodeURIComponent(customerId)}/notes`,
    input,
  );
}

/** Deletes a note. The author or a MANAGER+ may delete. */
export function deleteNoteApi(
  salonRef: string,
  customerId: string,
  noteId: string,
) {
  return api.delete<{ message: string; data: null }>(
    `/salons/${encodeURIComponent(salonRef)}/customers/${encodeURIComponent(customerId)}/notes/${encodeURIComponent(noteId)}`,
  );
}
