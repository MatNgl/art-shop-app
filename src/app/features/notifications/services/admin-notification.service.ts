import { Injectable, signal, computed, inject } from '@angular/core';
import { AdminNotification, NotificationStats } from '../models/admin-notification.model';
import { ProductService } from '../../catalog/services/product';
import { OrderService } from '../../orders/services/order';
import { SubscriptionService } from '../../subscriptions/services/subscription.service';
import { MonthlyBoxService } from '../../subscriptions/services/monthly-box.service';
import { AuthService } from '../../auth/services/auth';

const STORAGE_KEY = 'admin_notifications';
const CHECK_INTERVAL = 60000; // 1 minute

@Injectable({ providedIn: 'root' })
export class AdminNotificationService {
  private readonly productSvc = inject(ProductService);
  private readonly orderSvc = inject(OrderService);
  private readonly subscriptionSvc = inject(SubscriptionService);
  private readonly boxSvc = inject(MonthlyBoxService);
  private readonly authSvc = inject(AuthService);

  private readonly _notifications = signal<AdminNotification[]>(this.loadFromStorage());
  private lastCheckTimestamp = signal<number>(Date.now());

  readonly notifications = this._notifications.asReadonly();

  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.isRead && !n.dismissedAt).length
  );

  readonly stats = computed<NotificationStats>(() => {
    const notifs = this._notifications().filter(n => !n.dismissedAt);

    const byType: Record<string, number> = {
      out_of_stock: 0,
      low_stock: 0,
      new_order: 0,
      new_subscription: 0,
      pending_orders: 0,
      box_to_prepare: 0,
      payment_failed: 0,
      new_user: 0,
    };

    // Count by type
    notifs.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      total: notifs.length,
      unread: notifs.filter(n => !n.isRead).length,
      bySeverity: {
        critical: notifs.filter(n => n.severity === 'critical').length,
        warning: notifs.filter(n => n.severity === 'warning').length,
        info: notifs.filter(n => n.severity === 'info').length,
      },
      byType: byType as Record<'out_of_stock' | 'low_stock' | 'new_order' | 'new_subscription' | 'pending_orders' | 'box_to_prepare' | 'payment_failed' | 'new_user', number>,
    };
  });

  constructor() {
    // Vérification initiale
    this.checkAll();

    // Vérification périodique
    setInterval(() => this.checkAll(), CHECK_INTERVAL);

    // DEMO: Ajouter quelques notifications de test au premier chargement
    this.addDemoNotifications();
  }

  /**
   * DEMO: Ajouter des notifications de test
   * À SUPPRIMER en production
   */
  private addDemoNotifications(): void {
    const now = new Date().toISOString();

    // Stock faible
    if (!this.exists('demo_low_stock')) {
      this.addNotification({
        id: 'demo_low_stock',
        type: 'low_stock',
        severity: 'warning',
        title: 'Stock faible',
        message: 'La Joconde - 3 unités restantes',
        icon: 'fa-solid fa-box-open',
        color: 'orange',
        relatedEntityId: 1,
        relatedEntityType: 'product',
        actionUrl: '/admin/products/1/edit',
        metadata: {
          productName: 'La Joconde',
          stockQuantity: 3,
        },
        createdAt: now,
        isRead: false,
      });
    }

    // Nouvelle commande
    if (!this.exists('demo_new_order')) {
      this.addNotification({
        id: 'demo_new_order',
        type: 'new_order',
        severity: 'info',
        title: 'Nouvelle commande',
        message: 'Commande #42 - 150€ (3 articles)',
        icon: 'fa-solid fa-cart-shopping',
        color: 'blue',
        relatedEntityId: 42,
        relatedEntityType: 'order',
        actionUrl: '/admin/orders/42',
        metadata: {
          orderTotal: 150,
          orderItemCount: 3,
        },
        createdAt: now,
        isRead: false,
      });
    }

    // Rupture de stock
    if (!this.exists('demo_out_of_stock')) {
      this.addNotification({
        id: 'demo_out_of_stock',
        type: 'out_of_stock',
        severity: 'critical',
        title: 'Rupture de stock',
        message: 'Le Cri est en rupture de stock',
        icon: 'fa-solid fa-triangle-exclamation',
        color: 'red',
        relatedEntityId: 2,
        relatedEntityType: 'product',
        actionUrl: '/admin/products/2/edit',
        metadata: {
          productName: 'Le Cri',
          stockQuantity: 0,
        },
        createdAt: now,
        isRead: false,
      });
    }
  }

  /**
   * Vérifier toutes les notifications
   */
  async checkAll(): Promise<void> {
    await Promise.all([
      this.checkStockLevels(),
      this.checkNewOrders(),
      this.checkNewSubscriptions(),
      this.checkBoxesToPrepare(),
      this.checkPaymentFailures(),
      this.checkNewUsers(),
    ]);

    this.lastCheckTimestamp.set(Date.now());
  }

  /**
   * Vérifier les niveaux de stock
   */
  private async checkStockLevels(): Promise<void> {
    try {
      const products = await this.productSvc.getAllProducts();
      const now = new Date().toISOString();

      products.forEach(product => {
        const stock = product.stock ?? 0;

        // Rupture de stock
        if (stock === 0) {
          const existingId = `out_of_stock_${product.id}`;
          if (!this.exists(existingId)) {
            this.addNotification({
              id: existingId,
              type: 'out_of_stock',
              severity: 'critical',
              title: 'Rupture de stock',
              message: `${product.title} est en rupture de stock`,
              icon: 'fa-solid fa-triangle-exclamation',
              color: 'red',
              relatedEntityId: product.id,
              relatedEntityType: 'product',
              actionUrl: `/admin/products/${product.id}/edit`,
              metadata: {
                productName: product.title,
                stockQuantity: 0,
              },
              createdAt: now,
              isRead: false,
            });
          }
        } else if (stock > 0 && stock < 5) {
          // Stock faible
          const existingId = `low_stock_${product.id}`;
          if (!this.exists(existingId)) {
            this.addNotification({
              id: existingId,
              type: 'low_stock',
              severity: 'warning',
              title: 'Stock faible',
              message: `${product.title} - ${stock} unité(s) restante(s)`,
              icon: 'fa-solid fa-box-open',
              color: 'orange',
              relatedEntityId: product.id,
              relatedEntityType: 'product',
              actionUrl: `/admin/products/${product.id}/edit`,
              metadata: {
                productName: product.title,
                stockQuantity: stock,
              },
              createdAt: now,
              isRead: false,
            });
          }
        } else {
          // Si stock > 5, supprimer les notifications de stock faible
          this.removeNotification(`low_stock_${product.id}`);
          this.removeNotification(`out_of_stock_${product.id}`);
        }
      });
    } catch (error) {
      console.error('Erreur vérification stock:', error);
    }
  }

  /**
   * Vérifier les nouvelles commandes
   */
  private async checkNewOrders(): Promise<void> {
    try {
      const orders = await this.orderSvc.getAll();
      const recentOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt).getTime();
        const lastCheck = this.lastCheckTimestamp();
        return orderDate > lastCheck && order.status === 'pending';
      });

      recentOrders.forEach(order => {
        const notifId = `new_order_${order.id}`;
        if (!this.exists(notifId)) {
          const itemCount = order.items.reduce((sum, item) => sum + (item.qty || 1), 0);

          this.addNotification({
            id: notifId,
            type: 'new_order',
            severity: 'info',
            title: 'Nouvelle commande',
            message: `Commande #${order.id} - ${order.total}€ (${itemCount} article${itemCount > 1 ? 's' : ''})`,
            icon: 'fa-solid fa-cart-shopping',
            color: 'blue',
            relatedEntityId: order.id,
            relatedEntityType: 'order',
            actionUrl: `/admin/orders/${order.id}`,
            metadata: {
              orderTotal: order.total,
              orderItemCount: itemCount,
            },
            createdAt: order.createdAt,
            isRead: false,
          });
        }
      });
    } catch (error) {
      console.error('Erreur vérification commandes:', error);
    }
  }

  /**
   * Vérifier les nouveaux abonnements
   */
  private async checkNewSubscriptions(): Promise<void> {
    try {
      // La méthode getAll() n'existe pas, donc on ne vérifie pas les abonnements pour le moment
      // TODO: Ajouter une méthode getAllUserSubscriptions() dans SubscriptionService
      // Pour l'instant, cette fonctionnalité est désactivée
    } catch (error) {
      console.error('Erreur vérification abonnements:', error);
    }
  }

  /**
   * Vérifier les box mensuelles à préparer
   */
  private async checkBoxesToPrepare(): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const boxes = this.boxSvc.getBoxesForMonth(currentMonth);
      const pendingBoxes = boxes.filter(box => box.status === 'pending');

      if (pendingBoxes.length > 0) {
        const notifId = `boxes_to_prepare_${currentMonth}`;
        if (!this.exists(notifId)) {
          this.addNotification({
            id: notifId,
            type: 'box_to_prepare',
            severity: 'warning',
            title: 'Box mensuelles à préparer',
            message: `${pendingBoxes.length} box à préparer pour ${currentMonth}`,
            icon: 'fa-solid fa-box-open',
            color: 'yellow',
            relatedEntityType: 'box',
            actionUrl: `/admin/subscriptions/orders`,
            metadata: {
              boxMonth: currentMonth,
              boxCount: pendingBoxes.length,
            },
            createdAt: new Date().toISOString(),
            isRead: false,
          });
        }
      }
    } catch (error) {
      console.error('Erreur vérification box:', error);
    }
  }

  /**
   * Vérifier les échecs de paiement
   */
  private async checkPaymentFailures(): Promise<void> {
    // Mock - à implémenter avec vraie logique de paiement
    // Pour le moment, on ne génère pas de notifications
  }

  /**
   * Vérifier les nouveaux utilisateurs
   */
  private async checkNewUsers(): Promise<void> {
    try {
      const users = await this.authSvc.getAllUsers();
      const recentUsers = users.filter(user => {
        const userDate = new Date(user.createdAt || Date.now()).getTime();
        const lastCheck = this.lastCheckTimestamp();
        return userDate > lastCheck;
      });

      recentUsers.forEach(user => {
        const notifId = `new_user_${user.id}`;
        if (!this.exists(notifId)) {
          const createdAt = user.createdAt
            ? (user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date(user.createdAt).toISOString())
            : new Date().toISOString();

          this.addNotification({
            id: notifId,
            type: 'new_user',
            severity: 'info',
            title: 'Nouveau compte',
            message: `${user.firstName} ${user.lastName} a créé un compte`,
            icon: 'fa-solid fa-user-plus',
            color: 'green',
            relatedEntityId: user.id,
            relatedEntityType: 'user',
            actionUrl: `/admin/users/${user.id}`,
            metadata: {
              userName: `${user.firstName} ${user.lastName}`,
            },
            createdAt,
            isRead: false,
          });
        }
      });
    } catch (error) {
      console.error('Erreur vérification utilisateurs:', error);
    }
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    this.saveToStorage();
  }

  /**
   * Marquer toutes comme lues
   */
  markAllAsRead(): void {
    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, isRead: true }))
    );
    this.saveToStorage();
  }

  /**
   * Ignorer une notification
   */
  dismiss(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, dismissedAt: new Date().toISOString() } : n
      )
    );
    this.saveToStorage();
  }

  /**
   * Supprimer les notifications ignorées
   */
  clearDismissed(): void {
    this._notifications.update(notifications =>
      notifications.filter(n => !n.dismissedAt)
    );
    this.saveToStorage();
  }

  /**
   * Récupérer les notifications actives (non ignorées)
   */
  getActive(): AdminNotification[] {
    return this._notifications().filter(n => !n.dismissedAt);
  }

  /**
   * Récupérer les notifications non lues
   */
  getUnread(): AdminNotification[] {
    return this._notifications().filter(n => !n.isRead && !n.dismissedAt);
  }

  // ========== PRIVATE HELPERS ==========

  private exists(notificationId: string): boolean {
    return this._notifications().some(n => n.id === notificationId && !n.dismissedAt);
  }

  private addNotification(notification: AdminNotification): void {
    this._notifications.update(notifications => [notification, ...notifications]);
    this.saveToStorage();
  }

  private removeNotification(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );
    this.saveToStorage();
  }

  private loadFromStorage(): AdminNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._notifications()));
    } catch (e) {
      console.error('Erreur sauvegarde notifications:', e);
    }
  }
}
