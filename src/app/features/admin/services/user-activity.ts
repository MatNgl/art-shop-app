// src/app/features/admin/services/user-activity.service.ts

import { Injectable, signal } from '@angular/core';
import {
  UserActivity,
  ActivityType,
  Order,
  OrderStatus,
  UserFavorite,
  ActivityMetadata,
} from '../../auth/models/user-activity.model';

@Injectable({ providedIn: 'root' })
export class UserActivityService {
  private activities = signal<UserActivity[]>([]);
  private orders = signal<Order[]>([]);
  private favorites = signal<UserFavorite[]>([]);

  constructor() {
    // Initialiser avec des données mock
    this.initializeMockData();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enregistre une nouvelle activité utilisateur
   */
  async logActivity(
    userId: number,
    type: ActivityType,
    action: string,
    details: string,
    metadata?: ActivityMetadata
  ): Promise<UserActivity> {
    await this.delay(100);

    const activity: UserActivity = {
      id: this.generateId(),
      userId,
      type,
      action,
      details,
      metadata,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
    };

    this.activities.update((activities) => [activity, ...activities]);
    return activity;
  }
  /**
   * Récupère l'activité d'un utilisateur
   */
  async getUserActivity(userId: number, limit = 10): Promise<UserActivity[]> {
    await this.delay(200);

    return this.activities()
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Récupère toutes les activités (admin uniquement)
   */
  async getAllActivities(limit = 50): Promise<UserActivity[]> {
    await this.delay(300);

    return this.activities()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Récupère les activités par type
   */
  async getActivitiesByType(type: ActivityType, limit = 20): Promise<UserActivity[]> {
    await this.delay(200);

    return this.activities()
      .filter((activity) => activity.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Récupère les commandes d'un utilisateur
   */
  async getUserOrders(userId: number): Promise<Order[]> {
    await this.delay(300);

    return this.orders()
      .filter((order) => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Récupère une commande par ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    await this.delay(200);

    return this.orders().find((order) => order.id === orderId) || null;
  }

  /**
   * Met à jour le statut d'une commande
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, adminId: number): Promise<Order> {
    await this.delay(400);

    const orders = this.orders();
    const orderIndex = orders.findIndex((order) => order.id === orderId);

    if (orderIndex === -1) {
      throw new Error('Commande introuvable');
    }

    const updatedOrder = {
      ...orders[orderIndex],
      status,
      updatedAt: new Date(),
    };

    this.orders.update((orders) => {
      const copy = [...orders];
      copy[orderIndex] = updatedOrder;
      return copy;
    });

    // Logger l'activité
    await this.logActivity(
      updatedOrder.userId,
      ActivityType.ADMIN_ACTION,
      'Statut de commande modifié',
      `Statut de la commande ${orderId} changé en ${status}`,
      { orderId, newStatus: status, adminId }
    );

    return updatedOrder;
  }

  /**
   * Récupère les favoris d'un utilisateur
   */
  async getUserFavorites(userId: number): Promise<UserFavorite[]> {
    await this.delay(200);

    return this.favorites()
      .filter((favorite) => favorite.userId === userId)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }

  /**
   * Ajoute un produit aux favoris
   */
  async addToFavorites(
    userId: number,
    productId: number,
    productName: string,
    productPrice: number,
    productImage?: string
  ): Promise<UserFavorite> {
    await this.delay(300);

    const favorite: UserFavorite = {
      id: this.generateId(),
      userId,
      productId,
      productName,
      productImage,
      productPrice,
      addedAt: new Date(),
      isAvailable: true,
    };

    this.favorites.update((favorites) => [favorite, ...favorites]);

    // Logger l'activité
    await this.logActivity(
      userId,
      ActivityType.FAVORITE_ADDED,
      'Produit ajouté aux favoris',
      `${productName} ajouté aux favoris`,
      { productId, productName }
    );

    return favorite;
  }

  /**
   * Supprime un produit des favoris
   */
  async removeFromFavorites(favoriteId: string, userId: number): Promise<void> {
    await this.delay(200);

    const favorite = this.favorites().find((f) => f.id === favoriteId);
    if (!favorite) {
      throw new Error('Favori introuvable');
    }

    this.favorites.update((favorites) => favorites.filter((f) => f.id !== favoriteId));

    // Logger l'activité
    await this.logActivity(
      userId,
      ActivityType.FAVORITE_REMOVED,
      'Produit retiré des favoris',
      `${favorite.productName} retiré des favoris`,
      { productId: favorite.productId, productName: favorite.productName }
    );
  }

  /**
   * Récupère les statistiques d'activité d'un utilisateur
   */
  async getUserActivityStats(userId: number): Promise<{
    totalActivities: number;
    loginCount: number;
    orderCount: number;
    favoriteCount: number;
    lastActivity?: Date;
  }> {
    await this.delay(200);

    const userActivities = this.activities().filter((a) => a.userId === userId);
    const userOrders = this.orders().filter((o) => o.userId === userId);
    const userFavorites = this.favorites().filter((f) => f.userId === userId);

    return {
      totalActivities: userActivities.length,
      loginCount: userActivities.filter((a) => a.type === ActivityType.LOGIN).length,
      orderCount: userOrders.length,
      favoriteCount: userFavorites.length,
      lastActivity:
        userActivities.length > 0
          ? new Date(Math.max(...userActivities.map((a) => new Date(a.timestamp).getTime())))
          : undefined,
    };
  }

  /**
   * Nettoie les anciennes activités (garde les 1000 plus récentes)
   */
  async cleanupOldActivities(): Promise<number> {
    await this.delay(300);

    const currentActivities = this.activities();
    const sortedActivities = currentActivities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const toKeep = sortedActivities.slice(0, 1000);
    const removedCount = currentActivities.length - toKeep.length;

    this.activities.set(toKeep);

    return removedCount;
  }

  /**
   * Obtient l'IP client (simulation)
   */
  private getClientIP(): string {
    // En production, ceci serait obtenu depuis le serveur
    const mockIPs = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '192.168.0.10'];
    return mockIPs[Math.floor(Math.random() * mockIPs.length)];
  }

  /**
   * Initialise les données mock pour le développement
   */
  private initializeMockData(): void {
    const now = new Date();
    const users = [2, 3, 4, 5, 6, 7, 8]; // IDs des utilisateurs mock

    // Générer des activités mock
    const activities: UserActivity[] = [];
    users.forEach((userId) => {
      // Activités de connexion
      for (let i = 0; i < 3; i++) {
        activities.push({
          id: this.generateId(),
          userId,
          type: ActivityType.LOGIN,
          action: 'Connexion réussie',
          details: "L'utilisateur s'est connecté avec succès",
          ipAddress: this.getClientIP(),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
      }

      // Mise à jour de profil
      activities.push({
        id: this.generateId(),
        userId,
        type: ActivityType.PROFILE_UPDATE,
        action: 'Profil mis à jour',
        details: 'Modification des informations personnelles',
        metadata: { fields: ['firstName', 'phone'] },
        ipAddress: this.getClientIP(),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      });

      // Ajout de favoris
      activities.push({
        id: this.generateId(),
        userId,
        type: ActivityType.FAVORITE_ADDED,
        action: 'Produit ajouté aux favoris',
        details: 'iPhone 15 Pro ajouté aux favoris',
        metadata: { productId: 123, productName: 'iPhone 15 Pro' },
        ipAddress: this.getClientIP(),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        timestamp: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    });

    // Générer des commandes mock
    const orders: Order[] = [
      {
        id: 'ORD-2024-001',
        userId: 2,
        status: OrderStatus.DELIVERED,
        total: 1299.99,
        currency: 'EUR',
        items: [
          {
            id: 'item-1',
            productId: 123,
            productName: 'iPhone 15 Pro',
            productImage: 'https://via.placeholder.com/100x100/007bff/ffffff?text=iPhone',
            quantity: 1,
            unitPrice: 1299.99,
            totalPrice: 1299.99,
            sku: 'IPH15PRO-128-BLK',
          },
        ],
        shippingAddress: {
          street: '123 Rue de la Paix',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        paymentMethod: {
          id: 'pm-1',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          holder: 'John Doe',
        },
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-05'),
        estimatedDelivery: new Date('2024-12-03'),
        trackingNumber: 'FR123456789',
      },
      {
        id: 'ORD-2024-002',
        userId: 3,
        status: OrderStatus.PROCESSING,
        total: 899.99,
        currency: 'EUR',
        items: [
          {
            id: 'item-2',
            productId: 124,
            productName: 'MacBook Air M2',
            productImage: 'https://via.placeholder.com/100x100/28a745/ffffff?text=MacBook',
            quantity: 1,
            unitPrice: 899.99,
            totalPrice: 899.99,
            sku: 'MBA-M2-256-SLV',
          },
        ],
        shippingAddress: {
          street: '45 Avenue des Arts',
          city: 'Lyon',
          postalCode: '69000',
          country: 'France',
        },
        paymentMethod: {
          id: 'pm-2',
          brand: 'mastercard',
          last4: '5555',
          expMonth: 8,
          expYear: 2026,
          holder: 'Marie Dupont',
        },
        createdAt: new Date('2024-12-10'),
        updatedAt: new Date('2024-12-10'),
      },
      {
        id: 'ORD-2024-003',
        userId: 2,
        status: OrderStatus.SHIPPED,
        total: 279.99,
        currency: 'EUR',
        items: [
          {
            id: 'item-3',
            productId: 125,
            productName: 'AirPods Pro (2ème génération)',
            productImage: 'https://via.placeholder.com/100x100/dc3545/ffffff?text=AirPods',
            quantity: 1,
            unitPrice: 279.99,
            totalPrice: 279.99,
            sku: 'APP-2GEN-WHT',
          },
        ],
        shippingAddress: {
          street: '123 Rue de la Paix',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
        paymentMethod: {
          id: 'pm-1',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          holder: 'John Doe',
        },
        createdAt: new Date('2024-12-15'),
        updatedAt: new Date('2024-12-16'),
        trackingNumber: 'FR987654321',
      },
    ];

    // Générer des favoris mock
    const favorites: UserFavorite[] = [
      {
        id: 'fav-2-1',
        userId: 2,
        productId: 125,
        productName: 'AirPods Pro (2ème génération)',
        productImage: 'https://via.placeholder.com/100x100/dc3545/ffffff?text=AirPods',
        productPrice: 279.99,
        addedAt: new Date('2024-12-08'),
        isAvailable: true,
      },
      {
        id: 'fav-2-2',
        userId: 2,
        productId: 126,
        productName: 'iPad Pro 12.9"',
        productImage: 'https://via.placeholder.com/100x100/6c757d/ffffff?text=iPad',
        productPrice: 1449.99,
        addedAt: new Date('2024-12-05'),
        isAvailable: true,
      },
      {
        id: 'fav-3-1',
        userId: 3,
        productId: 127,
        productName: 'Apple Watch Series 9',
        productImage: 'https://via.placeholder.com/100x100/fd7e14/ffffff?text=Watch',
        productPrice: 449.99,
        addedAt: new Date('2024-12-07'),
        isAvailable: false,
      },
      {
        id: 'fav-4-1',
        userId: 4,
        productId: 128,
        productName: 'Mac Studio',
        productImage: 'https://via.placeholder.com/100x100/343a40/ffffff?text=Mac',
        productPrice: 2299.99,
        addedAt: new Date('2024-12-03'),
        isAvailable: true,
      },
    ];

    // Initialiser les signaux
    this.activities.set(activities);
    this.orders.set(orders);
    this.favorites.set(favorites);
  }

  /**
   * Méthodes utilitaires pour les tests et le debugging
   */

  // Obtenir le nombre total d'activités
  getActivityCount(): number {
    return this.activities().length;
  }

  // Obtenir le nombre total de commandes
  getOrderCount(): number {
    return this.orders().length;
  }

  // Obtenir le nombre total de favoris
  getFavoriteCount(): number {
    return this.favorites().length;
  }

  // Réinitialiser toutes les données (utile pour les tests)
  resetAllData(): void {
    this.activities.set([]);
    this.orders.set([]);
    this.favorites.set([]);
  }

  // Obtenir un résumé des données pour le debugging
  getDataSummary(): {
    activities: number;
    orders: number;
    favorites: number;
    usersWithActivity: number[];
  } {
    const activities = this.activities();
    const uniqueUserIds = [...new Set(activities.map((a) => a.userId))];

    return {
      activities: activities.length,
      orders: this.orders().length,
      favorites: this.favorites().length,
      usersWithActivity: uniqueUserIds.sort((a, b) => a - b),
    };
  }
}
