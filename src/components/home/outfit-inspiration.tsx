import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const OUTFITS = [
  { image: "/products/lifestyle-1.svg", label: "@ana.treina", href: "/categoria/roupas-academia" },
  { image: "/products/lifestyle-2.svg", label: "@bruno.run", href: "/categoria/tenis" },
  { image: "/products/lifestyle-3.svg", label: "@carla.fit", href: "/categoria/roupas-academia" },
  { image: "/products/lifestyle-4.svg", label: "@diego.street", href: "/categoria/tenis" },
];

export function OutfitInspiration() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl uppercase tracking-tight">Inspire-se e Monte seu Look</h2>
        <Button
          variant="outline"
          className="rounded-none font-semibold gap-2"
          render={<Link href="/novidades">Ver tudo</Link>}
        />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
        {OUTFITS.map((outfit) => (
          <Link
            key={outfit.label}
            href={outfit.href}
            className="relative flex-shrink-0 w-56 sm:w-64 aspect-[3/4] overflow-hidden rounded-lg snap-start group"
          >
            <Image
              src={outfit.image}
              alt={outfit.label}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="256px"
            />
            <span className="absolute top-3 left-3 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {outfit.label}
            </span>
            <span className="absolute bottom-3 left-3 bg-white text-black text-xs font-semibold px-2 py-1 rounded-full">
              Ver look
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
