# Havoc — Backend

Backend do e-commerce Havoc: infraestrutura 100% AWS (RDS Postgres + Cognito + Lambda/API Gateway + S3/CloudFront), desenhada com foco em custo zero/baixo na fase atual via free tier. A arquitetura completa, com justificativas, modelo de dados e checklist de segurança, está documentada em [`../havoc-documentacao-tecnica.md`](../havoc-documentacao-tecnica.md) — **leia esse documento antes de mexer aqui**, este README cobre só "como rodar".

## Estrutura

```
backend/
├── infra/     # AWS CDK (TypeScript) — toda a infraestrutura como código
└── api/       # Schema Drizzle + handlers Lambda (a lógica de negócio)
```

Workspace npm simples (dois pacotes, `infra` e `api`) — não há build tool de monorepo além disso por enquanto.

## Pacote `api/`

Contém o schema do banco (Drizzle ORM) e os handlers Lambda. Não é deployado diretamente — o CDK em `infra/` importa os arquivos de `api/src/handlers/*` e empacota cada um como uma função Lambda via `NodejsFunction` (bundling automático com esbuild).

### Setup local

```bash
cd backend/api
npm install
```

### Schema e migrations

O schema vive em `src/db/schema.ts`, espelhando o modelo de dados descrito na seção 6 da doc técnica (SUPPLIERS → PRODUCTS → VARIANTS, CUSTOMERS → ORDERS → ORDER_ITEMS, mais `admin_audit_log`).

```bash
# gerar uma nova migration a partir de mudanças no schema.ts
npm run db:generate

# aplicar as migrations pendentes contra um banco (local ou RDS já provisionado)
DATABASE_URL=postgres://usuario:senha@host:5432/havoc npm run db:migrate

# popular um banco local/dev com um fornecedor e produto de exemplo
DATABASE_URL=postgres://usuario:senha@host:5432/havoc npm run db:seed
```

`DATABASE_URL` é usado **só** por esses scripts locais/de deploy. Em runtime, as Lambdas nunca leem `DATABASE_URL` — elas buscam a credencial do Secrets Manager via `src/lib/secrets.ts` (ver seção "Segredos" abaixo).

### Handlers implementados (ponto de partida)

| Handler | Rota | Autenticação | O que faz |
|---|---|---|---|
| `products/list.ts` | `GET /products` | Pública | Lista catálogo, filtros opcionais de categoria/gênero/tag. Nunca retorna `costPrice` |
| `products/get-by-slug.ts` | `GET /products/{slug}` | Pública | Detalhe de um produto (PDP) |
| `orders/list-mine.ts` | `GET /orders/mine` | Cliente autenticado | Pedidos do usuário logado — referência do padrão de autorização por linha (ver `src/lib/auth.ts`) |
| `orders/checkout.ts` | `POST /orders/checkout` | Cliente autenticado | Cria o pedido a partir do carrinho. Recalcula o preço de cada item a partir da variant no banco (nunca confia em preço vindo do client), valida estoque, grava ORDER+ORDER_ITEMS numa transação. Pedido nasce como `pending_payment` — a confirmação de pagamento é responsabilidade do futuro webhook do gateway, não deste handler |
| `admin/products/upsert.ts` | `POST/PUT /admin/products` | Admin | Cria/atualiza produto, com allowlist Zod e log em `admin_audit_log` |
| `auth/post-confirmation.ts` | Trigger Cognito | — | Cria o registro em `CUSTOMERS` após confirmação de cadastro, com `role` fixado como `customer` no servidor |

Estes cinco cobrem os três padrões que qualquer novo endpoint deve seguir: rota pública, rota autenticada com filtro por dono do dado, e rota admin com allowlist + auditoria. Ao adicionar um endpoint novo, comece copiando o mais parecido com o que você precisa.

### Convenções ao adicionar um handler

- **Nunca faça `SELECT *`** — liste as colunas explicitamente (`columns: {...}` no Drizzle), principalmente pra nunca vazar `costPrice` de `variants` ou dados de `suppliers` numa resposta pública.
- **Toda rota que não é pública precisa resolver `getAuthContext()`** (`src/lib/auth.ts`) e checar `role` quando for admin-only — o API Gateway JWT Authorizer garante só que o token é válido, não que o usuário tem a permissão certa.
- **Toda query que filtra por dono do registro precisa do filtro explícito** (`WHERE customer_id = ...` equivalente em Drizzle) — não existe RLS automática no RDS (ver seção 4 da doc técnica). Esquecer esse filtro é uma falha de segurança (IDOR), não um bug cosmético.
- **Todo payload de escrita passa por um schema Zod** em `src/schemas/` antes de tocar o banco — a allowlist do schema é o que impede mass assignment.
- **Toda mutação feita por um admin grava em `admin_audit_log`** — copie o padrão de `admin/products/upsert.ts`.

## Pacote `infra/`

CDK em TypeScript, cinco stacks com dependência em cadeia:

```
NetworkStack (VPC, sem NAT Gateway)
    │
    ├── DatabaseStack (RDS Postgres db.t4g.micro)
    │       │
    │       ├── AuthStack (Cognito User Pool + trigger PostConfirmation)
    │       │
    │       └── ApiStack (Lambda + HTTP API Gateway, depende de Auth pro JWT Authorizer)
    │
    └── StorageStack (S3 + CloudFront, independente das demais)
```

### Setup local

```bash
cd backend/infra
npm install

# primeira vez usando CDK nesta conta/região da AWS:
npx cdk bootstrap

# ver o que seria criado, sem aplicar nada
npm run diff

# gerar o CloudFormation localmente, sem tocar a AWS (útil pra revisar antes de deployar)
npm run synth

# aplicar de fato (cria/atualiza os recursos reais na AWS — vai custar, mesmo que pouco)
npm run deploy
```

Pré-requisito: credenciais AWS configuradas localmente (`aws configure` ou variáveis de ambiente) com permissão para criar VPC, RDS, Cognito, Lambda, API Gateway, S3 e CloudFront.

### Decisões de custo embutidas na infra (ver seção 3 da doc técnica)

- **Zero NAT Gateway** — as Lambdas que precisam do RDS ficam em subnet isolada sem rota de internet; o que precisam de outro serviço AWS (Secrets Manager) usa um VPC Interface Endpoint em vez de NAT.
- **RDS `db.t4g.micro`, single-AZ, sem Aurora** — dentro do free tier de 12 meses.
- **Cognito, Lambda e API Gateway** — free tier permanente nos volumes esperados nesta fase.
- Antes do primeiro `cdk deploy`, configure **AWS Budgets** com um alerta de custo (não faz parte deste CDK ainda — configurar manualmente no Console ou adicionar como stack própria depois).

### Segredos

O RDS gera automaticamente um Secret no Secrets Manager com host/porta/usuário/senha (`Credentials.fromGeneratedSecret` no `database-stack.ts`). As Lambdas recebem só a **ARN** desse secret via variável de ambiente (`DB_SECRET_ARN`) e o buscam em runtime — a senha em si nunca aparece em código, variável de ambiente em texto plano, nem no state do CDK além do próprio Secrets Manager.

### O que ainda falta nesta infra (ver seção 11 da doc técnica para a lista completa)

- Lambda de transformação/resize de imagem (`StorageStack` hoje só serve os arquivos como estão)
- Rate limiting (usage plans do API Gateway ou AWS WAF)
- Security headers completos, HSTS
- Stack de AWS Budgets / alertas de custo
- Ajustar `corsPreflight.allowOrigins` do `ApiStack` do wildcard `"*"` para o domínio real do frontend antes de qualquer ambiente que não seja dev pessoal

## Ordem de deploy recomendada (primeira vez)

1. `cdk bootstrap` (uma vez por conta/região)
2. `cdk deploy Havoc-Network`
3. `cdk deploy Havoc-Database` (demora alguns minutos — provisionamento de RDS)
4. `npm run db:migrate` (pacote `api/`, apontando `DATABASE_URL` para o endpoint do RDS recém-criado — pegue o secret gerado no Secrets Manager Console)
5. `cdk deploy Havoc-Auth`
6. `cdk deploy Havoc-Api`
7. `cdk deploy Havoc-Storage`

Ou simplesmente `npm run deploy` (deploya todas as stacks, o CDK resolve a ordem de dependência sozinho) — só separe os passos manualmente se quiser rodar a migration entre a criação do banco e o resto.
