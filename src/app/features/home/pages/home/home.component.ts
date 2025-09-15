import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../catalog/services/product';
import { Product } from '../../../catalog/models/product.model';
import { ProductTileComponent } from '../../../../shared/components/product-tile/product-tile.component';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { AuthService } from '../../../auth/services/auth';
import { ToastService } from '../../../../shared/services/toast.service';
import { CategoryService } from '../../../catalog/services/category';
import { Category } from '../../../catalog/models/category.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductTileComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Hero Section -->
      <section class="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div class="absolute inset-0 bg-black opacity-20"></div>
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1 class="text-4xl md:text-6xl font-bold mb-6">Découvrez des Œuvres d'Art Uniques</h1>
            <p class="text-xl md:text-2xl mb-8 text-gray-200">
              Collection exclusive d'œuvres originales créées par des artistes talentueux
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                (click)="scrollToProducts()"
                class="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Découvrir la Collection
              </button>
              <a
                routerLink="/catalog"
                class="border-2 border-white text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Voir Tout le Catalogue
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Explorez par Catégorie</h2>

          <!-- Grille centrée -->
          <div class="mx-auto w-fit">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 justify-items-center">
              @for (cat of categories(); track cat.id) {
              <a
                [routerLink]="['/catalog']"
                [queryParams]="{ category: cat.slug }"
                class="group bg-gray-50 rounded-lg p-6 text-center hover:bg-blue-50 hover:shadow-lg transition-all duration-300"
              >
                <!-- Logo parfaitement centré -->
                <div
                  class="mb-4 flex items-center justify-center w-12 h-12 rounded-lg transition-transform duration-200 group-hover:scale-105"
                  [ngClass]="getCategoryBgClass(cat)"
                >
                  <i
                    [ngClass]="[getCategoryIconClass(cat), getCategoryIconColorClass(cat)]"
                    class="block text-[22px] leading-[0]"
                    aria-hidden="true"
                  ></i>
                </div>

                <h3
                  class="font-semibold text-gray-900 group-hover:text-blue-600 flex items-center gap-2 justify-center"
                >
                  <span>{{ cat.name }}</span>
                  <span
                    class="ml-2 inline-flex items-center px-2 rounded-full text-xs bg-gray-200 text-gray-800 border border-gray-300 font-medium"
                  >
                    {{ categoryCounts()[cat.id] ?? (cat.productIds?.length ?? 0) }}
                  </span>
                </h3>
              </a>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Products -->
      <section id="featured-products" class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Œuvres à la Une</h2>
            <p class="text-gray-600">Découvrez notre sélection d'œuvres exceptionnelles</p>
          </div>

          @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (item of [1,2,3,4,5,6]; track $index) {
            <div class="bg-white rounded-xl shadow overflow-hidden animate-pulse">
              <div class="aspect-[4/3] bg-gray-300"></div>
              <div class="p-6">
                <div class="h-4 bg-gray-300 rounded mb-2"></div>
                <div class="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
                <div class="h-6 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>
            }
          </div>
          } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (product of featuredProducts(); track product.id) {
            <app-product-tile [product]="product"></app-product-tile>
            }
          </div>

          <div class="text-center mt-12">
            <a
              routerLink="/catalog"
              class="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Voir Toute la Collection
              <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
          }
        </div>
      </section>

      <!-- About Section -->
      <section class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 class="text-3xl font-bold text-gray-900 mb-6">
                Pourquoi Choisir Notre Galerie ?
              </h2>
              <div class="space-y-6">
                <div class="flex items-start">
                  <div
                    class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4"
                  >
                    <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Œuvres Authentiques</h3>
                    <p class="text-gray-600">
                      Toutes nos œuvres sont originales et certifiées par les artistes.
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <div
                    class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4"
                  >
                    <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Paiement Sécurisé</h3>
                    <p class="text-gray-600">
                      Transactions 100% sécurisées avec garantie de remboursement.
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <div
                    class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4"
                  >
                    <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Livraison Soignée</h3>
                    <p class="text-gray-600">
                      Emballage professionnel et livraison rapide partout en France.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop"
                alt="Atelier d'artiste"
                class="rounded-lg shadow-md"
              />
              <img
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop"
                alt="Œuvre d'art"
                class="rounded-lg shadow-md mt-8"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly fav = inject(FavoritesStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  featuredProducts = signal<Product[]>([]);
  loading = signal<boolean>(true);

  // Catégories réelles (avec id, slug, icône, couleur…)
  categories = signal<Category[]>([]);
  // Comptes par categoryId (clé potentiellement absente)
  categoryCounts = signal<Partial<Record<number, number>>>({});

  async ngOnInit(): Promise<void> {
    try {
      const [products, counts, cats] = await Promise.all([
        this.productService.getFeaturedProducts(6),
        this.productService.getCategoryCounts(),
        this.categoryService.getAll(),
      ]);
      this.featuredProducts.set(products);
      this.categoryCounts.set(counts);
      this.categories.set(cats);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onToggleFavorite(id: number): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.requireAuth('favorites');
      return;
    }
    const added = this.fav.toggle(id);
    this.toast.success(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
  }

  scrollToProducts(): void {
    const element = document.getElementById('featured-products');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  }

  getCategoryIconClass(cat: Category): string {
    // largeur fixe FA + fallback
    return `fa-solid fa-fw ${cat.icon || 'fa-tags'}`;
  }

  getCategoryIconColorClass(cat: Category): string {
    const map: Record<string, string> = {
      dessin: 'text-amber-600',
      peinture: 'text-blue-600',
      'art-numerique': 'text-fuchsia-600',
      photographie: 'text-emerald-600',
      sculpture: 'text-orange-600',
      'mixed-media': 'text-violet-600',
    };
    return map[cat.slug] || 'text-slate-600';
  }

  getCategoryBgClass(cat: Category): string {
    const map: Record<string, string> = {
      dessin: 'bg-amber-50',
      peinture: 'bg-blue-50',
      'art-numerique': 'bg-fuchsia-50',
      photographie: 'bg-emerald-50',
      sculpture: 'bg-orange-50',
      'mixed-media': 'bg-violet-50',
    };
    return map[cat.slug] || 'bg-gray-100';
  }
}
