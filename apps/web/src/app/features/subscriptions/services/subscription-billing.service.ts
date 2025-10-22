import { Injectable, inject, signal } from '@angular/core';
import { SubscriptionService } from './subscription.service';
import { OrderService } from '../../orders/services/order';
import { AuthService } from '../../auth/services/auth';
import type { PendingSubscriptionOrder, SubscriptionPlanChange } from '../models/subscription.model';
import type { Order } from '../../orders/models/order.model';

const STORAGE_KEY_PLAN_HISTORY = 'subscription_plan_history';
const STORAGE_KEY_PENDING_ORDERS = 'subscription_pending_orders';

@Injectable({ providedIn: 'root' })
export class SubscriptionBillingService {
  private readonly subscriptionSvc = inject(SubscriptionService);
  private readonly orderSvc = inject(OrderService);
  private readonly authSvc = inject(AuthService);

  private readonly _planHistory = signal<SubscriptionPlanChange[]>(this.loadPlanHistory());
  private readonly _pendingOrders = signal<PendingSubscriptionOrder[]>(this.loadPendingOrders());

  /**
   * Génère toutes les commandes mensuelles pour le 1er du mois prochain
   * À appeler manuellement ou via un cron job
   */
  async generateMonthlyOrders(): Promise<{
    success: number;
    failed: number;
    orders: Order[];
  }> {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dueDate = nextMonth.toISOString();

    let successCount = 0;
    let failedCount = 0;
    const generatedOrders: Order[] = [];

    // Récupérer tous les abonnements actifs
    const activeSubscriptions = this.getAllActiveSubscriptions();

    for (const sub of activeSubscriptions) {
      // Vérifier si une commande n'a pas déjà été générée pour ce mois
      const existing = this._pendingOrders().find(
        p => p.subscriptionId === sub.id && p.dueDate === dueDate && p.status === 'generated'
      );

      if (existing) {
        continue; // Déjà généré
      }

      try {
        const plan = this.subscriptionSvc.getPlanById(sub.planId);
        if (!plan) {
          failedCount++;
          continue;
        }

        const user = await this.authSvc.getUserById(sub.userId);
        if (!user) {
          failedCount++;
          continue;
        }

        // Calculer le montant selon le term
        const amount = sub.term === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

        // Créer la commande
        const order: Order = {
          id: `SUB-${sub.id}-${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`,
          userId: sub.userId,
          createdAt: now.toISOString(),
          items: [
            {
              productId: -1, // Pas un produit physique
              title: `Abonnement ${plan.name} - ${sub.term === 'monthly' ? 'Mensuel' : 'Annuel'}`,
              unitPrice: amount,
              qty: 1,
            },
          ],
          subtotal: amount,
          taxes: 0,
          shipping: 0,
          total: amount,
          status: 'pending',
          customer: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.addresses?.[0] ? {
              street: user.addresses[0].street,
              city: user.addresses[0].city,
              zip: user.addresses[0].postalCode,
              country: user.addresses[0].country,
            } : {
              street: '',
              city: '',
              zip: '',
              country: 'France',
            },
          },
          payment: {
            method: 'card',
          },
          orderType: 'subscription',
          subscriptionId: sub.id,
          notes: `Commande automatique pour l'abonnement ${plan.name}`,
        };

        // Sauvegarder la commande
        await this.orderSvc.create(order);
        generatedOrders.push(order);

        // Marquer comme généré
        this.markOrderAsGenerated(sub.id, dueDate, plan.name, amount, sub.term, sub.userId, sub.planId);

        successCount++;
      } catch (error) {
        console.error('Erreur génération commande pour sub', sub.id, error);
        this.markOrderAsFailed(sub.id, dueDate);
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, orders: generatedOrders };
  }

  /**
   * Récupère tous les abonnements actifs
   */
  private getAllActiveSubscriptions() {
    const subs = [];
    // Parcourir tous les utilisateurs possibles (simplifié)
    for (let userId = 1; userId <= 1000; userId++) {
      const sub = this.subscriptionSvc.getActiveForUser(userId);
      if (sub && sub.status === 'active' && sub.autoRenew) {
        subs.push(sub);
      }
    }
    return subs;
  }

  /**
   * Récupère les commandes en attente pour le mois prochain
   */
  getPendingOrdersForNextMonth(): PendingSubscriptionOrder[] {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dueDate = nextMonth.toISOString().split('T')[0];

    return this._pendingOrders().filter(p => p.dueDate.startsWith(dueDate));
  }

  /**
   * Récupère toutes les commandes en attente
   */
  getAllPendingOrders(): PendingSubscriptionOrder[] {
    return this._pendingOrders();
  }

  /**
   * Marque une commande comme générée
   */
  private markOrderAsGenerated(
    subscriptionId: string,
    dueDate: string,
    planName: string,
    amount: number,
    term: 'monthly' | 'annual',
    userId: number,
    planId: number
  ) {
    const pending: PendingSubscriptionOrder = {
      subscriptionId,
      userId,
      planId,
      planName,
      amount,
      term,
      dueDate,
      status: 'generated',
    };

    this._pendingOrders.update(orders => [...orders, pending]);
    this.savePendingOrders();
  }

  /**
   * Marque une commande comme échouée
   */
  private markOrderAsFailed(subscriptionId: string, dueDate: string) {
    this._pendingOrders.update(orders =>
      orders.map(o =>
        o.subscriptionId === subscriptionId && o.dueDate === dueDate
          ? { ...o, status: 'failed' as const }
          : o
      )
    );
    this.savePendingOrders();
  }

  /**
   * Enregistre un changement de plan dans l'historique
   */
  recordPlanChange(change: Omit<SubscriptionPlanChange, 'id'>): void {
    const newChange: SubscriptionPlanChange = {
      ...change,
      id: `chg-${change.userId}-${Date.now()}`,
    };

    this._planHistory.update(history => [...history, newChange]);
    this.savePlanHistory();
  }

  /**
   * Récupère l'historique des changements de plan pour un utilisateur
   */
  getPlanHistoryForUser(userId: number): SubscriptionPlanChange[] {
    return this._planHistory().filter(h => h.userId === userId);
  }

  /**
   * Récupère tout l'historique des changements de plan
   */
  getAllPlanHistory(): SubscriptionPlanChange[] {
    return this._planHistory();
  }

  // ========== PERSISTENCE ==========

  private loadPlanHistory(): SubscriptionPlanChange[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PLAN_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private savePlanHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY_PLAN_HISTORY, JSON.stringify(this._planHistory()));
    } catch (e) {
      console.error('Erreur sauvegarde historique plans', e);
    }
  }

  private loadPendingOrders(): PendingSubscriptionOrder[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PENDING_ORDERS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private savePendingOrders(): void {
    try {
      localStorage.setItem(STORAGE_KEY_PENDING_ORDERS, JSON.stringify(this._pendingOrders()));
    } catch (e) {
      console.error('Erreur sauvegarde commandes pendantes', e);
    }
  }

  /**
   * Nettoie les commandes générées de plus de 3 mois
   */
  cleanOldPendingOrders(): void {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    this._pendingOrders.update(orders =>
      orders.filter(o => new Date(o.dueDate) > threeMonthsAgo)
    );
    this.savePendingOrders();
  }
}
