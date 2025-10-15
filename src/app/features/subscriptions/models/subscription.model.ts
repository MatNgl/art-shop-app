// src/app/features/subscriptions/models/subscription.model.ts
export type SubscriptionTerm = 'monthly' | 'annual';

export type SubscriptionVisibility = 'public' | 'admin';

export type LoyaltyMultiplier = 1.1 | 1.2 | 1.5;

/** Plan d’abonnement vendable (catalogue/admin) */
export interface SubscriptionPlan {
  id: number;
  slug: string; // unique, kebab-case (ex: "starter", "plus", "pro")
  name: string;
  description: string;
  /** Prix par mois si facturé mensuellement */
  monthlyPrice: number;
  /** Prix annuel payé une fois (brut, avant "mois offerts") */
  annualPrice: number;
  /** Nb de mois offerts lorsque payé à l’année (affiche le "moyen / mois") */
  monthsOfferedOnAnnual: number; // ex: 1 => "12 - 1 offert"
  /** Liste courte pour card (3–6 points) et longue pour modal (FAQ) */
  perksShort: string[];
  perksFull: string[];
  /** Multiplicateur de points fidélité appliqué à l’acquisition pendant l’abonnement */
  loyaltyMultiplier: LoyaltyMultiplier;
  /** Plafond de points gagnables par mois via multiplicateur (0 = illimité) */
  monthlyPointsCap: number;
  visibility: SubscriptionVisibility;
  isActive: boolean; // activable/désactivable (achat possible)
  deprecated: boolean; // plus vendable, mais support existant
  displayOrder: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Abonnement utilisateur (un seul actif à la fois) */
export interface UserSubscription {
  id: string; // uid (ex: "sub-<userId>-<timestamp>")
  userId: number;
  planId: number;
  term: SubscriptionTerm;
  status: SubscriptionStatus;
  startedAt: string; // ISO
  currentPeriodStart: string; // ISO
  currentPeriodEnd: string; // ISO (renouvellement prévu)
  autoRenew: boolean;
  /** snapshot du multiplicateur au moment de la période courante (traçabilité) */
  appliedMultiplier: LoyaltyMultiplier;
}

/** Statut d’abonnement */
export type SubscriptionStatus = 'active' | 'paused' | 'canceled';

/** Snapshot immuable pour le panier/commande (quand on ajoutera l’intégration panier) */
export interface SubscriptionSnapshot {
  planId: number;
  planSlug: string;
  planName: string;
  term: SubscriptionTerm;
  priceCharged: number; // prix au moment de l’ajout (mensuel ou annuel)
  monthsOfferedOnAnnual: number;
  loyaltyMultiplier: LoyaltyMultiplier;
}

/** Résultats métier sans any */
export interface OperationResultOk<T> {
  success: true;
  data: T;
  message?: string;
}
export interface OperationResultErr {
  success: false;
  error: string;
}
export type OperationResult<T> = OperationResultOk<T> | OperationResultErr;

/** Helpers utilitaires typés */
export interface PlanCreate {
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthsOfferedOnAnnual: number;
  perksShort: string[];
  perksFull: string[];
  loyaltyMultiplier: LoyaltyMultiplier;
  monthlyPointsCap: number;
  visibility: SubscriptionVisibility;
  isActive: boolean;
  deprecated?: boolean;
  displayOrder?: number;
}

export interface PlanUpdate extends Partial<Omit<PlanCreate, 'slug'>> {
  slug?: string; // autoriser le changement si unique ok
}

export interface LifecycleSwitchTermPayload {
  term: SubscriptionTerm;
  effectiveNow?: boolean; // défaut: au prochain renouvellement
}

export interface LifecycleUpgradePayload {
  toPlanId: number;
  effectiveNow?: boolean; // défaut: au prochain renouvellement
}
