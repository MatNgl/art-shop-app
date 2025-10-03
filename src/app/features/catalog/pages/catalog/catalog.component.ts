import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { AuthService } from '../../../auth/services/auth';
import { ToastService } from '../../../../shared/services/toast.service';
import { CategoryService } from '../../services/category';
import { Category } from '../../models/category.model';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { Product, ProductFilter } from '../../models/product.model';

type SortBy = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'title';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Banderole décorative -->
      <div class="relative h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden mb-4">
        <div class="absolute inset-0 opacity-20">
          <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 pb-8">
        <!-- Fil d'Ariane et contexte -->
        <div class="mb-6 bg-white rounded-lg shadow-sm p-4">
          <nav class="text-sm mb-3" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2 text-gray-600">
              <li><a routerLink="/" class="hover:text-blue-600">Accueil</a></li>
              <li><i class="fa-solid fa-chevron-right text-xs"></i></li>
              @if (currentCategory()) {
                <li><a [routerLink]="['/catalog']" class="hover:text-blue-600">Catalogue</a></li>
                <li><i class="fa-solid fa-chevron-right text-xs"></i></li>
                <li class="font-medium text-gray-900">{{ currentCategory()!.name }}</li>
                @if (currentSubCategory()) {
                  <li><i class="fa-solid fa-chevron-right text-xs"></i></li>
                  <li class="font-medium text-gray-900">{{ currentSubCategory()!.name }}</li>
                }
              } @else if (promoOnly) {
                <li><a [routerLink]="['/catalog']" class="hover:text-blue-600">Catalogue</a></li>
                <li><i class="fa-solid fa-chevron-right text-xs"></i></li>
                <li class="font-medium text-gray-900">Promotions</li>
              } @else {
                <li class="font-medium text-gray-900">Catalogue</li>
              }
            </ol>
          </nav>

          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                @if (currentSubCategory()) {
                  {{ currentSubCategory()!.name }}
                } @else if (currentCategory()) {
                  {{ currentCategory()!.name }}
                } @else if (promoOnly) {
                  Promotions
                } @else {
                  Catalogue
                }
              </h1>
              <p class="text-sm text-gray-600 mt-1">
                @if (loading()) {
                  Chargement...
                } @else {
                  {{ total() }} {{ total() > 1 ? 'œuvres' : 'œuvre' }}
                }
              </p>
            </div>

            <!-- Filtres légers -->
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <label for="sort-simple" class="text-sm font-medium text-gray-700">Trier par</label>
                <select
                  id="sort-simple"
                  [(ngModel)]="sortBy"
                  (change)="onSortChange()"
                  class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="title">Titre A-Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres avancés (collapsible) -->
        <div class="bg-white rounded-lg shadow-sm mb-8">
          <button
            (click)="showAdvancedFilters = !showAdvancedFilters"
            class="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span class="text-sm font-medium text-gray-700">
              <i class="fa-solid fa-sliders mr-2"></i>
              Filtres avancés
            </span>
            <i class="fa-solid" [class.fa-chevron-down]="!showAdvancedFilters" [class.fa-chevron-up]="showAdvancedFilters"></i>
          </button>

          @if (showAdvancedFilters) {
          <div class="px-6 pb-6 pt-2 border-t">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  placeholder="Titre, technique..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
          }
        </div>

        <!-- Grille -->
        @if (loading()) {
        <div
          class="grid gap-7 grid-cols-1
            [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]"
        >
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
        <div
          class="grid gap-7 grid-cols-1
            [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]"
        >
          @for (product of pagedProducts(); track product.id) {
          <app-product-card
            [product]="product"
            [isFavorite]="fav.has(product.id)"
            (toggleFavorite)="onToggleFavorite($event)"
            (view)="goToProduct($event)"
          ></app-product-card>
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
  // Services
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly fav = inject(FavoritesStore);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  // Données
  private readonly allProducts = signal<Product[]>([]);
  private readonly filteredProducts = signal<Product[]>([]);
  loading = signal(true);

  categories: Category[] = [];
  showAdvancedFilters = false;

  // Filtres
  searchTerm = '';
  selectedCategoryId: number | null = null;
  selectedCategorySlug: string | null = null;
  selectedSubCategorySlug: string | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  promoOnly = false;
  sortBy: SortBy = 'newest';

  // Pagination
  readonly pageSize = 15;
  page = 1;

  private searchTimeout?: ReturnType<typeof setTimeout>;

  // Contexte de navigation
  currentCategory = signal<Category | null>(null);
  currentSubCategory = signal<{ id: number; name: string; slug: string } | null>(null);

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe((params) => {
      // Legacy support: categoryId (number)
      const catParam = params['categoryId'];
      if (catParam !== null && catParam !== '') {
        const parsed = Number(catParam);
        this.selectedCategoryId = Number.isFinite(parsed) ? parsed : null;
      } else {
        this.selectedCategoryId = null;
      }

      // Nouveau: categorySlug et subCategorySlug
      this.selectedCategorySlug = params['categorySlug'] ?? null;
      this.selectedSubCategorySlug = params['subCategorySlug'] ?? null;

      // Promo filter
      this.promoOnly = params['promo'] === 'true';

      this.searchTerm = params['search'] ?? '';

      const p = parseInt(params['page'] ?? '1', 10);
      this.page = Number.isFinite(p) && p > 0 ? p : 1;

      const s = (params['sort'] ?? 'newest') as SortBy;
      this.sortBy = (['newest', 'oldest', 'price-asc', 'price-desc', 'title'] as SortBy[]).includes(
        s
      )
        ? s
        : 'newest';

      this.updateNavigationContext();

      if (!this.loading()) this.applyFilters(false);
    });

    await Promise.all([this.loadProducts(), this.loadCategories()]);
    this.updateNavigationContext();
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories = await this.categoryService.getAll();
    } catch (e) {
      if (!(e instanceof Error)) {
        this.toast.error('Erreur inattendue lors du chargement des catégories.');
      }
      this.categories = [];
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      const products = await this.productService.getAll();
      for (const p of products) {
        if (p && p.createdAt && typeof p.createdAt === 'string') {
          p.createdAt = new Date(p.createdAt);
        }
      }
      this.allProducts.set(products);
      await this.applyFilters(false);
    } catch (error) {
      if (!(error instanceof Error)) {
        this.toast.error('Erreur inattendue lors du chargement des produits.');
      }
    } finally {
      this.loading.set(false);
    }
  }
  async applyFilters(resetPage = true): Promise<void> {
    const filters: ProductFilter = {
      search: this.searchTerm || undefined,
      categoryId: this.selectedCategoryId ?? undefined,
      categorySlug: this.selectedCategorySlug ?? undefined,
      subCategorySlug: this.selectedSubCategorySlug ?? undefined,
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
    };

    try {
      let filtered = await this.productService.filterProducts(filters);

      // Apply promo filter if enabled
      if (this.promoOnly) {
        filtered = filtered.filter(p => p.originalPrice !== undefined && p.originalPrice > p.price);
      }

      this.filteredProducts.set(filtered);

      if (resetPage) this.goToPage(1, true);

      const max = this.pagesCount();
      if (this.page > max) this.goToPage(max || 1, true);
    } catch (error) {
      if (!(error instanceof Error)) {
        this.toast.error('Erreur inattendue lors du filtrage.');
      }
      this.filteredProducts.set([]);
      if (resetPage) this.goToPage(1, true);
    }
  }

  onSearchChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: this.searchTerm || null, page: 1 },
      queryParamsHandling: 'merge',
    });
    this.searchTimeout = setTimeout(() => this.applyFilters(), 300);
  }

  onFilterChange(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoryId: this.selectedCategoryId ?? null, page: 1 },
      queryParamsHandling: 'merge',
    });
    this.applyFilters();
  }

  onSortChange(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: this.sortBy, page: this.page },
      queryParamsHandling: 'merge',
    });
  }

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

  total = (): number => this.filteredProducts().length;
  pagesCount = (): number => Math.max(1, Math.ceil(this.total() / this.pageSize));
  startIndex = (): number => (this.page - 1) * this.pageSize;
  endIndex = (): number => Math.min(this.startIndex() + this.pageSize, this.total());

  pagedProducts(): Product[] {
    const sorted = this.sortedProducts();
    return sorted.slice(this.startIndex(), this.endIndex());
  }

  pageWindow(): number[] {
    const total = this.pagesCount();
    const current = this.page;
    const span = 2;
    let start = Math.max(1, current - span);
    let end = Math.min(total, current + span);
    if (current <= span) end = Math.min(total, start + 2 * span);
    if (current + span > total) start = Math.max(1, total - 2 * span);

    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  goToPage(n: number, noScroll = false): void {
    const max = this.pagesCount();
    this.page = Math.min(Math.max(1, n), max);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.page },
      queryParamsHandling: 'merge',
    });
    if (noScroll) return;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.selectedCategorySlug = null;
    this.selectedSubCategorySlug = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.promoOnly = false;
    this.sortBy = 'newest';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categoryId: null,
        categorySlug: null,
        subCategorySlug: null,
        search: null,
        promo: null,
        sort: null,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedCategoryId !== null ||
      this.selectedCategorySlug !== null ||
      this.selectedSubCategorySlug !== null ||
      this.minPrice !== null ||
      this.maxPrice !== null
    );
  }

  getDiscountPercentage(currentPrice: number, originalPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  onToggleFavorite(id: number): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.requireAuth('favorites');
      return;
    }
    const added = this.fav.toggle(id);
    this.toast.success(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
  }

  private updateNavigationContext(): void {
    // Mise à jour de la catégorie courante
    if (this.selectedCategorySlug) {
      const cat = this.categories.find(c => c.slug === this.selectedCategorySlug);
      this.currentCategory.set(cat ?? null);

      // Mise à jour de la sous-catégorie courante
      if (this.selectedSubCategorySlug && cat?.subCategories) {
        const subCat = cat.subCategories.find(sc => sc.slug === this.selectedSubCategorySlug);
        this.currentSubCategory.set(subCat ?? null);
      } else {
        this.currentSubCategory.set(null);
      }
    } else if (this.selectedCategoryId) {
      const cat = this.categories.find(c => c.id === this.selectedCategoryId);
      this.currentCategory.set(cat ?? null);
      this.currentSubCategory.set(null);
    } else {
      this.currentCategory.set(null);
      this.currentSubCategory.set(null);
    }
  }

  goToProduct(id: number): void {
    this.router.navigate(['/product', id]);
  }
}
