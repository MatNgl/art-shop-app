export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentCategoryId: number;
  productIds?: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  productIds?: number[]; // Produits directement attachés (legacy, non recommandé si sous-cat existent)
  subCategories?: SubCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithSubCats extends Category {
  subCategories: SubCategory[];
}
