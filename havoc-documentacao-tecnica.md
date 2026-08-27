# Havoc — Documentação técnica

**Status:** frontend em desenvolvimento (catálogo mockado), backend a ser implementado.
**Escopo deste documento:** decisões de arquitetura, backend, modelo de dados, painel admin, otimização de imagens e segurança, definidas em conjunto para orientar a implementação.

---

## 1. Visão geral do projeto

Havoc é um e-commerce de artigos esportivos (tênis, óculos, relógios, roupas de academia) em regime de **dropshipping**: a loja não mantém estoque físico. O cliente efetua o pagamento e, a partir da confirmação, a equipe solicita o produto ao fornecedor correspondente.

**Stack do frontend (já implementada):**

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 |
| Componentes UI | shadcn/ui sobre Base UI |
| Estado (carrinho/wishlist) | Zustand + persist (localStorage) |
| Tema | next-themes (dark como padrão) |

---

## 2. Modelo de negócio: dropshipping

Implicações diretas no desenho técnico:

- **Sem controle de estoque físico** — não há necessidade de decremento atômico de estoque como em e-commerce tradicional.
- **Disponibilidade é uma estimativa**, não uma garantia — o campo de tamanho/cor "disponível" reflete a última informação repassada pelo fornecedor, atualizada manualmente pelo admin.
- **Cada pedido pode envolver múltiplos fornecedores** — itens de um mesmo pedido podem seguir ritmos de fulfillment diferentes.
- **Margem por produto é informação sensível** — a diferença entre `price` (venda) e `cost_price` (custo do fornecedor) nunca pode ser exposta ao cliente final.

---

## 3. Infraestrutura: AWS com foco em custo zero/baixo no estágio atual

### Decisão

Mantém-se **100% AWS**, evitando especificamente os componentes que custam caro em baixo tráfego (Aurora Serverless v2 sempre ativo). A combinação escolhida usa o free tier de cada serviço para operar a **custo próximo de zero** enquanto o projeto não tem tráfego relevante, com caminho de crescimento natural dentro do próprio ecossistema AWS.

| Camada | Serviço escolhido | Por que este e não a alternativa mais cara |
|---|---|---|
| Banco de dados | **RDS Postgres** (`db.t4g.micro`) | Free tier 12 meses (750h/mês, cobre uso 24/7 de uma instância); Postgres padrão, suporta o modelo relacional já desenhado (seção 6) sem adaptação. Evita Aurora Serverless v2, cujo custo mínimo por hora de ACU ativa o torna caro mesmo ocioso |
| Autenticação | **Amazon Cognito** | Free tier **permanente** até 50.000 MAU (usuários ativos por mês) — não é trial de 12 meses, então continua gratuito bem além da fase inicial |
| Armazenamento de imagens | **Amazon S3** | Free tier 12 meses (5GB + requisições); depois do free tier, custo é de centavos por GB/mês em baixo volume |
| API / lógica de servidor | **Lambda + API Gateway** | Free tier **permanente** (1M de invocações Lambda/mês, 1M de chamadas API Gateway/mês) — cobre folgadamente o volume de um e-commerce em fase inicial |
| Hospedagem do frontend | **AWS Amplify Hosting** (ou Vercel, ver observação) | Free tier generoso, build e deploy do Next.js sem infraestrutura própria a manter |

### Pontos de atenção para manter o custo baixo

- **Nunca usar Aurora Serverless v2** nesta fase — é o único item da lista original de arquitetura AWS que não tem uma opção de custo zero equivalente; RDS `db.t4g.micro` resolve o mesmo problema (Postgres transacional) dentro do free tier.
- **Monitorar o relógio do free tier do RDS** (12 meses corridos a partir da criação da instância) — ao expirar, o custo passa a ser o de uma instância `db.t4g.micro` sob demanda (baixo, mas não mais zero). Cognito, Lambda e API Gateway continuam gratuitos indefinidamente nesses limites de uso.
- **Configurar AWS Budgets** com alerta de custo desde o primeiro dia, para não ser surpreendido caso o tráfego cresça além do previsto ou algum recurso fique mal configurado (ex.: instância RDS maior que `t4g.micro` por engano).

### Hospedagem do frontend: Amplify vs. Vercel

Ambos resolvem bem o deploy de um app Next.js. Amplify Hosting mantém tudo dentro da conta AWS (mais simples para billing e IAM unificados); Vercel tem a melhor experiência de desenvolvimento para Next.js especificamente (é o mesmo time que mantém o framework), mas introduz um segundo provedor de billing. Nenhuma decisão tomada ainda — qualquer um dos dois é compatível com o restante desta arquitetura; a Server Action de checkout e os Server Components continuam funcionando da mesma forma nos dois casos.

### O que continua fora da AWS

- **Gateway de pagamento** (Stripe, Mercado Pago ou Pagar.me) — nenhum serviço de nuvem resolve isso, é sempre uma integração externa dedicada a pagamentos.

### Caminho de crescimento futuro

Como o banco já nasce em RDS Postgres (não uma camada proprietária), crescer para Aurora (provisionado ou Serverless v2) quando o tráfego justificar o custo é uma mudança de classe de instância/motor, não uma reescrita do modelo de dados ou da camada de acesso (Server Components/Server Actions, seção 4).

---

## 4. Padrão de acesso ao banco de dados

### Decisão

Toda comunicação com o banco de dados passa pelo backend — **o browser nunca fala diretamente com o RDS para ler ou escrever dados.** O Postgres do RDS não é exposto publicamente; fica dentro de uma VPC, acessível apenas pelas funções Lambda que compõem a API.

### Como isso fica na prática com Next.js + Lambda

- **Leitura de dados**: feita em Server Components (que chamam a API via Lambda/API Gateway) ou diretamente em Server Components com acesso de rede à VPC, dependendo de onde o frontend é hospedado — o código de acesso ao banco nunca chega ao bundle enviado ao navegador.
- **Escrita de dados (mutações)**: feita via Server Actions do Next.js, que por sua vez chamam a API (Lambda). Nenhum componente `"use client"` monta uma query SQL ou chama o banco diretamente.
- **Sessão do usuário**: o backend valida o JWT emitido pelo Cognito a cada chamada (via API Gateway Authorizer ou verificação manual na Lambda) e aplica os filtros de autorização (`WHERE customer_id = ...`) explicitamente em cada query — como o Postgres do RDS não tem uma camada de RLS habilitada por padrão como o Supabase oferece pronta, essa checagem de "este usuário só vê os próprios dados" precisa ser escrita e testada deliberadamente em cada endpoint, e não assumida como garantida pela infraestrutura.
- **Credenciais do banco**: a Lambda usa uma role/credencial de conexão gerenciada (idealmente via IAM database authentication do RDS, ou um segredo no AWS Secrets Manager) — nunca uma connection string exposta ao frontend.

### Por que isso é considerado boa prática aqui

- **Superfície de ataque menor**: o client nunca sabe quais tabelas/colunas existem nem como consultá-las — reduz o que um atacante consegue descobrir só olhando o tráfego de rede.
- **Validação centralizada**: toda regra de negócio (preço recalculado no checkout, allowlist de campos, filtro de autorização por dono do registro) vive em um único lugar no servidor, em vez de espalhada e potencialmente divergente entre chamadas feitas do client.
- **Autorização explícita por ausência de RLS automática**: como o RDS não aplica isolamento de linha sozinho, cada query precisa ser escrita assumindo que "esquecer o filtro `WHERE customer_id = ...` expõe dado de outro cliente" — vale reforçar esse ponto em code review, já que aqui não existe uma segunda camada de defesa automática cobrindo esse erro.
- **Facilita auditoria e rate limiting**: como toda escrita passa por um ponto central no servidor, fica mais simples logar quem fez o quê e aplicar limites de uso.

### Trade-off reconhecido

Esse padrão exige mais código do que uma API autogerada tipo PostgREST — cada endpoint precisa de uma Lambda (ou rota dentro de uma Lambda maior) escrevendo a query e aplicando a checagem de autorização manualmente. Em troca, ganha-se controle total sobre a lógica de negócio e um único lugar para auditar todo acesso a dado sensível. Dado o cuidado que o projeto já está tendo com segurança, essa troca vale a pena — e é o preço de manter tudo dentro do ecossistema AWS em vez de uma plataforma de backend gerenciado.

---

## 5. Estimativa de custo inicial

| Item | Estimativa mensal |
|---|---|
| RDS Postgres `db.t4g.micro` | US$ 0 (free tier, 12 meses) → depois ~US$ 15–20 |
| Cognito (até 50.000 MAU) | US$ 0 (free tier permanente) |
| Lambda + API Gateway (baixo volume) | US$ 0 (free tier permanente) |
| S3 (imagens, até 5GB) | US$ 0 (free tier, 12 meses) → depois poucos centavos/GB |
| Hospedagem do frontend (Amplify Hosting ou Vercel) | US$ 0–20 |
| Domínio (registro + DNS via Route 53 ou registrador externo) | ~R$ 40–90/ano |
| **Total aproximado nos primeiros 12 meses** | **~US$ 0–20/mês** |
| **Total aproximado após o free tier do RDS/S3 expirar** | **~US$ 15–40/mês** |

*Não inclui taxas de transação do gateway de pagamento (tipicamente 2–5% + taxa fixa por transação) nem tempo de desenvolvimento. Valores sujeitos a variação — confirmar nas calculadoras oficiais da AWS antes de orçar formalmente, e configurar AWS Budgets para alertar sobre qualquer desvio.*

---

## 6. Modelo de dados

### Entidades principais

**SUPPLIERS** (fornecedores)
- `id` (PK), `name`, `contact_info`

**PRODUCTS**
- `id` (PK), `supplier_id` (FK → SUPPLIERS), `slug`, `name`

**VARIANTS** (cor/tamanho de um produto)
- `id` (PK), `product_id` (FK → PRODUCTS), `size`, `color`, `price`, `cost_price`

**CUSTOMERS**
- `id` (PK), `email`, `full_name`

**ORDERS**
- `id` (PK), `customer_id` (FK → CUSTOMERS, **obrigatório** — não há pedido sem conta), `status`, `total`, `created_at`

**ORDER_ITEMS**
- `id` (PK), `order_id` (FK → ORDERS), `variant_id` (FK → VARIANTS), `quantity`, `unit_price`, `supplier_order_ref`, `fulfillment_status`

### Relacionamentos

- Um fornecedor supre vários produtos (`SUPPLIERS 1—N PRODUCTS`)
- Um produto tem várias variações de cor/tamanho (`PRODUCTS 1—N VARIANTS`)
- Um cliente faz vários pedidos (`CUSTOMERS 1—N ORDERS`)
- Um pedido contém vários itens (`ORDERS 1—N ORDER_ITEMS`)
- Cada item de pedido referencia uma variação específica (`VARIANTS 1—N ORDER_ITEMS`)

### Decisões de modelagem

- **`fulfillment_status` fica no item do pedido, não no pedido** — itens do mesmo pedido podem vir de fornecedores diferentes e ter status de envio distintos. O status geral exibido ao cliente pode ser derivado do pior status entre os itens.
- **Status do pedido (fluxo sugerido):** `pending_payment` → `paid` → `awaiting_supplier_order` → `ordered_from_supplier` → `shipped` → `delivered`, com `cancelled`/`refunded` podendo ocorrer antes de `shipped`.
- **`cost_price` na variação** permite calcular margem por produto (essencial em dropshipping para saber se o negócio é saudável item a item).
- **Carrinho permanece 100% client-side** (Zustand + localStorage) — só o pedido confirmado precisa existir no banco.
- **Decremento de estoque não se aplica** — não há estoque físico a controlar; o campo de disponibilidade por tamanho é atualizado manualmente pelo admin.

---

## 7. Contas e autenticação

### Contas de cliente (cadastro público)

- Cadastro público via Amazon Cognito (`SignUpCommand`, AWS SDK), com e-mail/senha.
- Ao criar a conta (via trigger `PostConfirmation` do Cognito, chamando uma Lambda), o registro correspondente é criado em `CUSTOMERS`, com `role` **fixado como `customer` no servidor** — esse campo nunca é lido do payload enviado pelo cliente.
- Fluxo de recuperação de senha segue o item 29 do checklist de segurança: token de expiração curta, uso único, e invalidação de sessões antigas na troca de senha.

### Cadastro obrigatório para finalizar compra

- **Não há checkout de convidado.** O carrinho é montado livremente sem conta (client-side, como já definido), mas ao clicar em "finalizar compra" o sistema verifica se existe sessão ativa antes de prosseguir.
- **Sem sessão:** o cliente é redirecionado para a tela de cadastro/login, com retorno automático ao checkout assim que a autenticação for concluída — o conteúdo do carrinho não se perde nesse meio-tempo, pois já vive no localStorage do navegador, independente de login.
- **Com sessão:** o checkout segue direto, e o pedido criado já nasce vinculado ao `customer_id` da conta autenticada — nunca a um pedido "anônimo".
- Essa verificação acontece na própria Server Action de checkout (seção 4), nunca só na interface — um usuário não pode contornar a exigência de conta manipulando o client.

### Contas de admin (nunca criadas por cadastro público)

- **Não existe rota pública de criação de conta admin.** Contas admin são provisionadas diretamente por alguém com acesso administrativo à conta AWS — via `AdminCreateUserCommand` (AWS SDK) em um script interno, ou manualmente pelo Console do Cognito.
- Após a conta existir no User Pool do Cognito, o papel `admin` é setado manualmente na tabela de perfis do RDS (`UPDATE profiles SET role = 'admin' WHERE cognito_sub = '...'`) — nunca por uma chamada de API que o frontend possa disparar.
- **Nenhum endpoint da aplicação aceita ou processa um campo `role`/`is_admin` vindo do cliente.** Isso fecha por completo o vetor de escalonamento de privilégio: mesmo que alguém forje uma requisição com `{ role: "admin" }`, não existe caminho no código que leia esse campo do payload — o valor é sempre definido no servidor, fora do alcance do usuário.

### Por que essa separação importa

Se o cadastro público pudesse, por falha de implementação, aceitar um papel escolhido pelo cliente, qualquer visitante poderia se autopromover a admin. Manter o provisionamento de admin inteiramente fora do aplicativo público — só via banco/dashboard — elimina essa superfície de ataque, em vez de depender de uma validação que algum dia pode falhar.

---

## 8. Painel administrativo

### Estrutura de navegação

1. **Dashboard** — pedidos do dia, receita, margem estimada, alertas de indisponibilidade reportada pelo fornecedor.
2. **Pedidos** — lista filtrável por status; detalhe do pedido com itens, endereço do cliente, campo de rastreio por item, histórico de mudança de status. Tela central da operação diária (fila de "aguardando repasse ao fornecedor").
3. **Produtos** — CRUD completo do catálogo: nome, subtítulo, categoria, descrição, imagens, preço de venda e preço de custo lado a lado (margem visível), cores e tamanhos disponíveis, fornecedor vinculado.
4. **Fornecedores** — cadastro: nome, contato, portal/site de pedido, observações (prazo médio, política de devolução).
5. **Clientes** — read-only, histórico de pedidos por cliente (suporte).

### Controle de acesso

- Rota `/admin` protegida por checagem de papel (`admin`) no middleware do Next.js, além da checagem de autorização explícita em cada query da Lambda (defesa em profundidade — ver seção 4 sobre a ausência de RLS automática no RDS).
- Papel `admin` separado do papel `customer` — nenhuma conta de cliente deve alcançar o painel. Provisionamento de conta admin descrito na seção 7.
- **MFA obrigatório para contas admin**, dado que ações ali (alterar preço, marcar pedido como enviado) têm impacto financeiro direto.

### Edição de produto — todos os campos editáveis pelo admin

Imagens, título, subtítulo, descrição, categoria, preço, preço comparativo, cores (nome + swatch), tamanhos por cor (marcados como disponível/indisponível conforme informação do fornecedor) e fornecedor vinculado.

---

## 9. Upload e otimização de imagens

**Formato definido: WebP.** Suporte praticamente universal nos navegadores atuais, 25–35% menor que JPEG na mesma qualidade visual, com suporte a transparência.

### Pipeline

1. Upload da imagem pelo admin → S3 (via URL pré-assinada gerada pela Lambda, pra não passar o arquivo pela API/Lambda de negócio).
2. Validação no upload: tipo MIME real do arquivo (não confiar na extensão), tamanho máximo (ex.: rejeitar acima de 5MB ou 3000px, comum em fotos de fornecedor sem tratamento) — feita na Lambda antes de emitir a URL pré-assinada, e reforçada por uma trigger `S3:ObjectCreated` que roda a validação real no arquivo já enviado.
3. Transformação (resize + conversão pra WebP) via uma Lambda dedicada, seguindo o padrão [AWS Serverless Image Handler](https://aws.amazon.com/solutions/implementations/serverless-image-handler/): CloudFront na frente do S3, requisição de imagem com parâmetros (`width`, `quality`, `format=webp`) aciona a Lambda que gera e cacheia a variante sob demanda — evita gerar cópias manualmente no upload.
4. Entrega ao frontend via `next/image`, que gera automaticamente múltiplas resoluções (srcset) por viewport, apontando pra URL do CloudFront.
5. Qualidade de compressão: **75–80%** (perda imperceptível a olho nu, arquivo significativamente menor que 100%).
6. Lazy loading por padrão; `priority` apenas na primeira imagem visível (hero, primeira foto do produto) para evitar layout shift.

---

## 10. Segurança

### 10.1 Checklist base (20 itens)

| # | Item | Aplicação no Havoc |
|---|---|---|
| 1 | Esconder API keys | Credenciais do RDS e chaves de terceiros (gateway de pagamento) só em variáveis de ambiente da Lambda / AWS Secrets Manager — nunca no bundle do frontend |
| 2 | Limpar secrets do git | `.env.local` no `.gitignore` desde o primeiro commit; se vazar, trocar a chave (remover do histórico não desfaz o vazamento) |
| 3 | Public key DB | RDS dentro de uma VPC privada, sem endpoint público — só a Lambda (na mesma VPC ou via peering) alcança o banco; pela decisão da seção 4, o browser nunca chama o banco direto de forma alguma |
| 4 | Autorização por linha | Sem RLS automática no RDS (seção 4) — cada query da Lambda aplica explicitamente o filtro de dono do registro (`WHERE customer_id = ...`); tratado como código de segurança crítico, com testes dedicados |
| 5 | Criptografia de dados | Habilitar encryption at rest no RDS e no bucket S3 (ambos suportam nativamente, é uma flag de configuração); dado de cartão nunca armazenado — fica só no gateway de pagamento |
| 6 | Auth server-side | Preço, status de pedido e decisões financeiras sempre confirmados no servidor (Lambda), nunca confiando em valor vindo do client |
| 7 | Restringir acessos | Papéis `customer` vs `admin` verificados a partir do JWT do Cognito, checados na Lambda/API Gateway Authorizer + no middleware do Next.js |
| 8 | Bloquear mass assignment | Allowlist explícita de campos aceitos em cada insert/update — nunca aceitar o payload inteiro do cliente |
| 9 | Proteger cookies | Cookie de sessão `HttpOnly` + `Secure` + `SameSite`, configurado manualmente na integração com Cognito (não vem pronto como no `@supabase/ssr` — atenção redobrada aqui) |
| 10 | Hash nas senhas | Automático (gerenciado internamente pelo Cognito) |
| 11 | Rate limit | Login, criação de conta e checkout — via usage plans do API Gateway (throttling nativo) ou AWS WAF rate-based rules; pendente de configuração |
| 12 | Bot protection | AWS WAF com CAPTCHA/Challenge gerenciado, ou Cloudflare Turnstile na frente do formulário, em cadastro/login e checkout |
| 13 | Queries parametrizadas | Obrigatório usar prepared statements / query builder parametrizado na Lambda (ex.: `pg` com placeholders, ou um ORM como Drizzle/Prisma) — nunca concatenar SQL com input do usuário |
| 14 | Validação de inputs | Validação server-side com schema (ex.: Zod) antes de qualquer escrita no banco |
| 15 | Vazar conteúdo | Garantir que queries do cliente final nunca tragam `cost_price` ou dados de `SUPPLIERS` — reforçado pela ausência de `select('*')` (item 17) |
| 16 | Restringir uploads | Validar tipo MIME real e tamanho máximo no upload de imagem do admin |
| 17 | Trim de respostas de API | Nunca usar `select('*')` — selecionar apenas as colunas necessárias em cada endpoint |
| 18 | Security headers | Configurar CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS no `next.config.ts` |
| 19 | Forçar HTTPS | Redirect HTTP→HTTPS e HSTS confirmados explicitamente na hospedagem |
| 20 | Dependências | Dependabot/Renovate ativo, `npm audit` no CI, atenção a typosquatting em pacotes novos |

### 10.2 Itens complementares (OWASP Top 10:2025 e OWASP API Security Top 10)

| # | Item | Aplicação no Havoc |
|---|---|---|
| 21 | IDOR / controle de acesso a objetos | Testar explicitamente se um cliente consegue acessar pedido de outro cliente trocando o ID na URL |
| 22 | Abuso de fluxos de negócio sensíveis | **Carding** (teste de cartão roubado no checkout) e abuso de cupom — mitigar com rate limit, captcha e ferramentas antifraude do gateway de pagamento |
| 23 | Configuração de nuvem | Verificar visibilidade de buckets do Storage (público vs. privado) e evitar mensagens de erro que exponham detalhes internos ao usuário final |
| 24 | XSS | Sanitizar qualquer conteúdo dinâmico exibido (descrição de produto, futuras avaliações); evitar `dangerouslySetInnerHTML` |
| 25 | Cadeia de suprimentos de software | Usar `npm ci` no CI/CD (não `npm install`); revisar scripts de `postinstall` de pacotes novos |
| 26 | Consumo irrestrito de recursos | Rate limit também em endpoints caros (busca, transformação de imagem), não só login |
| 27 | Logging e alertas | Registrar eventos sensíveis (login falho, ações de admin) **e** configurar alertas — log sem alerta tem pouco valor prático |
| 28 | Tratamento de condições excepcionais | Falha deve ser "fechada" por padrão — ex.: erro na verificação de assinatura do webhook de pagamento nunca deve confirmar o pedido |
| 29 | Fluxo de reset de senha | Token de redefinição com expiração curta e uso único; troca de senha invalida sessões antigas |
| 30 | Inventário de API | Manter lista viva de endpoints/funções Lambda ativos, evitar funções de teste esquecidas em produção |

### 10.3 Pendências de implementação ativa

Itens que exigem decisão e código específico (não vêm prontos de fábrica por optar por RDS + Lambda + Cognito em vez de uma plataforma de backend gerenciado tipo Supabase): **4, 8, 9, 11, 12, 13, 14, 16, 17, 18, 20, 21, 22, 26, 27, 28**. Em particular, os itens **4** (autorização por linha) e **9** (configuração de cookie de sessão) merecem atenção redobrada: são exatamente os dois pontos que uma plataforma de backend gerenciado costuma resolver por padrão, e que aqui precisam ser implementados e testados manualmente.

### 10.4 LGPD

Armazenamento de nome, e-mail, endereço e histórico de compra de clientes brasileiros exige: política de privacidade acessível, base legal clara (execução de contrato), e mecanismo de solicitação de exclusão de dados pelo cliente.

### 10.5 Auditoria

Tabela `admin_audit_log` registrando alterações feitas por contas admin (quem mudou o quê) — baixo custo de implementação agora, alto custo de reconstruir retroativamente depois.

---

## 11. Roadmap técnico — próximos passos

Código em `backend/` (ver `backend/README.md` para como rodar). Itens já implementados no scaffold inicial estão marcados; o resto é o caminho até um backend utilizável ponta a ponta.

- [x] CDK (TypeScript) com 5 stacks: `Havoc-Network` (VPC sem NAT Gateway), `Havoc-Database` (RDS `db.t4g.micro`), `Havoc-Auth` (Cognito + trigger PostConfirmation), `Havoc-Api` (Lambda + HTTP API Gateway com JWT Authorizer), `Havoc-Storage` (S3 + CloudFront) — `cdk synth` validado
- [x] Schema Drizzle completo (seção 6) + primeira migration gerada (`backend/api/src/db/migrations/0000_lazy_skin.sql`)
- [x] Convenção de autorização por linha documentada e exemplificada (`backend/api/src/lib/auth.ts`, `orders/list-mine.ts` como handler de referência)
- [x] Handler `GET /products` e `GET /products/{slug}` (catálogo público, nunca expõe `costPrice`)
- [x] Handler `GET /orders/mine` (autenticado, filtro por dono do registro)
- [x] Handler admin `POST/PUT /admin/products` — allowlist Zod + checagem de role + gravação em `admin_audit_log`
- [x] Trigger `PostConfirmation` do Cognito — cria o perfil no signup com `role` fixado como `customer` no servidor
- [ ] Provisionar de fato a infra numa conta AWS (`cdk bootstrap` + `cdk deploy`) — até agora só sintetizado localmente, nada rodando na nuvem
- [ ] Rodar a migration contra o RDS real após o primeiro deploy (`npm run db:migrate`)
- [ ] Script interno de provisionamento de conta admin (fora do app público, via `AdminCreateUserCommand`)
- [ ] Função de checkout (criação de pedido + validação server-side de preço + exigência de sessão ativa)
- [ ] Webhook de pagamento com verificação de assinatura
- [ ] Rate limiting em login, criação de conta e checkout (usage plans do API Gateway ou AWS WAF)
- [ ] Security headers no `next.config.ts` (frontend) e nas respostas da API
- [ ] Lambda de transformação/resize de imagem (pipeline WebP completo, seção 9 — hoje o `StorageStack` só serve os arquivos como estão)
- [ ] AWS Budgets configurado com alerta de custo desde o primeiro deploy
- [ ] Busca funcional (pendência já identificada no README do frontend)
- [ ] Página de cadastro e login do cliente no frontend, integrada ao Cognito
- [ ] Conectar o frontend (hoje 100% mock, `frontend/src/data/products.ts`) aos endpoints reais
- [ ] Substituição dos placeholders SVG por fotos reais (pipeline WebP)
