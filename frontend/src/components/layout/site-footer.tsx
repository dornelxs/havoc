import Link from "next/link";
import { HavocMark } from "@/components/brand/havoc-mark";

const COLUMNS = [
  {
    title: "Produtos",
    links: [
      { label: "Novidades", href: "/novidades" },
      { label: "Tênis", href: "/categoria/tenis" },
      { label: "Roupas de Academia", href: "/categoria/roupas-academia" },
      { label: "Óculos", href: "/categoria/oculos" },
      { label: "Relógios", href: "/categoria/relogios" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { label: "Central de Ajuda", href: "#" },
      { label: "Status do Pedido", href: "#" },
      { label: "Trocas e Devoluções", href: "#" },
      { label: "Guia de Tamanhos", href: "#" },
      { label: "Contato", href: "#" },
    ],
  },
  {
    title: "Sobre a Havoc",
    links: [
      { label: "Nossa História", href: "#" },
      { label: "Sustentabilidade", href: "#" },
      { label: "Trabalhe Conosco", href: "#" },
      { label: "Imprensa", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <HavocMark className="size-7" />
            <span className="font-display font-bold text-xl uppercase tracking-tight">Havoc</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Performance e estilo para quem não para. Feito para o seu próximo recorde.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          <p>© {new Date().getFullYear()} Havoc. Todos os direitos reservados.</p>
          <p>Ambiente de demonstração — frontend apenas.</p>
        </div>
      </div>
    </footer>
  );
}
