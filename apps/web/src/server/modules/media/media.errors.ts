/** Thrown when the requested media asset does not exist. */
export class MediaNotFoundError extends Error {
  constructor() {
    super("Media asset not found");
    this.name = "MediaNotFoundError";
  }
}

/** Thrown when the caller does not own the asset they are touching. */
export class MediaAccessDeniedError extends Error {
  constructor() {
    super("You do not have access to this media asset");
    this.name = "MediaAccessDeniedError";
  }
}

/** Thrown when a publicId is already persisted (unique constraint). */
export class MediaAlreadyExistsError extends Error {
  constructor() {
    super("This media asset has already been saved");
    this.name = "MediaAlreadyExistsError";
  }
}
