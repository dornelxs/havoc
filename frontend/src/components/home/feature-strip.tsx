import { Heart, Ruler, Truck, Undo2 } from "lucide-react";

const FEATURES = [
  {
    icon: Truck,
    title: "Frete Grátis",
    description: "Em compras acima de R$ 399 para todo o Brasil.",
  },
  {
    icon: Undo2,
    title: "Troca Fácil",
    description: "30 dias para trocar ou devolver, sem burocracia.",
  },
  {
    icon: Ruler,
    title: "Guia de Tamanhos",
    description: "Encontre o caimento ideal antes de comprar.",
  },
  {
    icon: Heart,
    title: "Lista de Desejos",
    description: "Salve seus favoritos e compre quando quiser.",
  },
];

export function FeatureStrip() {
  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="flex flex-col gap-2">
            <feature.icon className="size-6" />
            <h3 className="text-sm font-bold">{feature.title}</h3>
            <p className="text-xs text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
