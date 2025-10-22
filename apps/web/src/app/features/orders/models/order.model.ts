export interface OrderItem {
  productId: number;
  variantId?: number;
  variantLabel?: string; // ex: "A4" (juste la taille)
  title: string;
  unitPrice: number;
  qty: number;
  imageUrl?: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
}
export type PaymentBrand = 'visa' | 'mastercard' | 'amex' | 'paypal' | 'other';

export type OrderType = 'product' | 'subscription';

export interface Order {
  id: string; // ex: 'ORD-2025-0001'
  userId?: number | null;
  createdAt: string; // ISO
  items: OrderItem[];
  subtotal: number;
  taxes: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  customer: CustomerInfo;
  payment: {
    method: 'card' | 'paypal' | 'bank';
    last4?: string;
    brand?: PaymentBrand;
  };
  notes?: string;
  orderType?: OrderType; // 'product' (default) ou 'subscription'
  subscriptionId?: string; // ID de l'abonnement si orderType === 'subscription'
}

export type OrderStatus =
  | 'pending' // créée (avant traitement)
  | 'processing' // en cours de traitement
  | 'accepted' // acceptée
  | 'refused' // refusée
  | 'delivered'; // livrée
