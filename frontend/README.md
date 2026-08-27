# Havoc — E-commerce

E-commerce da **Havoc**, marca própria de artigos esportivos (tênis, óculos, relógios e roupas de academia), construído com o site da **adidas.com.br** como referência de UX/estrutura, mas com identidade visual própria.

> **Status atual:** frontend em desenvolvimento, com dados de catálogo mockados localmente (sem backend/API ainda). O backend será construído depois no ecossistema **AWS**. Para o histórico completo de decisões técnicas e de produto, veja [`DECISIONS.md`](./DECISIONS.md) — este README cobre "como rodar e onde as coisas estão"; o `DECISIONS.md` cobre "por que as coisas são como são".

---

## Sumário

- [Stack técnica](#stack-técnica)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar](#como-rodar)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Catálogo mock e dados](#catálogo-mock-e-dados)
- [Identidade visual](#identidade-visual)
- [Funcionalidades implementadas](#funcionalidades-implementadas)
- [Rotas da aplicação](#rotas-da-aplicação)
- [Autenticação (mock)](#autenticação-mock)
- [Painel admin](#painel-admin)
- [Estado global (carrinho e wishlist)](#estado-global-carrinho-e-wishlist)
- [Imagens de produto (placeholders)](#imagens-de-produto-placeholders)
- [Convenções de código](#convenções-de-código)
- [Roadmap / o que falta](#roadmap--o-que-falta)
- [Backend (AWS)](#backend-aws)

---

## Stack técnica

| Camada | Tecnologia | Observação |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) | Turbopack como bundler, SSG nas páginas de produto/categoria |
| Linguagem | TypeScript | Strict mode via `tsconfig.json` padrão do Next |
| Estilo | [Tailwind CSS v4](https://tailwindcss.com) | Configuração CSS-first via `@theme inline` em `src/app/globals.css`, sem `tailwind.config.js` |
| Componentes UI | [shadcn/ui](https://ui.shadcn.com) sobre [Base UI](https://base-ui.com) | **Atenção:** esta versão do shadcn usa Base UI, não Radix — `Button` não tem prop `asChild`, usa `render` (ver seção Convenções) |
| Ícones | [lucide-react](https://lucide.dev) | |
| Estado (carrinho/wishlist) | [Zustand](https://zustand-demo.pmnd.rs) + `persist` (localStorage) | Sem backend, então tudo client-side por enquanto |
| Tema claro/escuro | [next-themes](https://github.com/pacocoursey/next-themes) | Dark é o tema padrão; toggle manual no header |
| Notificações (toast) | [sonner](https://sonner.emilkowal.ski) | |
| Fontes | Chakra Petch (display), Inter (corpo), JetBrains Mono (labels/UI) | Via `next/font/google`, self-hosted no build |

## Pré-requisitos

- Node.js 20+ (recomendado 22 LTS)
- npm (o projeto usa `package-lock.json`; não foi testado com yarn/pnpm)

## Como rodar

```bash
# instalar dependências
npm install

# subir o servidor de desenvolvimento (http://localhost:3000)
npm run dev

# build de produção
npm run build

# rodar o build de produção localmente
npm run start

# lint
npm run lint
```

Não há variáveis de ambiente necessárias hoje — todo o catálogo é mock local em `src/data/products.ts`, sem chamadas de API externas.

## Scripts disponíveis

| Script | Comando | O que faz |
|---|---|---|
| `dev` | `next dev` | Servidor de desenvolvimento com Turbopack e hot reload |
| `build` | `next build` | Build de produção — gera páginas estáticas (SSG) para todo produto/categoria conhecidos em `src/data/products.ts` via `generateStaticParams` |
| `start` | `next start` | Serve o build de produção |
| `lint` | `eslint` | Roda o ESLint (config em `eslint.config.mjs`, baseado em `eslint-config-next`) |

Há também um script utilitário fora do fluxo do `npm run`:

```bash
node scripts/gen-placeholders.mjs
```

Gera os arquivos SVG de placeholder em `public/products/` (ver [Imagens de produto](#imagens-de-produto-placeholders)).

## Estrutura de pastas

```
havoc/
├── DECISIONS.md              # Histórico de decisões técnicas/produto (leitura recomendada)
├── scripts/
│   └── gen-placeholders.mjs  # Gera as imagens SVG placeholder do catálogo
├── public/
│   └── products/             # Imagens SVG placeholder (produtos, hero, lifestyle, avatares)
└── src/
    ├── app/                          # App Router do Next.js
    │   ├── layout.tsx                # Layout raiz: fontes, ThemeProvider, header/footer/cart/toaster
    │   ├── globals.css               # Tokens de design (cores, fontes, radius) — light + dark
    │   ├── icon.svg                  # Favicon (octógono + "H")
    │   ├── page.tsx                  # Home
    │   ├── novidades/page.tsx        # Listagem de lançamentos
    │   ├── categoria/[slug]/page.tsx # PLP (categoria OU gênero) — SSG
    │   ├── produto/[slug]/page.tsx   # PDP — SSG
    │   └── lista-de-desejos/page.tsx # Wishlist (client-rendered, lê do localStorage)
    │
    ├── components/
    │   ├── ui/                 # Primitivos shadcn/ui (button, sheet, badge, input, etc.) — gerados via CLI
    │   ├── brand/
    │   │   └── havoc-mark.tsx  # Logo/ícone SVG (octógono + "H")
    │   ├── layout/
    │   │   ├── site-header.tsx     # Header: top bar, logo, mega-menu, busca, ícones de conta/wishlist/carrinho
    │   │   ├── site-footer.tsx     # Footer institucional
    │   │   └── mega-menu-data.ts   # Estrutura do mega-menu, GERADA DINAMICAMENTE a partir do catálogo
    │   ├── home/
    │   │   ├── hero-banner.tsx           # Banner principal da home
    │   │   ├── category-strip.tsx        # "Compre por Categoria"
    │   │   ├── outfit-inspiration.tsx    # Carrossel de looks lifestyle
    │   │   ├── shop-by-audience.tsx      # "Para quem você está comprando" (avatares)
    │   │   ├── product-tabs-section.tsx  # Grid de produtos com tabs por categoria
    │   │   ├── editorial-banners.tsx     # 2 banners editoriais lado a lado
    │   │   └── feature-strip.tsx         # Frete/troca/guia de tamanhos/wishlist
    │   ├── product/
    │   │   ├── product-card.tsx           # Card de produto usado em grids
    │   │   ├── product-grid.tsx           # Grid responsivo de cards
    │   │   ├── product-listing.tsx        # Grid + filtros (usado em /novidades)
    │   │   ├── category-page-content.tsx  # Conteúdo completo da PLP: breadcrumb, tabs, filtros, chips (client)
    │   │   ├── product-filters.tsx        # Drawer "Filtrar e Organizar" (ordenação + cor)
    │   │   ├── product-gallery.tsx        # Galeria de imagens do PDP
    │   │   ├── product-buy-box.tsx        # Seleção de cor/tamanho + CTAs do PDP
    │   │   └── product-detail.tsx         # Composição gallery + buy-box (sincroniza cor selecionada)
    │   ├── cart/
    │   │   └── cart-sheet.tsx      # Sacola lateral (Sheet)
    │   ├── theme-provider.tsx      # Wrapper client do next-themes
    │   └── theme-toggle.tsx        # Botão de alternar claro/escuro
    │
    ├── data/
    │   └── products.ts    # Catálogo mock completo + funções de acesso (getAllProducts, getProductBySlug, etc.)
    │
    ├── store/
    │   ├── cart-store.ts       # Zustand store do carrinho (persistido)
    │   └── wishlist-store.ts   # Zustand store da wishlist (persistido)
    │
    ├── types/
    │   └── product.ts     # Tipos de domínio: Product, ProductCategory, ProductGender, CartItem, etc.
    │
    └── lib/
        ├── utils.ts    # `cn()` (clsx + tailwind-merge), padrão shadcn
        └── format.ts   # `formatPrice()` — Intl.NumberFormat pt-BR/BRL
```

## Catálogo mock e dados

Todo o catálogo vive em [`src/data/products.ts`](./src/data/products.ts) como um array tipado (`Product[]`). Não há API, banco de dados ou fetch de rede — é o "banco de dados" da fase atual do projeto.

**Categorias de produto** (`ProductCategory`): `tenis`, `oculos`, `relogios`, `roupas-academia`.

**Gêneros** (`ProductGender`): `masculino`, `feminino`, `unissex`, `infantil`. Nas listagens, produtos `unissex` sempre aparecem junto de qualquer filtro de gênero específico.

Cada `Product` tem:
- Dados básicos: `id`, `slug`, `name`, `subtitle`, `category`, `gender`, `price`, `compareAtPrice` (opcional, pra mostrar desconto), `description`, `features[]`
- Flags: `isNew`, `isBestSeller`
- Avaliação: `rating`, `reviewCount`
- `tags[]`: usadas tanto para as tabs de sub-coleção na PLP quanto para gerar os links do mega-menu (ver abaixo)
- `colorways[]`: cada cor tem seu próprio conjunto de imagens e tabela de tamanhos com controle de estoque (`inStock` por tamanho)

Funções utilitárias exportadas de `products.ts`: `getAllProducts()`, `getProductBySlug(slug)`, `getRelatedProducts(product)`, `getNewArrivals(limit)`, `getBestSellers(limit)`.

**Importante para quando o backend chegar:** o formato de `Product`/`CartItem` em `src/types/product.ts` deve ser tratado como o contrato de referência ao desenhar os endpoints da API — mantê-lo (ou migrar com cuidado) evita retrabalho grande no frontend.

## Identidade visual

O design system completo (paleta, tipografia, uso do ícone, regras de forma) está documentado em detalhe na seção **2.1** de [`DECISIONS.md`](./DECISIONS.md#21-identidade-visual-rebrand--2026-08-23). Resumo rápido:

- **Paleta:** preto (`#0A0A0A`) / osso (`#F1F0EC`) / vermelho (`#FF2E2E`) — dark é o tema padrão, com toggle para light
- **Tipografia:** Chakra Petch (headlines, uppercase), Inter (corpo), JetBrains Mono (labels/nav/CTAs curtos, sempre uppercase com tracking largo)
- **Forma:** cantos retos por padrão (`rounded-none`); círculos só onde fazem sentido semântico (swatch de cor, avatar, radio button, badge de contagem)
- **Logo:** `HavocMark` — octógono preto com "H" branco, usado no header, footer e como favicon (`src/app/icon.svg`)

Os tokens de cor ficam em `src/app/globals.css`, dentro de `:root` (light) e `.dark` (dark, padrão). **Nunca hardcode uma cor fora desses tokens** — isso quebra o toggle de tema.

## Funcionalidades implementadas

- **Home** com hero, categorias, carrossel de looks, "compre por público", tabs de produto, banners editoriais, novidades/mais vendidos
- **Mega-menu** (Mulher/Homem/Infantil) **gerado dinamicamente** a partir do catálogo real — nunca lista uma combinação categoria+gênero+tag que não tenha produto de verdade
- **PLP** (`/categoria/[slug]`) com breadcrumb, título com contagem, descrição contextual (muda conforme a tag/gênero selecionado), tabs de sub-coleção, chips de filtro removíveis, drawer "Filtrar e Organizar" (ordenação + cor). Suporta combinação de categoria (rota) + gênero (`?genero=`) + tag (`?tag=`) via query string
- **PDP** (`/produto/[slug]`) com galeria sincronizada à cor selecionada, seleção de tamanho com estoque, preço parcelado, avaliação em estrelas, produtos relacionados
- **Carrinho** (Sheet lateral, abre automaticamente ao adicionar item, persiste no navegador). Checkout está **desabilitado** — aguarda o backend
- **Wishlist** (`/lista-de-desejos`) com botão de coração no card e no PDP, contador no header, persistência local
- **Tema claro/escuro** com toggle manual no header

## Rotas da aplicação

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | Estática | Home |
| `/novidades` | Estática | Todos os lançamentos |
| `/categoria/[slug]` | SSG | PLP — `slug` é uma categoria (`tenis`, `oculos`, `relogios`, `roupas-academia`) ou um gênero (`masculino`, `feminino`, `unissex`, `infantil`). Aceita `?genero=` e `?tag=` como filtros adicionais |
| `/produto/[slug]` | SSG | PDP de um produto específico |
| `/lista-de-desejos` | Client-rendered | Wishlist do usuário (lê do `localStorage`, por isso não pode ser SSG) |
| `/login`, `/cadastro` | Client-rendered | Login e cadastro — **autenticação mockada**, ver seção "Autenticação (mock)" abaixo |
| `/minha-conta/pedidos` | Client-rendered | Pedidos do cliente logado — protegida por `useRequireAuth()`; ainda sem fetch real à API |
| `/admin` | Client-rendered | Painel administrativo — protegida por `useRequireAuth("admin")`. Subrotas: `/admin/produtos` (lê o mock do frontend), `/admin/fornecedores`, `/admin/pedidos`, `/admin/clientes` (placeholders, ver seção "Painel admin" abaixo) |

Todas as rotas SSG usam `generateStaticParams()` lendo diretamente de `src/data/products.ts` — qualquer produto/categoria novo adicionado ao mock já gera página no próximo build, sem código extra.

## Autenticação (mock)

`src/store/auth-store.ts` implementa login/cadastro **inteiramente mockados** — sem Cognito, sem JWT, sem chamada de rede real. É um placeholder deliberado para destravar as telas de login, checkout-exige-sessão e painel admin antes de `Havoc-Auth` (backend) estar deployado.

- Conta de teste: `admin@havoc.com` / `admin123` (role `admin`)
- Cadastro público sempre nasce com role `customer` — a mesma regra do backend real (nunca aceitar um role vindo de fora)
- `useRequireAuth(role?)` (`src/lib/use-require-auth.ts`) é um guard de rota **client-side apenas** — proteção de UX, não de segurança. Quando a API estiver deployada, toda chamada precisa validar de novo no servidor (é exatamente o que os handlers Lambda já fazem, ver `backend/README.md`)

**Ao trocar para autenticação real:** substituir `auth-store.ts` por uma integração com `amazon-cognito-identity-js` contra o User Pool criado em `Havoc-Auth`, mantendo a mesma interface pública (`user`, `login`, `signup`, `logout`) para minimizar mudanças nos componentes que já consomem o store.

## Painel admin

`/admin` e subrotas foram criadas como ponto de partida visual, seguindo a estrutura de navegação da seção 8 de `../havoc-documentacao-tecnica.md` (Dashboard, Pedidos, Produtos, Fornecedores, Clientes). Estado atual de cada uma:

| Página | Fonte de dados |
|---|---|
| `/admin` (Dashboard) | Dados de exemplo hardcoded — nenhum endpoint de agregação existe no backend |
| `/admin/produtos` | Mock do frontend (`src/data/products.ts`) — a API real (`GET /admin/products`, com `costPrice` e margem) já existe, falta conectar |
| `/admin/fornecedores` | Placeholder — `GET/POST/PUT /admin/suppliers` já existem no backend |
| `/admin/pedidos` | Placeholder — nenhum endpoint admin de pedidos existe ainda (só `GET /orders/mine`, do próprio cliente) |
| `/admin/clientes` | Placeholder — nenhum endpoint existe ainda |

## Estado global (carrinho e wishlist)

Ambos usam [Zustand](https://zustand-demo.pmnd.rs) com o middleware `persist`, salvando em `localStorage`:

- `useCartStore` (`src/store/cart-store.ts`) — chave `havoc-cart`. Expõe `items`, `isOpen`, `open()`, `close()`, `addItem()`, `removeItem()`, `updateQuantity()`, `clear()`, `totalItems()`, `totalPrice()`
- `useWishlistStore` (`src/store/wishlist-store.ts`) — chave `havoc-wishlist`. Expõe `productIds`, `toggle()`, `has()`, `remove()`, `clear()`

**Cuidado com hidratação:** como esses stores leem `localStorage`, qualquer componente que renderiza algo diferente com base neles (contador, ícone preenchido) precisa de um guard `mounted` (`useState` + `useEffect`) antes de confiar no valor — senão o HTML do servidor não bate com o do cliente e o React acusa mismatch. Ver `WishlistButton` e `ProductBuyBox` como referência do padrão já usado no projeto.

## Imagens de produto (placeholders)

Como ainda não há fotos reais de produto, todas as imagens em `public/products/*.svg` são geradas por [`scripts/gen-placeholders.mjs`](./scripts/gen-placeholders.mjs) — um SVG simples com cor de fundo e o nome do produto. Para regenerar (por exemplo, depois de editar a lista de produtos no script):

```bash
node scripts/gen-placeholders.mjs
```

Quando fotos reais estiverem disponíveis, basta substituir os arquivos referenciados em `colorways[].images` dentro de `src/data/products.ts` (e, futuramente, migrar para S3 + CloudFront — ver Roadmap).

## Convenções de código

- **`Button` não usa `asChild`.** Esta versão do shadcn/ui é baseada em Base UI, não Radix. Para renderizar o botão como outro elemento (ex: um `Link`), use a prop `render`:
  ```tsx
  // ❌ não funciona nesta versão
  <Button asChild><Link href="/novidades">Ver tudo</Link></Button>

  // ✅ correto
  <Button render={<Link href="/novidades">Ver tudo</Link>} />
  ```
- **Nomes de rota em português**, seguindo o padrão já estabelecido: `/categoria`, `/produto`, `/novidades`, `/lista-de-desejos`.
- **Preços sempre em BRL**, formatados com `formatPrice()` de `src/lib/format.ts` — nunca formatar manualmente.
- **Novas cores devem ser tokens** em `globals.css` (`:root` + `.dark`), nunca um hex direto num componente (quebra o tema).
- **Mega-menu não deve ser editado com links hardcoded.** Ele é derivado do catálogo em `mega-menu-data.ts` — para mudar o que aparece lá, mude os produtos/tags em `src/data/products.ts`.

## Roadmap / o que falta

Ver seção 7 (Pendências conhecidas) de [`DECISIONS.md`](./DECISIONS.md) para a lista completa e atualizada. Os itens mais relevantes hoje:

- [ ] Busca funcional (o input existe no header, sem lógica de busca ainda)
- [ ] Página de conta/login
- [ ] Checkout real (bloqueado até o backend existir)
- [ ] Substituir os placeholders SVG por fotos reais de produto
- [ ] Backend em AWS (ver seção abaixo)

## Backend (AWS)

O backend está em desenvolvimento em `../backend/` (fora deste diretório). A arquitetura completa — infraestrutura AWS, modelo de dados, autenticação, painel admin, pipeline de imagens e checklist de segurança — está documentada em [`../havoc-documentacao-tecnica.md`](../havoc-documentacao-tecnica.md), na raiz do repositório. Esse documento é a **fonte da verdade** para qualquer decisão de arquitetura de backend; `DECISIONS.md` neste diretório cobre apenas decisões de frontend.

Resumo rápido (ver o documento completo para detalhes e justificativas):

- **Banco de dados:** RDS Postgres (`db.t4g.micro`, free tier)
- **API:** Lambda + API Gateway
- **Autenticação:** Amazon Cognito
- **Imagens de produto:** S3 + CloudFront + Lambda de resize/WebP, substituindo os SVGs locais
- **Pagamentos:** gateway brasileiro (Pix/cartão) — provedor ainda não escolhido
