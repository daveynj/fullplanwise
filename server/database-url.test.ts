import { describe, expect, it } from "vitest";
import { resolveDatabaseConfig } from "./database-url";

const legacyUrl = "postgresql://legacy.example.test/planwise";
const managedUrl = "postgresql://managed.example.test/planwise";

describe("resolveDatabaseConfig", () => {
  it("defaults to the legacy database during migration", () => {
    expect(
      resolveDatabaseConfig({
        NEON_DATABASE_URL: legacyUrl,
        DATABASE_URL: managedUrl,
      }),
    ).toEqual({ source: "legacy", connectionString: legacyUrl });
  });

  it("uses Replit's environment-specific DATABASE_URL after explicit cutover", () => {
    expect(
      resolveDatabaseConfig({
        PLANWISE_DATABASE_SOURCE: "managed",
        NEON_DATABASE_URL: legacyUrl,
        DATABASE_URL: managedUrl,
      }),
    ).toEqual({ source: "managed", connectionString: managedUrl });
  });

  it("does not silently fall back when the selected database is missing", () => {
    expect(() =>
      resolveDatabaseConfig({
        PLANWISE_DATABASE_SOURCE: "managed",
        NEON_DATABASE_URL: legacyUrl,
      }),
    ).toThrow("DATABASE_URL is required");

    expect(() =>
      resolveDatabaseConfig({
        PLANWISE_DATABASE_SOURCE: "legacy",
        DATABASE_URL: managedUrl,
      }),
    ).toThrow("NEON_DATABASE_URL is required");
  });

  it("rejects invalid source names and non-PostgreSQL URLs", () => {
    expect(() =>
      resolveDatabaseConfig({
        PLANWISE_DATABASE_SOURCE: "automatic",
        NEON_DATABASE_URL: legacyUrl,
      }),
    ).toThrow('must be "legacy" or "managed"');

    expect(() =>
      resolveDatabaseConfig({
        PLANWISE_DATABASE_SOURCE: "managed",
        DATABASE_URL: "helium",
      }),
    ).toThrow("must be a valid PostgreSQL connection URL");
  });
});