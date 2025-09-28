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
  dimensions: Dimensions;
  isAvailable: boolean;
  stock: number;
  isLimitedEdition: boolean;
  editionNumber?: number;
  totalEditions?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
}

export interface Dimensions {
  width: number;
  height: number;
  depth?: number;
  unit: 'cm' | 'inches';
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

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
}
