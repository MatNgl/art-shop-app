// src/app/features/admin/pages/products/admin-products.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../auth/services/auth';
import { ProductService } from '../../../catalog/services/product';
import { Product } from '../../../catalog/models/product.model';
import { CategoryService } from '../../../catalog/services/category';
import { Category, SubCategory } from '../../../catalog/models/category.model';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { AdminHeaderComponent } from '../../../../shared/components/admin-header/admin-header.component';

interface ProductStats {
  total: number;
  available: number;
  unavailable: number;
  avgPrice: number;
}

type SortBy = 'createdAt_desc' | 'title' | 'price_asc' | 'price_desc';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PricePipe, AdminHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <app-admin-header
        title="Gestion des Produits"
        description="Gérez le catalogue de produits de la boutique"
        icon="fa-cubes"
        gradientClass="bg-gradient-to-br from-green-500 to-teal-500"
      >
        <div actions class="flex items-center gap-3">
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
      </app-admin-header>

      <div class="container-wide">
        <!-- Stats rapides -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
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

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
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

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
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

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
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
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-2"
                >Recherche</label
              >
              <input
                id="searchInput"
                type="text"
                [ngModel]="searchTerm()"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Nom, référence..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="categorySelect" class="block text-sm font-medium text-gray-700 mb-2"
                >Catégorie</label
              >
              <select
                id="categorySelect"
                [ngModel]="selectedCategory()"
                (ngModelChange)="onCategoryChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option [ngValue]="''">Toutes les catégories</option>
                <option *ngFor="let cat of categories()" [ngValue]="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <!-- ✅ Filtre Sous-catégorie (dépend de la catégorie sélectionnée) -->
            <div>
              <label for="subCategorySelect" class="block text-sm font-medium text-gray-700 mb-2"
                >Sous-catégorie</label
              >
              <select
                id="subCategorySelect"
                [disabled]="!subCategoriesForSelected().length"
                [ngModel]="selectedSubCategory()"
                (ngModelChange)="onSubCategoryChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                [title]="
                  !subCategoriesForSelected().length
                    ? 'Choisissez pour commencer une catégorie'
                    : ''
                "
              >
                <option [ngValue]="''">
                  @if (selectedCategory() === '') { Toutes les sous-catégories } @else { Toutes }
                </option>
                <option *ngFor="let sub of subCategoriesForSelected()" [ngValue]="sub.id">
                  {{ sub.name }}
                </option>
              </select>
            </div>

            <div>
              <label for="availabilitySelect" class="block text-sm font-medium text-gray-700 mb-2"
                >Disponibilité</label
              >
              <select
                id="availabilitySelect"
                [ngModel]="selectedAvailability()"
                (ngModelChange)="onAvailabilityChange($event)"
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
                [ngModel]="sortBy()"
                (ngModelChange)="onSortChange($event)"
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
                    Sous-catégories
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
              <tbody class="divide-y divide-gray-200">
                @for (product of filteredProducts(); track product.id) {
                <tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="
                          (product.images && product.images[0]) ||
                          product.imageUrl ||
                          '/assets/placeholder.jpg'
                        "
                        [alt]="product.title"
                        class="w-16 h-16 rounded-lg object-cover border"
                      />
                      <div class="min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">
                          {{ product.title }}
                        </div>
                        <div class="text-xs text-gray-400 truncate">ID: {{ product.id }}</div>
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="getCategoryBadgeClass(product.categoryId)"
                    >
                      {{ getCategoryLabel(product.categoryId) }}
                    </span>
                  </td>

                  <!-- ✅ Affichage sous-catégories -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2 flex-wrap">
                      @if ((product.subCategoryIds?.length ?? 0) === 0) {
                      <span class="text-xs text-gray-400">—</span>
                      } @else { @for (sid of product.subCategoryIds!; track sid) {
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                        [title]="getSubCategoryFullPath(sid)"
                      >
                        {{ getSubCategoryLabel(sid) }}
                      </span>
                      } }
                    </div>
                  </td>

                  <!-- PRIX -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span>{{ getEffectiveLowestPrice(product) | price }}</span>
                    @if (product.reducedPrice && product.reducedPrice < product.originalPrice) {
                    <span class="ml-2 text-xs line-through text-gray-500">{{
                      product.originalPrice | price
                    }}</span>
                    }
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
              @if (searchTerm() || selectedCategory() || selectedAvailability() ||
              selectedSubCategory()) { Essayez de modifier vos critères de recherche } @else {
              Commencez par ajouter votre premier produit }
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
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  // State
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal<boolean>(true);

  // Filters
  searchTerm = signal<string>('');
  selectedCategory = signal<number | ''>('');
  selectedSubCategory = signal<number | ''>(''); // ✅ nouveau
  selectedAvailability = signal<'' | 'available' | 'unavailable'>('');
  sortBy = signal<SortBy>('createdAt_desc');

  // Derived lists
  subCategoriesForSelected = computed<SubCategory[]>(() => {
    const catId = this.selectedCategory();
    if (catId === '') return [];
    const cat = this.categories().find((c) => c.id === catId);
    return cat?.subCategories ?? [];
  });

  // Stats
  stats = computed<ProductStats>(() => {
    const prods = this.products();
    const available = prods.filter((p) => p.isAvailable).length;
    const unavailable = prods.length - available;
    const avgPrice =
      prods.length > 0 ? prods.reduce((s, p) => s + p.originalPrice, 0) / prods.length : 0;
    return { total: prods.length, available, unavailable, avgPrice };
  });

  // Filtering
  filteredProducts = computed<Product[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    const sub = this.selectedSubCategory();
    const avail = this.selectedAvailability();
    const sort = this.sortBy();

    let filtered = [...this.products()];

    if (term) {
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(term) || String(p.id).includes(term)
      );
    }

    if (cat !== '') {
      filtered = filtered.filter((p) => p.categoryId === cat);
    }

    if (sub !== '') {
      filtered = filtered.filter((p) => (p.subCategoryIds ?? []).includes(sub));
    }

    if (avail) {
      const isAvailable = avail === 'available';
      filtered = filtered.filter((p) => p.isAvailable === isAvailable);
    }

    filtered.sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price_asc':
          return a.originalPrice - b.originalPrice;
        case 'price_desc':
          return b.originalPrice - a.originalPrice;
        case 'createdAt_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  });

  async ngOnInit(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [prods, cats] = await Promise.all([
        this.productService.getAll(),
        this.categoryService.getAll(),
      ]);

      // Normalise createdAt au cas où ce soit string
      for (const p of prods) {
        if (p && typeof (p.createdAt as unknown) === 'string') {
          p.createdAt = new Date(p.createdAt as unknown as string);
        }
      }

      this.products.set(prods);
      this.categories.set(cats);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      this.toast.error('Impossible de charger les produits.');
    } finally {
      this.loading.set(false);
    }
  }

  // Handlers
  onSearchChange(v: string) {
    this.searchTerm.set(v ?? '');
  }

  onCategoryChange(v: number | '') {
    this.selectedCategory.set(v === null || v === undefined ? '' : v);
    // Reset sous-catégorie quand la catégorie change
    this.selectedSubCategory.set('');
  }

  onSubCategoryChange(v: number | '') {
    this.selectedSubCategory.set(v === null || v === undefined ? '' : v);
  }

  onAvailabilityChange(v: '' | 'available' | 'unavailable') {
    this.selectedAvailability.set(v ?? '');
  }

  onSortChange(v: SortBy) {
    this.sortBy.set(v ?? 'createdAt_desc');
  }

  async refreshData(): Promise<void> {
    await this.loadData();
    this.toast.success('Produits actualisés');
  }

  createProduct(): void {
    this.router.navigate(['/admin/products/new']);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/admin/products', product.id, 'edit']);
  }

  async toggleAvailability(product: Product): Promise<void> {
    const newAvailability = !product.isAvailable;
    const ok = await this.confirm.ask({
      title: newAvailability ? 'Rendre disponible ?' : 'Rendre indisponible ?',
      message:
        'Vous êtes sur le point de ' +
        (newAvailability ? 'rendre disponible' : 'rendre indisponible') +
        ` « ${product.title} ».`,
      confirmText: newAvailability ? 'Rendre disponible' : 'Rendre indisponible',
      cancelText: 'Annuler',
      variant: 'primary',
    });
    if (!ok) return;

    try {
      await this.productService.updateProductAvailability(product.id, newAvailability);
      await this.loadData();
      this.toast.success(`Produit ${newAvailability ? 'rendu disponible' : 'rendu indisponible'}`);
    } catch (err) {
      console.error(err);
      this.toast.error('La mise à jour de la disponibilité a échoué.');
    }
  }

  async deleteProduct(product: Product): Promise<void> {
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
      await this.loadData();
      this.toast.success('Produit supprimé.');
    } catch (err) {
      console.error(err);
      this.toast.error('La suppression a échoué.');
    }
  }

  // Helpers

  /** Renvoie le prix le plus bas à afficher (réduit si disponible, sinon original). */
  getEffectiveLowestPrice(p: Product): number {
    const base = p.originalPrice;
    const reduced = typeof p.reducedPrice === 'number' ? p.reducedPrice : Number.POSITIVE_INFINITY;
    return Math.min(base, reduced);
  }

  getCategoryLabel(categoryId?: number): string {
    if (typeof categoryId !== 'number') return '—';
    const cat = this.categories().find((c) => c.id === categoryId);
    return cat ? cat.name : `Catégorie #${categoryId}`;
  }

  getSubCategoryLabel(subId: number): string {
    for (const c of this.categories()) {
      const s = c.subCategories?.find((sc) => sc.id === subId);
      if (s) return s.name;
    }
    return `#${subId}`;
  }

  getSubCategoryFullPath(subId: number): string {
    for (const c of this.categories()) {
      const s = c.subCategories?.find((sc) => sc.id === subId);
      if (s) return `${c.name} › ${s.name}`;
    }
    return `Sous-catégorie #${subId}`;
  }

  getCategoryBadgeClass(categoryId?: number): string {
    switch (categoryId) {
      case 1:
        return 'bg-amber-100 text-amber-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 3:
        return 'bg-fuchsia-100 text-fuchsia-800';
      case 4:
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
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
