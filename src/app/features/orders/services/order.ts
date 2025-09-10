import { Injectable, signal } from '@angular/core';
import type { Order, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly orders = signal<Order[]>(this.seed());

  private delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  async getAll(): Promise<Order[]> {
    await this.delay(250);
    return JSON.parse(JSON.stringify(this.orders()));
  }

  async getById(id: string): Promise<Order> {
    await this.delay(150);
    const found = this.orders().find((o) => o.id === id);
    if (!found) throw new Error('Commande introuvable');
    return JSON.parse(JSON.stringify(found));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await this.delay(250);
    const arr = this.orders();
    const idx = arr.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Commande introuvable');

    const updated: Order = {
      ...arr[idx],
      status,
      // on laisse createdAt tel quel (ISO string)
    };

    this.orders.update((list) => {
      const copy = [...list];
      copy[idx] = updated;
      return copy;
    });

    return JSON.parse(JSON.stringify(updated));
  }

  async updateNotes(id: string, notes: string): Promise<Order> {
    await this.delay(200);
    const arr = this.orders();
    const idx = arr.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Commande introuvable');

    const updated: Order = { ...arr[idx] /* ajoute/maj d'un champ libre si souhaité */ };
    // Si tu veux réellement stocker des notes côté modèle, ajoute `notes?: string;` dans ton interface Order
    // @ts-expect-error champ non typé dans le modèle d'origine (optionnel)
    updated.notes = notes;

    this.orders.update((list) => {
      const copy = [...list];
      copy[idx] = updated;
      return copy;
    });

    return JSON.parse(JSON.stringify(updated));
  }

  async delete(id: string): Promise<void> {
    await this.delay(200);
    this.orders.update((list) => list.filter((o) => o.id !== id));
  }

  // --- Données mock compatibles avec ton modèle ---
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
        payment: { method: 'card', last4: '4242' },
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
