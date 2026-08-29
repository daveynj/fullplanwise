
import { defineConfig } from "drizzle-kit";
import { resolveDatabaseConfig } from "./server/database-url";

const { connectionString } = resolveDatabaseConfig();

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
