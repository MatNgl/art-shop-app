export type Unit = 'mm' | 'cm' | 'in' | 'inches';
export type PrintSize = 'A3' | 'A4' | 'A5' | 'A6';

export interface Dimensions {
  width: number;
  height: number;
  depth?: number;
  unit: Unit;
}

/**
 * Variante d'un produit (ex: tirage A3/A4/A5/A6)
 */
export interface ProductVariant {
  id: number;
  sku?: string;
  size: PrintSize;
  price: number;
  originalPrice?: number;
  stock: number;
  isAvailable: boolean; // dérivé côté service : stock > 0
  dimensions: Dimensions; // dimensions du tirage
  imageUrl?: string;
}

/**
 * Produit principal
 * - Compat : si variantes, price = min(variantes), stock = somme(variantes)
 */
export interface Product {
  id: number;
  title: string;
  description: string;

  price: number;
  originalPrice?: number;

  categoryId?: number;
  tags: string[];
  imageUrl: string;
  images: string[];

  technique: string;
  /** dimensions de l'œuvre originale (pas du tirage) */
  dimensions: Dimensions;

  isAvailable: boolean;
  stock: number;

  isLimitedEdition: boolean;
  editionNumber?: number;
  totalEditions?: number;

  /** Variantes optionnelles (A3/A4/A5/A6) */
  variants?: ProductVariant[];

  createdAt: Date;
  updatedAt: Date;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
}

export interface ProductFilter {
  categoryId?: number;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  technique?: string;
  isAvailable?: boolean;
  search?: string;
}
