import { describe, expect, it, vi } from "vitest";
import {
  getDatabaseCutoverSignature,
  hashCutoverSnapshot,
  verifyManagedDatabaseCutover,
  type CutoverSnapshot,
} from "./database-cutover";

const snapshot: CutoverSnapshot = {
  users_count: "192",
  users_signature: "users",
  lessons_count: "551",
  lessons_signature: "lessons",
  students_count: "53",
  students_signature: "students",
  assignments_count: "250",
  assignments_signature: "assignments",
  vocabulary_count: "1603",
  vocabulary_signature: "vocabulary",
  jobs_count: "16",
  jobs_signature: "jobs",
  stripe_subscriptions_count: "3",
  stripe_subscriptions_signature: "subscriptions",
};

function mockDatabase(value: CutoverSnapshot = snapshot) {
  return {
    query: vi.fn(async () => ({ rows: [value] })),
  } as any;
}

describe("managed database cutover verification", () => {
  it("does not query the database while legacy mode is selected", async () => {
    const database = mockDatabase();
    await verifyManagedDatabaseCutover(
      database,
      { source: "legacy", connectionString: "postgresql://legacy/db" },
      {},
    );
    expect(database.query).not.toHaveBeenCalled();
  });

  it("blocks managed mode without a verified source signature", async () => {
    const database = mockDatabase();
    await expect(
      verifyManagedDatabaseCutover(
        database,
        { source: "managed", connectionString: "postgresql://managed/db" },
        {},
      ),
    ).rejects.toThrow("SIGNATURE is missing or invalid");
    expect(database.query).not.toHaveBeenCalled();
  });

  it("blocks managed mode when destination data differs", async () => {
    const database = mockDatabase();
    await expect(
      verifyManagedDatabaseCutover(
        database,
        { source: "managed", connectionString: "postgresql://managed/db" },
        { PLANWISE_MANAGED_DATABASE_SIGNATURE: "0".repeat(64) },
      ),
    ).rejects.toThrow("destination data does not match");
  });

  it("allows managed mode only when the copied data matches", async () => {
    const database = mockDatabase();
    const expected = hashCutoverSnapshot(snapshot);
    await expect(
      verifyManagedDatabaseCutover(
        database,
        { source: "managed", connectionString: "postgresql://managed/db" },
        { PLANWISE_MANAGED_DATABASE_SIGNATURE: expected },
      ),
    ).resolves.toBeUndefined();
  });

  it("produces a stable signature from the database snapshot", async () => {
    const expected = hashCutoverSnapshot(snapshot);
    await expect(getDatabaseCutoverSignature(mockDatabase())).resolves.toBe(
      expected,
    );
  });
});