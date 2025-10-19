/**
 * Types de réduction
 */
export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';

/**
 * Portée de la promotion
 */
export type PromotionScope =
  | 'product'           // Produits spécifiques
  | 'category'          // Catégories
  | 'subcategory'       // Sous-catégories
  | 'site-wide'         // Tout le site
  | 'format'            // Formats d'impression (remplace 'size')
  | 'cart'              // Panier entier
  | 'shipping'          // Frais de livraison
  | 'user-segment'      // Segment utilisateur (premier achat, etc.)
  | 'buy-x-get-y'       // X achetés = Y offerts
  | 'subscription';     // Plans d'abonnement

/**
 * Type de promotion
 */
export type PromotionType = 'automatic' | 'code';

/**
 * Stratégie d'application de la réduction
 */
export type ApplicationStrategy =
  | 'all'               // Tous les produits éligibles
  | 'cheapest'          // Produit le moins cher
  | 'most-expensive'    // Produit le plus cher
  | 'proportional'      // Répartition proportionnelle
  | 'non-promo-only';   // Produits hors promo uniquement

/**
 * Type de palier progressif
 */
export interface ProgressiveTier {
  minAmount: number;     // Montant minimum pour ce palier
  discountValue: number; // Valeur de la réduction pour ce palier
  discountType: 'percentage' | 'fixed';
}

/**
 * Configuration Buy X Get Y
 */
export interface BuyXGetYConfig {
  buyQuantity: number;   // Nombre à acheter (X)
  getQuantity: number;   // Nombre offert (Y)
  applyOn: 'cheapest' | 'most-expensive'; // Quel produit offrir
}

/**
 * Segment utilisateur ciblé
 */
export type UserSegment =
  | 'first-purchase'    // Premier achat
  | 'returning'         // Client fidèle
  | 'vip'               // Client VIP
  | 'all';              // Tous les clients

/**
 * Condition de promotion (optionnelle)
 */
export interface PromotionCondition {
  minQuantity?: number;       // Quantité minimum de produits
  minAmount?: number;         // Montant minimum du panier
  maxUsagePerUser?: number;   // Nombre d'utilisations max par utilisateur
  maxUsageTotal?: number;     // Nombre d'utilisations max total
  userSegment?: UserSegment;  // Segment utilisateur ciblé
  excludePromotedProducts?: boolean; // Exclure les produits déjà en promo
}

/**
 * Modèle de promotion
 */
export interface Promotion {
  id: number;
  name: string; // Nom interne de la promotion
  description?: string; // Description publique

  // Type et scope
  type: PromotionType; // 'automatic' ou 'code'
  code?: string; // Code promo (requis si type='code')
  scope: PromotionScope; // Portée de la promotion

  // Réduction
  discountType: DiscountType; // 'percentage', 'fixed' ou 'free_shipping'
  discountValue: number; // Valeur de la réduction (% ou €)

  // Cibles (selon scope)
  productIds?: number[]; // IDs des produits concernés (si scope='product')
  categorySlugs?: string[]; // Slugs des catégories (si scope='category')
  subCategorySlugs?: string[]; // Slugs des sous-catégories (si scope='subcategory')
  formatIds?: number[]; // IDs des formats d'impression concernés (si scope='format')
  subscriptionPlanIds?: number[]; // IDs des plans d'abonnement concernés (si scope='subscription')

  // Nouveaux champs pour types avancés
  applicationStrategy?: ApplicationStrategy; // Comment appliquer la réduction
  progressiveTiers?: ProgressiveTier[]; // Paliers pour promo progressive
  buyXGetYConfig?: BuyXGetYConfig; // Config pour "X achetés = Y offerts"

  // Cumulabilité
  isStackable?: boolean; // Peut se cumuler avec d'autres promos
  priority?: number; // Priorité (plus élevé = prioritaire)

  // Conditions
  conditions?: PromotionCondition;

  // Validité
  startDate: Date | string;
  endDate?: Date | string; // null = pas de date de fin

  // État
  isActive: boolean;

  // Tracking
  currentUsage?: number; // Nombre d'utilisations actuelles
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * DTO pour créer/modifier une promotion
 */
export interface PromotionInput {
  name: string;
  description?: string;
  type: PromotionType;
  code?: string;
  scope: PromotionScope;
  discountType: DiscountType;
  discountValue: number;
  productIds?: number[];
  categorySlugs?: string[];
  subCategorySlugs?: string[];
  formatIds?: number[];
  subscriptionPlanIds?: number[];
  applicationStrategy?: ApplicationStrategy;
  progressiveTiers?: ProgressiveTier[];
  buyXGetYConfig?: BuyXGetYConfig;
  isStackable?: boolean;
  priority?: number;
  conditions?: PromotionCondition;
  startDate: Date | string;
  endDate?: Date | string;
  isActive: boolean;
}

/**
 * Résultat de l'application d'une promotion
 */
export interface PromotionApplicationResult {
  success: boolean;
  promotion?: Promotion;
  discountAmount: number;
  message?: string;
}

/**
 * Informations sur les promotions applicables à un produit
 */
export interface ProductPromotion {
  productId: number;
  promotions: Promotion[];
  bestDiscount?: {
    promotion: Promotion;
    discountAmount: number;
    finalPrice: number;
  };
}

/**
 * Indicateur de progression pour une promotion
 */
export interface PromotionProgress {
  promotion: Promotion;
  type: 'amount' | 'quantity' | 'buy-x-get-y';
  current: number;           // Valeur actuelle (€ ou quantité)
  target: number;            // Valeur cible (€ ou quantité)
  remaining: number;         // Restant pour débloquer
  isUnlocked: boolean;       // Promo débloquée ?
  nextTier?: ProgressiveTier; // Prochain palier (pour progressives)
  message: string;           // Message à afficher ("15€ restants pour -10%")
}

/**
 * Résultat du calcul des promotions sur le panier
 */
export interface CartPromotionResult {
  appliedPromotions: AppliedPromotion[];  // Promos appliquées
  progressIndicators: PromotionProgress[]; // Indicateurs de progression
  totalDiscount: number;                   // Total des réductions
  freeShipping: boolean;                   // Livraison gratuite ?
}

/**
 * Promotion appliquée avec détails
 */
export interface AppliedPromotion {
  promotion: Promotion;
  discountAmount: number;
  affectedItems?: number[];  // IDs des produits concernés
  message: string;           // Message d'affichage
}
