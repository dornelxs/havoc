"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist-store";
import { useMounted } from "@/lib/use-mounted";

interface WishlistButtonProps {
  productId: string;
  productName?: string;
  className?: string;
  size?: "sm" | "lg";
}

export function WishlistButton({
  productId,
  productName,
  className,
  size = "sm",
}: WishlistButtonProps) {
  const mounted = useMounted();
  const isSaved = useWishlistStore((s) => s.productIds.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
    if (!isSaved) {
      toast.success(`${productName ?? "Produto"} adicionado à lista de desejos.`);
    }
  }

  const saved = mounted && isSaved;

  return (
    <button
      aria-label={saved ? "Remover da lista de desejos" : "Adicionar à lista de desejos"}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background",
        size === "sm" ? "size-8" : "size-11",
        className
      )}
    >
      <Heart
        className={cn(size === "sm" ? "size-4" : "size-5", saved && "fill-primary text-primary")}
      />
    </button>
  );
}
