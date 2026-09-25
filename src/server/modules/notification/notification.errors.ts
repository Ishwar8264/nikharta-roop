/** Thrown when a notification does not exist or does not belong to the user. */
export class NotificationNotFoundError extends Error {
  constructor() {
    super("Notification not found");
    this.name = "NotificationNotFoundError";
  }
}

/** Thrown when no provider is registered for the requested channel. */
export class NotificationChannelUnsupportedError extends Error {
  constructor(channel: string) {
    super(`No provider is registered for channel "${channel}"`);
    this.name = "NotificationChannelUnsupportedError";
  }
}
