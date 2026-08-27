# Havoc E-commerce — Documentação de Decisões

> Registro vivo de decisões técnicas e de produto. Atualizar a cada mudança relevante.

---

## 1. Visão Geral

E-commerce da **Havoc** (marca própria), inspirado na estrutura, UX e fluxo de navegação do **adidas.com.br**. Fase atual: **frontend apenas**, com dados mockados localmente. Backend será desenvolvido depois, usando ecossistema **AWS**.

## 2. Referência de Design — adidas.com.br

Prints de referência coletados em 2026-08-23 (home, mega-menu, PLP, filtros). Padrões extraídos:

| Elemento | Padrão adidas | Aplicado no Havoc |
|---|---|---|
| Header | Logo + nav horizontal (Mulher/Homem/Infantil/Tendências/Esportes/Outlet) + busca + conta/wishlist/sacola | Mesma estrutura, adaptada pro catálogo Havoc |
| Top bar | Faixa preta com aviso institucional (login/cadastro) | Faixa com frete grátis/parcelamento |
| Mega-menu | Dropdown no hover com colunas (Novidades, Tênis, Roupas, Acessórios, Esportes) + banner promocional à direita | Replicado: colunas por categoria + banner lateral |
| Hero | Banner full-bleed com imagem de atleta/produto + CTA | Banner full-bleed com CTA "Comprar Novidades" |
| Home sections | Carrosséis: "Inspire-se", "Para quem você está comprando" (avatares por público), grid de produtos por categoria com tabs | Seções equivalentes: categorias, novidades, mais vendidos |
| PLP (listagem) | Breadcrumb, título com contagem, tabs de sub-coleção, botão "Filtrar e Organizar" abrindo drawer lateral direito, chips de filtros aplicados | Drawer de filtro lateral (Sheet), chips, contagem de produtos |
| Product Card | Imagem, hover troca imagem, preço, nome, "N cores" quando variantes, ícone de favoritar | Replicado com swatches de cor e contagem |
| Footer | Colunas (Produtos/Esportes/Suporte/Institucional/Redes sociais), CTA de cadastro em destaque, bandeiras de pagamento | Estrutura equivalente simplificada |

Decisão: **não clonar 1:1** (evitar risco de marca), mas seguir o **padrão estrutural/UX** com identidade visual própria da Havoc (preto/branco, tipografia bold condensada).

## 2.1 Identidade Visual (Rebrand — 2026-08-23)

Novo design system adotado a partir de conceitos de banner/ícone fornecidos pelo usuário (`havoc_banners.html`, `havoc_icones.html`). Referência visual: streetwear técnico, angular, alto contraste.

**Paleta:**
| Token | Valor | Uso |
|---|---|---|
| `--black` | `#0A0A0A` | Fundo base (modo dark, padrão) |
| `--bone` | `#F1F0EC` | Texto/fundo claro |
| `--steel` | `#8C8C8C` | Texto secundário |
| `--red` | `#FF2E2E` | Accent/destructive/CTA de destaque — mapeado em `--destructive`, `--ring`, `--chart-1` |
| `--line` | `#2B2B2B` | Bordas no modo dark |

**Tipografia (3 fontes, via `next/font/google`):**
- **Chakra Petch** (`--font-display`, peso 600/700) — headlines, uppercase, todo `h1`/`h2` de seção e nome de produto
- **Inter** (`--font-sans`) — corpo de texto, parágrafos, preços
- **JetBrains Mono** (`--font-mono`) — labels/eyebrows/nav/CTA, sempre uppercase com `tracking-[0.1em]` a `tracking-[0.25em]` (vocabulário "mono uppercase" do banner de referência)

**Modo de tema:** dark-first (`defaultTheme="dark"` via `next-themes`, `attribute="class"`, `enableSystem={false}`). Toggle manual em `ThemeToggle` (`src/components/theme-toggle.tsx`) no header. Tokens `:root` = variante light (bone/preto), `.dark` = variante padrão (preto/osso/vermelho). **Ambos os modos existem e devem ser mantidos ao editar `globals.css`** — nunca hardcode cor fora dos tokens.

**Forma:** cantos retos (`--radius: 0.125rem`, a maioria dos componentes usa `rounded-none` explícito) — exceção: elementos circulares por natureza (avatar de público-alvo, swatch de cor, dot de radio, badge de contagem numérica, botão de coração da wishlist).

**Ícone/logo:** `HavocMark` (`src/components/brand/havoc-mark.tsx`) — octógono preto com "H" branco (opção 01 do conceito de ícones, a recomendada pro favicon/avatar). Usado no header, footer e em `src/app/icon.svg` (favicon). Variante "ápice isolado" (opção 05) documentada no conceito mas não implementada ainda — candidata a marca d'água em embalagem/detalhe, não decidida.

**Onde aplicado:** header (logo, nav, mega-menu, search, top bar), footer, hero, product card (badges), product buy-box (CTAs, labels), product filters (chips, sort, cor), cart sheet, wishlist page. Toda label/CTA curto virou mono uppercase; todo heading de seção virou Chakra Petch uppercase.

## 3. Stack Técnica

- **Framework:** Next.js 16 (App Router) + TypeScript + Turbopack
- **Estilo:** Tailwind CSS v4 (`@theme inline`, tokens OKLCH)
- **Componentes:** shadcn/ui sobre **Base UI** (`@base-ui/react`) — atenção: nesta versão do shadcn, `Button` não usa Radix `Slot`/`asChild`, e sim prop **`render`** para polimorfismo (`<Button render={<Link href="...">texto</Link>} />`)
- **Ícones:** lucide-react
- **Estado do carrinho:** Zustand (`persist` em localStorage), sem backend ainda
- **Dados:** mock local em `src/data/products.ts`, tipado em `src/types/product.ts`
- **Imagens de produto:** placeholders SVG gerados via script (`scripts/gen-placeholders.mjs`) até termos assets reais

## 4. Arquitetura de Pastas

```
src/
  app/
    page.tsx                    → Home
    novidades/page.tsx          → Todas as novidades
    categoria/[slug]/page.tsx   → PLP por categoria ou gênero
    produto/[slug]/page.tsx     → PDP
  components/
    layout/site-header.tsx      → Header + mega-menu + busca + ícones
    layout/site-footer.tsx      → Footer institucional
    home/hero-banner.tsx        → Hero da home
    home/category-strip.tsx     → Grid de categorias
    product/product-card.tsx    → Card de produto (grid)
    product/product-grid.tsx    → Grid responsivo
    product/product-gallery.tsx → Galeria de imagens do PDP
    product/product-buy-box.tsx → Seleção cor/tamanho + add to cart
    product/product-detail.tsx  → Composição gallery + buy-box (sincroniza cor)
    product/product-filters.tsx → Drawer de filtro (estilo "Filtrar e Organizar")
    cart/cart-sheet.tsx         → Sacola lateral (Sheet)
  data/products.ts              → Catálogo mock
  types/product.ts               → Tipos de domínio (Product, CartItem, etc)
  store/cart-store.ts            → Zustand store do carrinho
  lib/format.ts                  → Formatação de preço (BRL)
```

## 5. Decisões de Produto / UX

- **Moeda:** BRL, formatação via `Intl.NumberFormat("pt-BR")`
- **Parcelamento:** exibido como "10x sem juros" no PDP (texto estático por ora)
- **Frete grátis:** anunciado na top bar (regra de valor ainda não aplicada, é só copy)
- **Carrinho:** Sheet lateral, abre automaticamente ao adicionar item, persiste no localStorage, checkout **desabilitado** (aguarda backend AWS)
- **Categorias (foco atual, 2026-08-23):** `tenis`, `oculos`, `relogios`, `roupas-academia` — categorias antigas (roupas genérico, acessórios, futebol, corrida, training) foram removidas do mock e do mega-menu
- **Gênero:** `masculino`, `feminino`, `unissex`, `infantil` — filtragem inclui sempre itens unissex
- **Variantes:** cor (colorway) determina imagens e ativa/desativa tamanhos por estoque
- **Rotas de produto/categoria:** estáticas via `generateStaticParams` (SSG) — todo catálogo mock é conhecido em build time

## 6. Backend (AWS) — em desenvolvimento

A arquitetura de backend está decidida e documentada em detalhe em [`../havoc-documentacao-tecnica.md`](../havoc-documentacao-tecnica.md) (raiz do repositório) — esse é o documento de referência para infraestrutura, modelo de dados, autenticação, painel admin, imagens e segurança. Esta seção mantém só o resumo relevante pro frontend:

- Hospedagem frontend: AWS Amplify Hosting ou Vercel (não decidido, ambos compatíveis)
- API: API Gateway + Lambda (Node/TS)
- Banco de dados: RDS Postgres (`db.t4g.micro`, free tier) — modelo relacional (SUPPLIERS/PRODUCTS/VARIANTS/CUSTOMERS/ORDERS/ORDER_ITEMS)
- Autenticação: Amazon Cognito
- Pagamentos: gateway brasileiro (Pix/cartão) — integração via Lambda, provedor ainda não escolhido
- Imagens de produto: S3 + CloudFront + Lambda de resize/WebP (substituindo os placeholders SVG atuais)
- Mock atual (`src/data/products.ts`) deve virar contrato de API — manter mesmo shape de `Product`/`CartItem` ao desenhar endpoints, pra reduzir retrabalho no frontend
- Código do backend vive em `../backend/` (fora deste diretório frontend)

## 7. Pendências conhecidas

- [ ] Mega-menu do header (hover dropdown estilo adidas) — ver seção 8
- [ ] Drawer "Filtrar e Organizar" na PLP — ver seção 8
- [ ] Busca funcional (input existe, sem lógica)
- [x] Página de conta/login — implementada, mas com autenticação **mockada** (ver changelog); trocar por Cognito real quando `Havoc-Auth` estiver deployado
- [x] Wishlist/favoritos — implementado (ver changelog)
- [ ] Checkout real (bloqueado até a API estar deployada e a autenticação mockada ser trocada pela real)
- [ ] Trocar placeholders SVG por fotos reais de produto
- [ ] Painel admin (`/admin`) conectado à API real — hoje só `/admin/produtos` lê o mock do frontend; `/admin/fornecedores`, `/admin/pedidos`, `/admin/clientes` são placeholders sem fetch nenhum
- [ ] Endpoints admin de pedidos (`GET /admin/orders`, `PATCH /admin/orders/{id}`) e de clientes (`GET /admin/customers`) — não existem no backend ainda, necessários pras telas correspondentes do painel

## 8. Changelog

### 2026-08-26
- **Fix crítico: dropdown de conta crashava silenciosamente.** `DropdownMenuLabel` usava o primitivo `Menu.GroupLabel` do Base UI, que exige um `Menu.Group` ancestral inexistente — isso lançava um erro não capturado que derrubava a árvore de componentes inteira do header sem feedback visual algum (por isso "nada acontecia" após o login). Trocado por uma `<div>` simples. Corrigidos também: hydration mismatch no contador do carrinho (faltava guard `mounted`, igual ao bug já resolvido antes na wishlist) e keys duplicadas `/novidades` no nav (desktop e mobile)
- **CRUD de produto no admin**: novo `useProductStore` (Zustand+persist, `havoc-products-admin`) — catálogo editável client-side, seedado do mock original, usado como "banco" temporário até a API admin real estar deployada. `/admin/produtos` ganhou criar/editar/excluir de verdade (antes só listava); `ProductForm` (`src/components/admin/product-form.tsx`) é o formulário compartilhado, com lista dinâmica de cores/tamanhos. **A loja pública continua lendo o mock estático original** (`src/data/products.ts`), não este store — unificação é passo futuro, não feito ainda
- **Dashboard corrigido pra refletir dropshipping real**: "Alertas de Estoque" (número fake, sugeria contagem que não existe no modelo) virou "Variantes Indisponíveis" — métrica real, conta `inStock: false` no catálogo. Não existe e nunca existirá conceito de estoque com quantidade (seção 2 da doc técnica: dropshipping é disponibilidade booleana por variante, não quantidade)
- **Autenticação mockada + painel admin inicial**: novo `useAuthStore` (Zustand+persist, `havoc-auth-mock`) com login/cadastro **100% mock, sem Cognito real** — deliberadamente documentado como temporário em `src/store/auth-store.ts`, com um único usuário de teste (`admin@havoc.com`/`admin123`). Páginas `/login` e `/cadastro`. Hook `useRequireAuth(role?)` (`src/lib/use-require-auth.ts`) faz guard client-side de rota (proteção de UX, não de segurança — a autorização real continua sendo feita no backend via JWT Authorizer + `requireAdmin()`). `AccountMenu` no header troca entre "Entrar" e um dropdown (Meus Pedidos / Painel Admin se `role === "admin"` / Sair). Novo `/admin` (layout + nav lateral + dashboard com dados de exemplo claramente marcados, `/admin/produtos` consumindo o mock existente do frontend, `/admin/fornecedores`, `/admin/pedidos`, `/admin/clientes` como placeholders honestos apontando pro endpoint que falta). `/minha-conta/pedidos` para o cliente. **Nada disso está conectado à API real ainda** — ver `backend/README.md` para os endpoints já prontos no backend que essas telas devem passar a consumir
- **Novo hook `useMounted()`** (`src/lib/use-mounted.ts`) centraliza o padrão de hydration-guard (`useEffect(() => setMounted(true), [])`) que já se repetia em 6 arquivos — motivado por uma regra nova do lint (`react-hooks/set-state-in-effect`) que passou a acusar esse padrão espalhado; o hook isola o `eslint-disable` num único lugar documentado em vez de espalhar a exceção
- **Backend iniciado em `../backend/`**: scaffold CDK (5 stacks: Network/Database/Auth/Api/Storage) + schema Drizzle completo + handlers Lambda de referência (catálogo público, pedidos do cliente com autorização por linha, admin de produtos com allowlist+auditoria, trigger de criação de conta). Frontend continua 100% mock por enquanto — nenhuma integração real ainda, ver `backend/README.md` e a seção 11 de `../havoc-documentacao-tecnica.md` para o estado exato
- **Arquitetura de backend definida**: RDS Postgres + Cognito + Lambda/API Gateway + S3/CloudFront (100% AWS, com foco em custo zero/baixo via free tier — evita Aurora Serverless v2). Documentado em detalhe em `../havoc-documentacao-tecnica.md`, incluindo modelo de negócio (dropshipping), modelo de dados, padrão de acesso ao banco (sem RLS automática — autorização por linha é responsabilidade explícita de cada query), autenticação/admin, painel administrativo, pipeline de imagens e checklist de segurança. README e seção 6 deste documento atualizados pra apontar pra ele como fonte da verdade
- **Mega-menu gerado dinamicamente do catálogo**: `mega-menu-data.ts` deixou de ser hardcoded e agora lê `getAllProducts()` — cada coluna de categoria (Tênis/Roupas/Óculos/Relógios) lista automaticamente todas as tags reais existentes para aquele gênero, então nunca fica com sub-links a menos (nem a mais) do que o catálogo suporta. Coluna de categoria some inteira se não houver produto daquele gênero na categoria. Header ajustado (`gap-8`, colunas `flex-1`, promo `hidden xl:block` pra não espremer em telas menores)
- **Tabs da PLP agora respeitam o filtro de gênero ativo**: antes listavam todas as tags da categoria inteira mesmo com `?genero=` aplicado, mostrando tabs vazias. Agora `tags` deriva de `genderFiltered`, e a tag ativa é limpa automaticamente da URL se deixar de existir pro gênero selecionado
- **Mega-menu 100% funcional**: todos os links agora apontam pra combinações reais do catálogo via query params (`/categoria/tenis?genero=masculino&tag=corrida`), sem links redundantes ou mortos. Filtro de tag na PLP migrou de state local pra URL (`?tag=`), igual `?genero=`, pra permitir deep-linking do mega-menu. Adicionados 3 produtos infantis ao mock (`kids-runner`, `kids-tee`, `kids-track-set`) — antes a coluna "Infantil" do mega-menu e `/categoria/infantil` não tinham nenhum produto real
- **Descrição dinâmica por seleção na PLP**: cada tab de sub-coleção (`TAG_DESCRIPTIONS`) e cada gênero (`GENDER_DESCRIPTIONS`) tem texto próprio, substituindo a descrição base da categoria quando ativos. Prioridade: tag > gênero > descrição da categoria
- **PLP (página de categoria) redesenhada** seguindo padrão adidas.com.br (print de referência): breadcrumb ("Voltar / Página Inicial / Categoria"), título grande + contagem entre colchetes em vermelho, descrição SEO por categoria (`CATEGORY_DESCRIPTIONS`), tabs de sub-coleção geradas a partir das `tags` do produto, chips de contexto ativo (categoria + tag + gênero) em preto sólido com botão de remover. Novo componente `CategoryPageContent` (client) substitui a antiga `ProductListing` direto na página; suporta filtro de gênero via query param `?genero=masculino|feminino` (chips "Homem"/"Mulher" clicáveis, combináveis com a categoria da rota). `ProductFilters` ganhou `key` dinâmica pra resetar sort/cor ao trocar tab/gênero. Página envolvida em `Suspense` por causa de `useSearchParams` (exigência do Next pra SSG)
- **Rebrand completo** aplicado a partir de conceitos de banner/ícone do usuário — ver seção 2.1 para o design system completo (paleta preto/osso/vermelho, Chakra Petch + Inter + JetBrains Mono, ícone octógono+H, dark-first com toggle, cantos retos). Aplicado em: header, footer, hero, product card, buy-box, filtros, cart sheet, wishlist
- **Home ampliada** com seções inspiradas no padrão adidas.com.br: `OutfitInspiration` (carrossel de looks lifestyle), `ShopByAudience` (avatares Mulher/Homem/Infantil/Ver Tudo), `ProductTabsSection` (grid com tabs por categoria — Tênis/Roupas de Academia/Óculos/Relógios), `EditorialBanners` (2 banners editoriais lado a lado), `FeatureStrip` (frete/troca/guia de tamanhos/wishlist). Ordem final: Hero → Category Strip → Outfit Inspiration → Shop by Audience → Product Tabs → Novidades → Editorial Banners → Mais Vendidos → Feature Strip (Category Strip movida pro topo a pedido, logo após o Hero). Seções sem equivalente no nosso catálogo (times de futebol, adiclub/pontos) foram deliberadamente omitidas
- **Ajuste de espaçamento do nav** pra bater com o print de referência: removido `uppercase`/`tracking-wide`, gap reduzido (`gap-5`/`ml-8`), "Outlet" adicionado como item fixo em destaque (cor destructive), sem alterar a top bar de frete grátis
- **Mega-menu reestruturado gênero-first** (Mulher/Homem/Infantil no topo, igual print de referência adidas.com.br): cada dropdown tem colunas Novidades/Tênis/Roupas de Academia/Acessórios + banner promo lateral + linha de footer com "Todos os Produtos/Tênis/Roupas/Acessórios". Links "Tendências/Esportes/Outlet" seguem como itens simples ao lado. `MegaMenuColumn.links` ganhou flag `bold?` pro link em destaque dentro da coluna
- **Foco de catálogo redefinido**: produto agora concentra em 4 categorias — Tênis, Óculos, Relógios, Roupas de Academia. Categorias antigas (futebol, corrida separada, acessórios genérico) removidas do tipo `ProductCategory`, do mock (`src/data/products.ts`), do mega-menu e da home. Catálogo mock passou de 13 pra 17 produtos, todos redistribuídos nas 4 categorias novas
- **Lista de desejos (wishlist)**: novo `useWishlistStore` (Zustand + persist, `havoc-wishlist` no localStorage), `WishlistButton` reutilizável (card e PDP), ícone de coração no header com contador, página `/lista-de-desejos`. Hydration-safe via guard `mounted` (evita mismatch SSR/localStorage)
- Tipografia padronizada: trocado Geist Sans/Mono por **Inter** (via `next/font/google`), única fonte do projeto, mapeada em `--font-sans`
- Fix: header do drawer "Filtrar e Organizar" com `pr-12` pra não sobrepor o botão de fechar (X) do Sheet
- Scaffold inicial Next.js + Tailwind + shadcn/ui
- Estrutura de tipos, mock catalog (13 produtos), cart store
- Páginas: home, PDP, PLP por categoria/gênero, novidades
- Header simples (nav direta, sem mega-menu), footer institucional
- Placeholders de imagem gerados via SVG
- Recebidos prints de referência do adidas.com.br → iniciado alinhamento de mega-menu e filtros de PLP (em andamento nesta mesma sessão)
