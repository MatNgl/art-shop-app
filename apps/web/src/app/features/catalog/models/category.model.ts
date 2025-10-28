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
  bannerImage?: string;
  isActive: boolean;
  parentId?: number | null; // For tree structure
  children?: Category[]; // For tree structure
  productIds?: number[];
  subCategories?: SubCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithSubCats extends Category {
  subCategories: SubCategory[];
}
