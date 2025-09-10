import { ProductCategory } from './product.model';

export interface CategoryMeta {
  key: ProductCategory;
  label: string;
  icon: string; // ex: 'fa-pencil'
  colorClass: string; // ex: 'text-amber-600'
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CategoryWithCount extends CategoryMeta {
  count: number;
}
