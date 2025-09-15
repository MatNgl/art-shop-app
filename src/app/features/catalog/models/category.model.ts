export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  productIds?: number[];
  createdAt: string;
  updatedAt: string;
}
