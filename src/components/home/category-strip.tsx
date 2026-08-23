import Link from "next/link";

const CATEGORIES = [
  { label: "Tênis", href: "/categoria/tenis", color: "bg-neutral-900" },
  { label: "Óculos", href: "/categoria/oculos", color: "bg-stone-800" },
  { label: "Relógios", href: "/categoria/relogios", color: "bg-neutral-700" },
  { label: "Roupas de Academia", href: "/categoria/roupas-academia", color: "bg-neutral-800" },
];

export function CategoryStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="font-display text-xl uppercase tracking-tight mb-4">Compre por Categoria</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={`${cat.color} text-white rounded-lg h-28 flex items-end p-4 font-bold text-lg hover:opacity-90 transition-opacity`}
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
