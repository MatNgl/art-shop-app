// src/app/features/subscriptions/services/subscription.service.ts
import { Injectable, signal } from '@angular/core';
import {
  LoyaltyMultiplier,
  OperationResult,
  PlanCreate,
  PlanUpdate,
  SubscriptionPlan,
  SubscriptionTerm,
  UserSubscription,
} from '../models/subscription.model';

const STORAGE_KEY_PLANS = 'subscriptions_plans_v1';
const STORAGE_KEY_USER_SUBS = 'subscriptions_user_active_v1'; // map par userId

function safeReadJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function safeWriteJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  const base = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${base}`;
}

/** Mocks initiaux — 3 plans avec multiplicateurs x1.1 / x1.2 / x1.5 */
function seedMockPlans(): SubscriptionPlan[] {
  const createdAt = new Date('2025-01-10T09:00:00Z').toISOString();
  const updatedAt = createdAt;

  const mk = (
    id: number,
    args: {
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
      displayOrder: number;
    }
  ): SubscriptionPlan => ({
    id,
    slug: args.slug,
    name: args.name,
    description: args.description,
    monthlyPrice: args.monthlyPrice,
    annualPrice: args.annualPrice,
    monthsOfferedOnAnnual: args.monthsOfferedOnAnnual,
    perksShort: args.perksShort,
    perksFull: args.perksFull,
    loyaltyMultiplier: args.loyaltyMultiplier,
    monthlyPointsCap: args.monthlyPointsCap,
    visibility: 'public',
    isActive: true,
    deprecated: false,
    displayOrder: args.displayOrder,
    createdAt,
    updatedAt,
  });

  return [
    mk(101, {
      slug: 'starter',
      name: 'Starter',
      description:
        'Lancez-vous et recevez un goodie surprise tous les mois. Bonus de points fidélité pour vos commandes.',
      monthlyPrice: 4.99,
      annualPrice: 49.9,
      monthsOfferedOnAnnual: 1,
      perksShort: ['Goodie mensuel', 'Badge profil', 'Support standard'],
      perksFull: [
        '1 goodie physique expédié chaque mois',
        'Badge “Starter” visible sur votre profil',
        'Multiplicateur fidélité x1,1 sur vos commandes',
        'Support standard par email',
      ],
      loyaltyMultiplier: 1.1,
      monthlyPointsCap: 300, // plafond des points bonus/mois
      displayOrder: 1,
    }),
    mk(102, {
      slug: 'plus',
      name: 'Plus',
      description:
        'Recevez un print A5 chaque mois et profitez de réductions exclusives. Plus de points fidélité.',
      monthlyPrice: 9.99,
      annualPrice: 99.9,
      monthsOfferedOnAnnual: 1,
      perksShort: ['Print A5 mensuel', 'Remises exclusives', 'Support prioritaire'],
      perksFull: [
        '1 print A5 expédié chaque mois',
        'Accès à des remises abonné (sélection)',
        'Multiplicateur fidélité x1,2 sur vos commandes',
        'Support prioritaire',
      ],
      loyaltyMultiplier: 1.2,
      monthlyPointsCap: 700,
      displayOrder: 2,
    }),
    mk(103, {
      slug: 'pro',
      name: 'Pro',
      description:
        'La version premium : print A4 signé chaque mois, accès bêta, et maximum de points fidélité.',
      monthlyPrice: 19.99,
      annualPrice: 199.9,
      monthsOfferedOnAnnual: 2,
      perksShort: ['Print A4 signé', 'Accès bêta', 'Support VIP'],
      perksFull: [
        '1 print A4 signé expédié chaque mois',
        'Accès anticipé aux nouveautés et préventes',
        'Multiplicateur fidélité x1,5 sur vos commandes',
        'Support VIP',
      ],
      loyaltyMultiplier: 1.5,
      monthlyPointsCap: 1500,
      displayOrder: 3,
    }),
  ];
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  /** Cache local (reactif) — utile pour éviter de relire le storage à chaque fois */
  private readonly _plans = signal<SubscriptionPlan[]>([]);
  /** Map userId -> UserSubscription (actif/pausé/annulé) */
  private readonly _userSubs = signal<Record<number, UserSubscription | null>>({});

  constructor() {
    this.bootstrap();
  }

  // ---------- Bootstrap / Persistence ----------
  private bootstrap(): void {
    const savedPlans = safeReadJson<SubscriptionPlan[]>(STORAGE_KEY_PLANS);
    if (!savedPlans || savedPlans.length === 0) {
      const seeded = seedMockPlans();
      this._plans.set(seeded);
      safeWriteJson(STORAGE_KEY_PLANS, seeded);
    } else {
      this._plans.set(savedPlans);
    }

    const savedSubs = safeReadJson<Record<number, UserSubscription | null>>(STORAGE_KEY_USER_SUBS);
    this._userSubs.set(savedSubs ?? {});
  }

  private persistPlans(): void {
    safeWriteJson(STORAGE_KEY_PLANS, this._plans());
  }

  private persistUserSubs(): void {
    safeWriteJson(STORAGE_KEY_USER_SUBS, this._userSubs());
  }

  // ---------- READ ----------
  /** Plans visibles publiquement et actifs, non dépréciés */
  getPublicPlans(): SubscriptionPlan[] {
    return this._plans()
      .filter((p) => p.visibility === 'public' && p.isActive && !p.deprecated)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /** Tous les plans (admin) */
  getAllPlans(): SubscriptionPlan[] {
    return [...this._plans()].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getPlanById(id: number): SubscriptionPlan | undefined {
    return this._plans().find((p) => p.id === id);
  }

  getActiveForUser(userId: number): UserSubscription | null {
    const map = this._userSubs();
    return map[userId] ?? null;
  }

  // ---------- CRUD Plans (admin) ----------
  createPlan(payload: PlanCreate): OperationResult<SubscriptionPlan> {
    if (this._plans().some((p) => p.slug === payload.slug)) {
      return { success: false, error: 'SLUG_ALREADY_EXISTS' };
    }
    const id = Date.now();
    const now = nowIso();

    const plan: SubscriptionPlan = {
      id,
      slug: payload.slug,
      name: payload.name,
      description: payload.description,
      monthlyPrice: payload.monthlyPrice,
      annualPrice: payload.annualPrice,
      monthsOfferedOnAnnual: payload.monthsOfferedOnAnnual,
      perksShort: [...payload.perksShort],
      perksFull: [...payload.perksFull],
      loyaltyMultiplier: payload.loyaltyMultiplier,
      monthlyPointsCap: payload.monthlyPointsCap,
      visibility: payload.visibility,
      isActive: payload.isActive,
      deprecated: Boolean(payload.deprecated),
      displayOrder:
        typeof payload.displayOrder === 'number'
          ? payload.displayOrder
          : Math.max(0, ...this._plans().map((p) => p.displayOrder)) + 1,
      createdAt: now,
      updatedAt: now,
    };

    this._plans.update((arr) => [...arr, plan]);
    this.persistPlans();
    return { success: true, data: plan };
  }

  updatePlan(id: number, updates: PlanUpdate): OperationResult<SubscriptionPlan> {
    let updated: SubscriptionPlan | undefined;
    this._plans.update((arr) =>
      arr.map((p) => {
        if (p.id !== id) return p;
        if (
          updates.slug &&
          updates.slug !== p.slug &&
          this._plans().some((x) => x.slug === updates.slug)
        ) {
          return p;
        }
        updated = {
          ...p,
          ...updates,
          updatedAt: nowIso(),
        };
        return updated!;
      })
    );
    if (!updated) return { success: false, error: 'PLAN_NOT_FOUND_OR_SLUG_TAKEN' };
    this.persistPlans();
    return { success: true, data: updated };
  }

  setPlanDeprecated(id: number, deprecated: boolean): OperationResult<SubscriptionPlan> {
    return this.updatePlan(id, { deprecated });
  }

  setPlanVisibility(id: number, visibility: 'public' | 'admin'): OperationResult<SubscriptionPlan> {
    return this.updatePlan(id, { visibility });
  }

  setPlanActive(id: number, isActive: boolean): OperationResult<SubscriptionPlan> {
    return this.updatePlan(id, { isActive });
  }

  reorderPlans(newOrder: number[]): OperationResult<SubscriptionPlan[]> {
    const idSet = new Set(this._plans().map((p) => p.id));
    const allKnown = newOrder.every((id) => idSet.has(id));
    if (!allKnown) return { success: false, error: 'UNKNOWN_PLAN_ID' };

    const orderMap = new Map<number, number>();
    newOrder.forEach((id, idx) => orderMap.set(id, idx + 1));

    this._plans.update((arr) =>
      arr.map((p) => ({
        ...p,
        displayOrder: orderMap.get(p.id) ?? p.displayOrder,
        updatedAt: nowIso(),
      }))
    );
    this.persistPlans();
    return { success: true, data: this.getAllPlans() };
  }

  // ---------- Lifecycle utilisateur ----------
  /** Souscrire (crée un abonnement actif si aucun actif non annulé) */
  subscribeUser(
    userId: number,
    planId: number,
    term: SubscriptionTerm,
    autoRenew = true
  ): OperationResult<UserSubscription> {
    const current = this.getActiveForUser(userId);
    if (current && current.status !== 'canceled') {
      return { success: false, error: 'SUBSCRIPTION_ALREADY_EXISTS' };
    }
    const plan = this.getPlanById(planId);
    if (!plan || !plan.isActive) return { success: false, error: 'PLAN_NOT_AVAILABLE' };

    const start = new Date();
    const end = this.computeNextPeriodEnd(start, term);
    const sub: UserSubscription = {
      id: uid(`sub-${userId}`),
      userId,
      planId,
      term,
      status: 'active',
      startedAt: start.toISOString(),
      currentPeriodStart: start.toISOString(),
      currentPeriodEnd: end.toISOString(),
      autoRenew,
      appliedMultiplier: plan.loyaltyMultiplier,
    };

    this._userSubs.update((map) => ({ ...map, [userId]: sub }));
    this.persistUserSubs();
    return { success: true, data: sub };
  }

  /** Pause (ne prolonge pas la période courante) */
  pause(userId: number): OperationResult<UserSubscription> {
    const sub = this.getActiveForUser(userId);
    if (!sub) return { success: false, error: 'NO_ACTIVE_SUBSCRIPTION' };
    if (sub.status !== 'active') return { success: false, error: 'NOT_ACTIVE' };

    const updated: UserSubscription = { ...sub, status: 'paused' };
    this._userSubs.update((m) => ({ ...m, [userId]: updated }));
    this.persistUserSubs();
    return { success: true, data: updated };
  }

  /** Reprendre une pause */
  resume(userId: number): OperationResult<UserSubscription> {
    const sub = this.getActiveForUser(userId);
    if (!sub) return { success: false, error: 'NO_ACTIVE_SUBSCRIPTION' };
    if (sub.status !== 'paused') return { success: false, error: 'NOT_PAUSED' };

    const now = new Date();
    const nextEnd = this.computeNextPeriodEnd(now, sub.term);
    const updated: UserSubscription = {
      ...sub,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: nextEnd.toISOString(),
    };
    this._userSubs.update((m) => ({ ...m, [userId]: updated }));
    this.persistUserSubs();
    return { success: true, data: updated };
  }

  /** Annuler (arrête la reconduction) */
  cancel(userId: number): OperationResult<UserSubscription> {
    const sub = this.getActiveForUser(userId);
    if (!sub) return { success: false, error: 'NO_ACTIVE_SUBSCRIPTION' };
    if (sub.status === 'canceled') return { success: false, error: 'ALREADY_CANCELED' };

    const updated: UserSubscription = { ...sub, status: 'canceled', autoRenew: false };
    this._userSubs.update((m) => ({ ...m, [userId]: updated }));
    this.persistUserSubs();
    return { success: true, data: updated };
  }

  /** Basculer de term (mensuel/annuel). Par défaut effectif au renouvellement. */
  switchTerm(
    userId: number,
    term: SubscriptionTerm,
    effectiveNow = false
  ): OperationResult<UserSubscription> {
    const sub = this.getActiveForUser(userId);
    if (!sub) return { success: false, error: 'NO_ACTIVE_SUBSCRIPTION' };
    if (sub.term === term) return { success: false, error: 'SAME_TERM' };

    if (!effectiveNow) {
      const updated: UserSubscription = { ...sub, term };
      this._userSubs.update((m) => ({ ...m, [userId]: updated }));
      this.persistUserSubs();
      return { success: true, data: updated };
    }

    // Effectif immédiat -> redémarre la période
    const start = new Date();
    const end = this.computeNextPeriodEnd(start, term);
    const updated: UserSubscription = {
      ...sub,
      term,
      status: 'active',
      currentPeriodStart: start.toISOString(),
      currentPeriodEnd: end.toISOString(),
    };
    this._userSubs.update((m) => ({ ...m, [userId]: updated }));
    this.persistUserSubs();
    return { success: true, data: updated };
  }

  /** Upgrade de plan. Par défaut effectif au renouvellement. */
  upgradePlan(
    userId: number,
    toPlanId: number,
    effectiveNow = false
  ): OperationResult<UserSubscription> {
    const sub = this.getActiveForUser(userId);
    if (!sub) return { success: false, error: 'NO_ACTIVE_SUBSCRIPTION' };
    const target = this.getPlanById(toPlanId);
    if (!target || !target.isActive) return { success: false, error: 'PLAN_NOT_AVAILABLE' };
    if (sub.planId === toPlanId) return { success: false, error: 'SAME_PLAN' };

    if (!effectiveNow) {
      const updated: UserSubscription = {
        ...sub,
        planId: toPlanId,
        appliedMultiplier: target.loyaltyMultiplier,
      };
      this._userSubs.update((m) => ({ ...m, [userId]: updated }));
      this.persistUserSubs();
      return { success: true, data: updated };
    }

    // Effectif immédiat -> redémarre la période
    const start = new Date();
    const end = this.computeNextPeriodEnd(start, sub.term);
    const updated: UserSubscription = {
      ...sub,
      planId: toPlanId,
      appliedMultiplier: target.loyaltyMultiplier,
      status: 'active',
      currentPeriodStart: start.toISOString(),
      currentPeriodEnd: end.toISOString(),
    };
    this._userSubs.update((m) => ({ ...m, [userId]: updated }));
    this.persistUserSubs();
    return { success: true, data: updated };
  }

  /** Utilitaire: calcule la fin de période à partir d’un début et d’un term */
  private computeNextPeriodEnd(start: Date, term: SubscriptionTerm): Date {
    const d = new Date(start);
    if (term === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setFullYear(d.getFullYear() + 1);
    }
    return d;
  }

  // ---------- Utils pour tests / maintenance ----------
  resetAll(): void {
    this._plans.set(seedMockPlans());
    this._userSubs.set({});
    this.persistPlans();
    this.persistUserSubs();
  }
}
