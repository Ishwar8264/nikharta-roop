/** Thrown when the user's balance is insufficient for a redemption. */
export class LoyaltyInsufficientPointsError extends Error {
  constructor(available: number, requested: number) {
    super(
      `Insufficient points: available ${available}, requested ${requested}`,
    );
    this.name = "LoyaltyInsufficientPointsError";
  }
}

/** Thrown when a loyalty transaction does not exist or is not the caller's. */
export class LoyaltyTransactionNotFoundError extends Error {
  constructor() {
    super("Loyalty transaction not found");
    this.name = "LoyaltyTransactionNotFoundError";
  }
}

/** Thrown when the requested amount is not a positive integer. */
export class LoyaltyInvalidAmountError extends Error {
  constructor() {
    super("Points amount must be a positive integer");
    this.name = "LoyaltyInvalidAmountError";
  }
}
