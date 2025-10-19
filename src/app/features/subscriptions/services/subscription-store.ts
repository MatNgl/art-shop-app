// src/app/features/subscriptions/services/subscription-store.ts
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import {
  OperationResult,
  SubscriptionPlan,
  SubscriptionTerm,
  UserSubscription,
} from '../models/subscription.model';
import { SubscriptionService } from './subscription.service';
import { AuthService } from '../../auth/services/auth';
import { EmailService } from './email.service';

const STORAGE_KEY_SELECTED_TERM = 'subscriptions_ui_selected_term'; // préférence UI (mensuel/annuel)

function safeRead(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function safeWrite(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
}

@Injectable({ providedIn: 'root' })
export class SubscriptionStore {
  private readonly svc = inject(SubscriptionService);
  private readonly auth = inject(AuthService);
  private readonly emailSvc = inject(EmailService);

  // UI State
  private readonly _loading = signal<boolean>(false);
  private readonly _preferredTerm = signal<SubscriptionTerm>(
    (safeRead(STORAGE_KEY_SELECTED_TERM) as SubscriptionTerm) ?? 'monthly'
  );

  // Data State
  private readonly _plans = signal<SubscriptionPlan[]>(this.svc.getAllPlans());
  private readonly _active = signal<UserSubscription | null>(this.getForCurrentUserSync());

  // Exposed Signals
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly plans: Signal<SubscriptionPlan[]> = computed(() =>
    [...this._plans()].sort((a, b) => a.displayOrder - b.displayOrder)
  );
  readonly publicPlans: Signal<SubscriptionPlan[]> = computed(() =>
    this._plans().filter((p) => p.visibility === 'public' && p.isActive && !p.deprecated)
  );
  readonly active: Signal<UserSubscription | null> = this._active.asReadonly();

  /** Multiplicateur courant (1.0 si aucun abo actif) */
  readonly loyaltyMultiplier: Signal<number> = computed(() => {
    const sub = this._active();
    if (!sub || sub.status !== 'active') return 1.0;
    const plan = this._plans().find((p) => p.id === sub.planId);
    return plan?.loyaltyMultiplier ?? sub.appliedMultiplier ?? 1.0;
  });

  /** Cap mensuel de points bonus (0 = illimité) */
  readonly monthlyPointsCap: Signal<number> = computed(() => {
    const sub = this._active();
    if (!sub || sub.status !== 'active') return 0;
    const plan = this._plans().find((p) => p.id === sub.planId);
    return plan?.monthlyPointsCap ?? 0;
  });

  /** Préférence UI (mensuel / annuel) */
  readonly preferredTerm: Signal<SubscriptionTerm> = this._preferredTerm.asReadonly();

  constructor() {
    // Rehydratation si l’utilisateur change en session
    const current = this.getForCurrentUserSync();
    this._active.set(current);
  }

  // ---------- Helpers ----------
  private currentUserId(): number | null {
    return this.auth.getCurrentUser()?.id ?? null;
  }

  private getForCurrentUserSync(): UserSubscription | null {
    const uid = this.currentUserId();
    if (!uid) return null;
    return this.svc.getActiveForUser(uid);
  }

  // ---------- Commands ----------
  refresh(): void {
    this._plans.set(this.svc.getAllPlans());
    const active = this.getForCurrentUserSync();
    this._active.set(active);
  }

  setPreferredTerm(term: SubscriptionTerm): void {
    this._preferredTerm.set(term);
    safeWrite(STORAGE_KEY_SELECTED_TERM, term);
  }

  /** Souscrit au plan (si aucun autre abonnement non annulé). */
  subscribe(planId: number, term: SubscriptionTerm): OperationResult<UserSubscription> {
    const uid = this.currentUserId();
    if (!uid) return { success: false, error: 'AUTH_REQUIRED' };

    this._loading.set(true);
    const res = this.svc.subscribeUser(uid, planId, term, true);
    this._loading.set(false);

    if (res.success) {
      this._active.set(res.data);

      // Envoyer l'email de confirmation
      const user = this.auth.getCurrentUser();
      const plan = this._plans().find(p => p.id === planId);
      if (user && plan) {
        this.emailSvc.sendEmail(user.id, user.email, 'subscription_confirmation', {
          userName: user.firstName,
          planName: plan.name,
          multiplier: String(plan.loyaltyMultiplier),
          nextBillingDate: new Date(res.data.currentPeriodEnd).toLocaleDateString('fr-FR'),
        });
      }
    }
    return res;
  }


  cancel(): OperationResult<UserSubscription> {
    const uid = this.currentUserId();
    if (!uid) return { success: false, error: 'AUTH_REQUIRED' };

    this._loading.set(true);
    const res = this.svc.cancel(uid);
    this._loading.set(false);

    if (res.success) {
      this._active.set(res.data);

      // Envoyer l'email d'annulation
      const user = this.auth.getCurrentUser();
      const plan = this._plans().find(p => p.id === res.data.planId);
      if (user && plan) {
        this.emailSvc.sendEmail(user.id, user.email, 'subscription_canceled', {
          userName: user.firstName,
          planName: plan.name,
          endDate: new Date(res.data.currentPeriodEnd).toLocaleDateString('fr-FR'),
        });
      }
    }
    return res;
  }

  switchTerm(term: SubscriptionTerm, effectiveNow = false): OperationResult<UserSubscription> {
    const uid = this.currentUserId();
    if (!uid) return { success: false, error: 'AUTH_REQUIRED' };

    this._loading.set(true);
    const res = this.svc.switchTerm(uid, term, effectiveNow);
    this._loading.set(false);

    if (res.success) this._active.set(res.data);
    return res;
  }

  upgradePlan(toPlanId: number, effectiveNow = false): OperationResult<UserSubscription> {
    const uid = this.currentUserId();
    if (!uid) return { success: false, error: 'AUTH_REQUIRED' };

    this._loading.set(true);
    const res = this.svc.upgradePlan(uid, toPlanId, effectiveNow);
    this._loading.set(false);

    if (res.success) this._active.set(res.data);
    return res;
  }

  // ---------- Selectors utilitaires ----------
  /** Prix moyen / mois quand payé à l’année (en tenant compte des mois offerts) */
  averageMonthlyForAnnual(plan: SubscriptionPlan): number {
    const monthsBilled = Math.max(1, 12 - Math.max(0, plan.monthsOfferedOnAnnual));
    return +(plan.annualPrice / monthsBilled).toFixed(2);
  }

  /** Multiplicateur courant casté strictement (1.0 | 1.1 | 1.2 | 1.5) pour usage dans fidelity */
  currentMultiplierStrict(): 1.0 | 1.1 | 1.2 | 1.5 {
    const m = this.loyaltyMultiplier();
    if (m === 1.1 || m === 1.2 || m === 1.5) return m;
    return 1.0;
  }
}
