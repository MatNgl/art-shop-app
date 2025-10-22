import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product.model';
import { AuthHttpService as AuthService } from '../../../auth/services/auth-http.service';
import { CartStore } from '../../../cart/services/cart-store';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { ToastService } from '../../../../shared/services/toast.service';
import { SizePipe } from '../../../../shared/pipes/size.pipe';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { CategoryService } from '../../services/category';
import { Category } from '../../models/category.model';
import {
  ProductPromotionService,
  ProductPromotionResult,
} from '../../../promotions/services/product-promotion.service';
import { FormatService } from '../../services/format.service';
import { BrowsingHistoryService } from '../../../../shared/services/browsing-history.service';
import { RecommendationsService } from '../../../../shared/services/recommendations.service';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';

interface CartItemLite {
  productId: string | number;
  variantId?: number;
  qty: number;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SizePipe, PricePipe, ProductCardComponent],
  styleUrls: ['./product-detail.scss'],
  template: `
    <div class="min-h-[calc(100vh-65px)]">
      @if (loading()) {
      <!-- skeleton -->
      <div class="max-w-7xl mx-auto px-4 py-10">
        <div class="h-6 w-40 bg-gray-200 animate-pulse rounded mb-6"></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div class="aspect-[4/3] bg-gray-200 animate-pulse rounded"></div>
          <div class="space-y-4">
            <div class="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
            <div class="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
            <div class="h-24 w-full bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
      } @else if (error()) {
      <div class="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 class="text-2xl font-semibold text-gray-900 mb-2">Œuvre introuvable</h1>
        <p class="text-gray-600 mb-6">La page que vous cherchez n'existe pas.</p>
        <a routerLink="/catalog" class="text-blue-600 hover:text-blue-700 font-medium"
          >← Retour au catalogue</a
        >
      </div>
      } @else if (product()) {
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- fil d'Ariane -->
        <nav class="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <a routerLink="/" class="hover:text-gray-700">Accueil</a>
          <span>/</span>
          <a routerLink="/catalog" class="hover:text-gray-700">Catalogue</a>
          <span>/</span>
          <span class="text-gray-900 line-clamp-1">{{ product()!.title }}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <!-- Galerie -->
          <section class="pd-gallery">
            <!-- Image principale -->
            <div class="pd-image relative">
              <img [src]="activeImageUrl()" [alt]="product()!.title" class="pd-image__img" />
              @if (promoResult()?.hasPromotion && promoResult()?.badge) {
              <span
                class="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold rounded px-2 py-1"
              >
                {{ promoResult()!.badge }}
              </span>
              } @else if (displayReducedPrice() && displayReducedPrice()! < displayPrice()) {
              <span
                class="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold rounded px-2 py-1"
              >
                -{{ getDiscount(displayReducedPrice()!, displayPrice()) }}%
              </span>
              }
            </div>

            <!-- Thumbs carrées, 20px sous l'image -->
            <div class="pd-thumbs" role="list">
              @for (url of thumbs(); track url; let i = $index) {
              <button
                type="button"
                class="pd-thumb"
                [class.pd-thumb--active]="i === activeIndex()"
                (click)="setActive(i)"
                [attr.aria-label]="'Aperçu ' + (i + 1)"
              >
                <img [src]="url" [alt]="product()!.title + ' miniature ' + (i + 1)" />
              </button>
              }
            </div>
          </section>

          <!-- Infos -->
          <section>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ product()!.title }}</h1>
                @if (category()) {
                <div class="mt-1">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                  >
                    {{ category()!.name }}
                  </span>
                </div>
                }
              </div>

              <!-- Bouton admin -->
              @if (isAdmin()) {
              <button
                type="button"
                (click)="goAdminEdit(product()!.id)"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                title="Modifier (admin)"
              >
                <i class="fa-solid fa-wrench"></i>
                <span class="hidden sm:inline">Modifier (admin)</span>
              </button>
              }
            </div>

            @if (!isLoggedIn()) {
            <div
              class="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-900 shadow-sm p-3 sm:p-4 flex items-start gap-3"
              role="note"
              aria-live="polite"
            >
              <div
                class="h-8 w-8 rounded-full bg-white/80 ring-1 ring-blue-200 flex items-center justify-center"
              >
                <span class="text-blue-600">🔒</span>
              </div>
              <div class="min-w-0 text-sm leading-5">
                <div class="font-semibold text-blue-800">Connexion requise</div>
                <p class="mt-0.5">
                  Vous devez être connecté pour ajouter au panier ou aux favoris.
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <a
                    [routerLink]="['/auth/login']"
                    [queryParams]="{ redirect: currentUrl() }"
                    class="inline-flex items-center px-3 py-1.5 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >Se connecter</a
                  >
                  <a
                    [routerLink]="['/auth/register']"
                    [queryParams]="{ redirect: currentUrl() }"
                    class="inline-flex items-center px-3 py-1.5 rounded-md text-blue-700 bg-white hover:bg-blue-50 ring-1 ring-blue-200 transition-colors"
                    >Créer un compte</a
                  >
                </div>
              </div>
            </div>
            }

            <!-- Sélecteur de taille (variantes) -->
            @if (product()!.variants && product()!.variants!.length > 0) {
            <div class="mt-5">
              <span class="block text-sm font-semibold text-gray-900 mb-2">Taille</span>
              <div role="radiogroup" class="flex gap-2 flex-wrap">
                @for (variant of sortedVariants(); track variant.id) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="selectedVariantId() === variant.id"
                  [attr.aria-disabled]="!variant.isAvailable"
                  [disabled]="!variant.isAvailable"
                  (click)="selectVariant(variant.id)"
                  class="flex flex-col items-center justify-center border-2 rounded-lg px-4 py-3 text-sm font-medium transition-all min-w-[100px]"
                  [class.border-blue-500]="selectedVariantId() === variant.id"
                  [class.bg-blue-50]="selectedVariantId() === variant.id"
                  [class.text-blue-900]="selectedVariantId() === variant.id"
                  [class.border-gray-300]="
                    selectedVariantId() !== variant.id && variant.isAvailable
                  "
                  [class.text-gray-900]="selectedVariantId() !== variant.id && variant.isAvailable"
                  [class.hover:border-blue-400]="
                    selectedVariantId() !== variant.id && variant.isAvailable
                  "
                  [class.opacity-50]="!variant.isAvailable"
                  [class.cursor-not-allowed]="!variant.isAvailable"
                  [title]="variant.formatId | size"
                >
                  <span class="font-bold">{{ getFormatName(variant.formatId) }}</span>
                  <span class="text-xs text-gray-500">{{ variant.formatId | size }}</span>
                  @if (!variant.isAvailable) {
                  <span class="text-xs text-red-600 mt-1">Rupture de stock</span>
                  }
                </button>
                }
              </div>
            </div>
            }

            <!-- Prix + quantité -->
            <div class="mt-5 flex items-end gap-4 flex-wrap">
              <div class="flex items-center gap-2">
                <div class="inline-flex items-center rounded-full border border-gray-300 bg-white">
                  <button
                    type="button"
                    aria-label="Diminuer la quantité"
                    class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-l-full disabled:opacity-40"
                    (click)="decQty()"
                    [disabled]="qty() <= 1"
                  >
                    –
                  </button>
                  <span class="px-4 font-semibold tabular-nums select-none">{{ qty() }}</span>
                  <button
                    type="button"
                    aria-label="Augmenter la quantité"
                    class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-r-full disabled:opacity-40"
                    (click)="incQty()"
                    [disabled]="qty() >= uiMax()"
                  >
                    +
                  </button>
                </div>
              </div>

              <div class="flex items-baseline gap-3">
                @if (displayReducedPrice() && displayReducedPrice()! < displayPrice()) {
                <span class="text-2xl font-bold text-gray-900">{{
                  displayReducedPrice() | price
                }}</span>
                <span class="text-lg line-through text-gray-500">{{ displayPrice() | price }}</span>
                } @else {
                <span class="text-2xl font-bold text-gray-900">{{ displayPrice() | price }}</span>
                }
              </div>
            </div>

            <p class="mt-1 text-xs text-gray-500">Jusqu'à {{ uiMax() }} par ajout.</p>
            <p *ngIf="noStockAvailable()" class="mt-1 text-xs font-semibold text-red-600">
              Plus de stock disponible
            </p>

            <p class="mt-2 text-xs text-gray-500">
              Taxes incluses.
              <span class="underline decoration-dotted">Frais d'expédition</span> calculés à l'étape
              de paiement.
            </p>

            @if (promoResult()?.hasPromotion && promoResult()?.message) {
            <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-tag text-green-600"></i>
                <span class="text-sm font-medium text-green-800">{{ promoResult()!.message }}</span>
              </div>
              @if (promoResult()!.allPromotions.length > 1) {
              <p class="text-xs text-green-700 mt-1">
                {{ promoResult()!.allPromotions.length }} promotions cumulées
              </p>
              }
            </div>
            }

            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                class="inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                (click)="onAddToCart()"
                [disabled]="!isLoggedIn() || noStockAvailable()"
              >
                <i class="fa-solid fa-cart-shopping mr-2"></i>
                Ajouter au panier
              </button>

              <button
                class="inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                (click)="onToggleFavorite()"
                [disabled]="!isLoggedIn()"
                [attr.aria-pressed]="isFav()"
                [title]="isFav() ? 'Retirer des favoris' : 'Ajouter aux favoris'"
              >
                <i
                  [class]="
                    isFav() ? 'fa-solid fa-heart mr-2 text-red-500' : 'fa-regular fa-heart mr-2'
                  "
                ></i>
                {{ isFav() ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
              </button>
            </div>

            <!-- Caractéristiques -->
            <ul class="mt-8 space-y-3 text-lg text-gray-800">
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100"
                >
                  <i
                    class="fa-solid fa-up-right-and-down-left-from-center text-gray-600 text-sm"
                  ></i>
                </span>
                <span class="font-medium">
                  {{
                    selectedVariantId()
                      ? 'Format ' + getFormatName(selectedVariant()?.formatId)
                      : 'Format original'
                  }}
                </span>
              </li>

              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100"
                >
                  <i class="fa-solid fa-ruler-combined text-gray-600 text-sm"></i>
                </span>
                <span class="font-medium">
                  {{
                    selectedVariantId()
                      ? (selectedVariant()!.formatId | size)
                      : (product()!.dimensions | size)
                  }}
                </span>
              </li>

              @if (category()) {
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100"
                >
                  <i class="fa-solid fa-folder-open text-gray-600 text-sm"></i>
                </span>
                <span class="font-medium">{{ category()!.name }}</span>
              </li>
              }

              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100"
                >
                  <i class="fa-solid fa-print text-gray-600 text-sm"></i>
                </span>
                <span class="font-medium">Imprimé par Kyodai (FR)</span>
              </li>
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100"
                >
                  <i class="fa-solid fa-box text-gray-600 text-sm"></i>
                </span>
                <span class="font-medium">Soigneusement emballé par nos équipes</span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <!-- Vous aimerez aussi -->
      @if (recommendations().length > 0) {
      <section id="recommendations" class="carousel-section">
        <div class="section-header left">
          <h2>Vous aimerez aussi</h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="navRecommendations.canLeft()"
            (click)="scrollRecommendations(-1)"
            (keyup.enter)="scrollRecommendations(-1)"
            (keyup.space)="scrollRecommendations(-1)"
            tabindex="0"
            aria-label="Faire défiler vers la gauche"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #recommendationsTrack (scroll)="onRecommendationsScroll()">
            @for (product of recommendations(); track product.id) {
            <app-product-card
              [product]="product"
              [isFavorite]="isProductFavorite(product.id)"
              (toggleFavorite)="toggleProductFavorite($event)"
              (view)="goToProduct($event)"
            />
            }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="navRecommendations.canRight()"
            (click)="scrollRecommendations(1)"
            (keyup.enter)="scrollRecommendations(1)"
            (keyup.space)="scrollRecommendations(1)"
            tabindex="0"
            aria-label="Faire défiler vers la droite"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
      }
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartStore);
  private readonly fav = inject(FavoritesStore);
  private readonly toast = inject(ToastService);
  private readonly promotionService = inject(ProductPromotionService);
  private readonly formatService = inject(FormatService);
  private readonly browsingHistory = inject(BrowsingHistoryService);
  private readonly recommendationsService = inject(RecommendationsService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  product = signal<Product | null>(null);
  related = signal<Product[]>([]);
  recommendations = signal<Product[]>([]);
  activeIndex = signal<number>(0);
  category = signal<Category | null>(null);
  promoResult = signal<ProductPromotionResult | null>(null);

  qty = signal<number>(1);

  // Gestion variantes
  selectedVariantId = signal<number | null>(null);

  selectedVariant = computed(() => {
    const p = this.product();
    const variantId = this.selectedVariantId();
    if (!p?.variants || !variantId) return null;
    return p.variants.find((v) => v.id === variantId) ?? null;
  });

  sortedVariants = computed(() => {
    const p = this.product();
    if (!p?.variants) return [];

    // Tri A3 -> A4 -> A5 -> A6
    const formats = this.formatService.formats();
    const order: Record<number, number> = {};
    formats.forEach((f) => {
      const n = f.name.toUpperCase();
      order[f.id] = n === 'A3' ? 1 : n === 'A4' ? 2 : n === 'A5' ? 3 : n === 'A6' ? 4 : 999;
    });

    return [...p.variants].sort(
      (a, b) => (a.formatId ? order[a.formatId] : 999) - (b.formatId ? order[b.formatId] : 999)
    );
  });

  displayPrice = computed(() => {
    const promo = this.promoResult();
    if (promo?.hasPromotion) return promo.originalPrice;
    return this.selectedVariant()?.originalPrice ?? this.product()?.originalPrice ?? 0;
  });

  displayReducedPrice = computed(() => {
    const promo = this.promoResult();
    if (promo?.hasPromotion) return promo.discountedPrice;
    return this.selectedVariant()?.reducedPrice ?? this.product()?.reducedPrice ?? null;
  });

  addedQty = signal<number | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  isToastVisible = computed(() => this.addedQty() !== null);

  isFav = computed(() => {
    const p = this.product();
    return p ? this.fav.isFavorite(p.id) : false;
  });

  readonly maxPerAdd = 10;

  currentInCart = computed(() => {
    const p = this.product();
    const variantId = this.selectedVariantId();
    if (!p) return 0;
    const items = (this.cart.items() || []) as CartItemLite[];
    return items
      .filter(
        (it) =>
          String(it.productId) === String(p.id) &&
          (variantId ? it.variantId === variantId : !it.variantId)
      )
      .reduce((sum, it) => sum + (it.qty ?? 0), 0);
  });

  remainingStock = computed(() => {
    const p = this.product();
    const variant = this.selectedVariant();
    if (!p) return 0;
    const totalStock = variant ? variant.stock : p.stock ?? this.maxPerAdd;
    return Math.max(0, totalStock - this.currentInCart());
  });

  uiMax = computed(() => Math.min(this.maxPerAdd, this.remainingStock()));
  noStockAvailable = computed(() => this.remainingStock() <= 0);

  currentUrl = computed(() => this.router.url);
  isLoggedIn = computed(() => this.auth.isAuthenticated());
  isAdmin = computed(() => this.auth.getCurrentUser()?.role === 'admin');

  activeImageUrl = computed(() => {
    const p = this.product();
    if (!p) return '';
    const imgs = p.images && p.images.length ? p.images : [p.imageUrl];
    return imgs[this.activeIndex()] || p.imageUrl;
  });

  thumbs = computed<string[]>(() => {
    const p = this.product();
    if (!p) return [];
    return p.images && p.images.length ? p.images : [p.imageUrl];
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id || Number.isNaN(id)) {
        this.router.navigate(['/catalog']);
        return;
      }
      this.fetch(id);
      this.activeIndex.set(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  private async fetch(id: number): Promise<void> {
    try {
      this.loading.set(true);
      const p = await this.productService.getProductById(id);
      if (!p) {
        this.error.set('not_found');
        return;
      }
      this.product.set(p);
      this.activeIndex.set(0);

      const promoResult = await this.promotionService.calculateProductPromotion(p);
      this.promoResult.set(promoResult);

      if (typeof p.categoryId === 'number') {
        const cats = await this.categoryService.getAll();
        const c = cats.find((x: Category) => x.id === p.categoryId) ?? null;
        this.category.set(c);
      } else {
        this.category.set(null);
      }

      if (p.variants && p.variants.length > 0) {
        const availableVariants = p.variants.filter((v) => v.isAvailable);
        if (availableVariants.length > 0) {
          const minPriceVariant = availableVariants.reduce((min, v) =>
            v.originalPrice < min.originalPrice ? v : min
          );
          this.selectedVariantId.set(minPriceVariant.id);
        } else {
          this.selectedVariantId.set(null);
        }
      } else {
        this.selectedVariantId.set(null);
      }

      if (typeof p.categoryId === 'number') {
        const sim = await this.productService.getProductsByCategoryId(p.categoryId);
        this.related.set(sim.filter((x: Product) => x.id !== p.id).slice(0, 4));
      } else {
        this.related.set([]);
      }

      // Tracker la consultation du produit
      this.browsingHistory.addBrowsingItem({
        productId: p.id,
        title: p.title,
        imageUrl: p.images[0] || '',
        price: p.reducedPrice || p.originalPrice,
      });

      // Charger les recommandations
      const recs = await this.recommendationsService.getSimilarProducts(p, 6);
      this.recommendations.set(recs);

      // Mettre à jour la navigation du carrousel après affichage
      setTimeout(() => this.updateRecommendationsNav(), 100);
    } catch {
      this.error.set('error');
    } finally {
      this.loading.set(false);
    }
  }

  selectVariant(variantId: number): void {
    this.selectedVariantId.set(variantId);
    this.qty.set(1);
  }

  setActive(i: number): void {
    this.activeIndex.set(i);
  }

  incQty(): void {
    this.qty.update((q) => Math.min(q + 1, this.uiMax()));
  }
  decQty(): void {
    this.qty.update((q) => Math.max(1, q - 1));
  }

  getDiscount(reducedPrice: number, basePrice: number): number {
    return Math.round(((basePrice - reducedPrice) / basePrice) * 100);
  }

  onAddToCart(): void {
    if (!this.isLoggedIn()) {
      this.toast.requireAuth('cart', this.router.url);
      return;
    }
    const item = this.product();
    if (!item) return;

    const remaining = this.remainingStock();
    if (remaining <= 0) {
      this.toast.error('Stock atteint pour cet article.');
      return;
    }

    const quantity = this.qty();
    if (quantity > remaining) {
      this.toast.warning(
        remaining === 1
          ? "Il ne reste plus qu'un exemplaire disponible (vous en avez déjà dans le panier)."
          : `Il ne reste plus que ${remaining} exemplaires disponibles.`
      );
      this.qty.set(remaining);
      return;
    }

    const variant = this.selectedVariant() ?? undefined;
    this.cart.add(item, quantity, variant);
    this.toast.success(
      quantity > 1 ? `${quantity} articles ajoutés au panier.` : 'Ajouté au panier.'
    );

    this.addedQty.set(quantity);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.closeToast(), 2200);

    this.qty.set(1);
  }

  closeToast(): void {
    this.addedQty.set(null);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  getFormatName(formatId?: number | null): string {
    if (!formatId) return '';
    const fmt = this.formatService.formats().find((f) => f.id === formatId);
    return fmt ? fmt.name : '';
  }

  onToggleFavorite(): void {
    if (!this.isLoggedIn()) {
      this.toast.requireAuth('favorites', this.router.url);
      return;
    }
    const p = this.product();
    if (!p) return;
    const nowFav = this.fav.toggle(p.id);
    this.toast.success(nowFav ? 'Ajouté aux favoris' : 'Retiré des favoris');
  }

  goAdminEdit(id: number): void {
    this.router.navigate(['/admin/products', id, 'edit']);
  }

  // Navigation recommendations carousel
  navRecommendations = {
    canLeft: signal(false),
    canRight: signal(false),
  };

  private updateRecommendationsNav(): void {
    const el = document.querySelector<HTMLElement>('#recommendations .carousel-track');
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    this.navRecommendations.canLeft.set(el.scrollLeft > 2);
    this.navRecommendations.canRight.set(el.scrollLeft < max);
  }

  onRecommendationsScroll(): void {
    this.updateRecommendationsNav();
  }

  scrollRecommendations(dir: number): void {
    const el = document.querySelector<HTMLElement>('#recommendations .carousel-track');
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8 * dir;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(() => this.updateRecommendationsNav(), 400);
  }

  isProductFavorite(productId: number): boolean {
    return this.fav.has(productId);
  }

  toggleProductFavorite(productId: number): void {
    if (!this.isLoggedIn()) {
      this.toast.requireAuth('favorites', this.router.url);
      return;
    }
    const nowFav = this.fav.toggle(productId);
    this.toast.success(nowFav ? 'Ajouté aux favoris' : 'Retiré des favoris');
  }

  goToProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }
}
