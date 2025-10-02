import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { AuthService } from '../../auth/services/auth';
import { CartItem } from '../models/cart.model';
import { Product, ProductVariant } from '../../catalog/models/product.model';

export interface CartTotals {
  subtotal: number;
  taxes: number;
  total: number;
  count: number;
}

// TVA simulée (20%)
const TAX_RATE = 0.2;
const CART_STORAGE_VERSION = 'v2';

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

  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  private readonly userId = computed(() => this.auth.currentUser$()?.id ?? null);

  private readonly storageKey = computed(() => {
    const uid = this.userId();
    return uid ? `cart:${uid}:${CART_STORAGE_VERSION}` : `cart:guest:${CART_STORAGE_VERSION}`;
  });

  private lastMergedUserId: number | null = null;

  readonly count = computed(() => this._items().reduce((acc, it) => acc + it.qty, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((acc, it) => acc + it.unitPrice * it.qty, 0)
  );
  readonly taxes = computed(() => +(this.subtotal() * TAX_RATE).toFixed(2));
  readonly total = computed(() => +(this.subtotal() + this.taxes()).toFixed(2));
  readonly empty = computed(() => this._items().length === 0);

  private readonly nf = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  formatPrice(amount: number): string {
    return this.nf.format(amount);
  }

  totals(): CartTotals {
    const subtotal = this.subtotal();
    const taxes = this.taxes();
    const total = this.total();
    const count = this.count();
    return { subtotal, taxes, total, count };
  }

  constructor() {
    effect(() => {
      const key = this.storageKey();
      const saved = safeRead<CartItem[]>(key);
      // Migration : nettoyer les anciennes variantLabel avec dimensions
      const cleaned = Array.isArray(saved)
        ? saved.map((item) => {
            if (item.variantLabel && item.variantLabel.includes('—')) {
              // Extraire juste la taille (ex: "A4 — 21 × 29.7 cm" → "A4")
              return { ...item, variantLabel: item.variantLabel.split('—')[0].trim() };
            }
            return item;
          })
        : [];
      this._items.set(cleaned);
    });

    let persistTimer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const key = this.storageKey();
      const snapshot = this._items();
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => safeWrite(key, snapshot), 120);
    });

    effect(() => {
      const uid = this.userId();
      if (uid && this.lastMergedUserId !== uid) {
        this.mergeGuestIntoUser();
        this.lastMergedUserId = uid;
      }
    });

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

  /** Ajouter un produit avec variante optionnelle */
  add(product: Product, qty = 1, variant?: ProductVariant): void {
    if (!product) return;

    try {
      const productId = product.id;
      const variantId = variant?.id;
      const unitPrice = variant?.price ?? product.price;
      const maxStock = variant?.stock ?? product.stock ?? 99;
      const imageUrl = variant?.imageUrl ?? product.images?.[0] ?? product.imageUrl;

      let variantLabel: string | undefined;
      if (variant) {
        variantLabel = variant.size; // Juste la taille (A3/A4/A5/A6)
      }

      const cartItem: CartItem = {
        productId,
        variantId,
        title: product.title,
        imageUrl,
        variantLabel,
        unitPrice,
        qty: 0, // défini ci-dessous
        maxStock,
      };

      this._items.update((items) => {
        const existingIndex = items.findIndex(
          (item) => item.productId === productId && item.variantId === variantId
        );

        if (existingIndex === -1) {
          const finalQty = Math.min(qty, cartItem.maxStock);
          return [...items, { ...cartItem, qty: finalQty }];
        } else {
          const existing = items[existingIndex];
          const newQty = Math.min(existing.qty + qty, existing.maxStock);
          const updatedItems = [...items];
          updatedItems[existingIndex] = { ...existing, qty: newQty };
          return updatedItems;
        }
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
      throw error;
    }
  }

  /** Compatibilité ascendante : addProduct sans variante */
  addProduct(product: Product, qty = 1): void {
    this.add(product, qty, undefined);
  }

  setQty(productId: number, qty: number, variantId?: number): void {
    this._items.update((arr) => {
      const idx = arr.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
      );
      if (idx === -1) return arr;
      const current = arr[idx];
      const clamped = Math.max(0, Math.min(qty, current.maxStock));
      if (clamped === 0)
        return arr.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        );
      const copy = [...arr];
      copy[idx] = { ...current, qty: clamped };
      return copy;
    });
  }

  inc(productId: number, variantId?: number): void {
    this._items.update((arr) => {
      const idx = arr.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
      );
      if (idx === -1) return arr;
      const current = arr[idx];
      const next = Math.min(current.qty + 1, current.maxStock);
      const copy = [...arr];
      copy[idx] = { ...current, qty: next };
      return copy;
    });
  }

  dec(productId: number, variantId?: number): void {
    this._items.update((arr) => {
      const idx = arr.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
      );
      if (idx === -1) return arr;
      const current = arr[idx];
      const next = Math.max(current.qty - 1, 0);
      if (next === 0)
        return arr.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        );
      const copy = [...arr];
      copy[idx] = { ...current, qty: next };
      return copy;
    });
  }

  remove(productId: number, variantId?: number): void {
    this._items.update((arr) =>
      arr.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  }

  clear(): void {
    this._items.set([]);
    safeWrite(this.storageKey(), []);
  }

  hasProduct(productId: number): boolean {
    return this._items().some((item) => item.productId === productId);
  }

  hasLine(productId: number, variantId?: number): boolean {
    return this._items().some(
      (item) => item.productId === productId && item.variantId === variantId
    );
  }

  getProductQuantity(productId: number): number {
    return this._items()
      .filter((item) => item.productId === productId)
      .reduce((acc, item) => acc + item.qty, 0);
  }

  getLineQuantity(productId: number, variantId?: number): number {
    const item = this._items().find(
      (i) => i.productId === productId && i.variantId === variantId
    );
    return item?.qty ?? 0;
  }

  async decreaseStockAfterOrder(
    items: { productId: number; variantId?: number; qty: number }[]
  ) {
    this._items.update((current) =>
      current.map((ci) => {
        const match = items.find(
          (oi) => oi.productId === ci.productId && oi.variantId === ci.variantId
        );
        if (match) {
          return { ...ci, maxStock: Math.max(0, ci.maxStock - match.qty) };
        }
        return ci;
      })
    );
  }

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
      const map = new Map<string, CartItem>();

      // Clé unique: productId + variantId
      const makeKey = (productId: number, variantId?: number) =>
        `${productId}#${variantId ?? ''}`;

      for (const it of current) map.set(makeKey(it.productId, it.variantId), it);

      for (const g of guest) {
        const key = makeKey(g.productId, g.variantId);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, g);
        } else {
          const nextQty = Math.min(existing.qty + g.qty, existing.maxStock);
          map.set(key, { ...existing, qty: nextQty });
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
