export type Unit = 'mm' | 'cm' | 'in' | 'inches';

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
  formatId?: number; // ID du format depuis FormatService
  originalPrice: number;
  reducedPrice?: number;
  stock: number;
  isAvailable: boolean;
  dimensions: Dimensions; // Dimensions physiques (width × height × unit)
  imageUrl?: string;
}

/**
 * Association catégorie/sous-catégorie pour un produit
 */
export interface ProductCategoryAssociation {
  categoryId: number;
  subCategoryIds?: number[];
}

/**
 * Produit principal
 * - Peut appartenir à plusieurs catégories et sous-catégories
 * - categoryAssociations: liste des associations catégorie/sous-catégories
 * - categoryId (legacy): pour compatibilité, correspond à la première association
 */
export interface Product {
  id: number;
  title: string;
  description: string;

  originalPrice: number; // Prix de base
  reducedPrice?: number; // Prix réduit optionnel (doit être < originalPrice)

  categoryId: number; // Catégorie principale (legacy, pour compatibilité)
  subCategoryIds?: number[]; // Sous-catégories (legacy, pour compatibilité)
  categoryAssociations?: ProductCategoryAssociation[]; // Nouvelles associations multiples
  tags: string[];
  imageUrl: string;
  images: string[];

  technique: string;
  /** dimensions de l'œuvre originale (pas du tirage) */
  dimensions: Dimensions;
  /** Format d'impression pour produit sans variantes */
  formatId?: number;

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
