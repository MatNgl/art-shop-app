import { Injectable, computed, inject, signal, effect } from '@angular/core';

import { AuthService } from '../../auth/services/auth';
import { FormatService } from '../../catalog/services/format.service';
import { Product, ProductVariant } from '../../catalog/models/product.model';

import {
  CartProductItem,
  CartSubscriptionItem,
  CartTotals,
  AddSubscriptionInput,
} from '../models/cart.model';

import { SubscriptionStore } from '../../subscriptions/services/subscription-store';
import { SubscriptionTerm } from '../../subscriptions/models/subscription.model';
import { ToastService } from '../../../shared/services/toast.service';

// TVA simulée (20%)
const TAX_RATE = 0.2;

// ----- Stockage simple (sans version) -----
interface CartPersist {
  products: CartProductItem[];
  subscription: CartSubscriptionItem | null;
}

/* ==========================
 *  Helpers safe read/write
 * ========================== */

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

/* ==========================
 *        Cart Store
 * ========================== */

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly auth = inject(AuthService);
  private readonly formatService = inject(FormatService);
  private readonly subscriptionStore = inject(SubscriptionStore);
  private readonly toast = inject(ToastService);

  // --- État interne (produits + abonnement)
  private readonly _products = signal<CartProductItem[]>([]);
  private readonly _subscription = signal<CartSubscriptionItem | null>(null);

  /** Items "produits" exposés (compat compos existants) */
  readonly items = this._products.asReadonly();

  /** Item d’abonnement (s’il existe) */
  readonly subscriptionItem = this._subscription.asReadonly();

  private readonly userId = computed(() => this.auth.currentUser$()?.id ?? null);

  private readonly storageKey = computed(() => {
    const uid = this.userId();
    return uid ? `cart:${uid}` : `cart:guest`;
  });

  private lastMergedUserId: number | null = null;

  /* ====== Dérivés ====== */

  /** Nombre d’articles : somme des qty produits + 1 si abo présent */
  readonly count = computed(() => {
    const productsCount = this._products().reduce((acc, it) => acc + it.qty, 0);
    const subCount = this._subscription() ? 1 : 0;
    return productsCount + subCount;
  });

  /** Sous-total TTC (inclut l’abonnement si présent) */
  readonly subtotal = computed(() => {
    const productsSum = this._products().reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
    const sub = this._subscription();
    const subSum = sub ? sub.snapshot.priceCharged : 0;
    return productsSum + subSum;
  });

  readonly taxes = computed(() => +(this.subtotal() * TAX_RATE).toFixed(2));
  readonly total = computed(() => +(this.subtotal() + this.taxes()).toFixed(2));
  readonly empty = computed(() => this._products().length === 0 && !this._subscription());

  /* ====== Format monétaire utilitaire (fallback) ====== */
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
    // Rehydratation
    effect(() => {
      const key = this.storageKey();
      const saved = safeRead<CartPersist>(key);
      if (saved && typeof saved === 'object') {
        this._products.set(this.normalizeProducts(saved.products ?? []));
        this._subscription.set(saved.subscription ?? null);
      } else {
        this._products.set([]);
        this._subscription.set(null);
      }
    });

    // Persistance (debounce light)
    let persistTimer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const snapshot: CartPersist = {
        products: this._products(),
        subscription: this._subscription(),
      };
      const key = this.storageKey();
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => safeWrite<CartPersist>(key, snapshot), 120);
    });

    // Fusion panier invité → utilisateur lors de la connexion
    effect(() => {
      const uid = this.userId();
      if (uid && this.lastMergedUserId !== uid) {
        this.mergeGuestIntoUser();
        this.lastMergedUserId = uid;
      }
    });

    // Sync multi-onglets
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (!e.key) return;
        if (e.key === this.storageKey()) {
          try {
            const parsed = e.newValue ? (JSON.parse(e.newValue) as CartPersist) : null;
            if (parsed && typeof parsed === 'object') {
              this._products.set(this.normalizeProducts(parsed.products ?? []));
              this._subscription.set(parsed.subscription ?? null);
            } else {
              this._products.set([]);
              this._subscription.set(null);
            }
          } catch {
            /* ignore */
          }
        }
      });
    }
  }

  /* ==========================
   *      API Produits
   * ========================== */

  /** Ajouter un produit avec variante optionnelle */
  add(product: Product, qty = 1, variant?: ProductVariant): void {
    if (!product) return;

    try {
      const productId = product.id;
      const variantId = variant?.id;
      const unitPrice = variant?.originalPrice ?? product.originalPrice;
      const maxStock = variant?.stock ?? product.stock ?? 99;
      const imageUrl = variant?.imageUrl ?? product.images?.[0] ?? product.imageUrl;

      let variantLabel: string | undefined;
      if (variant?.formatId) {
        const fmt = this.formatService.formats().find((f) => f.id === variant.formatId);
        variantLabel = fmt
          ? `${fmt.name} (${fmt.width} × ${fmt.height} ${fmt.unit})`
          : `Format #${variant.formatId}`;
      }

      const cartItem: CartProductItem = {
        kind: 'product',
        productId,
        variantId,
        title: product.title,
        imageUrl,
        variantLabel,
        unitPrice,
        qty: 0, // défini ci-dessous
        maxStock,
      };

      this._products.update((items) => {
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
    this._products.update((arr) => {
      const idx = arr.findIndex((i) => i.productId === productId && i.variantId === variantId);
      if (idx === -1) return arr;
      const current = arr[idx];
      const clamped = Math.max(0, Math.min(qty, current.maxStock));
      if (clamped === 0)
        return arr.filter((i) => !(i.productId === productId && i.variantId === variantId));
      const copy = [...arr];
      copy[idx] = { ...current, qty: clamped };
      return copy;
    });
  }

  inc(productId: number, variantId?: number): void {
    this._products.update((arr) => {
      const idx = arr.findIndex((i) => i.productId === productId && i.variantId === variantId);
      if (idx === -1) return arr;
      const current = arr[idx];
      const next = Math.min(current.qty + 1, current.maxStock);
      const copy = [...arr];
      copy[idx] = { ...current, qty: next };
      return copy;
    });
  }

  dec(productId: number, variantId?: number): void {
    this._products.update((arr) => {
      const idx = arr.findIndex((i) => i.productId === productId && i.variantId === variantId);
      if (idx === -1) return arr;
      const current = arr[idx];
      const next = Math.max(current.qty - 1, 0);
      if (next === 0)
        return arr.filter((i) => !(i.productId === productId && i.variantId === variantId));
      const copy = [...arr];
      copy[idx] = { ...current, qty: next };
      return copy;
    });
  }

  remove(productId: number, variantId?: number): void {
    this._products.update((arr) =>
      arr.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  }

  /* ==========================
   *     API Abonnement
   * ========================== */

  /** A-t-on déjà un abonnement dans le panier ? */
  hasSubscription(): boolean {
    return !!this._subscription();
  }

  /** Le user a-t-il déjà un abonnement actif ? */
  private userHasActiveSubscription(): boolean {
    const active = this.subscriptionStore.active();
    return !!active && active.status === 'active';
  }

  /**
   * Ajoute un abonnement au panier à partir d’un plan+term.
   * Règles :
   * - refuse si déjà un abo dans le panier
   * - refuse si l’utilisateur a déjà un abo actif
   * - qty = 1, immuable
   * - snapshot créé au moment de l’ajout
   */
  addSubscription(input: AddSubscriptionInput): void {
    const { plan, term } = input;

    if (!this.auth.isAuthenticated()) {
      this.toast.requireAuth('cart', '/subscriptions');
      return;
    }

    if (this.userHasActiveSubscription()) {
      this.toast.warning('Vous avez déjà un abonnement actif.');
      return;
    }

    if (this.hasSubscription()) {
      this.toast.info('Un abonnement est déjà présent dans votre panier.');
      return;
    }

    if (!plan?.isActive || plan.deprecated || plan.visibility !== 'public') {
      this.toast.error("Ce plan n'est pas disponible à l'achat pour le moment.");
      return;
    }

    const price = term === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

    const snapshot = {
      planId: plan.id,
      planSlug: plan.slug,
      planName: plan.name,
      term,
      priceCharged: price,
      monthsOfferedOnAnnual: plan.monthsOfferedOnAnnual,
      loyaltyMultiplier: plan.loyaltyMultiplier,
    } as const;

    const line: CartSubscriptionItem = { kind: 'subscription', snapshot, qty: 1 };

    this._subscription.set(line);
    this.toast.success('Abonnement ajouté au panier.');
  }

  /** Retire l’abonnement du panier (s’il existe) */
  removeSubscription(): void {
    if (this._subscription()) {
      this._subscription.set(null);
      this.toast.info('Abonnement retiré du panier.');
    }
  }

  /** Term du snapshot courant (utile pour UI) */
  getSubscriptionTerm(): SubscriptionTerm | null {
    return this._subscription()?.snapshot.term ?? null;
  }

  /* ==========================
   *   Clear / Merge / Utils
   * ========================== */

  clear(): void {
    this._products.set([]);
    this._subscription.set(null);
    this.persist(); // force write empty
  }

  /** Y a-t-il une ligne produit donnée ? */
  hasProduct(productId: number): boolean {
    return this._products().some((item) => item.productId === productId);
  }

  hasLine(productId: number, variantId?: number): boolean {
    return this._products().some(
      (item) => item.productId === productId && item.variantId === variantId
    );
  }

  getProductQuantity(productId: number): number {
    return this._products()
      .filter((item) => item.productId === productId)
      .reduce((acc, item) => acc + item.qty, 0);
  }

  getLineQuantity(productId: number, variantId?: number): number {
    const item = this._products().find(
      (i) => i.productId === productId && i.variantId === variantId
    );
    return item?.qty ?? 0;
  }

  async decreaseStockAfterOrder(items: { productId: number; variantId?: number; qty: number }[]) {
    // ⚠️ L’abonnement ne consomme pas de stock
    this._products.update((current) =>
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

  /** Fusionne le panier invité dans le panier user (produits + abo) */
  mergeGuestIntoUser(): void {
    const uid = this.userId();
    if (!uid) return;

    const guestKey = `cart:guest`;
    const userKey = `cart:${uid}`;

    try {
      const rawGuest = localStorage.getItem(guestKey);
      const guestParsed = rawGuest ? (JSON.parse(rawGuest) as CartPersist) : null;

      const guestProducts = this.normalizeProducts(guestParsed?.products ?? []);
      const guestSubscription = guestParsed?.subscription ?? null;

      // Charger l’état courant user
      const currentUserRaw = localStorage.getItem(userKey);
      const currentUserParsed = currentUserRaw ? (JSON.parse(currentUserRaw) as CartPersist) : null;

      const currentProducts = this.normalizeProducts(currentUserParsed?.products ?? []);
      const currentSubscription = currentUserParsed?.subscription ?? null;

      // Merge produits (agg qty, clamp maxStock)
      const map = new Map<string, CartProductItem>();
      const makeKey = (pId: number, vId?: number) => `${pId}#${vId ?? ''}`;
      for (const it of currentProducts) map.set(makeKey(it.productId, it.variantId), it);
      for (const g of guestProducts) {
        const key = makeKey(g.productId, g.variantId);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, g);
        } else {
          const nextQty = Math.min(existing.qty + g.qty, existing.maxStock);
          map.set(key, { ...existing, qty: nextQty });
        }
      }

      // Merge abonnement : on garde la ligne user si déjà présente, sinon guest
      const mergedSub = currentSubscription ?? guestSubscription ?? null;

      const merged: CartPersist = {
        products: Array.from(map.values()),
        subscription: mergedSub,
      };

      localStorage.setItem(userKey, JSON.stringify(merged));
      localStorage.removeItem(guestKey);
      this._products.set(merged.products);
      this._subscription.set(merged.subscription);
    } catch {
      /* ignore */
    }
  }

  /* ==========================
   *        Private
   * ========================== */

  /** Normalisation "générique" du label variante (sans notion de version) */
  private normalizeProducts(saved: CartProductItem[]): CartProductItem[] {
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((i) => i && typeof i.productId === 'number')
      .map((item) => {
        let variantLabel = item.variantLabel;
        // Exemple : nettoyer "A4 — 21 × 29.7 cm" → "A4"
        if (variantLabel && variantLabel.includes('—')) {
          variantLabel = variantLabel.split('—')[0].trim();
        }
        return { ...item, kind: 'product', variantLabel };
      });
  }

  /** Forcer une écriture immédiate (utile après clear) */
  private persist(): void {
    const key = this.storageKey();
    const snapshot: CartPersist = {
      products: this._products(),
      subscription: this._subscription(),
    };
    safeWrite<CartPersist>(key, snapshot);
  }
}
