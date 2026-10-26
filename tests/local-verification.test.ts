import { afterEach, expect, it, vi } from "vitest";
import { bypassLocalSalonVerification } from "../src/server/modules/salon/local-verification";
afterEach(() => vi.unstubAllEnvs());
it("requires development, explicit opt-in and a local database", () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("DATABASE_URL", "postgresql://localhost/nikharta_DB");
  vi.stubEnv("LOCAL_SALON_VERIFICATION_BYPASS", "true");
  expect(bypassLocalSalonVerification()).toBe(true);
  vi.stubEnv("NODE_ENV", "production");
  expect(bypassLocalSalonVerification()).toBe(false);
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("DATABASE_URL", "postgresql://database.example.com/nikharta_DB");
  expect(bypassLocalSalonVerification()).toBe(false);
  vi.stubEnv("DATABASE_URL", "invalid");
  expect(bypassLocalSalonVerification()).toBe(false);
  vi.stubEnv("DATABASE_URL", "postgresql://localhost/nikharta_DB");
  vi.stubEnv("LOCAL_SALON_VERIFICATION_BYPASS", "false");
  expect(bypassLocalSalonVerification()).toBe(false);
});
