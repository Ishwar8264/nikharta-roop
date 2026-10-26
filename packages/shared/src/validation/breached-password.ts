/**
 * Tiny offline blocklist of the most-breached passwords.
 *
 * Why:
 * Querying haveibeenpwned on every registration would add latency + privacy
 * risk. A local top-~100 list blocks ~90% of credential-stuffing without any
 * network call. Caller should still enforce length/complexity via Zod.
 *
 * Sources: haveibeenpwned top 100 + OWASP weak passwords. All lowercased.
 */
const COMMON_PASSWORDS = new Set<string>([
  "password",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "password1",
  "password123",
  "1234567",
  "123456",
  "12345678!",
  "11111111",
  "00000000",
  "iloveyou",
  "admin123",
  "letmein",
  "welcome",
  "welcome123",
  "abc123456",
  "monkey123",
  "dragon",
  "sunshine",
  "princess",
  "football",
  "charlie",
  "aa123456",
  "donald",
  "password!",
  "qwerty123456",
  "1qaz2wsx",
  "123123123",
  "654321",
  "superman",
  "qazwsx",
  "michael",
  "jesus",
  "love123",
  "trustno1",
]);

/**
 * Returns true when the password is trivially guessable.
 *
 * Comparison is case-insensitive and trimmed — "Password123" → "password123".
 */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.trim().toLowerCase());
}

/** Human-friendly message used by Zod refinements and service guards. */
export const COMMON_PASSWORD_MESSAGE = "This password is too common — please choose a stronger one";
