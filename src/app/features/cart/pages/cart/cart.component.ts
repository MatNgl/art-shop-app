import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartStore } from '../../services/cart-store';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { CartPromotionEngine } from '../../../promotions/services/cart-promotion-engine.service';
import { CartPromotionResult } from '../../../promotions/models/promotion.model';
import { CartPromotionDisplayComponent } from '../../../promotions/components/cart-promotion-display.component';
import { PromotionProgressIndicatorComponent } from '../../../promotions/components/promotion-progress-indicator.component';
import { CartFidelityPreviewComponent } from '../../../fidelity/components/cart-fidelity-preview/cart-fidelity-preview.component';

// Fidélité
import { FidelityStore } from '../../../fidelity/services/fidelity-store';
import { FidelityCalculatorService } from '../../../fidelity/services/fidelity-calculator.service';
import { AuthService } from '../../../auth/services/auth';
import { ConfirmService } from '../../../../shared/services/confirm.service';

// Abonnement
import { SubscriptionUpsellBannerComponent } from '../../../subscriptions/components/subscription-upsell-banner/subscription-upsell-banner.component';
import { CartSubscriptionDisplayComponent } from './cart-subscription-display.component';
import { SubscriptionStore } from '../../../subscriptions/services/subscription-store';

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
  categorySlug?: string;
}

interface FidelityUi {
  type: 'amount' | 'percent' | 'shipping' | 'gift';
  amount?: number;
  percent?: number;
  cap?: number | null;
  freeShipping?: boolean;
  label?: string | null;
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
    CartFidelityPreviewComponent,
    SubscriptionUpsellBannerComponent,
    CartSubscriptionDisplayComponent,
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
          <!-- Abonnement (si présent) -->
          @if (cart.subscriptionItem()) {
            <app-cart-subscription-display
              [subscription]="cart.subscriptionItem()!"
              (remove)="cart.removeSubscription()"
            />
          }

          <!-- Produits -->
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
                  @if (isItemFree(it)) {
                  <!-- Produit offert (100% de réduction) -->
                  <div class="flex items-center gap-2 justify-end">
                    <span class="text-xs text-gray-500 line-through">
                      {{ it.unitPrice * it.qty | price }}
                    </span>
                    <span
                      class="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md"
                    >
                      OFFERT
                    </span>
                  </div>
                  <div class="text-xs text-green-600 font-medium mt-1">
                    {{ getItemPromotionLabel(it) }}
                  </div>
                  } @else if (getItemDiscount(it) > 0) {
                  <!-- Produit avec réduction partielle -->
                  <div class="flex items-center gap-2 justify-end">
                    <span class="text-xs text-gray-500 line-through">
                      {{ it.unitPrice * it.qty | price }}
                    </span>
                    <span class="text-gray-900 font-semibold">
                      {{ getItemDiscountedPrice(it) * it.qty | price }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 justify-end mt-1">
                    <span
                      class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded"
                    >
                      {{ getItemPromotionBadge(it) }}
                    </span>
                    <span class="text-xs text-gray-600">{{ getItemPromotionLabel(it) }}</span>
                  </div>
                  } @else {
                  <!-- Prix normal -->
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
          <!-- Upsell banner (auto-hidden si non pertinent) -->
          <app-subscription-upsell-banner />

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

          <!-- Fidélité preview -->
          <app-cart-fidelity-preview
            [cartAmountAfterDiscounts]="cart.subtotal() - (cartPromotions()?.totalDiscount ?? 0)"
          />

          <!-- Résumé -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="font-semibold text-gray-900 mb-4">Résumé</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-600">Articles ({{ cart.count() }})</dt>
                <dd class="text-gray-900">{{ cart.subtotal() | price }}</dd>
              </div>

              @if (cartPromotions()?.appliedPromotions && cartPromotions()!.appliedPromotions.length
              > 0) {
              <div class="py-2 border-t border-gray-100">
                <div class="text-xs font-medium text-gray-700 mb-2">Promotions actives :</div>
                @for (promo of cartPromotions()!.appliedPromotions; track promo.promotion.id) {
                <div class="flex justify-between items-start text-xs mb-1.5">
                  <dt class="text-green-700 flex-1 pr-2">
                    <span class="font-medium">{{ promo.promotion.name }}</span>
                    @if (promo.promotion.code) {
                    <span class="ml-1 text-gray-500">({{ promo.promotion.code }})</span>
                    }
                    <div class="text-gray-600 text-[11px] mt-0.5">{{ promo.message }}</div>
                  </dt>
                  <dd class="text-green-700 font-medium whitespace-nowrap">
                    -{{ promo.discountAmount.toFixed(2) }}€
                  </dd>
                </div>
                }
              </div>
              } @if (cartPromotions()?.totalDiscount && cartPromotions()!.totalDiscount > 0) {
              <div class="flex justify-between text-green-700 font-medium">
                <dt>Total promotions</dt>
                <dd>-{{ cartPromotions()!.totalDiscount.toFixed(2) }}€</dd>
              </div>
              } @if (uiReward()) {
              <div class="flex justify-between text-purple-700 font-medium">
                <dt class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center rounded-full bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5"
                  >
                    Récompense fidélité
                  </span>
                  <ng-container [ngSwitch]="uiReward()!.type">
                    <span *ngSwitchCase="'amount'">-{{ uiReward()!.amount | price }}</span>
                    <span *ngSwitchCase="'percent'">
                      -{{ uiReward()!.percent }}%
                      <ng-container *ngIf="uiReward()!.cap !== null">
                        <span class="ml-1 text-xs text-gray-500"
                          >(cap {{ uiReward()!.cap | price }})</span
                        >
                      </ng-container>
                      <span class="ml-1">= {{ uiReward()!.amount | price }}</span>
                    </span>
                    <span *ngSwitchCase="'shipping'">Livraison offerte</span>
                    <span *ngSwitchCase="'gift'">Cadeau : {{ uiReward()!.label ?? '—' }}</span>
                  </ng-container>
                </dt>

                <dd
                  class="whitespace-nowrap"
                  *ngIf="uiReward()!.type === 'amount' || uiReward()!.type === 'percent'"
                >
                  -{{ uiReward()!.amount | price }}
                </dd>
              </div>

              <div class="flex justify-end">
                <button
                  type="button"
                  (click)="onCancelReward()"
                  class="mt-1 text-xs underline underline-offset-2 text-purple-700 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-600 rounded"
                  [attr.aria-label]="'Annuler la récompense fidélité appliquée'"
                >
                  Annuler la récompense
                </button>
              </div>
              }

              <div class="flex justify-between pt-2 border-t">
                <dt class="font-semibold text-gray-900">Total</dt>
                <dd class="font-semibold text-gray-900">{{ getFinalTotal() | price }}</dd>
              </div>

              @if (earnedPoints() > 0) {
                <div class="flex justify-between mt-3 pt-3 border-t border-purple-100">
                  <dt class="text-sm text-purple-700 font-medium flex items-center gap-1.5">
                    <i class="fa-solid fa-star"></i>
                    Points fidélité
                  </dt>
                  <dd class="text-purple-700 font-bold">
                    {{ getFinalTotal() | number:'1.0-0' }} (+{{ earnedPoints() }})
                  </dd>
                </div>
              }
            </dl>

            <p class="mt-3 text-xs text-gray-500">
              Prix total.
              <span class="underline decoration-dotted">Frais d'expédition</span>
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

  // Fidélité
  private readonly fidelity = inject(FidelityStore);
  private readonly fidelityCalc = inject(FidelityCalculatorService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);

  // Abonnements
  readonly subscriptionStore = inject(SubscriptionStore);

  cartPromotions = signal<CartPromotionResult | null>(null);

  // Points de fidélité gagnés sur cette commande
  earnedPoints = computed(() => {
    const subtotal = this.cart.subtotal();
    const promoDiscount = this.cartPromotions()?.totalDiscount ?? 0;
    const baseForPoints = Math.max(0, subtotal - promoDiscount);
    const activeSub = this.subscriptionStore.active();
    const multiplier = (activeSub && activeSub.status === 'active') ? activeSub.appliedMultiplier : 1;
    return Math.floor(baseForPoints * 0.05 * multiplier);
  });

  appliedReward = signal<ReturnType<FidelityStore['getAppliedReward']> | null>(null);
  fidelityDiscount = signal<{
    amount: number;
    freeShipping?: boolean;
    percent?: number;
    cap?: number;
  } | null>(null);
  uiReward = signal<FidelityUi | null>(null);

  readonly syncFidelity = effect(() => {
    const userId = this.auth.currentUser$()?.id ?? null;
    const subtotal = this.cart.subtotal();
    const promoDiscount = this.cartPromotions()?.totalDiscount ?? 0;
    const baseForFidelity = Math.max(0, subtotal - promoDiscount);

    const reward = userId ? this.fidelity.getAppliedReward(userId) : null;
    this.appliedReward.set(reward);

    if (!reward) {
      this.fidelityDiscount.set(null);
      this.uiReward.set(null);
      return;
    }

    const d = this.fidelityCalc.applyReward(reward, baseForFidelity) ?? null;

    this.fidelityDiscount.set(
      d
        ? {
            amount: d.amount ?? 0,
            freeShipping: !!d.freeShipping,
            percent: d.percent,
            cap: d.cap,
          }
        : null
    );

    switch (reward.type) {
      case 'amount':
        this.uiReward.set({ type: 'amount', amount: this.fidelityDiscount()?.amount ?? 0 });
        break;
      case 'percent':
        this.uiReward.set({
          type: 'percent',
          amount: this.fidelityDiscount()?.amount ?? 0,
          percent: this.fidelityDiscount()?.percent,
          cap: this.fidelityDiscount()?.cap ?? null,
        });
        break;
      case 'shipping':
        this.uiReward.set({
          type: 'shipping',
          freeShipping: !!this.fidelityDiscount()?.freeShipping,
        });
        break;
      case 'gift':
        this.uiReward.set({ type: 'gift', label: reward.label ?? null });
        break;
      default:
        this.uiReward.set(null);
    }
  });

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
    const subtotal = this.cart.subtotal();
    const promoDiscount = this.cartPromotions()?.totalDiscount ?? 0;
    const fidelityAmount = this.fidelityDiscount()?.amount ?? 0;
    return Math.max(0, subtotal - promoDiscount - fidelityAmount);
  }

  goToProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  // … (tout le reste inchangé : getItemDiscount, etc.)

  getItemDiscount(item: CartLine): number {
    const promos = this.cartPromotions()?.appliedPromotions || [];
    let totalDiscount = 0;

    for (const applied of promos) {
      const promo = applied.promotion;
      const isAffectedByPromo = applied.affectedItems?.includes(Number(item.productId)) ?? false;

      if (promo.scope === 'buy-x-get-y' && promo.buyXGetYConfig && isAffectedByPromo) {
        const config = promo.buyXGetYConfig;
        const cartItems = this.cart.items();
        const eligibleItems = cartItems.filter((it) =>
          applied.affectedItems?.includes(Number(it.productId))
        );
        const totalQty = eligibleItems.reduce((sum, it) => sum + it.qty, 0);
        const sets = Math.floor(totalQty / (config.buyQuantity + config.getQuantity));
        let itemsToGift = sets * config.getQuantity;
        if (itemsToGift === 0) continue;

        const sortedItems = [...eligibleItems].sort((a, b) =>
          config.applyOn === 'cheapest' ? a.unitPrice - b.unitPrice : b.unitPrice - a.unitPrice
        );
        for (const cartItem of sortedItems) {
          if (itemsToGift === 0) break;
          if (cartItem.productId === item.productId && cartItem.variantId === item.variantId) {
            const qtyToGift = Math.min(itemsToGift, cartItem.qty);
            totalDiscount += (item.unitPrice * qtyToGift) / item.qty;
            break;
          }
          itemsToGift -= Math.min(itemsToGift, cartItem.qty);
        }
        continue;
      }

      if (
        isAffectedByPromo &&
        promo.scope === 'product' &&
        promo.productIds?.includes(Number(item.productId))
      ) {
        if (promo.discountType === 'percentage')
          totalDiscount += (item.unitPrice * promo.discountValue) / 100;
        else if (promo.discountType === 'fixed') totalDiscount += promo.discountValue;
      } else if (
        isAffectedByPromo &&
        promo.scope === 'category' &&
        promo.categorySlugs?.includes(item.categorySlug ?? '')
      ) {
        if (promo.discountType === 'percentage')
          totalDiscount += (item.unitPrice * promo.discountValue) / 100;
        else if (promo.discountType === 'fixed') totalDiscount += promo.discountValue;
      } else if (isAffectedByPromo && promo.scope === 'site-wide') {
        if (promo.discountType === 'percentage')
          totalDiscount += (item.unitPrice * promo.discountValue) / 100;
        else if (promo.discountType === 'fixed') totalDiscount += promo.discountValue;
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

  isItemFree(item: CartLine): boolean {
    const discount = this.getItemDiscount(item);
    return discount >= item.unitPrice;
  }

  getItemPromotionBadge(item: CartLine): string {
    const promos = this.cartPromotions()?.appliedPromotions || [];
    for (const applied of promos) {
      const promo = applied.promotion;
      if (promo.scope === 'product' && promo.productIds?.includes(Number(item.productId))) {
        return promo.discountType === 'percentage'
          ? `-${promo.discountValue}%`
          : `-${promo.discountValue}€`;
      } else if (
        promo.scope === 'category' &&
        promo.categorySlugs?.includes(item.categorySlug ?? '')
      ) {
        return promo.discountType === 'percentage'
          ? `-${promo.discountValue}%`
          : `-${promo.discountValue}€`;
      } else if (promo.scope === 'site-wide') {
        return promo.discountType === 'percentage'
          ? `-${promo.discountValue}%`
          : `-${promo.discountValue}€`;
      }
    }
    return '';
  }

  getItemPromotionLabel(item: CartLine): string {
    const promos = this.cartPromotions()?.appliedPromotions || [];
    for (const applied of promos) {
      const promo = applied.promotion;
      if (promo.scope === 'buy-x-get-y' && promo.buyXGetYConfig) {
        const config = promo.buyXGetYConfig;
        const discount = this.getItemDiscount(item);
        if (discount >= item.unitPrice) {
          if (config.getQuantity === 1) return `${config.buyQuantity + 1}ᵉ offert`;
          return `${config.getQuantity} offert${config.getQuantity > 1 ? 's' : ''}`;
        }
      }
      if (promo.scope === 'product' && promo.productIds?.includes(Number(item.productId))) {
        return promo.name || 'Promotion produit';
      }
      if (promo.scope === 'category' && promo.categorySlugs?.includes(item.categorySlug ?? '')) {
        return promo.name || 'Promotion catégorie';
      }
      if (promo.scope === 'site-wide') {
        return promo.name || 'Promotion générale';
      }
    }
    return 'Promotion appliquée';
  }

  async onCancelReward(): Promise<void> {
    const userId = this.auth.currentUser$()?.id;
    if (!userId || !this.appliedReward()) return;

    const confirmed = await this.confirm.ask({
      title: 'Confirmer',
      variant: 'primary',
      message: 'Annuler la récompense fidélité appliquée ?',
    });
    if (!confirmed) return;

    try {
      await this.fidelity.cancelAppliedReward(userId);
      this.toast.success('Récompense annulée.');
      this.appliedReward.set(null);
      this.fidelityDiscount.set(null);
      this.uiReward.set(null);
      await this.calculatePromotions();
    } catch {
      this.toast.error('Impossible d’annuler la récompense pour le moment.');
    }
  }

  onClearCart(): void {
    try {
      this.cart.clear();
      this.toast.success('Panier vidé');
    } catch (error) {
      if (!(error instanceof Error)) {
        this.toast.error('Erreur inattendue lors du vidage du panier.');
      }
    }
  }
}
