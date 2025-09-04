import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { Product, ProductCategory, ProductFilter } from '../../models/product.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

        <!-- Résultats et tri -->
        <div class="flex justify-between items-center mb-6">
          <p class="text-gray-600">
            @if (loading()) { Chargement... } @else {
            {{ filteredProducts().length }} œuvre(s) trouvée(s) }
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
          <div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div class="h-64 bg-gray-300"></div>
            <div class="p-4">
              <div class="h-4 bg-gray-300 rounded mb-2"></div>
              <div class="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
              <div class="h-5 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
          }
        </div>
        } @else if (filteredProducts().length === 0) {
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
          @for (product of sortedProducts(); track product.id) {
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
          >
            <div class="relative overflow-hidden">
              <img
                [src]="product.imageUrl"
                [alt]="product.title"
                class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              @if (product.originalPrice) {
              <div
                class="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold"
              >
                -{{ getDiscountPercentage(product.price, product.originalPrice) }}%
              </div>
              } @if (product.isLimitedEdition) {
              <div
                class="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded text-xs font-semibold"
              >
                Édition Limitée
              </div>
              }
              <div
                class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center"
              >
                <a
                  [routerLink]="['/product', product.id]"
                  class="bg-white text-gray-900 px-4 py-2 rounded-full font-semibold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                >
                  Voir Détails
                </a>
              </div>
            </div>

            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <h3 class="text-lg font-semibold text-gray-900 line-clamp-1">
                  {{ product.title }}
                </h3>
                @if (product.isLimitedEdition && product.editionNumber && product.totalEditions) {
                <span class="text-xs text-gray-500 ml-2 whitespace-nowrap">
                  {{ product.editionNumber }}/{{ product.totalEditions }}
                </span>
                }
              </div>

              <div class="flex items-center mb-3">
                <img
                  [src]="product.artist.profileImage || '/assets/default-avatar.png'"
                  [alt]="product.artist.name"
                  class="w-6 h-6 rounded-full mr-2"
                />
                <div class="text-sm text-gray-600 truncate">
                  {{ product.artist.name }}
                </div>
              </div>

              <p class="text-xs text-gray-500 mb-3">{{ product.technique }}</p>

              <div class="flex items-center justify-between">
                @if (product.originalPrice) {
                <div class="flex items-center space-x-2">
                  <span class="text-lg font-bold text-green-600">{{ product.price }}€</span>
                  <span class="text-sm text-gray-500 line-through"
                    >{{ product.originalPrice }}€</span
                  >
                </div>
                } @else {
                <span class="text-lg font-bold text-gray-900">{{ product.price }}€</span>
                }
              </div>

              <div class="mt-3 flex flex-wrap gap-1">
                @for (tag of product.tags.slice(0, 2); track tag) {
                <span class="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                  {{ tag }}
                </span>
                }
              </div>
            </div>
          </div>
          }
        </div>
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

  allProducts = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  loading = signal(true);

  categories = Object.values(ProductCategory);

  // Filtres
  searchTerm = '';
  selectedCategory = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy = 'newest';

  private searchTimeout?: ReturnType<typeof setTimeout>;

  async ngOnInit() {
    // Récupérer les paramètres de query string
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
    });

    await this.loadProducts();
  }

  async loadProducts() {
    try {
      const products = await this.productService.getAllProducts();
      this.allProducts.set(products);
      await this.applyFilters();
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async applyFilters() {
    const filters: ProductFilter = {
      search: this.searchTerm || undefined,
      category: (this.selectedCategory as ProductCategory) || undefined,
      minPrice: this.minPrice || undefined,
      maxPrice: this.maxPrice || undefined,
    };

    try {
      const filtered = await this.productService.searchProducts(filters);
      this.filteredProducts.set(filtered);
    } catch (error) {
      console.error('Erreur lors du filtrage:', error);
      this.filteredProducts.set([]);
    }
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.applyFilters(), 300);
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSortChange() {
    // Le tri est géré côté client car il ne change pas les données filtrées
  }

  sortedProducts(): Product[] {
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

  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'newest';

    // Supprimer les paramètres de l'URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });

    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedCategory || this.minPrice || this.maxPrice);
  }

  getDiscountPercentage(currentPrice: number, originalPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
}
