export interface BaseActivityMetadata {
  adminId?: number;
  userAgent?: string;
}

export interface ProfileUpdateMetadata extends BaseActivityMetadata {
  fields: string[];
  previousValues?: Record<string, string | number | boolean>;
}

export interface ProductActivityMetadata extends BaseActivityMetadata {
  productId: number;
  productName: string;
  productPrice?: number;
  quantity?: number;
}

export interface OrderActivityMetadata extends BaseActivityMetadata {
  orderId: string;
  orderTotal?: number;
  newStatus?: OrderStatus;
  previousStatus?: OrderStatus;
}

export interface SuspensionActivityMetadata extends BaseActivityMetadata {
  reason?: string;
  suspendedBy: number;
  duration?: number; // en jours, si applicable
}

export interface EmailActivityMetadata extends BaseActivityMetadata {
  email: string;
  emailType: 'password_reset' | 'account_notification' | 'order_confirmation';
  templateId?: string;
}

export interface LoginActivityMetadata extends BaseActivityMetadata {
  success: boolean;
  failureReason?: string;
  sessionDuration?: number; // en minutes
}

// Union type pour tous les types de métadonnées
export type ActivityMetadata =
  | BaseActivityMetadata
  | ProfileUpdateMetadata
  | ProductActivityMetadata
  | OrderActivityMetadata
  | SuspensionActivityMetadata
  | EmailActivityMetadata
  | LoginActivityMetadata;

export interface UserActivity {
  id: string;
  userId: number;
  type: ActivityType;
  action: string;
  details: string;
  metadata?: ActivityMetadata;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_UPDATE = 'profile_update',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  ORDER_PLACED = 'order_placed',
  ORDER_CANCELLED = 'order_cancelled',
  FAVORITE_ADDED = 'favorite_added',
  FAVORITE_REMOVED = 'favorite_removed',
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_SUSPENDED = 'account_suspended',
  ACCOUNT_REACTIVATED = 'account_reactivated',
  ACCOUNT_DELETED = 'account_deleted',
  ROLE_CHANGED = 'role_changed',
  ROLE_UPDATED = 'role_updated',
  EMAIL_SENT = 'email_sent',
  FAILED_LOGIN = 'failed_login',
  ADMIN_ACTION = 'admin_action',
}

export interface Order {
  id: string;
  userId: number;
  status: OrderStatus;
  total: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface UserFavorite {
  id: string;
  userId: number;
  productId: number;
  productName: string;
  productImage?: string;
  productPrice: number;
  addedAt: Date;
  isAvailable: boolean;
}

// Extension du modèle User existant
export interface UserExtended extends User {
  isActive: boolean;
  suspendedAt?: Date;
  suspendedBy?: number;
  suspensionReason?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockedUntil?: Date;
}

// Import des types existants
import { User, Address, PaymentMethod } from './user.model';
