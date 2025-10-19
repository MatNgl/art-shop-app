import { Injectable, inject, signal } from '@angular/core';
import { SubscriptionService } from './subscription.service';
import { AuthService } from '../../auth/services/auth';
import type {
  MonthlyBox,
  BoxProduct,
  BoxStatus,
  MonthlyBoxStats,
} from '../models/monthly-box.model';

const STORAGE_KEY_BOXES = 'monthly_boxes';

@Injectable({ providedIn: 'root' })
export class MonthlyBoxService {
  private readonly subscriptionSvc = inject(SubscriptionService);
  private readonly authSvc = inject(AuthService);

  private readonly _boxes = signal<MonthlyBox[]>(this.loadBoxes());

  readonly boxes = this._boxes.asReadonly();

  /**
   * Génère les box pour un mois donné (format YYYY-MM)
   * Parcourt tous les abonnés actifs et crée une box s'il n'en existe pas déjà
   */
  async generateBoxesForMonth(month: string): Promise<{ created: number; existing: number }> {
    let created = 0;
    let existing = 0;

    // Parcourir tous les utilisateurs possibles
    const users = await this.authSvc.getAllUsers();

    for (const user of users) {
      const sub = this.subscriptionSvc.getActiveForUser(user.id);

      if (!sub || sub.status !== 'active' || !sub.autoRenew) {
        continue;
      }

      // Vérifier si une box existe déjà pour ce mois
      const existingBox = this._boxes().find((b) => b.userId === user.id && b.month === month);

      if (existingBox) {
        existing++;
        continue;
      }

      // Créer la box
      const plan = this.subscriptionSvc.getPlanById(sub.planId);
      if (!plan) continue;

      // Déterminer le nombre de produits selon le plan
      let expectedProductCount = 1;
      if (plan.slug === 'plus') expectedProductCount = 2;
      if (plan.slug === 'pro') expectedProductCount = 3;

      const box: MonthlyBox = {
        id: `box-${user.id}-${month}`,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        subscriptionId: sub.id,
        planId: sub.planId,
        planName: plan.name,
        month,
        products: [],
        status: 'pending',
        expectedProductCount,
        shippingAddress: user.addresses?.[0]
          ? {
              street: user.addresses[0].street,
              city: user.addresses[0].city,
              zip: user.addresses[0].postalCode,
              country: user.addresses[0].country,
            }
          : {
              street: '',
              city: '',
              zip: '',
              country: 'France',
            },
        createdAt: new Date().toISOString(),
      };

      this._boxes.update((boxes) => [...boxes, box]);
      created++;
    }

    this.saveBoxes();
    return { created, existing };
  }

  /**
   * Récupère les box pour un mois donné
   */
  getBoxesForMonth(month: string): MonthlyBox[] {
    return this._boxes().filter((b) => b.month === month);
  }

  /**
   * Récupère les statistiques pour un mois
   */
  getStatsForMonth(month: string): MonthlyBoxStats {
    const boxes = this.getBoxesForMonth(month);

    const byPlan: Record<number, { planName: string; count: number }> = {};
    const byStatus = {
      pending: 0,
      prepared: 0,
      shipped: 0,
      delivered: 0,
    };

    for (const box of boxes) {
      // Stats par plan
      if (!byPlan[box.planId]) {
        byPlan[box.planId] = { planName: box.planName, count: 0 };
      }
      byPlan[box.planId].count++;

      // Stats par statut
      byStatus[box.status]++;
    }

    return {
      month,
      totalBoxes: boxes.length,
      byPlan,
      byStatus,
    };
  }

  /**
   * Définit les produits d'une box
   */
  setBoxProducts(boxId: string, products: BoxProduct[], adminUserId: number): boolean {
    const box = this._boxes().find((b) => b.id === boxId);
    if (!box) return false;

    this._boxes.update((boxes) =>
      boxes.map((b) =>
        b.id === boxId
          ? {
              ...b,
              products,
              status: 'prepared' as BoxStatus,
              preparedAt: new Date().toISOString(),
              preparedBy: adminUserId,
            }
          : b
      )
    );

    this.saveBoxes();
    return true;
  }

  /**
   * Met à jour le statut d'une box
   */
  updateBoxStatus(boxId: string, status: BoxStatus): boolean {
    const box = this._boxes().find((b) => b.id === boxId);
    if (!box) return false;

    const updates: Partial<MonthlyBox> = { status };

    if (status === 'shipped' && !box.shippedAt) {
      updates.shippedAt = new Date().toISOString();
    }

    if (status === 'delivered' && !box.deliveredAt) {
      updates.deliveredAt = new Date().toISOString();
    }

    this._boxes.update((boxes) => boxes.map((b) => (b.id === boxId ? { ...b, ...updates } : b)));

    this.saveBoxes();
    return true;
  }

  /**
   * Ajoute une note à une box
   */
  addBoxNote(boxId: string, note: string): boolean {
    this._boxes.update((boxes) => boxes.map((b) => (b.id === boxId ? { ...b, notes: note } : b)));

    this.saveBoxes();
    return true;
  }

  /**
   * Récupère une box par ID
   */
  getBoxById(boxId: string): MonthlyBox | undefined {
    return this._boxes().find((b) => b.id === boxId);
  }

  /**
   * Récupère toutes les box d'un utilisateur
   */
  getBoxesByUserId(userId: number): MonthlyBox[] {
    return this._boxes().filter((b) => b.userId === userId);
  }

  /**
   * Supprime les box de plus de 12 mois
   */
  cleanOldBoxes(): void {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    const cutoffMonth = `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(
      2,
      '0'
    )}`;

    this._boxes.update((boxes) => boxes.filter((b) => b.month >= cutoffMonth));
    this.saveBoxes();
  }

  /**
   * Obtient le mois actuel au format YYYY-MM
   */
  getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Obtient le mois suivant au format YYYY-MM
   */
  getNextMonth(): string {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Formate un mois YYYY-MM en texte lisible
   */
  formatMonth(month: string): string {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  // ========== PERSISTENCE ==========

  private loadBoxes(): MonthlyBox[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BOXES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveBoxes(): void {
    try {
      localStorage.setItem(STORAGE_KEY_BOXES, JSON.stringify(this._boxes()));
    } catch (e) {
      console.error('Erreur sauvegarde boxes', e);
    }
  }
}
