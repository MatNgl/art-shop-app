import { Injectable, computed, inject, signal, effect } from '@angular/core';
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

// --- Persistance ---
const CART_STORAGE_VERSION = 'v1';

function safeRead<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeWrite<T>(key: string, value: T) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

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
    return uid ? `cart:${uid}:${CART_STORAGE_VERSION}` : `cart:guest:${CART_STORAGE_VERSION}`;
  });

  // Pour éviter de re-fusionner à chaque tick
  private lastMergedUserId: number | null = null;

  // Computed
  readonly count = computed(() => this._items().reduce((acc, it) => acc + it.qty, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((acc, it) => acc + it.unitPrice * it.qty, 0)
  );
  readonly taxes = computed(() => +(this.subtotal() * TAX_RATE).toFixed(2));
  readonly total = computed(() => +(this.subtotal() + this.taxes()).toFixed(2));
  readonly empty = computed(() => this._items().length === 0);

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

  /** Helper method to get artist name from Product */
  private getArtistNameFromProduct(p: Product): string {
    return p.artist?.name ?? `Artist #${p.artistId}`;
  }

  constructor() {
    // 1) Charger les items quand la clé change (login/logout)
    effect(() => {
      const key = this.storageKey();
      const saved = safeRead<CartItem[]>(key);
      this._items.set(Array.isArray(saved) ? saved : []);
    });

    // 2) Sauvegarder à chaque changement d'items (avec un petit debounce)
    let persistTimer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const key = this.storageKey();
      const snapshot = this._items();
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => safeWrite(key, snapshot), 120);
    });

    // 3) Fusionner panier guest dans le compte lors du login (une seule fois par uid)
    effect(() => {
      const uid = this.userId();
      if (uid && this.lastMergedUserId !== uid) {
        this.mergeGuestIntoUser(); // ta méthode existante
        this.lastMergedUserId = uid;
      }
    });

    // 4) Synchronisation multi-onglets
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (!e.key) return;
        if (e.key === this.storageKey()) {
          try {
            this._items.set(e.newValue ? (JSON.parse(e.newValue) as CartItem[]) : []);
          } catch {
            /* ignore */
          }
        }
      });
    }
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
      artistName: this.getArtistNameFromProduct(product),
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
    // persister l'état vide tout de suite
    safeWrite(this.storageKey(), []);
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

  /** Fusion invité -> utilisateur après login (utilise les mêmes champs) */
  mergeGuestIntoUser(): void {
    const uid = this.userId();
    if (!uid) return;

    const guestKey = `cart:guest:${CART_STORAGE_VERSION}`;
    const userKey = `cart:${uid}:${CART_STORAGE_VERSION}`;

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
