import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product.model';
import { AuthService } from '../../../auth/services/auth';
import { CartStore } from '../../../cart/services/cart-store';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrls: ['./product-detail.scss'],
  template: `
    <div class="min-h-[calc(100vh-65px)]">
      @if (loading()) {
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
          <section>
            <div class="relative overflow-hidden rounded-xl shadow">
              <img
                [src]="activeImageUrl()"
                [alt]="product()!.title"
                class="w-full h-[520px] object-cover"
              />
              @if (product()!.originalPrice) {
              <span
                class="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold rounded px-2 py-1"
              >
                -{{ getDiscount(product()!.price, product()!.originalPrice!) }}%
              </span>
              }
            </div>

            <div class="mt-3 flex gap-3 overflow-x-auto pb-2">
              @for (url of thumbs(); track url; let i = $index) {
              <button
                type="button"
                class="shrink-0 rounded-lg overflow-hidden border-2"
                [class.border-blue-500]="i === activeIndex()"
                [class.border-transparent]="i !== activeIndex()"
                (click)="setActive(i)"
              >
                <img [src]="url" [alt]="product()!.title" class="h-20 w-28 object-cover" />
              </button>
              }
            </div>
          </section>

          <!-- Infos -->
          <section>
            <h1 class="text-2xl font-bold text-gray-900">{{ product()!.title }}</h1>

            <!-- Artiste -->
            <div class="mt-3 flex items-center gap-3">
              <img
                [src]="getArtistProfileImageFor(product()!) || '/assets/default-avatar.png'"
                [alt]="getArtistNameFor(product()!)"
                class="h-8 w-8 rounded-full object-cover"
              />
              <div class="text-sm text-gray-600">{{ getArtistNameFor(product()!) }}</div>
            </div>

            @if (!isLoggedIn()) {
            <div
              class="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-900
           shadow-sm p-3 sm:p-4 flex items-start gap-3"
              role="note"
              aria-live="polite"
            >
              <!-- Icon badge -->
              <div
                class="h-8 w-8 rounded-full bg-white/80 ring-1 ring-blue-200 flex items-center justify-center"
              >
                <span class="text-blue-600">🔒</span>
              </div>

              <!-- Text + actions -->
              <div class="min-w-0 text-sm leading-5">
                <div class="font-semibold text-blue-800">Connexion requise</div>
                <p class="mt-0.5">
                  Vous devez être connecté pour ajouter au panier ou aux favoris.
                </p>

                <div class="mt-2 flex flex-wrap gap-2">
                  <a
                    [routerLink]="['/auth/login']"
                    [queryParams]="{ redirect: currentUrl() }"
                    class="inline-flex items-center px-3 py-1.5 rounded-md text-white
                 bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Se connecter
                  </a>
                  <a
                    [routerLink]="['/auth/register']"
                    [queryParams]="{ redirect: currentUrl() }"
                    class="inline-flex items-center px-3 py-1.5 rounded-md
                 text-blue-700 bg-white hover:bg-blue-50 ring-1 ring-blue-200 transition-colors"
                  >
                    Créer un compte
                  </a>
                </div>
              </div>
            </div>
            }

            <!-- Prix + quantité -->
            <div class="mt-5 flex items-end gap-4 flex-wrap">
              <!-- Sélecteur de quantité -->
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

              <!-- Prix -->
              <div class="flex items-baseline gap-3">
                <span class="text-2xl font-bold text-gray-900">{{ product()!.price }}€</span>
                @if (product()!.originalPrice) {
                <span class="text-sm line-through text-gray-500"
                  >{{ product()!.originalPrice }}€</span
                >
                }
              </div>
            </div>

            <p class="mt-1 text-xs text-gray-500">Jusqu'à {{ uiMax() }} par ajout.</p>

            <!-- Phrase frais de port -->
            <p class="mt-2 text-xs text-gray-500">
              Taxes incluses.
              <span class="underline decoration-dotted">Frais d'expédition</span> calculés à l'étape
              de paiement.
            </p>

            <!-- Boutons -->
            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <!-- Panier -->
              <button
                class="inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold
                      text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                (click)="onAddToCart()"
                [disabled]="!isLoggedIn() || (product()!.stock || 0) === 0"
              >
                <i class="fa-solid fa-cart-shopping mr-2"></i>
                Ajouter au panier
              </button>

              <!-- Favoris -->
              <button
                class="inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold
                      text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                (click)="onToggleFavorite()"
                [disabled]="!isLoggedIn()"
                [attr.aria-pressed]="isFav()"
                [title]="isFav() ? 'Retirer des favoris' : 'Ajouter aux favoris'"
              >
                <i [class]="isFav() ? 'fa-solid fa-heart mr-2 text-red-500' : 'fa-regular fa-heart mr-2'"></i>
                {{ isFav() ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
              </button>
            </div>

            <!-- Toast flottant "Ajouté au panier" -->
            <div
              class="fixed inset-x-0 bottom-4 sm:bottom-auto sm:right-6 sm:left-auto sm:top-20
                     z-[70] pointer-events-none flex justify-center sm:justify-end"
              aria-live="polite"
            >
              <div
                class="pointer-events-auto w-[clamp(16rem,90vw,24rem)]
                       rounded-xl border border-green-200 bg-white/95 backdrop-blur
                       shadow-xl ring-1 ring-green-600/20 p-4
                       transition-all duration-300
                       flex items-start gap-3"
                [class.opacity-0]="!isToastVisible()"
                [class.translate-y-2]="!isToastVisible()"
                [class.opacity-100]="isToastVisible()"
                [class.translate-y-0]="isToastVisible()"
              >
                <div class="mt-0.5">
                  <div class="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
                    <span class="text-green-700 text-base">✔️</span>
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="text-sm font-semibold text-gray-900">Ajouté au panier</div>
                  <div class="text-sm text-gray-700">
                    {{ addedQty() }} article<span *ngIf="(addedQty() ?? 0) > 1">s</span> ajouté<span
                      *ngIf="(addedQty() ?? 0) > 1"
                      >s</span
                    >.
                    <a routerLink="/cart" class="text-blue-600 hover:text-blue-700 underline"
                      >Voir mon panier</a
                    >
                  </div>
                </div>

                <button
                  type="button"
                  class="ml-auto -mr-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  (click)="closeToast()"
                  aria-label="Fermer la notification"
                  title="Fermer"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Caractéristiques (avec icônes) -->
            <ul class="mt-8 space-y-3 text-lg text-gray-800">
              @for (f of features(); track f.label) {
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100"
                >
                <i [class]="f.iconClass + ' text-gray-600 text-sm'"></i>
      </span>
      <span class="font-medium">{{ f.label }}</span>
    </li>
              }
            </ul>
          </section>
        </div>

        <!-- Produits similaires -->
        @if (related().length) {
        <section class="mt-12">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Œuvres similaires</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (p of related(); track p.id) {
            <a
              [routerLink]="['/product', p.id]"
              class="block bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              <img [src]="p.imageUrl" [alt]="p.title" class="w-full h-40 object-cover" />
              <div class="p-3">
                <div class="font-medium text-gray-900 line-clamp-1">{{ p.title }}</div>
                <div class="text-sm text-gray-600">{{ p.price }}€</div>
              </div>
            </a>
            }
          </div>
        </section>
        }
      </div>
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartStore);
  private readonly fav = inject(FavoritesStore);
  private readonly toast = inject(ToastService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  product = signal<Product | null>(null);
  related = signal<Product[]>([]);
  activeIndex = signal<number>(0);

  // quantité sélectionnée quand on clique sur "Ajouter"
  qty = signal<number>(1);

  // Feedback après ajout
  addedQty = signal<number | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  isToastVisible = computed(() => this.addedQty() !== null);

  // Favori pour le produit courant
  isFav = computed(() => {
    const p = this.product();
    return p ? this.fav.isFavorite(p.id) : false;
  });

  // Cap UI : jusqu'à 10 par ajout, sans dépasser le stock si connu
  readonly maxPerAdd = 10;
  uiMax = computed(() => {
    const s = this.product()?.stock;
    return Math.min(this.maxPerAdd, s ?? this.maxPerAdd);
  });

  currentUrl = computed(() => this.router.url);
  isLoggedIn = computed(() => this.auth.isAuthenticated());

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

  features = computed<{ iconClass: string; label: string }[]>(() => {
    const p = this.product();
    if (!p) return [];
    const dims = `${p.dimensions.width} × ${p.dimensions.height} ${p.dimensions.unit}`;
    return [
      { iconClass: 'fa-solid fa-up-right-and-down-left-from-center', label: `Format ${dims}` },
      { iconClass: 'fa-solid fa-image', label: p.technique },
      { iconClass: 'fa-solid fa-print', label: 'Imprimé par Kyodai (FR)' },
      { iconClass: 'fa-solid fa-box', label: 'Soigneusement emballé par nos équipes' },
    ];
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

      // Produits similaires par catégorie
      if (typeof p.categoryId === 'number') {
        const sim = await this.productService.getProductsByCategoryId(p.categoryId);
        this.related.set(sim.filter((x: Product) => x.id !== p.id).slice(0, 4));
      } else {
        this.related.set([]);
      }
    } catch {
      this.error.set('error');
    } finally {
      this.loading.set(false);
    }
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

  getDiscount(current: number, original: number): number {
    return Math.round(((original - current) / original) * 100);
  }

  /** Helpers basés sur Product */
  getArtistNameFor(p: Product): string {
    return p.artist?.name ?? `Artist #${p.artistId}`;
  }
  getArtistProfileImageFor(p: Product): string | undefined {
    return p.artist?.profileImage || undefined;
  }

  onAddToCart(): void {
    if (!this.isLoggedIn()) {
      this.toast.requireAuth('cart', this.router.url);
      return;
    }
    const item = this.product();
    if (!item) return;

    const quantity = this.qty();
    this.cart.add(item, quantity);

    this.toast.success(
      quantity > 1 ? `${quantity} articles ajoutés au panier.` : 'Ajouté au panier.'
    );

    this.qty.set(1);
  }

  closeToast(): void {
    this.addedQty.set(null);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
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
}
