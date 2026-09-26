/** Thrown when a coupon code does not exist or was never issued. */
export class CouponNotFoundError extends Error {
  constructor() {
    super("Coupon not found");
    this.name = "CouponNotFoundError";
  }
}

/** Thrown when a coupon code already exists. */
export class CouponCodeConflictError extends Error {
  constructor() {
    super("A coupon with this code already exists");
    this.name = "CouponCodeConflictError";
  }
}

/** Thrown when a coupon is deactivated, expired, or outside its window. */
export class CouponNotActiveError extends Error {
  constructor(reason = "This coupon is not currently valid") {
    super(reason);
    this.name = "CouponNotActiveError";
  }
}

/** Thrown when the order total is below the coupon's minimum. */
export class CouponMinOrderNotMetError extends Error {
  public readonly minOrderAmount: number;

  constructor(minOrderAmount: number) {
    super(`Minimum order amount of ₹${minOrderAmount} is required`);
    this.name = "CouponMinOrderNotMetError";
    this.minOrderAmount = minOrderAmount;
  }
}

/** Thrown when the platform-wide usage limit has been reached. */
export class CouponUsageLimitReachedError extends Error {
  constructor() {
    super("This coupon has reached its usage limit");
    this.name = "CouponUsageLimitReachedError";
  }
}

/** Thrown when the caller has already used this coupon the maximum times. */
export class CouponPerUserLimitReachedError extends Error {
  constructor() {
    super("You have already used this coupon the maximum number of times");
    this.name = "CouponPerUserLimitReachedError";
  }
}

/** Thrown when a discount percentage or flat value is invalid. */
export class CouponInvalidDiscountError extends Error {
  constructor(message = "Discount configuration is invalid") {
    super(message);
    this.name = "CouponInvalidDiscountError";
  }
}

/** Thrown when the admin tries to change the code of an existing coupon. */
export class CouponCodeImmutableError extends Error {
  constructor() {
    super("The coupon code cannot be changed after creation");
    this.name = "CouponCodeImmutableError";
  }
}
