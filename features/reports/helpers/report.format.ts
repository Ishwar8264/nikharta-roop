type DecimalLike = { toString(): string };

/**
 * Serializes decimal aggregate values for API responses.
 */
export function moneyString(value: DecimalLike | number | null | undefined) {
  if (value == null) return "0";
  return typeof value === "number" ? value.toString() : value.toString();
}

/**
 * Converts a nullable aggregate sum to a stable string.
 */
export function aggregateMoney(value: DecimalLike | null | undefined) {
  return value?.toString() ?? "0";
}
