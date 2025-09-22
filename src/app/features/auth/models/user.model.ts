export interface User {
  id: number;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  addresses?: Address[];           //  plusieurs adresses
  paymentMethods?: PaymentMethod[]; //  moyens de paiement (masqués côté UI)
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id?: string;
  label?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export type PaymentBrand = 'visa' | 'mastercard' | 'amex' | 'paypal' | 'other';
export interface PaymentMethod {
  id: string;
  brand: PaymentBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holder?: string;
  isDefault?: boolean;
}


export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface UserSession {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
