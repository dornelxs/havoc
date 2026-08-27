import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../src/db/schema.js";

/**
 * Provisiona a primeira (ou uma nova) conta de admin — o único caminho
 * legítimo de criar um admin no Havoc (seção 7 da doc técnica). Roda fora
 * do app público: local, na máquina de quem tem acesso à conta AWS, nunca
 * como um endpoint da API.
 *
 * Uso:
 *   USER_POOL_ID=us-east-1_xxxxx \
 *   DATABASE_URL=postgres://... \
 *   npx tsx scripts/provision-admin.ts admin@havoc.com "Senha Temporária 123!"
 *
 * O que este script faz e por que:
 *   1. Cria (ou reaproveita, se já existir) o usuário no Cognito via
 *      AdminCreateUserCommand — nunca via signup público.
 *   2. Define uma senha permanente via AdminSetUserPasswordCommand
 *      (Permanent: true) para não depender do fluxo de "primeiro login troca
 *      senha", que existe pra clientes, não pra provisionamento manual.
 *   3. Upsert do registro em CUSTOMERS com role = "admin" — setado aqui,
 *      neste script, nunca por um endpoint que o app exponha.
 *
 * Depois de rodar, comunique a senha ao admin por um canal seguro (nunca
 * por e-mail em texto plano) e peça pra trocá-la no primeiro login.
 */
async function main() {
  const [, , email, temporaryPassword] = process.argv;
  const userPoolId = process.env.USER_POOL_ID;
  const databaseUrl = process.env.DATABASE_URL;
  const region = process.env.AWS_REGION ?? "sa-east-1";

  if (!email || !temporaryPassword) {
    console.error(
      "Uso: npx tsx scripts/provision-admin.ts <email> <senha>\n" +
        "Requer as variáveis de ambiente USER_POOL_ID e DATABASE_URL."
    );
    process.exit(1);
  }
  if (!userPoolId) {
    throw new Error("Defina USER_POOL_ID (ID do User Pool do Cognito).");
  }
  if (!databaseUrl) {
    throw new Error("Defina DATABASE_URL (connection string do RDS).");
  }

  const cognito = new CognitoIdentityProviderClient({ region });

  let cognitoSub: string;

  try {
    const created = await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
        MessageAction: "SUPPRESS", // não envia e-mail automático do Cognito; a senha é comunicada manualmente.
      })
    );
    cognitoSub =
      created.User?.Attributes?.find((a) => a.Name === "sub")?.Value ?? "";
    console.log(`Usuário criado no Cognito: ${email} (sub: ${cognitoSub})`);
  } catch (error) {
    if ((error as { name?: string }).name === "UsernameExistsException") {
      console.log(`Usuário ${email} já existe no Cognito, reaproveitando.`);
      const existing = await cognito.send(
        new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email })
      );
      cognitoSub =
        existing.UserAttributes?.find((a) => a.Name === "sub")?.Value ?? "";
    } else {
      throw error;
    }
  }

  if (!cognitoSub) {
    throw new Error("Não foi possível determinar o `sub` do usuário no Cognito.");
  }

  await cognito.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: temporaryPassword,
      Permanent: true,
    })
  );
  console.log("Senha definida como permanente.");

  const pgClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(pgClient, { schema });

  const existingCustomer = await db.query.customers.findFirst({
    where: eq(schema.customers.cognitoSub, cognitoSub),
  });

  if (existingCustomer) {
    await db
      .update(schema.customers)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(schema.customers.id, existingCustomer.id));
    console.log(`Customer existente (${existingCustomer.id}) promovido a admin.`);
  } else {
    const [created] = await db
      .insert(schema.customers)
      .values({ cognitoSub, email, role: "admin" })
      .returning({ id: schema.customers.id });
    console.log(`Customer criado como admin: ${created?.id}`);
  }

  await pgClient.end();
  console.log("\nProvisionamento concluído. Comunique a senha ao admin por um canal seguro.");
}

main().catch((error) => {
  console.error("Falha ao provisionar admin:", error);
  process.exit(1);
});
