import Image from "next/image";
import Link from "next/link";

const AUDIENCES = [
  { label: "Mulher", image: "/products/avatar-mulher.svg", href: "/categoria/feminino" },
  { label: "Homem", image: "/products/avatar-homem.svg", href: "/categoria/masculino" },
  { label: "Infantil", image: "/products/avatar-infantil.svg", href: "/categoria/infantil" },
  { label: "Ver Tudo", image: "/products/avatar-todos.svg", href: "/novidades" },
];

export function ShopByAudience() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="font-display text-xl uppercase tracking-tight mb-6">Para Quem Você Está Comprando?</h2>
      <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-2xl">
        {AUDIENCES.map((a) => (
          <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 group">
            <div className="relative size-16 sm:size-24 overflow-hidden rounded-full bg-secondary">
              <Image
                src={a.image}
                alt={a.label}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="96px"
              />
            </div>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-center">
              {a.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
