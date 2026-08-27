import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { getDatabaseUrl } from "@/lib/secrets.js";

let cachedClient: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Retorna um client Drizzle conectado ao RDS, reaproveitando a conexão entre
 * invocações da mesma execution environment da Lambda (evita reabrir conexão
 * a cada chamada — importante porque o RDS tem um limite baixo de conexões
 * simultâneas no tier `db.t4g.micro`).
 */
export async function getDb() {
  if (cachedClient) return cachedClient;

  const connectionString = await getDatabaseUrl();
  const queryClient = postgres(connectionString, {
    max: 1, // uma conexão por execution environment; escale com RDS Proxy se necessário
    idle_timeout: 20,
    connect_timeout: 10,
  });

  cachedClient = drizzle(queryClient, { schema });
  return cachedClient;
}
