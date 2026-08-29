export type DatabaseSource = "legacy" | "managed";

type DatabaseEnvironment = {
  PLANWISE_DATABASE_SOURCE?: string;
  NEON_DATABASE_URL?: string;
  DATABASE_URL?: string;
};

export interface DatabaseConfig {
  source: DatabaseSource;
  connectionString: string;
}

function requirePostgresUrl(value: string | undefined, variableName: string): string {
  if (!value) {
    throw new Error(`${variableName} is required for the selected database source.`);
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL connection URL.`);
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error(`${variableName} must use the postgres:// or postgresql:// protocol.`);
  }

  return value;
}

/**
 * Selects one database for every server-side consumer.
 *
 * The default remains "legacy" until the managed development database has
 * been populated and verified. Cutover is explicit:
 * PLANWISE_DATABASE_SOURCE=managed makes Replit's environment-specific
 * DATABASE_URL authoritative. Removing NEON_DATABASE_URL alone can never
 * silently switch production to an empty database.
 */
export function resolveDatabaseConfig(
  env: DatabaseEnvironment = process.env as DatabaseEnvironment,
): DatabaseConfig {
  const source = env.PLANWISE_DATABASE_SOURCE || "legacy";

  if (source === "managed") {
    return {
      source,
      connectionString: requirePostgresUrl(env.DATABASE_URL, "DATABASE_URL"),
    };
  }

  if (source === "legacy") {
    return {
      source,
      connectionString: requirePostgresUrl(
        env.NEON_DATABASE_URL,
        "NEON_DATABASE_URL",
      ),
    };
  }

  throw new Error(
    `PLANWISE_DATABASE_SOURCE must be "legacy" or "managed"; received "${source}".`,
  );
}