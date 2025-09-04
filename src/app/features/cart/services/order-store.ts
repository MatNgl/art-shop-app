import { Injectable, inject } from '@angular/core';
import { CartStore } from './cart-store';
import { AuthService } from '../../auth/services/auth';
import { Order, OrderItem, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly cart = inject(CartStore);
  private readonly auth = inject(AuthService);

  private key(): string {
    const uid = this.auth.currentUser$()?.id ?? null;
    return uid ? `orders_user_${uid}` : 'orders_guest';
  }

  private readAll(): Order[] {
    return JSON.parse(localStorage.getItem(this.key()) || '[]');
  }
  private writeAll(list: Order[]) {
    localStorage.setItem(this.key(), JSON.stringify(list));
  }

  listOrders(): Order[] {
    return this.readAll();
  }

  getOrder(id: string): Order | undefined {
    return this.readAll().find((o) => o.id === id);
  }

  updateStatus(id: string, status: OrderStatus): Order | undefined {
    const arr = this.readAll();
    const idx = arr.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    const updated: Order = { ...arr[idx], status };
    arr[idx] = updated;
    this.writeAll(arr);
    return updated;
  }

  /** ---- déjà présent chez toi, rappel (garde ta version si OK) ---- */
  async placeOrder(customer: Order['customer'], payment: Order['payment']): Promise<Order> {
    const totals = this.cart.totals();
    const items: OrderItem[] = this.cart.items().map((i) => ({
      productId: i.productId,
      title: i.title,
      unitPrice: i.unitPrice,
      qty: i.qty,
      imageUrl: i.imageUrl,
    }));
    if (!items.length) throw new Error('Le panier est vide.');
    await new Promise((res) => setTimeout(res, 600));

    const n = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    const id = `ORD-${new Date().getFullYear()}-${n}`;

    const order: Order = {
      id,
      userId: this.auth.currentUser$()?.id ?? null,
      createdAt: new Date().toISOString(),
      items,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      shipping: 0,
      total: totals.total,
      status: 'processing', // on démarre en "en cours de traitement"
      customer,
      payment,
    };

    const all = this.readAll();
    all.unshift(order);
    this.writeAll(all);

    await this.cart.decreaseStockAfterOrder(items);
    this.cart.clear();

    return order;
  }
}
