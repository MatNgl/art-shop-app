// src/app/features/fidelity/services/fidelity-store.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AppliedRewardState,
  FidelityAccount,
  FidelityLedgerEntry,
  FidelityReward,
  FidelitySettings,
} from '../models/fidelity.models';
import { FidelityCalculatorService } from './fidelity-calculator.service';
import { CartItem } from '../../cart/models/cart.model';

const STORAGE_KEY_ACCOUNTS = 'fidelity_accounts';
const STORAGE_KEY_SETTINGS = 'fidelity_settings';
const STORAGE_KEY_REWARDS = 'fidelity_rewards';
const STORAGE_KEY_APPLIED = 'fidelity_applied_by_user'; // { [userId]: AppliedRewardState | null }

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

@Injectable({ providedIn: 'root' })
export class FidelityStore {
  private readonly calculator = inject(FidelityCalculatorService);

  private readonly _accounts = signal<Record<number, FidelityAccount>>({});
  private readonly _settings = signal<FidelitySettings>({
    enabled: true,
    ratePerEuro: 10,
    oneRewardPerOrder: true,
  });
  private readonly _rewards = signal<FidelityReward[]>([]);
  /** Récompense “appliquée au panier” par utilisateur — pas de débit tant que la commande n’est pas finalisée */
  private readonly _appliedByUser = signal<Record<number, AppliedRewardState | null>>({});

  readonly accounts = this._accounts.asReadonly();
  readonly settings = this._settings.asReadonly();
  readonly rewards = this._rewards.asReadonly();
  readonly isEnabled = computed(() => this._settings().enabled);

  constructor() {
    this.loadFromStorage();
    this.seedDefaultDataIfNeeded();
  }

  // ---------- Persistence ----------
  private loadFromStorage(): void {
    const savedAccounts = safeReadJson<Record<number, FidelityAccount>>(STORAGE_KEY_ACCOUNTS);
    if (savedAccounts) this._accounts.set(savedAccounts);
    const savedSettings = safeReadJson<FidelitySettings>(STORAGE_KEY_SETTINGS);
    if (savedSettings) this._settings.set(savedSettings);
    const savedRewards = safeReadJson<FidelityReward[]>(STORAGE_KEY_REWARDS);
    if (savedRewards) this._rewards.set(savedRewards);
    const savedApplied =
      safeReadJson<Record<number, AppliedRewardState | null>>(STORAGE_KEY_APPLIED);
    if (savedApplied) this._appliedByUser.set(savedApplied);
  }
  private persistAccounts(): void {
    safeWriteJson(STORAGE_KEY_ACCOUNTS, this._accounts());
  }
  private persistSettings(): void {
    safeWriteJson(STORAGE_KEY_SETTINGS, this._settings());
  }
  private persistRewards(): void {
    safeWriteJson(STORAGE_KEY_REWARDS, this._rewards());
  }
  private persistApplied(): void {
    safeWriteJson(STORAGE_KEY_APPLIED, this._appliedByUser());
  }

  private seedDefaultDataIfNeeded(): void {
    const existingRewards = safeReadJson<FidelityReward[]>(STORAGE_KEY_REWARDS);
    const existingSettings = safeReadJson<FidelitySettings>(STORAGE_KEY_SETTINGS);
    if (!existingRewards || existingRewards.length === 0) {
      this._rewards.set(this.generateDefaultRewards());
      this.persistRewards();
    }
    if (!existingSettings) {
      this._settings.update((s) => ({
        ...s,
        enabled: true,
        ratePerEuro: 10,
        oneRewardPerOrder: true,
      }));
      this.persistSettings();
    }
    if (!safeReadJson<Record<number, AppliedRewardState | null>>(STORAGE_KEY_APPLIED)) {
      this._appliedByUser.set({});
      this.persistApplied();
    }
  }

  private generateDefaultRewards(): FidelityReward[] {
    const baseTime = new Date('2025-01-01T00:00:00Z').getTime();
    const defaults: Omit<FidelityReward, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        type: 'shipping',
        pointsRequired: 100,
        value: 0,
        label: 'Livraison offerte',
        description: 'Bénéficiez de la livraison gratuite sur votre prochaine commande',
        isActive: true,
      },
      {
        type: 'amount',
        pointsRequired: 500,
        value: 5,
        label: '5 € de réduction',
        description: 'Remise de 5 € sur votre commande',
        isActive: true,
      },
      {
        type: 'amount',
        pointsRequired: 1000,
        value: 10,
        label: '10 € de réduction',
        description: 'Remise de 10 € sur votre commande',
        isActive: true,
      },
      {
        type: 'percent',
        pointsRequired: 2000,
        value: 15,
        percentCap: 30,
        label: '-15% (plafonné à 30 €)',
        description: 'Réduction de 15% sur votre commande, dans la limite de 30 €',
        isActive: true,
      },
      {
        type: 'percent',
        pointsRequired: 3000,
        value: 20,
        percentCap: 50,
        label: '-20% (plafonné à 50 €)',
        description: 'Réduction de 20% sur votre commande, dans la limite de 50 €',
        isActive: true,
      },
      {
        type: 'gift',
        pointsRequired: 4000,
        value: 0,
        giftProductId: 999,
        label: 'Goodie/Print offert',
        description: 'Recevez un goodie ou un print offert avec votre commande',
        isActive: true,
      },
    ];
    return defaults.map((r, i) => ({
      ...r,
      id: 1000 + i,
      createdAt: new Date(baseTime + i * 1000).toISOString(),
      updatedAt: new Date(baseTime + i * 1000).toISOString(),
    }));
  }

  // ---------- Accounts (READ-ONLY) ----------
  /**
   * Lecture PURE : ne crée pas d'entry (safe dans un computed()).
   * Retourne un compte éphémère vide si absent (non persisté).
   */
  getAccount(userId: number): FidelityAccount {
    const existing = this._accounts()[userId];
    return existing ?? { userId, points: 0, ledger: [] };
  }
  getPoints(userId: number): number {
    return this.getAccount(userId).points;
  }
  getLedger(userId: number): FidelityLedgerEntry[] {
    return this.getAccount(userId).ledger;
  }

  // ---------- Accounts (WRITE HELPERS) ----------
  /** Création/initialisation EXPLICITE (à appeler dans les méthodes qui écrivent) */
  private ensureAccount(userId: number): void {
    const map = this._accounts();
    if (map[userId]) return;
    const created: FidelityAccount = { userId, points: 0, ledger: [] };
    this._accounts.set({ ...map, [userId]: created });
    this.persistAccounts();
  }

  // ---------- Earn ----------
  earnPoints(
    userId: number,
    payload: { orderId: number; amountTtcAfterDiscounts: number; items: CartItem[] }
  ): number {
    if (!this.isEnabled()) return 0;
    if (payload.amountTtcAfterDiscounts <= 0) return 0;

    const points = this.calculator.pointsFor(
      payload.amountTtcAfterDiscounts,
      this._settings().ratePerEuro
    );
    if (points <= 0) return 0;

    this.ensureAccount(userId);

    const entry: FidelityLedgerEntry = {
      id: this.generateEntryId(),
      userId,
      orderId: payload.orderId,
      type: 'earn',
      points,
      createdAt: new Date().toISOString(),
      note: `Points gagnés pour la commande #${payload.orderId}`,
    };

    this._accounts.update((accs) => {
      const acc = accs[userId]!;
      return {
        ...accs,
        [userId]: { ...acc, points: acc.points + points, ledger: [entry, ...acc.ledger] },
      };
    });
    this.persistAccounts();
    return points;
  }

  // ---------- Apply/Cancel in Cart (no points movement here) ----------
  applyRewardToCart(
    userId: number,
    rewardId: number
  ): { success: true } | { success: false; error: string } {
    if (!this.isEnabled()) return { success: false, error: 'Programme de fidélité désactivé' };
    const reward = this._rewards().find((r) => r.id === rewardId && r.isActive);
    if (!reward) return { success: false, error: 'Récompense introuvable ou inactive' };

    // Lecture pure des points; on n’écrit pas ici.
    if (this.getPoints(userId) < reward.pointsRequired) {
      return { success: false, error: 'Solde de points insuffisant' };
    }

    const already = this._appliedByUser()[userId] ?? null;
    if (this._settings().oneRewardPerOrder && already && already.rewardId !== rewardId) {
      return { success: false, error: 'Une récompense est déjà appliquée à cette commande' };
    }

    this._appliedByUser.update((map) => ({
      ...map,
      [userId]: { rewardId, appliedAt: new Date().toISOString() },
    }));
    this.persistApplied();
    return { success: true };
  }

  /** Annule l’état “appliquée au panier” — ne touche PAS aux points ni au ledger */
  cancelAppliedReward(userId: number): boolean {
    const map = { ...this._appliedByUser() };
    if (!map[userId]) return false;
    map[userId] = null;
    this._appliedByUser.set(map);
    this.persistApplied();
    return true;
  }

  /** Renvoie la récompense appliquée si et seulement si elle existe **et** est active. */
  getAppliedReward(userId: number): FidelityReward | null {
    const st = this._appliedByUser()[userId] ?? null;
    if (!st) return null;
    const reward = this._rewards().find((r) => r.id === st.rewardId && r.isActive);
    return reward ?? null;
  }

  /** Indique s’il y a une récompense appliquée **valide** (existante + active). */
  hasAppliedReward(userId: number): boolean {
    const st = this._appliedByUser()[userId] ?? null;
    if (!st) return false;
    return this._rewards().some((r) => r.id === st.rewardId && r.isActive);
  }

  /**
   * Finalise l’utilisation au moment de la commande :
   * - Débite les points
   * - Inscrit une ligne 'use' liée à l'orderId
   * - Efface l’état “appliquée au panier”
   */
  finalizeAppliedRewardOnOrder(userId: number, orderId: number): FidelityReward | null {
    const state = this._appliedByUser()[userId] ?? null;
    if (!state) return null;

    const reward = this._rewards().find((r) => r.id === state.rewardId && r.isActive);
    if (!reward) {
      this.cancelAppliedReward(userId);
      return null;
    }

    this.ensureAccount(userId);

    const account = this._accounts()[userId]!;
    if (account.points < reward.pointsRequired) {
      this.cancelAppliedReward(userId);
      return null;
    }

    const entry: FidelityLedgerEntry = {
      id: this.generateEntryId(),
      userId,
      orderId,
      type: 'use',
      points: -reward.pointsRequired,
      createdAt: new Date().toISOString(),
      note: `Utilisation récompense : ${reward.label}`,
    };

    this._accounts.update((accs) => {
      const acc = accs[userId]!;
      return {
        ...accs,
        [userId]: {
          ...acc,
          points: Math.max(0, acc.points - reward.pointsRequired),
          ledger: [entry, ...acc.ledger],
        },
      };
    });
    this.persistAccounts();

    this.cancelAppliedReward(userId);
    return reward;
  }

  /**
   * Crédite les points liés à une utilisation si une commande est annulée.
   * Ne s’utilise QUE si une ligne 'use' existe pour cet orderId.
   */
  revokeUsedRewardForOrder(orderId: number): {
    success: boolean;
    credited?: number;
    error?: string;
  } {
    let targetUserId: number | null = null;
    let pointsToCredit = 0;

    for (const [uid, acc] of Object.entries(this._accounts())) {
      const useEntry = acc.ledger.find((e) => e.orderId === orderId && e.type === 'use');
      if (useEntry) {
        targetUserId = parseInt(uid, 10);
        pointsToCredit = -useEntry.points; // 'use' est négatif
        break;
      }
    }
    if (!targetUserId || pointsToCredit <= 0) {
      return {
        success: false,
        error: 'Aucune utilisation de récompense trouvée pour cette commande',
      };
    }

    const entry: FidelityLedgerEntry = {
      id: this.generateEntryId(),
      userId: targetUserId,
      orderId,
      type: 'adjust',
      points: pointsToCredit,
      createdAt: new Date().toISOString(),
      note: `Remboursement points (annulation commande #${orderId})`,
    };

    this._accounts.update((accs) => {
      const acc = accs[targetUserId!];
      return {
        ...accs,
        [targetUserId!]: {
          ...acc,
          points: acc.points + pointsToCredit,
          ledger: [entry, ...acc.ledger],
        },
      };
    });
    this.persistAccounts();
    return { success: true, credited: pointsToCredit };
  }

  // ---------- Admin / maintenance ----------
  /** Ajustement manuel des points (admin) */
  adjustPoints(userId: number, delta: number, note: string): void {
    if (delta === 0) return;

    this.ensureAccount(userId);

    const entry: FidelityLedgerEntry = {
      id: this.generateEntryId(),
      userId,
      type: 'adjust',
      points: delta,
      createdAt: new Date().toISOString(),
      note: note || 'Ajustement manuel',
    };

    this._accounts.update((accounts) => {
      const account = accounts[userId]!;
      return {
        ...accounts,
        [userId]: {
          ...account,
          points: Math.max(0, account.points + delta),
          ledger: [entry, ...account.ledger],
        },
      };
    });

    this.persistAccounts();
  }

  /**
   * Révoque les points **gagnés** pour une commande annulée/remboursée (ligne 'earn').
   * -> différent de revokeUsedRewardForOrder qui rembourse une **utilisation**.
   */
  revokeForOrder(orderId: number): { success: boolean; revokedPoints?: number; error?: string } {
    const allAccounts = this._accounts();
    let targetUserId: number | null = null;
    let pointsToRevoke = 0;

    for (const [uid, account] of Object.entries(allAccounts)) {
      const earnEntry = account.ledger.find((e) => e.orderId === orderId && e.type === 'earn');
      if (earnEntry) {
        targetUserId = parseInt(uid, 10);
        pointsToRevoke = earnEntry.points;
        break;
      }
    }

    if (!targetUserId || pointsToRevoke <= 0) {
      return { success: false, error: 'Aucune attribution de points trouvée pour cette commande' };
    }

    const entry: FidelityLedgerEntry = {
      id: this.generateEntryId(),
      userId: targetUserId,
      orderId,
      type: 'revoke',
      points: -pointsToRevoke,
      createdAt: new Date().toISOString(),
      note: `Révocation : commande #${orderId} annulée`,
    };

    this._accounts.update((accounts) => {
      const account = accounts[targetUserId!];
      return {
        ...accounts,
        [targetUserId!]: {
          ...account,
          points: Math.max(0, account.points - pointsToRevoke),
          ledger: [entry, ...account.ledger],
        },
      };
    });

    this.persistAccounts();
    return { success: true, revokedPoints: pointsToRevoke };
  }

  // ---------- Rewards CRUD ----------
  createReward(reward: Omit<FidelityReward, 'id' | 'createdAt' | 'updatedAt'>): FidelityReward {
    const now = new Date().toISOString();
    const newReward: FidelityReward = { ...reward, id: Date.now(), createdAt: now, updatedAt: now };
    this._rewards.update((r) => [...r, newReward]);
    this.persistRewards();
    return newReward;
  }
  updateReward(id: number, updates: Partial<FidelityReward>): FidelityReward | null {
    let updated: FidelityReward | null = null;
    this._rewards.update((rs) =>
      rs.map((r) =>
        r.id === id ? (updated = { ...r, ...updates, updatedAt: new Date().toISOString() })! : r
      )
    );
    if (updated) this.persistRewards();
    return updated;
  }
  deleteReward(id: number): void {
    this._rewards.update((rs) => rs.filter((r) => r.id !== id));
    this.persistRewards();

    // Sécurité : si une récompense appliquée devient invalide, on nettoie l'état appliqué.
    const applied = this._appliedByUser();
    const cleaned: Record<number, AppliedRewardState | null> = {};
    for (const [uidStr, st] of Object.entries(applied)) {
      const uid = Number(uidStr);
      if (!st) {
        cleaned[uid] = null;
        continue;
      }
      const stillExists = this._rewards().some((r) => r.id === st.rewardId && r.isActive);
      cleaned[uid] = stillExists ? st : null;
    }
    this._appliedByUser.set(cleaned);
    this.persistApplied();
  }
  getRewardById(id: number): FidelityReward | undefined {
    return this._rewards().find((r) => r.id === id);
  }

  updateSettings(updates: Partial<FidelitySettings>): void {
    this._settings.update((s) => ({ ...s, ...updates }));
    this.persistSettings();
  }

  // ---------- Utils ----------
  private generateEntryId(): string {
    return `fid-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
  getAllAccounts(): FidelityAccount[] {
    return Object.values(this._accounts());
  }
  resetAll(): void {
    this._accounts.set({});
    this._settings.set({ enabled: true, ratePerEuro: 10, oneRewardPerOrder: true });
    this._rewards.set([]);
    this._appliedByUser.set({});
    this.persistAccounts();
    this.persistSettings();
    this.persistRewards();
    this.persistApplied();
  }
}
