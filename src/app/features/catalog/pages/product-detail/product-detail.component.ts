import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product.model';
import { AuthService } from '../../../auth/services/auth';
import { CartStore } from '../../../cart/services/cart-store';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrls: ['./product-detail.scss'],
  template: `
    <div class="fixed inset-x-0 bottom-0 top-[65px] overflow-auto">
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
        <p class="text-gray-600 mb-6">La page que vous cherchez n’existe pas.</p>
        <a routerLink="/catalog" class="text-blue-600 hover:text-blue-700 font-medium"
          >← Retour au catalogue</a
        >
      </div>
      } @else if (product()) {
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- fil d’Ariane -->
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
                [src]="product()!.artist.profileImage || '/assets/default-avatar.png'"
                [alt]="product()!.artist.name"
                class="h-8 w-8 rounded-full object-cover"
              />
              <div class="text-sm text-gray-600">{{ product()!.artist.name }}</div>
            </div>

            @if (!isLoggedIn()) {
            <p id="cart-tip" class="mt-3 text-sm text-gray-600">
              Vous devez être connecté pour ajouter au panier ou aux favoris.
              <a
                [routerLink]="['/auth/login']"
                [queryParams]="{ redirect: currentUrl() }"
                class="text-blue-600 hover:text-blue-700 underline"
              >
                Se connecter
              </a>
            </p>
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

            <p class="mt-1 text-xs text-gray-500">Jusqu’à {{ uiMax() }} par ajout.</p>

            <!-- Phrase frais de port -->
            <p class="mt-2 text-xs text-gray-500">
              Taxes incluses.
              <span class="underline decoration-dotted">Frais d’expédition</span> calculés à l’étape
              de paiement.
            </p>

            <!-- Boutons -->
            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                class="inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold
                           text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                (click)="onAddToCart()"
                [disabled]="!isLoggedIn() || (product()!.stock || 0) === 0"
              >
                🛒 Ajouter au panier
              </button>

              <button
                class="inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold
                           text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                (click)="onAddToFavorites()"
                [disabled]="!isLoggedIn()"
              >
                ☆ Ajouter aux favoris
              </button>
            </div>

            @if (addedQty()) {
            <div
              class="mt-3 text-sm rounded-md border border-green-200 bg-green-50 text-green-800 px-3 py-2"
              aria-live="polite"
            >
              Ajouté au panier ({{ addedQty() }}).
              <a routerLink="/cart" class="ml-2 underline hover:no-underline">Voir mon panier</a>
            </div>
            }

            <!-- Caractéristiques (avec icônes) -->
            <ul class="mt-8 space-y-3 text-lg text-gray-800">
              @for (f of features(); track f.label) {
              <li class="flex items-center gap-3">
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100"
                >
                  <span class="text-base">{{ f.icon }}</span>
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

  loading = signal(true);
  error = signal<string | null>(null);
  product = signal<Product | null>(null);
  related = signal<Product[]>([]);
  activeIndex = signal(0);

  // quantité sélectionnée quand on clique sur "Ajouter"
  qty = signal(1);

  // Feedback après ajout
  addedQty = signal<number | null>(null);

  // Cap UI : jusqu’à 10 par ajout, sans dépasser le stock si connu
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

  features = computed<{ icon: string; label: string }[]>(() => {
    const p = this.product();
    if (!p) return [];
    const dims = `${p.dimensions.width} × ${p.dimensions.height} ${p.dimensions.unit}`;
    return [
      { icon: '📏', label: `Format ${dims}` },
      { icon: '🧾', label: p.technique },
      { icon: '🖨️', label: 'Imprimé par Kyodai (FR)' },
      { icon: '📦', label: 'Soigneusement emballé par nos équipes' },
    ];
  });

  ngOnInit() {
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

  private async fetch(id: number) {
    try {
      this.loading.set(true);
      const p = await this.productService.getProductById(id);
      if (!p) {
        this.error.set('not_found');
        return;
      }
      this.product.set(p);
      this.activeIndex.set(0);

      const sim = await this.productService.getProductsByCategory(p.category);
      this.related.set(sim.filter((x) => x.id !== p.id).slice(0, 4));
    } catch {
      this.error.set('error');
    } finally {
      this.loading.set(false);
    }
  }

  setActive(i: number) {
    this.activeIndex.set(i);
  }

  incQty() {
    this.qty.update((q) => Math.min(q + 1, this.uiMax()));
  }
  decQty() {
    this.qty.update((q) => Math.max(1, q - 1));
  }

  getDiscount(current: number, original: number) {
    return Math.round(((original - current) / original) * 100);
  }

  onAddToCart() {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    const item = this.product();
    if (!item) return;

    const quantity = this.qty();
    // ✅ CUMULE si déjà présent (le CartStore gère l’addition)
    this.cart.add(item, quantity);

    // petit feedback & reset de la sélection à 1
    this.addedQty.set(quantity);
    this.qty.set(1);
    setTimeout(() => this.addedQty.set(null), 1600);
  }

  onAddToFavorites() {
    // branchement favoris si nécessaire
    this.router.navigate(['/favorites']); // ou ton toggle existant
  }
}
