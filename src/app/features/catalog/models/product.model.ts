export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number; // Pour les promotions
  category: ProductCategory;
  tags: string[];
  imageUrl: string;
  images: string[]; // Galerie d'images
  artist: Artist;
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

export interface Artist {
  id: number;
  name: string;
  bio?: string;
  profileImage?: string;
  website?: string;
  socialLinks?: SocialLinks;
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

export enum ProductCategory {
  DRAWING = 'drawing',
  PAINTING = 'painting',
  DIGITAL_ART = 'digital-art',
  PHOTOGRAPHY = 'photography',
  SCULPTURE = 'sculpture',
  MIXED_MEDIA = 'mixed-media',
}

export interface ProductFilter {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  artist?: string;
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
