import Image from "next/image";
import Link from "next/link";

const BANNERS = [
  {
    image: "/products/editorial-academia.svg",
    title: "Academia Sem Limites",
    subtitle: "O treino nunca foi tão completo.",
    cta: "Comprar Agora",
    href: "/categoria/roupas-academia",
  },
  {
    image: "/products/editorial-street.svg",
    title: "Estilo de Rua",
    subtitle: "Do treino pro dia a dia, sem esforço.",
    cta: "Comprar Agora",
    href: "/categoria/tenis",
  },
];

export function EditorialBanners() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BANNERS.map((banner) => (
          <div key={banner.title} className="space-y-3">
            <Link href={banner.href} className="block relative aspect-[4/3] overflow-hidden rounded-lg group">
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </Link>
            <div>
              <h3 className="font-bold">{banner.title}</h3>
              <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
              <Link href={banner.href} className="text-sm font-semibold underline underline-offset-2">
                {banner.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
