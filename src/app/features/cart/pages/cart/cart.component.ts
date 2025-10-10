import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartStore } from '../../services/cart-store';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { CartPromotionEngine } from '../../../promotions/services/cart-promotion-engine.service';
import { CartPromotionResult } from '../../../promotions/models/promotion.model';
import { CartPromotionDisplayComponent } from '../../../promotions/components/cart-promotion-display.component';
import { PromotionProgressIndicatorComponent } from '../../../promotions/components/promotion-progress-indicator.component';

/**
 * Typage strict de la ligne du panier utilisée dans ce composant.
 * Aligne les propriétés réellement lues dans le template/TS.
 */
export interface CartLine {
  productId: number;
  variantId?: number | null;
  imageUrl: string;
  title: string;
  variantLabel?: string;
  artistName?: string;
  qty: number;
  maxStock: number;
  unitPrice: number;
  /** Optionnel si les promos par catégorie utilisent un slug */
  categorySlug?: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PricePipe,
    CartPromotionDisplayComponent,
    PromotionProgressIndicatorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Mon panier</h1>

      @if (cart.empty()) {
      <div class="bg-white rounded-xl p-8 shadow text-center">
        <p class="text-gray-700 mb-4">Votre panier est vide.</p>
        <a
          routerLink="/catalog"
          class="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Parcourir le catalogue
        </a>
      </div>
      } @else {
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Liste des items -->
        <section class="lg:col-span-2 space-y-4">
          @for (it of cart.items(); track it.productId + '_' + (it.variantId ?? '')) {
          <div class="bg-white rounded-xl shadow p-4 flex items-center gap-4">
            <!-- Image cliquable et focusable -->
            <img
              [src]="it.imageUrl"
              [alt]="it.title"
              class="w-24 h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-blue-600"
              role="link"
              tabindex="0"
              (click)="goToProduct(it.productId)"
              (keydown.enter)="goToProduct(it.productId)"
              (keydown.space)="goToProduct(it.productId)"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <!-- Titre cliquable et focusable -->
                  <h3
                    class="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
                    role="link"
                    tabindex="0"
                    (click)="goToProduct(it.productId)"
                    (keydown.enter)="goToProduct(it.productId)"
                    (keydown.space)="goToProduct(it.productId)"
                  >
                    {{ it.title }}
                  </h3>
                  @if (it.variantLabel) {
                  <p class="text-sm text-gray-600 mt-0.5">{{ it.variantLabel }}</p>
                  } @if (it.artistName) {
                  <p class="text-sm text-gray-500 mt-0.5 truncate">{{ it.artistName }}</p>
                  }
                </div>
                <button
                  type="button"
                  (click)="cart.remove(it.productId, it.variantId)"
                  class="text-sm text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 rounded"
                >
                  Supprimer
                </button>
              </div>

              <div class="mt-3 flex items-center justify-between">
                <div class="inline-flex items-center rounded-full border border-gray-300 bg-white">
                  <button
                    type="button"
                    class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                    (click)="cart.dec(it.productId, it.variantId)"
                    [disabled]="it.qty <= 1"
                  >
                    –</button
                  ><span class="px-4 font-semibold tabular-nums select-none">{{ it.qty }}</span>
                  <button
                    type="button"
                    class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-r-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                    (click)="cart.inc(it.productId, it.variantId)"
                    [disabled]="it.qty >= it.maxStock"
                  >
                    +
                  </button>
                </div>
                <div class="text-right">
                  @if (getItemDiscount(it) > 0) {
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 line-through">
                      {{ it.unitPrice * it.qty | price }}
                    </span>
                    <span class="text-gray-900 font-semibold">
                      {{ getItemDiscountedPrice(it) * it.qty | price }}
                    </span>
                  </div>
                  <div class="text-xs text-green-600">
                    -{{ getItemDiscount(it) * it.qty | price }} ({{
                      getItemDiscountPercentage(it)
                    }}%)
                  </div>
                  } @else {
                  <div class="text-gray-900 font-semibold">
                    {{ it.unitPrice * it.qty | price }}
                  </div>
                  <div class="text-xs text-gray-500">({{ it.unitPrice | price }} / unité)</div>
                  }
                </div>
              </div>
            </div>
          </div>
          }
        </section>

        <!-- Récap -->
        <aside class="space-y-4">
          <!-- Indicateurs de progression -->
          @if (cartPromotions()?.progressIndicators && cartPromotions()!.progressIndicators.length >
          0) {
          <div class="bg-white rounded-xl shadow p-6">
            <app-promotion-progress-indicator
              [progressIndicators]="cartPromotions()!.progressIndicators"
            />
          </div>
          }

          <!-- Promotions actives -->
          @if (cartPromotions()?.appliedPromotions && cartPromotions()!.appliedPromotions.length >
          0) {
          <div class="bg-white rounded-xl shadow p-6">
            <app-cart-promotion-display [promotionResult]="cartPromotions()" />
          </div>
          }

          <!-- Résumé -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="font-semibold text-gray-900 mb-4">Résumé</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-600">Articles ({{ cart.count() }})</dt>
                <dd class="text-gray-900">{{ cart.subtotal() | price }}</dd>
              </div>
              @if (cartPromotions()?.totalDiscount && cartPromotions()!.totalDiscount > 0) {
              <div class="flex justify-between text-green-700">
                <dt class="font-medium">Promotions</dt>
                <dd class="font-medium">-{{ cartPromotions()!.totalDiscount.toFixed(2) }}€</dd>
              </div>
              }
              <div class="flex justify-between">
                <dt class="text-gray-600">TVA (20%)</dt>
                <dd class="text-gray-900">{{ cart.taxes() | price }}</dd>
              </div>
              <div class="flex justify-between pt-2 border-t">
                <dt class="font-semibold text-gray-900">Total</dt>
                <dd class="font-semibold text-gray-900">{{ getFinalTotal() | price }}</dd>
              </div>
            </dl>

            <p class="mt-3 text-xs text-gray-500">
              Taxes incluses. <span class="underline decoration-dotted">Frais d'expédition</span>
              calculés à l'étape de paiement.
            </p>

            <a
              class="mt-4 w-full inline-flex items-center justify-center px-4 py-2 rounded-md
                       bg-blue-600 text-white hover:bg-blue-700"
              [class.opacity-50]="cart.empty()"
              [attr.aria-disabled]="cart.empty() ? true : null"
              routerLink="/checkout"
            >
              Passer commande
            </a>

            <button
              type="button"
              class="mt-2 w-full inline-flex items-center justify-center px-4 py-2 rounded-md
                     bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              (click)="onClearCart()"
            >
              Vider le panier
            </button>
          </div>
        </aside>
      </div>
      }
    </div>
  `,
})
export class CartComponent implements OnInit {
  cart = inject(CartStore);
  private readonly toast = inject(ToastService);
  private readonly promotionEngine = inject(CartPromotionEngine);
  private readonly router = inject(Router);

  cartPromotions = signal<CartPromotionResult | null>(null);

  async ngOnInit(): Promise<void> {
    await this.calculatePromotions();
  }

  async calculatePromotions(): Promise<void> {
    const items = this.cart.items();
    const subtotal = this.cart.subtotal();
    const result = await this.promotionEngine.calculateCartPromotions(items, subtotal);
    this.cartPromotions.set(result);
  }

  getFinalTotal(): number {
    const baseTotal = this.cart.total();
    const discount = this.cartPromotions()?.totalDiscount ?? 0;
    return Math.max(0, baseTotal - discount);
  }

  goToProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  getItemDiscount(item: CartLine): number {
    const promos = this.cartPromotions()?.appliedPromotions || [];
    let totalDiscount = 0;

    for (const applied of promos) {
      const promo = applied.promotion;

      // Vérifier si la promotion s'applique à ce produit
      if (promo.scope === 'product' && promo.productIds?.includes(Number(item.productId))) {
        if (promo.discountType === 'percentage') {
          totalDiscount += (item.unitPrice * promo.discountValue) / 100;
        } else if (promo.discountType === 'fixed') {
          totalDiscount += promo.discountValue;
        }
      } else if (
        promo.scope === 'category' &&
        promo.categorySlugs?.includes(item.categorySlug ?? '')
      ) {
        if (promo.discountType === 'percentage') {
          totalDiscount += (item.unitPrice * promo.discountValue) / 100;
        } else if (promo.discountType === 'fixed') {
          totalDiscount += promo.discountValue;
        }
      } else if (promo.scope === 'site-wide') {
        if (promo.discountType === 'percentage') {
          totalDiscount += (item.unitPrice * promo.discountValue) / 100;
        } else if (promo.discountType === 'fixed') {
          totalDiscount += promo.discountValue;
        }
      }
    }

    return totalDiscount;
  }

  getItemDiscountedPrice(item: CartLine): number {
    return Math.max(0, item.unitPrice - this.getItemDiscount(item));
  }

  getItemDiscountPercentage(item: CartLine): number {
    const discount = this.getItemDiscount(item);
    if (item.unitPrice <= 0 || discount <= 0) return 0;
    return Math.round((discount / item.unitPrice) * 100);
  }

  onClearCart(): void {
    try {
      this.cart.clear();
      this.toast.success('Panier vidé');
    } catch (error) {
      // Erreur HTTP : toastée par l'interceptor
      // Erreur runtime inattendue : toast local
      if (!(error instanceof Error)) {
        this.toast.error('Erreur inattendue lors du vidage du panier.');
      }
    }
  }
}
