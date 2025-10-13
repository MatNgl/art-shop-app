import { Injectable, computed, inject, signal } from '@angular/core';
import {
  FidelityAccount,
  FidelityLedgerEntry,
  FidelityReward,
  FidelitySettings,
} from '../models/fidelity.models';
import { FidelityCalculatorService, AppliedFidelityDiscount } from './fidelity-calculator.service';
import { CartItem } from '../../cart/models/cart.model';

const STORAGE_KEY_ACCOUNTS = 'fidelity_accounts';
const STORAGE_KEY_SETTINGS = 'fidelity_settings';
const STORAGE_KEY_REWARDS = 'fidelity_rewards';

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

  // Signals internes
  private readonly _accounts = signal<Record<number, FidelityAccount>>({});
  private readonly _settings = signal<FidelitySettings>({
    enabled: true,
    ratePerEuro: 10,
    oneRewardPerOrder: true,
  });
  private readonly _rewards = signal<FidelityReward[]>([]);

  // Lecture seule
  readonly accounts = this._accounts.asReadonly();
  readonly settings = this._settings.asReadonly();
  readonly rewards = this._rewards.asReadonly();

  readonly isEnabled = computed(() => this._settings().enabled);

  constructor() {
    this.loadFromStorage();
    this.seedDefaultDataIfNeeded();
  }

  // ===========================
  // Persistance localStorage
  // ===========================

  private loadFromStorage(): void {
    const savedAccounts = safeReadJson<Record<number, FidelityAccount>>(STORAGE_KEY_ACCOUNTS);
    if (savedAccounts) this._accounts.set(savedAccounts);

    const savedSettings = safeReadJson<FidelitySettings>(STORAGE_KEY_SETTINGS);
    if (savedSettings) this._settings.set(savedSettings);

    const savedRewards = safeReadJson<FidelityReward[]>(STORAGE_KEY_REWARDS);
    if (savedRewards) this._rewards.set(savedRewards);
  }

  /**
   * Charge les données par défaut si aucune donnée n'existe (premier démarrage).
   * Équivalent à ce que tu fais dans AuthService avec les users mock.
   */
  private seedDefaultDataIfNeeded(): void {
    const existingRewards = safeReadJson<FidelityReward[]>(STORAGE_KEY_REWARDS);
    const existingSettings = safeReadJson<FidelitySettings>(STORAGE_KEY_SETTINGS);

    // Seed rewards si vide (comme tes users dans AuthService)
    if (!existingRewards || existingRewards.length === 0) {
      const defaultRewards = this.generateDefaultRewards();
      this._rewards.set(defaultRewards);
      this.persistRewards();
    }

    // Seed settings si vide
    if (!existingSettings) {
      const defaultSettings: FidelitySettings = {
        enabled: true,
        ratePerEuro: 10,
        oneRewardPerOrder: true,
      };
      this._settings.update((s) => ({ ...s, ...defaultSettings }));
      this.persistSettings();
    }
  }

  /**
   * Génère les récompenses par défaut du MVP (6 paliers).
   */
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

    return defaults.map((reward, index) => ({
      ...reward,
      id: 1000 + index,
      createdAt: new Date(baseTime + index * 1000).toISOString(),
      updatedAt: new Date(baseTime + index * 1000).toISOString(),
    }));
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

  // ===========================
  // Gestion des comptes
  // ===========================

  /**
   * Récupère ou crée un compte fidélité pour un utilisateur.
   */
  getAccount(userId: number): FidelityAccount {
    const existing = this._accounts()[userId];
    if (existing) return existing;

    const newAccount: FidelityAccount = {
      userId,
      points: 0,
      ledger: [],
    };
    this._accounts.update((accounts) => ({ ...accounts, [userId]: newAccount }));
    this.persistAccounts();
    return newAccount;
  }

  /**
   * Récupère le solde de points d'un utilisateur.
   */
  getPoints(userId: number): number {
    return this.getAccount(userId).points;
  }

  /**
   * Récupère le ledger (historique) d'un utilisateur.
   */
  getLedger(userId: number): FidelityLedgerEntry[] {
    return this.getAccount(userId).ledger;
  }

  // ===========================
  // Attribution de points (earn)
  // ===========================

  /**
   * Crédite des points suite à une commande.
   * @param userId - ID utilisateur
   * @param orderId - ID commande
   * @param amountTtcAfterDiscounts - Montant TTC après promos, hors livraison
   * @param items - Articles du panier (pour référence future)
   */
  earnPoints(
    userId: number,
    payload: {
      orderId: number;
      amountTtcAfterDiscounts: number;
      items: CartItem[];
    }
  ): number {
    if (!this.isEnabled()) return 0;
    if (payload.amountTtcAfterDiscounts <= 0) return 0;

    const { orderId, amountTtcAfterDiscounts } = payload;
    const rate = this._settings().ratePerEuro;
    const pointsEarned = this.calculator.pointsFor(amountTtcAfterDiscounts, rate);

    if (pointsEarned <= 0) return 0;

    const entry: FidelityLedgerEntry = {
      id: this.generateEntryId(),
      userId,
      orderId,
      type: 'earn',
      points: pointsEarned,
      createdAt: new Date().toISOString(),
      note: `Points gagnés pour la commande #${orderId}`,
    };

    this._accounts.update((accounts) => {
      const account = accounts[userId] ?? this.getAccount(userId);
      return {
        ...accounts,
        [userId]: {
          ...account,
          points: account.points + pointsEarned,
          ledger: [entry, ...account.ledger],
        },
      };
    });

    this.persistAccounts();
    return pointsEarned;
  }

  // ===========================
  // Utilisation de récompense (use)
  // ===========================

  /**
   * Utilise une récompense fidélité.
   * Vérifie que l'utilisateur a assez de points et retourne le discount à appliquer.
   */
  useReward(
    userId: number,
    rewardId: number
  ): { success: boolean; appliedDiscount?: AppliedFidelityDiscount; error?: string } {
    if (!this.isEnabled()) {
      return { success: false, error: 'Programme de fidélité désactivé' };
    }

    const reward = this._rewards().find((r) => r.id === rewardId);
    if (!reward || !reward.isActive) {
      return { success: false, error: 'Récompense introuvable ou inactive' };
    }

    const account = this.getAccount(userId);
    if (account.points < reward.pointsRequired) {
      return { success: false, error: 'Solde de points insuffisant' };
    }

    // Débiter les points
    const entry: FidelityLedgerEntry = {
      id: this.generateEntryId(),
      userId,
      type: 'use',
      points: -reward.pointsRequired,
      createdAt: new Date().toISOString(),
      note: `Utilisation : ${reward.label}`,
    };

    this._accounts.update((accounts) => {
      const acc = accounts[userId];
      return {
        ...accounts,
        [userId]: {
          ...acc,
          points: acc.points - reward.pointsRequired,
          ledger: [entry, ...acc.ledger],
        },
      };
    });

    this.persistAccounts();

    // Calculer l'appliedDiscount (pour l'instant on passe un montant fictif, il sera recalculé dans le checkout)
    const appliedDiscount = this.calculator.applyReward(reward, 100); // Le montant réel sera calculé dans le checkout

    return {
      success: true,
      appliedDiscount: appliedDiscount ?? undefined,
    };
  }

  // ===========================
  // Révocation (annulation commande)
  // ===========================

  /**
   * Révoque les points gagnés pour une commande annulée/remboursée.
   */
  revokeForOrder(orderId: number): { success: boolean; revokedPoints?: number; error?: string } {
    const allAccounts = this._accounts();
    let targetUserId: number | null = null;
    let pointsToRevoke = 0;

    // Trouver l'entrée 'earn' correspondante
    for (const [uid, account] of Object.entries(allAccounts)) {
      const earnEntry = account.ledger.find(
        (e) => e.orderId === orderId && e.type === 'earn'
      );
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

  // ===========================
  // Ajustement manuel (admin)
  // ===========================

  /**
   * Ajuste manuellement le solde de points d'un utilisateur (admin only).
   * @param delta - Peut être positif ou négatif
   */
  adjustPoints(userId: number, delta: number, note: string): void {
    if (delta === 0) return;

    const entry: FidelityLedgerEntry = {
      id: this.generateEntryId(),
      userId,
      type: 'adjust',
      points: delta,
      createdAt: new Date().toISOString(),
      note: note || 'Ajustement manuel',
    };

    this._accounts.update((accounts) => {
      const account = accounts[userId] ?? this.getAccount(userId);
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

  // ===========================
  // Gestion des récompenses (CRUD)
  // ===========================

  createReward(reward: Omit<FidelityReward, 'id' | 'createdAt' | 'updatedAt'>): FidelityReward {
    const now = new Date().toISOString();
    const newReward: FidelityReward = {
      ...reward,
      id: Date.now(),
      createdAt: now,
      updatedAt: now,
    };

    this._rewards.update((rewards) => [...rewards, newReward]);
    this.persistRewards();
    return newReward;
  }

  updateReward(id: number, updates: Partial<FidelityReward>): FidelityReward | null {
    let updated: FidelityReward | null = null;

    this._rewards.update((rewards) =>
      rewards.map((r) => {
        if (r.id === id) {
          updated = { ...r, ...updates, updatedAt: new Date().toISOString() };
          return updated;
        }
        return r;
      })
    );

    if (updated) this.persistRewards();
    return updated;
  }

  deleteReward(id: number): void {
    this._rewards.update((rewards) => rewards.filter((r) => r.id !== id));
    this.persistRewards();
  }

  getRewardById(id: number): FidelityReward | undefined {
    return this._rewards().find((r) => r.id === id);
  }

  // ===========================
  // Gestion des settings
  // ===========================

  updateSettings(updates: Partial<FidelitySettings>): void {
    this._settings.update((current) => ({ ...current, ...updates }));
    this.persistSettings();
  }

  // ===========================
  // Seeds/Init (appelé au boot ou dans un mock)
  // ===========================

  /**
   * Initialise les données par défaut (rewards + settings).
   * À appeler depuis fidelity.mock.ts ou au premier démarrage.
   */
  seedDefaultData(defaultRewards: FidelityReward[], defaultSettings?: Partial<FidelitySettings>): void {
    // Ne seed que si pas déjà fait
    const existing = safeReadJson<FidelityReward[]>(STORAGE_KEY_REWARDS);
    if (!existing || existing.length === 0) {
      this._rewards.set(defaultRewards);
      this.persistRewards();
    }

    if (defaultSettings) {
      const existingSettings = safeReadJson<FidelitySettings>(STORAGE_KEY_SETTINGS);
      if (!existingSettings) {
        this._settings.update((s) => ({ ...s, ...defaultSettings }));
        this.persistSettings();
      }
    }
  }

  // ===========================
  // Helpers
  // ===========================

  private generateEntryId(): string {
    return `fid-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Récupère tous les comptes (admin only).
   */
  getAllAccounts(): FidelityAccount[] {
    return Object.values(this._accounts());
  }

  /**
   * Efface toutes les données fidélité (pour tests).
   */
  resetAll(): void {
    this._accounts.set({});
    this._settings.set({ enabled: true, ratePerEuro: 10, oneRewardPerOrder: true });
    this._rewards.set([]);
    this.persistAccounts();
    this.persistSettings();
    this.persistRewards();
  }
}
