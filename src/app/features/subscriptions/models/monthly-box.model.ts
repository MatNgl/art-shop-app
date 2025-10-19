// Modèle pour les box mensuelles d'abonnement

export type BoxStatus = 'pending' | 'prepared' | 'shipped' | 'delivered';

export interface BoxProduct {
  productId: number;
  productName: string;
  variantId?: number;
  variantLabel?: string;
  imageUrl?: string;
}

export interface MonthlyBox {
  id: string; // "box-{userId}-{month}"
  userId: number;
  userName: string;
  userEmail: string;
  subscriptionId: string;
  planId: number;
  planName: string;
  month: string; // "2025-02" (format YYYY-MM)
  products: BoxProduct[]; // Vide si pas encore préparé
  status: BoxStatus;
  expectedProductCount: number; // Nombre de produits selon le plan (1, 2 ou 3)
  preparedAt?: string; // ISO
  preparedBy?: number; // Admin userId
  shippedAt?: string; // ISO
  deliveredAt?: string; // ISO
  shippingAddress: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  notes?: string;
  createdAt: string; // ISO
}

export interface MonthlyBoxStats {
  month: string;
  totalBoxes: number;
  byPlan: Record<number, { planName: string; count: number }>;
  byStatus: {
    pending: number;
    prepared: number;
    shipped: number;
    delivered: number;
  };
}
