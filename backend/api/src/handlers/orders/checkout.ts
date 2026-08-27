import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { inArray } from "drizzle-orm";
import { getDb } from "@/db/client.js";
import { orderItems, orders, variants } from "@/db/schema.js";
import { checkoutSchema } from "@/schemas/order.js";
import { getAuthContext } from "@/lib/auth.js";
import { badRequest, internalError, ok, unauthorized } from "@/lib/http.js";

/**
 * POST /orders/checkout — cria um pedido a partir do carrinho.
 *
 * Não há checkout de convidado (seção 7 da doc técnica): esta rota fica
 * atrás do JWT Authorizer do Cognito no API Gateway, e o handler confere de
 * novo que existe uma sessão válida antes de prosseguir — um cliente não
 * pode contornar essa exigência manipulando o client, porque a checagem
 * acontece aqui, não só na UI.
 *
 * O preço de cada item é sempre recalculado a partir da variant no banco.
 * O client manda apenas `variantId` + `quantity` (ver schemas/order.ts); um
 * valor de preço vindo do payload, se existisse, seria ignorado — aqui ele
 * nem é aceito pelo schema.
 */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> {
  try {
    const auth = await getAuthContext(event);
    if (!auth) return unauthorized();

    const rawBody = event.body ? JSON.parse(event.body) : null;
    const parsed = checkoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return badRequest("Payload de checkout inválido.", parsed.error.flatten());
    }
    const { items, shippingAddress } = parsed.data;

    const db = await getDb();

    const variantIds = items.map((item) => item.variantId);
    const variantRows = await db.query.variants.findMany({
      where: inArray(variants.id, variantIds),
      columns: { id: true, price: true, inStock: true, productId: true },
    });

    const variantById = new Map(variantRows.map((v) => [v.id, v]));

    // Falha fechada: qualquer item que não exista mais, ou que esteja fora
    // de estoque, aborta o checkout inteiro em vez de silenciosamente
    // ignorar o item ou seguir com um total incompleto.
    for (const item of items) {
      const variant = variantById.get(item.variantId);
      if (!variant) {
        return badRequest(`Variante ${item.variantId} não encontrada.`);
      }
      if (!variant.inStock) {
        return badRequest(`Variante ${item.variantId} está indisponível no momento.`);
      }
    }

    let total = 0;
    const itemsToInsert = items.map((item) => {
      const variant = variantById.get(item.variantId)!;
      const unitPrice = Number(variant.price);
      total += unitPrice * item.quantity;
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: unitPrice.toFixed(2),
      };
    });

    // Transação: criar o pedido e todos os itens de forma atômica — um
    // pedido nunca deve existir com só parte dos itens gravados.
    const orderId = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          customerId: auth.customerId,
          status: "pending_payment",
          total: total.toFixed(2),
          shippingAddress,
        })
        .returning({ id: orders.id });

      if (!order) {
        throw new Error("Falha ao criar o pedido.");
      }

      await tx.insert(orderItems).values(
        itemsToInsert.map((item) => ({
          orderId: order.id,
          ...item,
        }))
      );

      return order.id;
    });

    // Próximo passo (fora deste handler): iniciar a cobrança no gateway de
    // pagamento e, na confirmação via webhook, mover o status de
    // "pending_payment" para "paid" — nunca marcar como pago diretamente
    // aqui, antes da confirmação real do pagamento.
    return ok({ orderId, total: total.toFixed(2), status: "pending_payment" });
  } catch (error) {
    return internalError(error);
  }
}
