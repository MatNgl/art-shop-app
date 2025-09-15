import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { CartStore } from './cart-store';
import { AuthService } from '../../auth/services/auth';
import { Order, OrderItem, OrderStatus } from '../../orders/models/order.model';

function uid(): string {
  const n = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  const y = new Date().getFullYear();
  return `ORD-${y}-${n}`;
}

@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly cart = inject(CartStore);
  private readonly auth = inject(AuthService);

  // --- State (Signals) ---
  private readonly _orders = signal<Order[]>([]);
  /** Lecture seule pour les composants */
  readonly orders = this._orders.asReadonly();
  /** Compteur réactif pour le header/badges */
  readonly count = computed(() => this._orders().length);

  // --- Clé de stockage dépendante de l'utilisateur ---
  private readonly userId = computed(() => this.auth.currentUser$()?.id ?? null);
  private readonly storageKey = computed(() =>
    this.userId() ? `orders_user_${this.userId()}` : 'orders_guest'
  );

  constructor() {
    // Recharge les commandes à chaque changement d'utilisateur (clé)
    effect(() => {
      const key = this.storageKey();
      try {
        const raw = localStorage.getItem(key);
        this._orders.set(raw ? (JSON.parse(raw) as Order[]) : []);
      } catch {
        this._orders.set([]);
      }
    });
  }

  // --- Persistance ---
  private persist() {
    localStorage.setItem(this.storageKey(), JSON.stringify(this._orders()));
  }

  // --- API ---
  listOrders(): Order[] {
    return this._orders();
  }

  getOrder(id: string): Order | undefined {
    return this._orders().find((o) => o.id === id);
  }

  updateStatus(id: string, status: OrderStatus): Order | undefined {
    let updated: Order | undefined;
    this._orders.update((arr) =>
      arr.map((o) => {
        if (o.id === id) {
          updated = { ...o, status };
          return updated!;
        }
        return o;
      })
    );
    this.persist();
    return updated;
  }

  /** ➕ Ajout : mettre à jour les notes internes */
  updateNotes(id: string, notes: string): Order | undefined {
    let updated: Order | undefined;
    this._orders.update((arr) =>
      arr.map((o) => {
        if (o.id === id) {
          updated = { ...o, notes };
          return updated!;
        }
        return o;
      })
    );
    this.persist();
    return updated;
  }

  /** ➕ (optionnel mais utile côté admin) : supprimer une commande */
  remove(id: string): void {
    this._orders.update((arr) => arr.filter((o) => o.id !== id));
    this.persist();
  }

  /**
   * Crée une commande à partir du panier courant.
   * @param customer Informations client
   * @param payment  Informations de paiement
   * @param shipping Frais d'expédition (par défaut 0)
   */
  async placeOrder(
    customer: Order['customer'],
    payment: Order['payment'],
    shipping = 0
  ): Promise<Order> {
    // Récupération des items depuis le CartStore
    const items: OrderItem[] = this.cart.items().map((i) => ({
      productId: i.productId,
      title: i.title,
      unitPrice: i.unitPrice,
      qty: i.qty,
      imageUrl: i.imageUrl,
    }));
    if (!items.length) throw new Error('Le panier est vide.');

    // Totaux (utilise les computed du CartStore)
    const subtotal = this.cart.subtotal();
    const taxes = this.cart.taxes();
    const total = this.cart.total() + shipping;

    // petite latence simulée (mock)
    await new Promise((res) => setTimeout(res, 600));

    const order: Order = {
      id: uid(),
      userId: this.auth.currentUser$()?.id ?? null,
      createdAt: new Date().toISOString(),
      items,
      subtotal,
      taxes,
      shipping,
      total,
      status: 'processing', // on démarre en "en cours de traitement"
      customer,
      payment,
    };

    // Ajout en tête + persistance
    this._orders.update((arr) => [order, ...arr]);
    this.persist();

    // Effets côté panier
    await this.cart.decreaseStockAfterOrder(items);
    this.cart.clear();

    return order;
  }
}
