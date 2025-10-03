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
 * - categoryId obligatoire
 * - subCategoryIds obligatoire si la catégorie a des sous-catégories
 * - Peut appartenir à plusieurs sous-catégories
 */
export interface Product {
  id: number;
  title: string;
  description: string;

  price: number;
  originalPrice?: number;

  categoryId: number; // Catégorie parente (obligatoire)
  subCategoryIds?: number[]; // Sous-catégories (obligatoire si catégorie a des sous-cat, peut être multiple)
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
  subCategoryId?: number;
  subCategorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  technique?: string;
  isAvailable?: boolean;
  search?: string;
}
