import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Script de migração — roda localmente (ou num pipeline de deploy) contra
 * DATABASE_URL, nunca dentro da Lambda de runtime. Aplica as migrations
 * geradas em src/db/migrations (via `npm run db:generate`).
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Defina DATABASE_URL antes de rodar as migrations.");
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  console.log("Aplicando migrations...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations aplicadas com sucesso.");

  await client.end();
}

main().catch((error) => {
  console.error("Falha ao aplicar migrations:", error);
  process.exit(1);
});
