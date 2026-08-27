import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({});

let cachedUrl: string | null = null;

interface RdsSecret {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

/**
 * Monta a connection string do Postgres a partir do segredo gerenciado pelo
 * RDS no Secrets Manager (rotação automática de credenciais). Nunca hardcode
 * a connection string em variável de ambiente em texto plano — ver item 1 do
 * checklist de segurança em havoc-documentacao-tecnica.md.
 */
export async function getDatabaseUrl(): Promise<string> {
  if (cachedUrl) return cachedUrl;

  const secretId = process.env.DB_SECRET_ARN;
  if (!secretId) {
    throw new Error("DB_SECRET_ARN não configurado no ambiente da Lambda.");
  }

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );

  if (!response.SecretString) {
    throw new Error("Secret do banco não retornou SecretString.");
  }

  const secret = JSON.parse(response.SecretString) as RdsSecret;
  cachedUrl = `postgres://${secret.username}:${encodeURIComponent(secret.password)}@${secret.host}:${secret.port}/${secret.dbname}`;
  return cachedUrl;
}
