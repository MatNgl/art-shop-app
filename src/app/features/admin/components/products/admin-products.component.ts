// src/app/features/admin/components/products/admin-products.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { ProductService } from '../../../catalog/services/product';
import { Product, ProductCategory } from '../../../catalog/models/product.model';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

interface ProductStats {
  total: number;
  available: number;
  unavailable: number;
  avgPrice: number;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PricePipe],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a>
                <span>•</span>
                <span class="text-gray-900">Produits</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
              <p class="text-gray-600 mt-1">Gérez le catalogue de produits de la boutique</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                (click)="refreshData()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <i class="fa-solid fa-arrows-rotate text-sm"></i>
                Actualiser
              </button>
              <button
                (click)="createProduct()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <i class="fa-solid fa-plus text-sm"></i>
                Nouveau produit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Stats rapides -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Produits</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().total }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-cubes text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Disponibles</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().available }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-eye text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Indisponibles</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().unavailable }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-eye-slash text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Prix Moyen</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().avgPrice | price }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-euro-sign text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres et recherche -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-2"
                >Recherche</label
              >
              <input
                id="searchInput"
                type="text"
                [(ngModel)]="searchTerm"
                (input)="applyFilters()"
                placeholder="Nom, artiste, référence..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="categorySelect" class="block text-sm font-medium text-gray-700 mb-2"
                >Catégorie</label
              >
              <select
                id="categorySelect"
                [(ngModel)]="selectedCategory"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les catégories</option>
                <option *ngFor="let cat of categories" [value]="cat">
                  {{ getCategoryLabel(cat) }}
                </option>
              </select>
            </div>

            <div>
              <label for="availabilitySelect" class="block text-sm font-medium text-gray-700 mb-2"
                >Disponibilité</label
              >
              <select
                id="availabilitySelect"
                [(ngModel)]="selectedAvailability"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les produits</option>
                <option value="available">Disponible</option>
                <option value="unavailable">Indisponible</option>
              </select>
            </div>

            <div>
              <label for="sortBySelect" class="block text-sm font-medium text-gray-700 mb-2"
                >Tri</label
              >
              <select
                id="sortBySelect"
                [(ngModel)]="sortBy"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt_desc">Plus récent</option>
                <option value="title">Nom A-Z</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table des produits -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Liste des produits ({{ filteredProducts().length }})
            </h3>
            <div class="text-sm text-gray-500">
              {{ filteredProducts().length }} / {{ products().length }} produits
            </div>
          </div>

          @if (loading()) {
          <div class="p-6">
            <div class="space-y-4">
              @for (i of [1,2,3,4,5,6]; track i) {
              <div class="h-20 bg-gray-100 rounded animate-pulse"></div>
              }
            </div>
          </div>
          } @else if (filteredProducts().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Produit
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Catégorie
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Prix
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Stock
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Disponibilité
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Créé le
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (product of filteredProducts(); track product.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="product.images[0] || '/assets/placeholder.jpg'"
                        [alt]="product.title"
                        class="w-16 h-16 rounded-lg object-cover border"
                      />
                      <div class="min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">
                          {{ product.title }}
                        </div>
                        <div class="text-sm text-gray-500 truncate">
                          {{ getArtistName(product) }}
                        </div>
                        <div class="text-xs text-gray-400 truncate">ID: {{ product.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="getCategoryBadgeClass(product.category)"
                    >
                      {{ getCategoryLabel(product.category) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ product.price | price }}
                    <div *ngIf="product.originalPrice" class="text-xs text-gray-500 line-through">
                      {{ product.originalPrice | price }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span class="font-medium">{{ product.stock }}</span> unités
                    <div *ngIf="product.isLimitedEdition" class="text-xs text-purple-600">
                      Édition limitée
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="getAvailabilityBadgeClass(product.isAvailable)"
                    >
                      {{ product.isAvailable ? 'Disponible' : 'Indisponible' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(product.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button
                        [routerLink]="['/product', product.id]"
                        class="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        title="Voir le produit"
                      >
                        <i class="fa-solid fa-eye"></i>
                      </button>
                      <button
                        (click)="editProduct(product)"
                        class="text-green-600 hover:text-green-900 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                        title="Modifier"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        (click)="toggleAvailability(product)"
                        class="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                        [title]="product.isAvailable ? 'Rendre indisponible' : 'Rendre disponible'"
                      >
                        <i
                          class="fa-solid"
                          [ngClass]="product.isAvailable ? 'fa-eye-slash' : 'fa-eye'"
                        ></i>
                      </button>
                      <button
                        (click)="deleteProduct(product)"
                        class="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        title="Supprimer"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
          } @else {
          <div class="p-8 text-center">
            <i class="fa-solid fa-cubes text-4xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</p>
            <p class="text-sm text-gray-500 mb-6">
              @if (searchTerm || selectedCategory || selectedAvailability) { Essayez de modifier vos
              critères de recherche } @else { Commencez par ajouter votre premier produit }
            </p>
            <button
              (click)="createProduct()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <i class="fa-solid fa-plus"></i>
              Ajouter un produit
            </button>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminProductsComponent implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  // State
  products = signal<Product[]>([]);
  loading = signal(true);

  // Filters
  searchTerm = '';
  selectedCategory = '';
  selectedAvailability = '';
  sortBy = 'createdAt_desc';

  // Categories
  categories = Object.values(ProductCategory);

  // Computed
  stats = computed(() => {
    const prods = this.products();
    const available = prods.filter((p) => p.isAvailable).length;
    const unavailable = prods.filter((p) => !p.isAvailable).length;
    const avgPrice =
      prods.length > 0 ? prods.reduce((sum, p) => sum + p.price, 0) / prods.length : 0;

    return {
      total: prods.length,
      available,
      unavailable,
      avgPrice,
    } satisfies ProductStats;
  });

  filteredProducts = computed(() => {
    let filtered = [...this.products()];

    // Recherche textuelle
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          this.getArtistName(p).toLowerCase().includes(term) ||
          p.id.toString().includes(term)
      );
    }

    // Filtre par catégorie
    if (this.selectedCategory) {
      filtered = filtered.filter((p) => p.category === this.selectedCategory);
    }

    // Filtre par disponibilité
    if (this.selectedAvailability) {
      const isAvailable = this.selectedAvailability === 'available';
      filtered = filtered.filter((p) => p.isAvailable === isAvailable);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'createdAt_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  });

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    await this.loadProducts();
  }

  applyFilters() {
    // Les filtres sont appliqués automatiquement via les computed signals
  }

  async refreshData() {
    await this.loadProducts();
  }

  async loadProducts() {
    this.loading.set(true);
    try {
      const products = await this.productService.getAllProducts();
      this.products.set(products);
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
      this.toast.error('Impossible de charger les produits.');
    } finally {
      this.loading.set(false);
    }
  }

  createProduct() {
    this.router.navigate(['/admin/products/new']);
  }

  editProduct(product: Product) {
    this.router.navigate(['/admin/products', product.id, 'edit']);
  }

  async toggleAvailability(product: Product) {
    const newAvailability = !product.isAvailable;

    const ok = await this.confirm.ask({
      title: newAvailability ? 'Rendre disponible ?' : 'Rendre indisponible ?',
      message: `Vous êtes sur le point de ${
        newAvailability ? 'rendre disponible' : 'rendre indisponible'
      } « ${product.title} ». Vous pourrez changer cet état plus tard.`,
      confirmText: newAvailability ? 'Rendre disponible' : 'Rendre indisponible',
      cancelText: 'Annuler',
      variant: 'primary',
    });
    if (!ok) return;

    try {
      await this.productService.updateProductAvailability(product.id, newAvailability);
      await this.loadProducts();
      this.toast.success(`Produit ${newAvailability ? 'rendu disponible' : 'rendu indisponible'}`);
    } catch (err) {
      console.error(err);
      this.toast.error('La mise à jour de la disponibilité a échoué.');
    }
  }

  async deleteProduct(product: Product) {
    const ok = await this.confirm.ask({
      title: 'Supprimer le produit',
      message: `Cette action est irréversible. Confirmez la suppression de « ${product.title} ».`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await this.productService.deleteProduct(product.id);
      await this.loadProducts();
      this.toast.success('Produit supprimé.');
    } catch (err) {
      console.error(err);
      this.toast.error('La suppression a échoué.');
    }
  }

  // Helpers

  getArtistName(product: Product): string {
    if (typeof product.artist === 'string') {
      return product.artist;
    }
    if (typeof product.artist === 'number') {
      return `Artist #${product.artist}`;
    }
    return product.artist?.name ?? 'Artiste inconnu';
  }

  getCategoryLabel(category: ProductCategory): string {
    return this.productService.getCategoryLabel(category);
  }

  getCategoryBadgeClass(category: ProductCategory): string {
    const classes: Record<ProductCategory, string> = {
      [ProductCategory.DRAWING]: 'bg-amber-100 text-amber-800',
      [ProductCategory.PAINTING]: 'bg-blue-100 text-blue-800',
      [ProductCategory.DIGITAL_ART]: 'bg-fuchsia-100 text-fuchsia-800',
      [ProductCategory.PHOTOGRAPHY]: 'bg-emerald-100 text-emerald-800',
      [ProductCategory.SCULPTURE]: 'bg-orange-100 text-orange-800',
      [ProductCategory.MIXED_MEDIA]: 'bg-violet-100 text-violet-800',
    };
    return classes[category];
  }

  getAvailabilityBadgeClass(isAvailable: boolean): string {
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
