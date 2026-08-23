"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/format";

export function CartSheet() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice());

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent className="flex w-full flex-col sm:max-w-md p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-display uppercase">Sacola ({items.length})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-muted-foreground">Sua sacola está vazia.</p>
            <Button onClick={close} render={<Link href="/">Continuar comprando</Link>} />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.colorId}-${item.size}`}
                  className="flex gap-3"
                >
                  <div className="relative size-20 flex-shrink-0 overflow-hidden bg-secondary">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight truncate">{item.name}</p>
                      <button
                        aria-label="Remover item"
                        onClick={() => removeItem(item.productId, item.colorId, item.size)}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.colorName} · Tam. {item.size}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 rounded-none border border-border px-1">
                        <button
                          aria-label="Diminuir quantidade"
                          className="p-1 disabled:opacity-30"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(item.productId, item.colorId, item.size, item.quantity - 1)
                          }
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="text-xs w-4 text-center">{item.quantity}</span>
                        <button
                          aria-label="Aumentar quantidade"
                          className="p-1"
                          onClick={() =>
                            updateQuantity(item.productId, item.colorId, item.size, item.quantity + 1)
                          }
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t border-border gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold text-base">{formatPrice(totalPrice)}</span>
              </div>
              <Separator />
              <Button size="lg" className="w-full rounded-none font-mono uppercase tracking-[0.15em]" disabled>
                Finalizar Compra
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Checkout será integrado com a API AWS futuramente.
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
