import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_COST = 2 ** 17;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_MAX_MEMORY = 256 * 1024 * 1024;

/**
 * Creates a salted, memory-hard password hash suitable for database storage.
 *
 * Why:
 * Scrypt slows offline password guessing, and a unique random salt prevents
 * identical passwords from producing identical stored values.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await deriveKey(password, salt, {
    cost: SCRYPT_COST,
    blockSize: SCRYPT_BLOCK_SIZE,
    parallelization: SCRYPT_PARALLELIZATION,
  });

  return [
    "scrypt",
    `N=${SCRYPT_COST},r=${SCRYPT_BLOCK_SIZE},p=${SCRYPT_PARALLELIZATION}`,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

/**
 * Verifies a plaintext password against a stored scrypt hash.
 *
 * Why:
 * Uses timingSafeEqual so comparison time does not leak how many leading
 * characters matched, and re-derives the key with the SAME parameters that
 * were stored, so old hashes keep working even if defaults change later.
 *
 * Returns `false` (never throws) for malformed hashes so callers can keep a
 * single "invalid credentials" response path.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parsed = parseStoredHash(storedHash);
  if (!parsed) return false;

  const { cost, blockSize, parallelization, salt, expectedKey } = parsed;

  const derivedKey = await deriveKey(password, salt, {
    cost,
    blockSize,
    parallelization,
  });

  // Length mismatch means this is not the hash shape we expect.
  if (derivedKey.length !== expectedKey.length) return false;

  return timingSafeEqual(derivedKey, expectedKey);
}

/** Runs scrypt asynchronously so password hashing does not block the event loop. */
function deriveKey(
  password: string,
  salt: Buffer,
  options: {
    cost: number;
    blockSize: number;
    parallelization: number;
  },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        cost: options.cost,
        blockSize: options.blockSize,
        parallelization: options.parallelization,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
}

interface ParsedStoredHash {
  cost: number;
  blockSize: number;
  parallelization: number;
  salt: Buffer;
  expectedKey: Buffer;
}

/** Parses our self-describing "scrypt$N=..,r=..,p=..$salt$hash" format. */
function parseStoredHash(stored: string): ParsedStoredHash | null {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return null;

  const params = new Map<string, number>();
  for (const pair of parts[1].split(",")) {
    const [key, rawValue] = pair.split("=");
    const value = Number(rawValue);
    if (!key || !Number.isFinite(value)) return null;
    params.set(key, value);
  }

  const cost = params.get("N");
  const blockSize = params.get("r");
  const parallelization = params.get("p");
  if (!cost || !blockSize || !parallelization) return null;

  return {
    cost,
    blockSize,
    parallelization,
    salt: Buffer.from(parts[2], "base64url"),
    expectedKey: Buffer.from(parts[3], "base64url"),
  };
}
