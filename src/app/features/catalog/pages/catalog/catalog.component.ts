import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product';
import { Product, ProductCategory, ProductFilter } from '../../models/product.model';
import { ProductTileComponent } from '../../../../shared/components/product-tile/product-tile.component';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { AuthService } from '../../../auth/services/auth';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductTileComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- En-tête -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Catalogue des Œuvres</h1>
          <p class="text-gray-600 mt-2">Découvrez notre collection complète d'œuvres d'art</p>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Recherche -->
            <div>
              <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <input
                id="search"
                type="text"
                [(ngModel)]="searchTerm"
                (input)="onSearchChange()"
                placeholder="Titre, artiste, technique..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Catégorie -->
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                id="category"
                [(ngModel)]="selectedCategory"
                (change)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les catégories</option>
                @for (category of categories; track category) {
                <option [value]="category">{{ productService.getCategoryLabel(category) }}</option>
                }
              </select>
            </div>

            <!-- Prix minimum -->
            <div>
              <label for="minPrice" class="block text-sm font-medium text-gray-700 mb-2">
                Prix minimum
              </label>
              <input
                id="minPrice"
                type="number"
                [(ngModel)]="minPrice"
                (input)="onFilterChange()"
                placeholder="0 €"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Prix maximum -->
            <div>
              <label for="maxPrice" class="block text-sm font-medium text-gray-700 mb-2">
                Prix maximum
              </label>
              <input
                id="maxPrice"
                type="number"
                [(ngModel)]="maxPrice"
                (input)="onFilterChange()"
                placeholder="1000 €"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Bouton reset filtres -->
          @if (hasActiveFilters()) {
          <div class="mt-4 flex justify-end">
            <button
              (click)="resetFilters()"
              class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Réinitialiser les filtres
            </button>
          </div>
          }
        </div>

        <!-- Résultats / tri / résumé -->
        <div class="flex flex-wrap gap-4 items-center justify-between mb-6">
          <p class="text-gray-600">
            @if (loading()) { Chargement... } @else if (total() === 0) { 0 œuvre trouvée } @else {
            {{ startIndex() + 1 }}–{{ endIndex() }} sur {{ total() }} œuvres }
          </p>

          <div class="flex items-center space-x-4">
            <label for="sort" class="text-sm font-medium text-gray-700">Trier par:</label>
            <select
              id="sort"
              [(ngModel)]="sortBy"
              (change)="onSortChange()"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="title">Titre A-Z</option>
            </select>
          </div>
        </div>

        <!-- Grille des produits -->
        @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (item of [1,2,3,4,5,6,7,8]; track $index) {
          <div class="bg-white rounded-xl shadow overflow-hidden animate-pulse">
            <div class="aspect-[4/3] bg-gray-300"></div>
            <div class="p-4">
              <div class="h-4 bg-gray-300 rounded mb-2"></div>
              <div class="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
              <div class="h-5 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
          }
        </div>
        } @else if (total() === 0) {
        <div class="text-center py-12">
          <div class="text-6xl text-gray-300 mb-4">🎨</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune œuvre trouvée</h3>
          <p class="text-gray-600">
            Essayez de modifier vos critères de recherche ou
            <button (click)="resetFilters()" class="text-blue-600 hover:text-blue-700 underline">
              réinitialisez les filtres
            </button>
          </p>
        </div>
        } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (product of pagedProducts(); track product.id) {
          <app-product-tile [product]="product"></app-product-tile>
          }
        </div>

        <!-- Pagination -->
        <nav
          class="mt-8 flex items-center justify-center gap-1 select-none"
          aria-label="Pagination"
          *ngIf="pagesCount() > 1"
        >
          <button
            class="px-3 py-2 rounded border hover:bg-gray-50"
            [disabled]="page === 1"
            (click)="goToPage(1)"
            aria-label="Première page"
          >
            «
          </button>

          <button
            class="px-3 py-2 rounded border hover:bg-gray-50"
            [disabled]="page === 1"
            (click)="goToPage(page - 1)"
            aria-label="Page précédente"
          >
            ‹
          </button>

          <button
            *ngFor="let n of pageWindow()"
            class="px-3 py-2 rounded border"
            [class.bg-blue-600]="n === page"
            [class.text-white]="n === page"
            [class.border-blue-600]="n === page"
            [class.hover:bg-gray-50]="n !== page"
            (click)="goToPage(n)"
            [attr.aria-current]="n === page ? 'page' : null"
          >
            {{ n }}
          </button>

          <button
            class="px-3 py-2 rounded border hover:bg-gray-50"
            [disabled]="page === pagesCount()"
            (click)="goToPage(page + 1)"
            aria-label="Page suivante"
          >
            ›
          </button>

          <button
            class="px-3 py-2 rounded border hover:bg-gray-50"
            [disabled]="page === pagesCount()"
            (click)="goToPage(pagesCount())"
            aria-label="Dernière page"
          >
            »
          </button>
        </nav>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class CatalogComponent implements OnInit {
  productService = inject(ProductService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  // favoris / auth
  fav = inject(FavoritesStore);
  auth = inject(AuthService);

  allProducts = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  loading = signal(true);

  categories = Object.values(ProductCategory);

  // Filtres
  searchTerm = '';
  selectedCategory = '';
  selectedArtist = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy = 'newest';

  // Pagination
  readonly pageSize = 10;
  page = 1;

  private searchTimeout?: ReturnType<typeof setTimeout>;

  async ngOnInit() {
    // Lis les query params (category + page)
    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category'] ?? '';
      this.searchTerm = params['search'] ?? '';
      this.selectedArtist = params['artist'] ?? '';
      const p = parseInt(params['page'] ?? '1', 10);
      this.page = Number.isFinite(p) && p > 0 ? p : 1;
      // si les produits sont déjà chargés, on ré-applique (utile si on change ?page=)
      if (!this.loading()) this.applyFilters(false);
    });

    await this.loadProducts();
  }

  async loadProducts() {
    try {
      const products = await this.productService.getAllProducts();
      this.allProducts.set(products);
      await this.applyFilters(false);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async applyFilters(resetPage = true) {
    const filters: ProductFilter = {
      search: this.searchTerm || undefined,
      category: (this.selectedCategory as ProductCategory) || undefined,
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
      artist: this.selectedArtist || undefined,
    };

    try {
      const filtered = await this.productService.searchProducts(filters);
      this.filteredProducts.set(filtered);

      // Si on change les filtres, on repart page 1
      if (resetPage) this.goToPage(1, /*noScroll*/ true);

      // Clamp si page > max pages après filtrage
      const max = this.pagesCount();
      if (this.page > max) this.goToPage(max || 1, /*noScroll*/ true);
    } catch (error) {
      console.error('Erreur lors du filtrage:', error);
      this.filteredProducts.set([]);
      if (resetPage) this.goToPage(1, /*noScroll*/ true);
    }
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: this.searchTerm || null, page: 1 },
      queryParamsHandling: 'merge',
    });
    this.searchTimeout = setTimeout(() => this.applyFilters(), 300);
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSortChange() {
    // tri côté client : pas besoin de re-fetch; garder la même page
  }

  // Tri client (conserve ta logique)
  private sortedProducts(): Product[] {
    const products = [...this.filteredProducts()];

    switch (this.sortBy) {
      case 'oldest':
        return products.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      case 'price-asc':
        return products.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return products.sort((a, b) => b.price - a.price);
      case 'title':
        return products.sort((a, b) => a.title.localeCompare(b.title));
      case 'newest':
      default:
        return products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  // Pagination helpers
  total = () => this.filteredProducts().length;
  pagesCount = () => Math.max(1, Math.ceil(this.total() / this.pageSize));
  startIndex = () => (this.page - 1) * this.pageSize;
  endIndex = () => Math.min(this.startIndex() + this.pageSize, this.total());

  pagedProducts(): Product[] {
    const sorted = this.sortedProducts();
    return sorted.slice(this.startIndex(), this.endIndex());
  }

  pageWindow(): number[] {
    const total = this.pagesCount();
    const current = this.page;
    const span = 2; // 5 boutons (2 avant / 2 après)
    let start = Math.max(1, current - span);
    let end = Math.min(total, current + span);
    if (current <= span) end = Math.min(total, start + 2 * span);
    if (current + span > total) start = Math.max(1, total - 2 * span);

    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  goToPage(n: number, noScroll = false) {
    const max = this.pagesCount();
    this.page = Math.min(Math.max(1, n), max);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.page },
      queryParamsHandling: 'merge',
    });
    if (noScroll) return;
    // Si jamais tu veux forcer le scroll (au cas où) :
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'newest';
    this.selectedArtist = '';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null, search: null, artist: null, page: 1 },
      queryParamsHandling: 'merge',
    });

    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedArtist ||
      this.selectedCategory ||
      this.minPrice ||
      this.maxPrice
    );
  }

  getDiscountPercentage(currentPrice: number, originalPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  // ---- Favoris ----
  isFav = (id: number) => this.fav.isFavorite(id);
  onToggleFavorite(id: number) {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.fav.toggle(id);
  }
}
