import "server-only";

import { prisma } from "@/lib/prisma";

const PUBLIC_NOTE_SELECT = {
  id: true,
  customerId: true,
  salonId: true,
  note: true,
  createdBy: true,
  author: { select: { id: true, name: true } },
  createdAt: true,
} as const;

/** Lists a customer's notes inside one salon (newest first). */
export async function listNotesByCustomer(
  salonId: string,
  customerId: string,
) {
  return prisma.customerNote.findMany({
    where: { salonId, customerId },
    select: PUBLIC_NOTE_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

/** Loads one note scoped to its salon. */
export async function findNoteById(salonId: string, noteId: string) {
  return prisma.customerNote.findFirst({
    where: { id: noteId, salonId },
    select: PUBLIC_NOTE_SELECT,
  });
}

/** Persists a staff note about a customer. */
export async function createNote(data: {
  salonId: string;
  customerId: string;
  note: string;
  createdBy: string;
}) {
  return prisma.customerNote.create({
    data,
    select: PUBLIC_NOTE_SELECT,
  });
}

/** Deletes a note. */
export async function deleteNoteById(noteId: string): Promise<void> {
  await prisma.customerNote.delete({ where: { id: noteId } });
}
