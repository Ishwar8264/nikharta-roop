import "server-only";

import { randomBytes, scrypt } from "node:crypto";

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
  const derivedKey = await deriveKey(password, salt);

  return [
    "scrypt",
    `N=${SCRYPT_COST},r=${SCRYPT_BLOCK_SIZE},p=${SCRYPT_PARALLELIZATION}`,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

/** Runs scrypt asynchronously so password hashing does not block the event loop. */
function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        cost: SCRYPT_COST,
        blockSize: SCRYPT_BLOCK_SIZE,
        parallelization: SCRYPT_PARALLELIZATION,
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
