import { inject, Injectable } from '@angular/core';
import type { Order, OrderStatus } from '../models/order.model';
import { OrderStore } from '../../cart/services/order-store';

@Injectable({ providedIn: 'root' })
export class OrderService {
  // Préfixes de persistance côté OrderStore
  private readonly USER_PREFIX = 'orders_user_';
  private readonly GUEST_KEY = 'orders_guest';
  private readonly store = inject(OrderStore);

  private delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  /** Retourne TOUTES les commandes : persistées (tous users) + seeds.
   * Les persistées prennent le dessus en cas de doublon d'id. */
  async getAll(): Promise<Order[]> {
    await this.delay(120);
    const persisted = this.readAllPersisted();
    const seed = this.seed();

    // Fusion par id (priorité au persisted)
    const map = new Map<string, Order>();
    for (const o of seed) map.set(o.id, o);
    for (const o of persisted) map.set(o.id, o);

    // tri anté-chronologique
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /** Lecture d'une commande par id (persistée prioritaire) */
  async getById(id: string): Promise<Order> {
    await this.delay(80);
    // d’abord dans le stock persistant
    const { order } = this.findPersistedById(id) ?? {};
    if (order) return this.clone(order);

    // sinon dans les seeds
    const s = this.seed().find((o) => o.id === id);
    if (s) return this.clone(s);

    throw new Error('Commande introuvable');
  }

  /** Mise à jour du statut :
   *  - OK si la commande est persistée en localStorage (réelle)
   *  - ERREUR si c’est une seed (lecture seule) */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await this.delay(100);

    const hit = this.findPersistedById(id);
    if (!hit) {
      // Seed: lecture seule
      throw new Error(
        "Cette commande est un jeu de données de démonstration (seed) et n'est pas modifiable."
      );
    }

    const { key, list, index } = hit;
    const updated: Order = { ...list[index], status };
    const copy = [...list];
    copy[index] = updated;
    this.writeList(key, copy);

    return this.clone(updated);
  }

  /** Suppression :
   *  - OK si persistée
   *  - ERREUR si seed */
  async delete(id: string): Promise<void> {
    await this.delay(80);

    const hit = this.findPersistedById(id);
    if (!hit) {
      throw new Error(
        'Cette commande est un jeu de données de démonstration (seed) et ne peut pas être supprimée.'
      );
    }

    const { key, list, index } = hit;
    const next = [...list.slice(0, index), ...list.slice(index + 1)];
    this.writeList(key, next);
  }

  // =========================
  // ===== PERSISTENCE =======
  // =========================

  /** Liste toutes les commandes persistées, tous utilisateurs confondus */
  private readAllPersisted(): Order[] {
    try {
      const allOrders: Order[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? '';
        if (!k) continue;
        if (k.startsWith(this.USER_PREFIX) || k === this.GUEST_KEY) {
          const arr = this.readList(k);
          if (arr.length) allOrders.push(...arr);
        }
      }
      return allOrders;
    } catch {
      return [];
    }
  }

  /** Retourne {key, list, index, order} si l'id est trouvé dans une des clés persistées */
  private findPersistedById(
    id: string
  ): { key: string; list: Order[]; index: number; order: Order } | null {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? '';
        if (!k) continue;
        if (k.startsWith(this.USER_PREFIX) || k === this.GUEST_KEY) {
          const list = this.readList(k);
          const index = list.findIndex((o) => o.id === id);
          if (index !== -1) {
            return { key: k, list, index, order: list[index] };
          }
        }
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  private readList(key: string): Order[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as Order[]) : [];
    } catch {
      return [];
    }
  }

  private writeList(key: string, list: Order[]) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  private clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v));
  }

  /** Mise à jour des notes internes (OK si persistée, sinon erreur) */
  async updateNotes(id: string, notes: string): Promise<Order> {
    await this.delay(100);

    const hit = this.findPersistedById(id);
    if (!hit) {
      throw new Error(
        "Cette commande est un jeu de données de démonstration (seed) et n'est pas modifiable."
      );
    }

    const { key, list, index } = hit;
    const updated: Order = { ...list[index], notes };
    const copy = [...list];
    copy[index] = updated;
    this.writeList(key, copy);

    return this.clone(updated);
  }
  /** Jeux de données de démonstration (lecture seule pour l’admin) */
  private seed(): Order[] {
    const now = new Date();
    return [
      {
        id: 'ORD-2025-0001',
        userId: 2,
        createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
        items: [
          { productId: 1, title: 'Paysage Urbain', unitPrice: 450, qty: 1 },
          { productId: 7, title: 'Gravure Minimaliste', unitPrice: 90, qty: 2 },
        ],
        subtotal: 450 + 90 * 2,
        taxes: 0,
        shipping: 12,
        total: 642,
        status: 'processing',
        customer: {
          firstName: 'Nathan',
          lastName: 'Naegellen',
          email: 'user@example.com',
          phone: '06 55 44 33 22',
          address: {
            street: '10 Avenue des Champs-Élysées',
            city: 'Paris',
            zip: '75008',
            country: 'France',
          },
        },
        payment: { method: 'card', last4: '4242', brand: 'visa' }
      },
      {
        id: 'ORD-2025-0002',
        userId: 3,
        createdAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
        items: [{ productId: 4, title: 'Aquarelle Rivière', unitPrice: 210, qty: 1 }],
        subtotal: 210,
        taxes: 0,
        shipping: 9,
        total: 219,
        status: 'accepted',
        customer: {
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie.dupont@email.com',
          address: {
            street: '45 Avenue des Arts',
            city: 'Lyon',
            zip: '69000',
            country: 'France',
          },
        },
        payment: { method: 'paypal' },
      },
      {
        id: 'ORD-2025-0003',
        userId: 5,
        createdAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
        items: [{ productId: 9, title: 'Sculpture Résine', unitPrice: 560, qty: 1 }],
        subtotal: 560,
        taxes: 0,
        shipping: 15,
        total: 575,
        status: 'pending',
        customer: {
          firstName: 'Sophie',
          lastName: 'Bernard',
          email: 'sophie.bernard@email.com',
          address: { street: '', city: '', zip: '', country: 'France' },
        },
        payment: { method: 'bank' },
      },
      {
        id: 'ORD-2025-0004',
        userId: 6,
        createdAt: new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString(),
        items: [{ productId: 12, title: 'Photo N&B', unitPrice: 120, qty: 3 }],
        subtotal: 360,
        taxes: 0,
        shipping: 9,
        total: 369,
        status: 'delivered',
        customer: {
          firstName: 'Pierre',
          lastName: 'Durand',
          email: 'pierre.durand@email.com',
          address: {
            street: '12 Rue Montmartre',
            city: 'Paris',
            zip: '75018',
            country: 'France',
          },
        },
        payment: { method: 'card', last4: '9999' },
      },
    ];
  }
}
