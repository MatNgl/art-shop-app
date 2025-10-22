// Interfaces communes entre frontend et backend

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  phone?: string;
  createdAt: Date;
}

export interface Product {
  id: number;
  title: string;
  artistName: string;
  description?: string;
  imageUrl: string;
  originalPrice: number;
  reducedPrice?: number;
  stock: number;
  categoryId: number;
  categorySlug?: string;
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  bannerUrl?: string;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface Order {
  id: number;
  userId: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: number;
  variantId?: number;
  title: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Address {
  id?: string;
  label?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  label?: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'paypal' | 'other';
  last4: string;
  expMonth: number;
  expYear: number;
  holder?: string;
  isDefault: boolean;
}

// DTOs pour les APIs
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
