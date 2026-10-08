import "server-only";

import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { resolveSalonId } from "@/server/modules/service/service.repository";

import {
  CustomerNoteAccessDeniedError,
  CustomerNoteNotFoundError,
} from "./customer-note.errors";
import {
  createNote,
  deleteNoteById,
  findNoteById,
  listNotesByCustomer,
} from "./customer-note.repository";
import type {
  CreateCustomerNoteInput,
  PublicCustomerNote,
} from "./customer-note.types";

/** Loads a salon for a note operation and asserts the minimum role. */
async function loadSalonWithRole(
  callerId: string,
  salonRef: string,
  minimumRole: "STAFF" | "MANAGER",
) {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: callerId });
  if (!salon) throw new SalonNotFoundError();

  assertRoleAtLeast(salon.viewerRole, minimumRole);
  return salonId;
}

/** Lists a customer's notes. STAFF+. */
export async function listCustomerNotes(
  callerId: string,
  salonRef: string,
  customerId: string,
): Promise<PublicCustomerNote[]> {
  const salonId = await loadSalonWithRole(callerId, salonRef, "STAFF");
  return listNotesByCustomer(salonId, customerId);
}

/** Creates a note about a customer. STAFF+. */
export async function createCustomerNote(
  callerId: string,
  salonRef: string,
  customerId: string,
  input: CreateCustomerNoteInput,
): Promise<PublicCustomerNote> {
  const salonId = await loadSalonWithRole(callerId, salonRef, "STAFF");
  return createNote({
    salonId,
    customerId,
    note: input.note,
    createdBy: callerId,
  });
}

/**
 * Deletes a note. The author or a MANAGER+ may delete.
 *
 * Why:
 * Notes are internal staff context, so ownership is per-writer — but a
 * manager needs the ability to clean up anything in their salon.
 */
export async function deleteCustomerNote(
  callerId: string,
  salonRef: string,
  customerId: string,
  noteId: string,
): Promise<void> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: callerId });
  if (!salon) throw new SalonNotFoundError();

  assertRoleAtLeast(salon.viewerRole, "STAFF");

  const note = await findNoteById(salonId, noteId);
  if (!note || note.customerId !== customerId) {
    throw new CustomerNoteNotFoundError();
  }

  const isManager = salon.viewerRole !== "STAFF";
  if (note.createdBy !== callerId && !isManager) {
    throw new CustomerNoteAccessDeniedError();
  }

  await deleteNoteById(note.id);
}
