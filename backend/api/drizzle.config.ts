import { defineConfig } from "drizzle-kit";

// Usado apenas localmente (via `npm run db:generate` / `db:migrate`), fora do
// runtime da Lambda — por isso lê DATABASE_URL direto do ambiente em vez de
// passar pelo Secrets Manager (ver src/lib/secrets.ts para o runtime real).
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/havoc",
  },
  strict: true,
  verbose: true,
});
