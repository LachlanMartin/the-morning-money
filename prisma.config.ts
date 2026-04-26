import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations use DIRECT_URL (port 5432) — pgbouncer/pooled URL doesn't support
// the prepared statements migrate runs. Runtime queries use DATABASE_URL via
// the PgAdapter in src/lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
