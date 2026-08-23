"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HavocMark } from "@/components/brand/havoc-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { cn } from "@/lib/utils";
import { MEGA_MENU } from "@/components/layout/mega-menu-data";

const SIMPLE_LINKS = [
  { label: "Tendências", href: "/novidades" },
  { label: "Esportes", href: "/novidades" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.open);
  const wishlistCount = useWishlistStore((s) => s.productIds.length);

  useEffect(() => setMounted(true), []);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border bg-background"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="bg-primary text-primary-foreground text-center text-[11px] py-2 px-4 font-mono uppercase tracking-[0.2em]">
        Frete grátis acima de R$ 399 · Parcele em até 10x sem juros
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          className="lg:hidden"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>

        <Link href="/" className="flex items-center gap-2 select-none">
          <HavocMark className="size-8" />
          <span className="font-display font-bold text-xl uppercase tracking-tight">Havoc</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-5 ml-8 h-full">
          {MEGA_MENU.map((section) => (
            <div
              key={section.href}
              className="h-full flex items-center"
              onMouseEnter={() => setActiveMenu(section.label)}
            >
              <Link
                href={section.href}
                className={cn(
                  "font-mono text-xs uppercase tracking-[0.15em] transition-colors border-b-2 border-transparent py-1",
                  activeMenu === section.label
                    ? "text-foreground border-destructive"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                {section.label}
              </Link>
            </div>
          ))}
          {SIMPLE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-[0.15em] text-foreground/70 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/novidades"
            className="font-mono text-xs uppercase tracking-[0.15em] text-destructive hover:text-destructive/80 transition-colors"
          >
            Outlet
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:flex items-center relative">
            <Search className="size-4 absolute left-3 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar produtos"
              className="w-40 lg:w-64 pl-9 h-9 rounded-none bg-secondary border-none font-mono text-xs"
            />
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Conta" className="hidden sm:inline-flex">
            <User className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Lista de desejos"
            className="relative hidden sm:inline-flex"
            render={<Link href="/lista-de-desejos" />}
          >
            <Heart className="size-5" />
            {mounted && wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {wishlistCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Carrinho"
            className="relative"
            onClick={openCart}
          >
            <ShoppingBag className="size-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mega menu dropdown (desktop) */}
      {MEGA_MENU.map((section) => (
        <div
          key={section.href}
          onMouseEnter={() => setActiveMenu(section.label)}
          className={cn(
            "absolute left-0 top-full w-full border-b border-border bg-background shadow-lg overflow-hidden transition-[max-height,opacity] duration-200",
            activeMenu === section.label ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          )}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex gap-8">
              {section.columns.map((col) => (
                <div key={col.title} className="min-w-[140px] flex-1">
                  <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    {col.title}
                  </h3>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          onClick={() => setActiveMenu(null)}
                          className={cn(
                            "text-sm hover:text-foreground hover:underline transition-colors",
                            link.bold ? "font-bold text-foreground" : "text-foreground/80"
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <Link
                href={section.promo.href}
                onClick={() => setActiveMenu(null)}
                className="hidden xl:block group w-56 shrink-0"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
                  <Image
                    src={section.promo.image}
                    alt={section.promo.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
                <p className="mt-2 font-display font-bold uppercase">{section.promo.title}</p>
                <p className="text-xs text-muted-foreground">{section.promo.subtitle}</p>
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-border mt-6 py-4">
              {section.footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setActiveMenu(null)}
                  className="font-mono text-xs uppercase tracking-[0.1em] underline underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Mobile nav */}
      <nav
        className={cn(
          "lg:hidden overflow-hidden border-t border-border transition-[max-height] duration-300",
          mobileOpen ? "max-h-[70vh] overflow-y-auto" : "max-h-0 border-t-0"
        )}
      >
        <div className="flex flex-col px-4 py-3 gap-1">
          {MEGA_MENU.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="py-2 font-mono text-xs uppercase tracking-[0.15em]"
              onClick={() => setMobileOpen(false)}
            >
              {section.label}
            </Link>
          ))}
          {SIMPLE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-2 font-mono text-xs uppercase tracking-[0.15em]"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/lista-de-desejos"
            className="py-2 font-mono text-xs uppercase tracking-[0.15em]"
            onClick={() => setMobileOpen(false)}
          >
            Lista de Desejos
          </Link>
        </div>
      </nav>
    </header>
  );
}
