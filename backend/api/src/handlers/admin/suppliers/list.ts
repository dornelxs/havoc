import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { getDb } from "@/db/client.js";
import { authFailureResponse, requireAdmin } from "@/lib/auth.js";
import { internalError, ok } from "@/lib/http.js";

/** GET /admin/suppliers — lista de fornecedores pro painel administrativo. */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const authResult = await requireAdmin(event);
    if (!authResult.ok) return authFailureResponse(authResult);

    const db = await getDb();
    const rows = await db.query.suppliers.findMany({
      orderBy: (s, { asc }) => [asc(s.name)],
    });

    return ok({ suppliers: rows });
  } catch (error) {
    return internalError(error);
  }
}
