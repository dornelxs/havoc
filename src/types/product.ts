export type ProductCategory = "tenis" | "oculos" | "relogios" | "roupas-academia";

export type ProductGender = "masculino" | "feminino" | "unissex" | "infantil";

export interface ProductVariantSize {
  size: string;
  inStock: boolean;
}

export interface ProductColorway {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  sizes: ProductVariantSize[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  brand: "Havoc";
  category: ProductCategory;
  gender: ProductGender;
  price: number;
  compareAtPrice?: number;
  currency: "BRL";
  description: string;
  features: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  rating?: number;
  reviewCount?: number;
  colorways: ProductColorway[];
  tags?: string[];
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  colorId: string;
  colorName: string;
  size: string;
  quantity: number;
}
