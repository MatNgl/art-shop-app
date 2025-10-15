// src/app/features/cart/models/cart.model.ts
import type {
  SubscriptionSnapshot,
  SubscriptionPlan,
  SubscriptionTerm,
} from '../../subscriptions/models/subscription.model';

/** Type discriminant */
export type CartItemKind = 'product' | 'subscription';

/** Ligne PRODUIT (ex- CartItem) */
export interface CartProductItem {
  kind: 'product';
  productId: number;
  variantId?: number;
  title: string;
  imageUrl: string;
  variantLabel?: string; // ex: "A4"
  unitPrice: number;
  qty: number;
  maxStock: number;
  artistName?: string;
  /** Optionnel si promos par catégorie utilisent un slug */
  categorySlug?: string;
}

/** Ligne ABONNEMENT (qty=1, snapshot immuable) */
export interface CartSubscriptionItem {
  kind: 'subscription';
  snapshot: SubscriptionSnapshot;
  qty: 1;
}

/** Union utile si on veut itérer sur tous les types */
export type CartAnyItem = CartProductItem | CartSubscriptionItem;

/** Contrat pour l’ajout d’un abonnement */
export interface AddSubscriptionInput {
  plan: SubscriptionPlan;
  term: SubscriptionTerm;
}

/** Totaux panier */
export interface CartTotals {
  count: number;
  subtotal: number;
  taxes: number;
  total: number;
}

/** ✅ Compat: alias pour l’ancien nom utilisé ailleurs */
export type CartItem = CartProductItem;
