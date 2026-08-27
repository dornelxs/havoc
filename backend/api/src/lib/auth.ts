import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { customers } from "@/db/schema.js";

export interface AuthContext {
  cognitoSub: string;
  customerId: string;
  role: "customer" | "admin";
}

/**
 * Resolve o cliente autenticado a partir do JWT validado pelo API Gateway
 * (JWT Authorizer configurado contra o User Pool do Cognito — a validação de
 * assinatura/expiração já aconteceu antes deste código rodar).
 *
 * Retorna `null` se não houver claims (rota deveria estar protegida no nível
 * do API Gateway, mas o handler confere de novo — defesa em profundidade,
 * nunca confia cegamente na camada anterior).
 *
 * Este é o ponto central de autorização por linha discutido na seção 4 da
 * doc técnica: como o RDS não tem RLS automática, é aqui que resolvemos
 * "quem é o usuário" antes de qualquer handler decidir o que ele pode ver.
 */
export async function getAuthContext(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<AuthContext | null> {
  const claims = event.requestContext.authorizer?.jwt?.claims;
  const cognitoSub = claims?.sub as string | undefined;
  if (!cognitoSub) return null;

  const db = await getDb();
  const customer = await db.query.customers.findFirst({
    where: eq(customers.cognitoSub, cognitoSub),
    columns: { id: true, role: true },
  });

  if (!customer) return null;

  return {
    cognitoSub,
    customerId: customer.id,
    role: customer.role,
  };
}
