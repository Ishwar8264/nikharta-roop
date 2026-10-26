/** Thrown when the target of a favorite does not exist. */
export class FavoriteTargetNotFoundError extends Error {
  constructor() {
    super("Favorite target not found");
    this.name = "FavoriteTargetNotFoundError";
  }
}

/** Thrown when the favorite does not exist. */
export class FavoriteNotFoundError extends Error {
  constructor() {
    super("Favorite not found");
    this.name = "FavoriteNotFoundError";
  }
}

/** Thrown when the same target is already favorited by this user. */
export class FavoriteAlreadyExistsError extends Error {
  constructor() {
    super("This item is already in your favorites");
    this.name = "FavoriteAlreadyExistsError";
  }
}
