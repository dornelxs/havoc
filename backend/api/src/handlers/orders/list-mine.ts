import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { orders } from "@/db/schema.js";
import { getAuthContext } from "@/lib/auth.js";
import { internalError, ok, unauthorized } from "@/lib/http.js";

/**
 * GET /orders/mine — pedidos do cliente autenticado.
 *
 * Este handler é o exemplo de referência do padrão de autorização por linha
 * (seção 4 da doc técnica): como não existe RLS automática no RDS, o filtro
 * `eq(orders.customerId, auth.customerId)` abaixo é a ÚNICA coisa que impede
 * um cliente de ver pedido de outro. Qualquer novo endpoint que liste ou
 * retorne ORDERS precisa repetir este filtro explicitamente — nunca assumir
 * que "só usuários autenticados chegam aqui" é suficiente.
 */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const auth = await getAuthContext(event);
    if (!auth) return unauthorized();

    const db = await getDb();
    const myOrders = await db.query.orders.findMany({
      where: eq(orders.customerId, auth.customerId),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      with: {
        items: {
          columns: {
            id: true,
            quantity: true,
            unitPrice: true,
            fulfillmentStatus: true,
          },
          with: {
            variant: {
              columns: { id: true, colorName: true, size: true, images: true },
              with: { product: { columns: { name: true, slug: true } } },
            },
          },
        },
      },
    });

    return ok({ orders: myOrders });
  } catch (error) {
    return internalError(error);
  }
}
