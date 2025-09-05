import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth';
import { CartItem } from '../models/cart.model';
import { Product } from '../../catalog/models/product.model';

export interface CartTotals {
  subtotal: number;
  taxes: number;
  total: number;
  count: number;
}

// TVA simulée (20%)
const TAX_RATE = 0.2;

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly auth = inject(AuthService);

  // État
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  // Id utilisateur (ou null)
  private readonly userId = computed(() => this.auth.currentUser$()?.id ?? null);

  // Clé de stockage liée à l'utilisateur
  private readonly storageKey = computed(() => {
    const uid = this.userId();
    return uid ? `cart:${uid}` : 'cart:guest';
  });

  // Computed
  readonly count = computed(() => this._items().reduce((acc, it) => acc + it.qty, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((acc, it) => acc + it.unitPrice * it.qty, 0)
  );
  readonly taxes = computed(() => +(this.subtotal() * TAX_RATE).toFixed(2));
  readonly total = computed(() => +(this.subtotal() + this.taxes()).toFixed(2));
  readonly empty = computed(() => this._items().length === 0);

  constructor() {
    // Charger quand la clé change (ex: login/logout)
    effect(
      () => {
        const key = this.storageKey();
        try {
          const raw = localStorage.getItem(key);
          const parsed = raw ? (JSON.parse(raw) as unknown) : [];
          this._items.set(Array.isArray(parsed) ? (parsed as CartItem[]) : []);
        } catch {
          this._items.set([]);
        }
      },
      { allowSignalWrites: true }
    );

    // Sauvegarder à chaque changement
    effect(() => {
      const key = this.storageKey();
      localStorage.setItem(key, JSON.stringify(this._items()));
    });
  }

  /** Format prix en EUR (fr-FR) */
  private readonly nf = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  formatPrice(amount: number): string {
    return this.nf.format(amount);
  }

  /** Retourne les totaux du panier */
  totals(): CartTotals {
    const subtotal = this.subtotal();
    const taxes = this.taxes();
    const total = this.total();
    const count = this.count();
    return { subtotal, taxes, total, count };
  }

  /** Ajout depuis un Product + quantité souhaitée */
  add(product: Product, qty = 1): void {
    if (!product) return;
    const max = product.stock ?? 99;
    const id = product.id;

    const snapshot: CartItem = {
      productId: id,
      title: product.title,
      imageUrl: (product.images?.[0] ?? product.imageUrl) || product.imageUrl,
      unitPrice: product.price,
      qty: 0, // sera fixé ci-dessous
      maxStock: max,
      artistName: product.artist?.name,
    };

    this._items.update((arr) => {
      const idx = arr.findIndex((i) => i.productId === id);
      if (idx === -1) {
        const nextQty = Math.min(qty, snapshot.maxStock);
        return [...arr, { ...snapshot, qty: nextQty }];
      } else {
        const current = arr[idx];
        const nextQty = Math.min(current.qty + qty, current.maxStock);
        const copy = [...arr];
        copy[idx] = { ...current, qty: nextQty };
        return copy;
      }
    });
  }

  /** Fixer la quantité pour un produit (0 => supprime) */
  setQty(productId: number, qty: number): void {
    this._items.update((arr) => {
      const idx = arr.findIndex((i) => i.productId === productId);
      if (idx === -1) return arr;
      const current = arr[idx];
      const clamped = Math.max(0, Math.min(qty, current.maxStock));
      if (clamped === 0) return arr.filter((i) => i.productId !== productId);
      const copy = [...arr];
      copy[idx] = { ...current, qty: clamped };
      return copy;
    });
  }

  inc(productId: number): void {
    this._items.update((arr) => {
      const idx = arr.findIndex((i) => i.productId === productId);
      if (idx === -1) return arr;
      const current = arr[idx];
      const next = Math.min(current.qty + 1, current.maxStock);
      const copy = [...arr];
      copy[idx] = { ...current, qty: next };
      return copy;
    });
  }

  dec(productId: number): void {
    this._items.update((arr) => {
      const idx = arr.findIndex((i) => i.productId === productId);
      if (idx === -1) return arr;
      const current = arr[idx];
      const next = Math.max(current.qty - 1, 0);
      if (next === 0) return arr.filter((i) => i.productId !== productId);
      const copy = [...arr];
      copy[idx] = { ...current, qty: next };
      return copy;
    });
  }

  remove(productId: number): void {
    this._items.update((arr) => arr.filter((i) => i.productId !== productId));
  }

  clear(): void {
    this._items.set([]);
  }

  async decreaseStockAfterOrder(items: { productId: number; qty: number }[]) {
    const map = new Map(items.map((i) => [i.productId, i.qty]));

    this._items.update((current) =>
      current.map((ci) =>
        map.has(ci.productId)
          ? { ...ci, maxStock: Math.max(0, ci.maxStock - (map.get(ci.productId) || 0)) }
          : ci
      )
    );
  }

  /** Optionnel : fusionner l’invité dans le compte après login */
  mergeGuestIntoUser(): void {
    const uid = this.userId();
    if (!uid) return;

    const guestKey = 'cart:guest';
    const userKey = `cart:${uid}`;

    try {
      const rawGuest = localStorage.getItem(guestKey);
      const guestItems = rawGuest ? (JSON.parse(rawGuest) as unknown) : [];
      const guest: CartItem[] = Array.isArray(guestItems) ? (guestItems as CartItem[]) : [];
      if (!guest.length) return;

      const current = this._items();
      const map = new Map<number, CartItem>();
      for (const it of current) map.set(it.productId, it);
      for (const g of guest) {
        const existing = map.get(g.productId);
        if (!existing) {
          map.set(g.productId, g);
        } else {
          const nextQty = Math.min(existing.qty + g.qty, existing.maxStock);
          map.set(g.productId, { ...existing, qty: nextQty });
        }
      }
      const merged = Array.from(map.values());
      localStorage.setItem(userKey, JSON.stringify(merged));
      localStorage.removeItem(guestKey);
      this._items.set(merged);
    } catch {
      /* ignore */
    }
  }
}
