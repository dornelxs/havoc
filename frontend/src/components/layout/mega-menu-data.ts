import { getAllProducts } from "@/data/products";
import type { ProductCategory } from "@/types/product";

export interface MegaMenuColumn {
  title: string;
  links: { label: string; href: string; bold?: boolean }[];
}

export interface MegaMenuFooterLink {
  label: string;
  href: string;
}

export interface MegaMenuSection {
  label: string;
  href: string;
  columns: MegaMenuColumn[];
  footerLinks: MegaMenuFooterLink[];
  promo: {
    image: string;
    title: string;
    subtitle: string;
    href: string;
  };
}

type Gender = "feminino" | "masculino" | "infantil";

const GENDER_DISPLAY: Record<Gender, string> = {
  feminino: "Mulher",
  masculino: "Homem",
  infantil: "Infantil",
};

const CATEGORY_DISPLAY: Record<ProductCategory, string> = {
  tenis: "Tênis",
  oculos: "Óculos",
  relogios: "Relógios",
  "roupas-academia": "Roupas de Academia",
};

const TAG_DISPLAY: Record<string, string> = {
  lançamento: "Lançamentos",
  corrida: "Corrida",
  street: "Street",
  clássico: "Clássico",
  trilha: "Trilha",
  outdoor: "Outdoor",
  competição: "Competição",
  casual: "Casual",
  ciclismo: "Ciclismo",
  digital: "Digital",
  smartwatch: "Smartwatch",
  treino: "Treino",
};

/** Tags de produtos daquele gênero (inclui unissex) dentro de uma categoria, na ordem em que aparecem no catálogo. */
function tagsFor(gender: Gender, category: ProductCategory): string[] {
  const seen: string[] = [];
  getAllProducts()
    .filter((p) => p.category === category && (p.gender === gender || p.gender === "unissex"))
    .forEach((p) => p.tags?.forEach((t) => !seen.includes(t) && seen.push(t)));
  return seen;
}

function buildColumns(gender: Gender): MegaMenuColumn[] {
  const g = `genero=${gender}`;

  const productColumns: MegaMenuColumn[] = (
    ["tenis", "roupas-academia", "oculos", "relogios"] as ProductCategory[]
  )
    .map((category) => {
      const tags = tagsFor(gender, category);
      if (tags.length === 0) return null;
      return {
        title: CATEGORY_DISPLAY[category],
        links: [
          { label: `Todos os ${CATEGORY_DISPLAY[category]}`, href: `/categoria/${category}?${g}`, bold: true },
          ...tags.map((tag) => ({
            label: TAG_DISPLAY[tag] ?? tag,
            href: `/categoria/${category}?${g}&tag=${encodeURIComponent(tag)}`,
          })),
        ],
      };
    })
    .filter((c): c is MegaMenuColumn => c !== null);

  return [
    {
      title: "Novidades",
      links: [
        { label: "Lançamentos", href: `/novidades` },
        { label: `Descubra ${GENDER_DISPLAY[gender]}`, href: `/categoria/${gender}` },
      ],
    },
    ...productColumns,
  ];
}

function buildFooterLinks(gender: Gender): MegaMenuFooterLink[] {
  const g = `genero=${gender}`;
  return [
    { label: "Todos os Produtos", href: `/categoria/${gender}` },
    { label: "Todos os Tênis", href: `/categoria/tenis?${g}` },
    { label: "Todas as Roupas", href: `/categoria/roupas-academia?${g}` },
    { label: "Todos os Acessórios", href: `/categoria/oculos?${g}` },
  ];
}

export const MEGA_MENU: MegaMenuSection[] = [
  {
    label: "Mulher",
    href: "/categoria/feminino",
    columns: buildColumns("feminino"),
    footerLinks: buildFooterLinks("feminino"),
    promo: {
      image: "/products/flex-legging-black.svg",
      title: "Flex Legging",
      subtitle: "Compressão de alta performance.",
      href: "/produto/flex-legging",
    },
  },
  {
    label: "Homem",
    href: "/categoria/masculino",
    columns: buildColumns("masculino"),
    footerLinks: buildFooterLinks("masculino"),
    promo: {
      image: "/products/sprint-elite-black.svg",
      title: "Sprint Elite",
      subtitle: "Feito para recordes pessoais.",
      href: "/produto/sprint-elite",
    },
  },
  {
    label: "Infantil",
    href: "/categoria/infantil",
    columns: buildColumns("infantil"),
    footerLinks: buildFooterLinks("infantil"),
    promo: {
      image: "/products/kids-runner-blue.svg",
      title: "Kids Runner",
      subtitle: "Energia da criançada, do jeito Havoc.",
      href: "/produto/kids-runner",
    },
  },
];
