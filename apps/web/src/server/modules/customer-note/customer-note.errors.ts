import "server-only";

/** Thrown when a note does not exist in this salon. */
export class CustomerNoteNotFoundError extends Error {
  constructor() {
    super("Note not found");
    this.name = "CustomerNoteNotFoundError";
  }
}

/** Thrown when a non-author, non-manager tries to delete a note. */
export class CustomerNoteAccessDeniedError extends Error {
  constructor() {
    super("You do not have permission to delete this note");
    this.name = "CustomerNoteAccessDeniedError";
  }
}
