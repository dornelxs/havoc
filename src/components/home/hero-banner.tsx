import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroBanner() {
  return (
    <section className="relative h-[70vh] min-h-[420px] w-full overflow-hidden bg-primary">
      <Image
        src="/products/hero-1.svg"
        alt="Coleção Havoc FW26"
        fill
        priority
        className="object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="relative z-10 flex h-full flex-col items-start justify-end gap-4 px-6 pb-16 sm:px-12 sm:pb-24 max-w-7xl mx-auto">
        <span className="font-mono text-destructive text-xs uppercase tracking-[0.25em]">
          Coleção FW26
        </span>
        <h1 className="font-display text-white text-4xl sm:text-6xl font-bold uppercase leading-[0.95] tracking-tight max-w-xl">
          Não pare.
          <br />
          Nunca.
        </h1>
        <p className="text-white/70 max-w-md">
          Novos lançamentos em tênis, óculos, relógios e roupas de academia. Performance que
          acompanha seu ritmo.
        </p>
        <Button
          size="lg"
          className="rounded-none font-mono uppercase tracking-[0.15em] mt-2 border border-white"
          variant="outline"
          render={<Link href="/novidades">Comprar Novidades</Link>}
        />
      </div>
    </section>
  );
}
