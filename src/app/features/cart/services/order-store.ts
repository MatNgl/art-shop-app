import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { CartStore } from './cart-store';
import { AuthService } from '../../auth/services/auth';
import { ProductService } from '../../catalog/services/product';
import { Order, OrderItem, OrderStatus } from '../../orders/models/order.model';
import { ToastService } from '../../../shared/services/toast.service';

function uid(): string {
  const n = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  const y = new Date().getFullYear();
  return `ORD-${y}-${n}`;
}

interface StockValidationError {
  productId: number;
  variantId?: number;
  title: string;
  requested: number;
  available: number;
}

@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly cart = inject(CartStore);
  private readonly auth = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  // --- State (Signals) ---
  private readonly _orders = signal<Order[]>([]);
  readonly orders = this._orders.asReadonly();
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
        const orders = raw ? (JSON.parse(raw) as Order[]) : [];

        // Migration : nettoyer les anciennes variantLabel avec dimensions
        const cleanedOrders = orders.map((order) => ({
          ...order,
          items: order.items.map((item) => {
            if (item.variantLabel && item.variantLabel.includes('—')) {
              return { ...item, variantLabel: item.variantLabel.split('—')[0].trim() };
            }
            return item;
          }),
        }));

        this._orders.set(cleanedOrders);

        if (cleanedOrders.length > 0 && JSON.stringify(orders) !== JSON.stringify(cleanedOrders)) {
          localStorage.setItem(key, JSON.stringify(cleanedOrders));
        }
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

  /**
   * Valide le stock disponible pour tous les items de la commande
   * @returns tableau d'erreurs si stock insuffisant, tableau vide sinon
   */
  private async validateStockAvailability(items: OrderItem[]): Promise<StockValidationError[]> {
    const errors: StockValidationError[] = [];

    for (const item of items) {
      const product = await this.productService.getProductById(item.productId);
      if (!product) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          title: item.title,
          requested: item.qty,
          available: 0,
        });
        continue;
      }

      if (item.variantId) {
        const variant = product.variants?.find((v) => v.id === item.variantId);
        if (!variant) {
          errors.push({
            productId: item.productId,
            variantId: item.variantId,
            title: item.title,
            requested: item.qty,
            available: 0,
          });
          continue;
        }
        if (variant.stock < item.qty) {
          errors.push({
            productId: item.productId,
            variantId: item.variantId,
            title: `${item.title} (${item.variantLabel ?? 'variante'})`,
            requested: item.qty,
            available: variant.stock,
          });
        }
      } else {
        if (product.stock < item.qty) {
          errors.push({
            productId: item.productId,
            title: item.title,
            requested: item.qty,
            available: product.stock,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Décrémente le stock pour tous les items de manière **atomique** :
   * - Phase 1 : validation + calcul des nouveaux stocks (aucune écriture)
   * - Phase 2 : application des mises à jour uniquement si tout est ok
   * @returns true si succès, false si au moins un item est insuffisant
   */
  private async decrementStock(items: OrderItem[]): Promise<boolean> {
    type PlannedUpdate =
      | { type: 'variant'; productId: number; variantId: number; newStock: number }
      | { type: 'product'; productId: number; newStock: number };

    const planned: PlannedUpdate[] = [];

    // Phase 1 — validation et planification
    for (const item of items) {
      const product = await this.productService.getProductById(item.productId);
      if (!product) return false;

      if (item.variantId) {
        const variant = product.variants?.find((v) => v.id === item.variantId);
        if (!variant) return false;
        const newStock = variant.stock - item.qty;
        if (newStock < 0) return false;
        planned.push({
          type: 'variant',
          productId: item.productId,
          variantId: item.variantId,
          newStock,
        });
      } else {
        const newStock = product.stock - item.qty;
        if (newStock < 0) return false;
        planned.push({ type: 'product', productId: item.productId, newStock });
      }
    }

    // Phase 2 — application (toutes les écritures)
    try {
      for (const pu of planned) {
        if (pu.type === 'variant') {
          await this.productService.updateVariantStock(pu.productId, pu.variantId, pu.newStock);
        } else {
          await this.productService.updateProduct(pu.productId, {
            stock: pu.newStock,
            isAvailable: pu.newStock > 0,
          });
        }
      }
      return true;
    } catch (e) {
      // En théorie on ne passe pas ici car tous les checks ont été faits, mais on reste défensif.
      console.error('Erreur inattendue lors de l’application des décrémentations', e);
      return false;
    }
  }

  /**
   * Mise à jour du statut avec gestion automatique du stock
   * - Décrément lors du passage à 'processing' (première validation, atomique)
   * - Rollback lors du passage à 'refused' (si précédemment validée)
   * - Idempotence : pas de double décrément
   */
  async updateStatus(id: string, newStatus: OrderStatus): Promise<Order> {
    const order = this.getOrder(id);
    if (!order) {
      throw new Error(`Commande ${id} introuvable`);
    }

    const oldStatus = order.status;

    // Idempotence
    if (oldStatus === newStatus) {
      return order;
    }

    // Passage à 'processing' → valider + décrémenter atomiquement
    if (newStatus === 'processing' && oldStatus === 'pending') {
      const stockErrors = await this.validateStockAvailability(order.items);
      if (stockErrors.length > 0) {
        const errorMsg = stockErrors
          .map((e) => `${e.title}: demandé ${e.requested}, disponible ${e.available}`)
          .join('; ');
        this.toast.error(`Stock insuffisant: ${errorMsg}`);
        throw new Error(`Stock insuffisant pour valider la commande: ${errorMsg}`);
      }

      const success = await this.decrementStock(order.items);
      if (!success) {
        this.toast.error('Erreur lors de la mise à jour du stock');
        throw new Error('Impossible de décrémenter le stock');
      }

      this.toast.success('Stock mis à jour avec succès');
    }

    // Passage à 'refused' depuis un état validé → restaurer (réincrémenter)
    if (newStatus === 'refused' && (oldStatus === 'processing' || oldStatus === 'accepted')) {
      try {
        for (const item of order.items) {
          const product = await this.productService.getProductById(item.productId);
          if (!product) continue;

          if (item.variantId) {
            const variant = product.variants?.find((v) => v.id === item.variantId);
            if (variant) {
              const restoredStock = variant.stock + item.qty;
              await this.productService.updateVariantStock(
                item.productId,
                item.variantId,
                restoredStock
              );
            }
          } else {
            const restoredStock = product.stock + item.qty;
            await this.productService.updateProduct(item.productId, {
              stock: restoredStock,
              isAvailable: restoredStock > 0,
            });
          }
        }
        this.toast.info('Stock restauré suite au refus de la commande');
      } catch (error) {
        console.error('Erreur lors de la restauration du stock', error);
        this.toast.warning('Erreur partielle lors de la restauration du stock');
      }
    }

    // Mise à jour du statut
    let updated: Order | null = null;
    this._orders.update((arr) =>
      arr.map((o) => {
        if (o.id === id) {
          updated = { ...o, status: newStatus };
          return updated!;
        }
        return o;
      })
    );
    this.persist();

    if (!updated) {
      throw new Error(`Impossible de mettre à jour la commande ${id}`);
    }

    return updated;
  }

  /** Mise à jour des notes internes */
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

  /** Suppression d'une commande */
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
    // Récupération des items depuis le CartStore (avec variantes)
    const items: OrderItem[] = this.cart.items().map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      variantLabel: i.variantLabel,
      title: i.title,
      unitPrice: i.unitPrice,
      qty: i.qty,
      imageUrl: i.imageUrl,
    }));

    if (!items.length) {
      throw new Error('Le panier est vide.');
    }

    // Validation des stocks AVANT création de commande
    const stockErrors = await this.validateStockAvailability(items);
    if (stockErrors.length > 0) {
      const errorMsg = stockErrors
        .map((e) => `${e.title}: demandé ${e.requested}, disponible ${e.available}`)
        .join('\n');
      this.toast.error(`Stock insuffisant:\n${errorMsg}`);
      throw new Error(`Stock insuffisant: ${errorMsg}`);
    }

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
      status: 'pending', // Démarre en 'pending', passage à 'processing' décrémentera le stock
      customer,
      payment,
    };

    // Ajout en tête + persistance
    this._orders.update((arr) => [order, ...arr]);
    this.persist();

    // Mise à jour du stock côté UI panier (ajustement maxQty/etc.)
    await this.cart.decreaseStockAfterOrder(
      items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty }))
    );

    // Vider le panier
    this.cart.clear();

    this.toast.success('Commande créée avec succès');
    return order;
  }
}
