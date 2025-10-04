// src/app/features/admin/pages/categories/admin-categories.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../auth/services/auth';
import { CategoryService } from '../../../catalog/services/category';
import { Category, SubCategory } from '../../../catalog/models/category.model';
import { ProductService } from '../../../catalog/services/product';
import { Product } from '../../../catalog/models/product.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { SubCategoryFormModalComponent } from './subcategory-form-modal.component';

interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  avgProducts: number;
}

type SortBy = 'createdAt_desc' | 'name' | 'products_desc' | 'products_asc';

/** Compte fiable des produits par catégorie (via Product.categoryId). */
function buildCategoryCountMap(products: Product[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const p of products) {
    if (typeof p.categoryId === 'number') {
      map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    }
  }
  return map;
}

/** Compte fiable des produits par sous-catégorie (via Product.subCategoryIds). */
function buildSubCategoryCountMap(products: Product[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const p of products) {
    for (const subId of p.subCategoryIds ?? []) {
      map.set(subId, (map.get(subId) ?? 0) + 1);
    }
  }
  return map;
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SubCategoryFormModalComponent,
  ],
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
                <span class="text-gray-900">Catégories</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Gestion des Catégories</h1>
              <p class="text-gray-600 mt-1">Gérez vos catégories et sous-catégories</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                (click)="refreshData()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <i class="fa-solid fa-arrows-rotate text-sm"></i>
                Actualiser
              </button>
              <button
                (click)="createCategory()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <i class="fa-solid fa-plus text-sm"></i>
                Nouvelle catégorie
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Catégories</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().total }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-tags text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Actives</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().active }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-check text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Inactives</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().inactive }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-pause text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Produits / catégorie</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().avgProducts }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-cubes text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Recherche</span>
              <input
                type="text"
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                placeholder="Nom, slug, ID..."
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Statut</span>
              <select
                [ngModel]="selectedStatus()"
                (ngModelChange)="selectedStatus.set($event)"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </div>

            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Tri</span>
              <select
                [ngModel]="sortBy()"
                (ngModelChange)="sortBy.set($event)"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt_desc">Plus récent</option>
                <option value="name">Nom A-Z</option>
                <option value="products_desc">Produits décroissant</option>
                <option value="products_asc">Produits croissant</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Liste des catégories ({{ filteredCategories().length }})
            </h3>
            <div class="text-sm text-gray-500">
              {{ filteredCategories().length }} / {{ categories().length }} catégories
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
          } @else if (filteredCategories().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="w-12 px-6 py-3"></th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Catégorie
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Slug
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Produits
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sous-cat.
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (cat of filteredCategories(); track cat.id) {
                <!-- Ligne catégorie principale -->
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4">
                    @if ((cat.subCategories?.length ?? 0) > 0) {
                    <button
                      (click)="toggleExpand(cat.id)"
                      class="text-gray-500 hover:text-gray-700 focus:outline-none"
                      type="button"
                    >
                      <i
                        class="fa-solid text-sm transition-transform"
                        [class.fa-chevron-right]="!isExpanded(cat.id)"
                        [class.fa-chevron-down]="isExpanded(cat.id)"
                      ></i>
                    </button>
                    }
                  </td>

                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                        [style.background]="cat.color || '#eef2ff'"
                      >
                        <i class="fa-solid text-sm" [ngClass]="cat.icon || 'fa-tags'"></i>
                      </div>
                      <div class="min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">{{ cat.name }}</div>
                        <div class="text-xs text-gray-400">ID: {{ cat.id }}</div>
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4 text-sm text-gray-600">{{ cat.slug }}</td>

                  <td class="px-6 py-4">
                    <span class="text-sm font-medium text-gray-900">{{ productCount(cat.id) }}</span>
                  </td>

                  <td class="px-6 py-4">
                    <span class="text-sm text-gray-600">{{ cat.subCategories?.length || 0 }}</span>
                  </td>

                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="
                        cat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      "
                    >
                      {{ cat.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>

                  <td class="px-6 py-4 text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button
                        (click)="editCategory(cat)"
                        class="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                        title="Modifier"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        (click)="toggleActive(cat)"
                        class="text-orange-600 hover:bg-orange-50 px-2 py-1 rounded"
                        [title]="cat.isActive ? 'Désactiver' : 'Activer'"
                      >
                        <i class="fa-solid" [ngClass]="cat.isActive ? 'fa-pause' : 'fa-play'"></i>
                      </button>
                      <button
                        (click)="deleteCategory(cat)"
                        class="text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                        title="Supprimer"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Sous-tableau des sous-catégories (si expand) -->
                @if (isExpanded(cat.id)) {
                <tr>
                  <td colspan="7" class="bg-gray-50 px-6 py-4">
                    <div class="bg-white rounded-lg border">
                      <!-- Header sous-tableau -->
                      <div class="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex items-center justify-between">
                        <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <i class="fa-solid fa-layer-group text-blue-600"></i>
                          Sous-catégories de {{ cat.name }}
                          <span class="text-xs font-normal text-gray-600">({{ cat.subCategories?.length || 0 }})</span>
                        </h4>
                        <button
                          (click)="openSubCategoryModal(cat.id, cat.name, null)"
                          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium shadow-sm hover:shadow transition-all"
                          type="button"
                        >
                          <i class="fa-solid fa-plus"></i>
                          Nouvelle sous-catégorie
                        </button>
                      </div>

                      <!-- Liste des sous-catégories -->
                      @if ((cat.subCategories?.length ?? 0) > 0) {
                      <div class="p-4 space-y-2">
                        @for (sub of cat.subCategories; track sub.id) {
                        <div class="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
                          <!-- Indicateur coloré -->
                          <div class="w-1 h-12 rounded-full" [class.bg-green-500]="sub.isActive" [class.bg-gray-400]="!sub.isActive"></div>

                          <!-- Informations -->
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                              <h5 class="text-sm font-semibold text-gray-900">{{ sub.name }}</h5>
                              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                                [class.bg-green-100]="sub.isActive"
                                [class.text-green-700]="sub.isActive"
                                [class.bg-gray-100]="!sub.isActive"
                                [class.text-gray-700]="!sub.isActive"
                              >
                                {{ sub.isActive ? 'Active' : 'Inactive' }}
                              </span>
                            </div>
                            <div class="flex items-center gap-3 text-xs text-gray-600">
                              <span><i class="fa-solid fa-link mr-1"></i>{{ sub.slug }}</span>
                              <span class="text-gray-400">•</span>
                              <span><i class="fa-solid fa-boxes-stacked mr-1 text-purple-600"></i>{{ subProductCount(sub.id) }} produit(s)</span>
                              @if (sub.description) {
                              <span class="text-gray-400">•</span>
                              <span class="truncate max-w-xs">{{ sub.description }}</span>
                              }
                            </div>
                          </div>

                          <!-- Actions -->
                          <div class="flex items-center gap-2">
                            <button
                              (click)="openSubCategoryModal(cat.id, cat.name, sub)"
                              class="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-sm transition-colors flex items-center gap-2"
                              title="Gérer cette sous-catégorie"
                              type="button"
                            >
                              <i class="fa-solid fa-cog"></i>
                              Gérer
                            </button>

                            <button
                              (click)="quickToggleSubCategory(cat.id, sub)"
                              class="px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                              [class.text-orange-600]="sub.isActive"
                              [class.text-green-600]="!sub.isActive"
                              [title]="sub.isActive ? 'Désactiver' : 'Activer'"
                              type="button"
                            >
                              <i class="fa-solid" [class.fa-pause]="sub.isActive" [class.fa-play]="!sub.isActive"></i>
                            </button>

                            <button
                              (click)="deleteSubCategory(cat.id, sub)"
                              class="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Supprimer"
                              type="button"
                            >
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                        }
                      </div>
                      } @else {
                      <div class="p-12 text-center">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <i class="fa-solid fa-layer-group text-2xl text-gray-400"></i>
                        </div>
                        <p class="text-sm font-medium text-gray-900 mb-1">Aucune sous-catégorie</p>
                        <p class="text-xs text-gray-500 mb-4">Créez votre première sous-catégorie pour organiser vos produits</p>
                        <button
                          (click)="openSubCategoryModal(cat.id, cat.name, null)"
                          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                          type="button"
                        >
                          <i class="fa-solid fa-plus"></i>
                          Créer une sous-catégorie
                        </button>
                      </div>
                      }
                    </div>
                  </td>
                </tr>
                }
                }
              </tbody>
            </table>
          </div>
          } @else {
          <div class="p-8 text-center">
            <i class="fa-solid fa-tags text-4xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-900 mb-2">Aucune catégorie trouvée</p>
            <p class="text-sm text-gray-500 mb-6">
              @if (searchTerm() || selectedStatus()) { Modifiez vos critères } @else { Commencez par
              créer une catégorie }
            </p>
            <button
              (click)="createCategory()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <i class="fa-solid fa-plus"></i> Ajouter une catégorie
            </button>
          </div>
          }
        </div>
      </div>
    </div>

    <!-- SubCategory Form Modal -->
    @if (subCategoryModalState()) {
    <app-subcategory-form-modal
      [categoryId]="subCategoryModalState()!.categoryId"
      [categoryName]="subCategoryModalState()!.categoryName"
      [subCategory]="subCategoryModalState()!.subCategory"
      (saved)="onSubCategorySaved()"
      (closed)="closeSubCategoryModal()"
    ></app-subcategory-form-modal>
    }
  `,
})
export class AdminCategoriesComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private categoriesSvc = inject(CategoryService);
  private productsSvc = inject(ProductService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  categories = signal<Category[]>([]);
  private products = signal<Product[]>([]);
  loading = signal(true);

  searchTerm = signal<string>('');
  selectedStatus = signal<string>(''); // '' | 'active' | 'inactive'
  sortBy = signal<SortBy>('createdAt_desc');

  expandedCategoryIds = signal<Set<number>>(new Set());

  subCategoryModalState = signal<{
    categoryId: number;
    categoryName: string;
    subCategory: SubCategory | null;
  } | null>(null);

  private productCountMap = computed<Map<number, number>>(() =>
    buildCategoryCountMap(this.products())
  );

  private subProductCountMap = computed<Map<number, number>>(() =>
    buildSubCategoryCountMap(this.products())
  );

  stats = computed<CategoryStats>(() => {
    const list = this.categories();
    const total = list.length;
    const active = list.filter((c) => c.isActive).length;
    const inactive = total - active;

    if (!total) return { total, active, inactive, avgProducts: 0 };

    let sum = 0;
    const map = this.productCountMap();
    for (const c of list) sum += map.get(c.id) ?? 0;

    const avgProducts = Math.round(sum / total);
    return { total, active, inactive, avgProducts };
  });

  filteredCategories = computed<Category[]>(() => {
    let arr = [...this.categories()];

    const q = this.searchTerm().trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          String(c.id).includes(q)
      );
    }

    const status = this.selectedStatus();
    if (status) {
      const active = status === 'active';
      arr = arr.filter((c) => c.isActive === active);
    }

    const sort = this.sortBy();
    const map = this.productCountMap();
    arr.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'products_asc':
          return (map.get(a.id) ?? 0) - (map.get(b.id) ?? 0);
        case 'products_desc':
          return (map.get(b.id) ?? 0) - (map.get(a.id) ?? 0);
        case 'createdAt_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return arr;
  });

  productCount = (categoryId: number): number => {
    // Cumul des produits de la catégorie + tous ses sous-catégories
    const category = this.categories().find((c) => c.id === categoryId);
    if (!category) return 0;

    let total = 0;

    // Compter les produits directs de la catégorie (legacy, seulement si pas de sous-catégories)
    if (!category.subCategories || category.subCategories.length === 0) {
      total = category.productIds?.length ?? 0;
    }

    // Ajouter les produits de chaque sous-catégorie (basé sur SubCategory.productIds)
    for (const sub of category.subCategories ?? []) {
      total += sub.productIds?.length ?? 0;
    }

    return total;
  };

  subProductCount = (subCategoryId: number): number => {
    // Chercher dans toutes les catégories
    for (const cat of this.categories()) {
      const sub = cat.subCategories?.find(s => s.id === subCategoryId);
      if (sub) {
        return sub.productIds?.length ?? 0;
      }
    }
    return 0;
  };

  async ngOnInit(): Promise<void> {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [cats, prods] = await Promise.all([
        this.categoriesSvc.getAll(),
        this.productsSvc.getAll(),
      ]);
      this.categories.set(cats);
      this.products.set(prods);
    } catch (e) {
      console.error(e);
      this.toast.error('Impossible de charger les catégories.');
    } finally {
      this.loading.set(false);
    }
  }

  async refreshData(): Promise<void> {
    await this.loadData();
    this.toast.success('Catégories actualisées');
  }

  createCategory(): void {
    this.router.navigate(['/admin/categories/new']);
  }

  editCategory(cat: Category): void {
    this.router.navigate(['/admin/categories', cat.id, 'edit']);
  }

  async toggleActive(cat: Category): Promise<void> {
    const to = !cat.isActive;
    const ok = await this.confirm.ask({
      title: to ? 'Activer la catégorie ?' : 'Désactiver la catégorie ?',
      message: `Vous êtes sur le point de ${to ? 'activer' : 'désactiver'} « ${cat.name} ».`,
      confirmText: to ? 'Activer' : 'Désactiver',
      cancelText: 'Annuler',
      variant: 'primary',
    });
    if (!ok) return;

    try {
      await this.categoriesSvc.update(cat.id, { isActive: to });
      await this.loadData();
      this.toast.success(`Catégorie ${to ? 'activée' : 'désactivée'}.`);
    } catch {
      this.toast.error('La mise à jour a échoué.');
    }
  }

  async deleteCategory(cat: Category): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Supprimer la catégorie',
      message: `Cette action est irréversible. Confirmez la suppression de « ${cat.name} ».`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await this.categoriesSvc.remove(cat.id);
      await this.loadData();
      this.toast.success('Catégorie supprimée.');
    } catch {
      this.toast.error('La suppression a échoué.');
    }
  }

  // Expand/Collapse
  isExpanded(categoryId: number): boolean {
    return this.expandedCategoryIds().has(categoryId);
  }

  toggleExpand(categoryId: number): void {
    const current = new Set(this.expandedCategoryIds());
    if (current.has(categoryId)) {
      current.delete(categoryId);
    } else {
      current.add(categoryId);
    }
    this.expandedCategoryIds.set(current);
  }

  // Subcategory modal
  openSubCategoryModal(categoryId: number, categoryName: string, subCategory: SubCategory | null): void {
    this.subCategoryModalState.set({ categoryId, categoryName, subCategory });
  }

  closeSubCategoryModal(): void {
    this.subCategoryModalState.set(null);
  }

  async onSubCategorySaved(): Promise<void> {
    await this.loadData();
  }

  // Quick actions sur les sous-catégories
  async quickToggleSubCategory(categoryId: number, subCategory: SubCategory): Promise<void> {
    const newStatus = !subCategory.isActive;

    try {
      await this.categoriesSvc.updateSubCategory(categoryId, subCategory.id, {
        isActive: newStatus,
      });
      await this.loadData();
      this.toast.success(
        newStatus ? 'Sous-catégorie activée' : 'Sous-catégorie désactivée'
      );
    } catch (error) {
      console.error(error);
      this.toast.error('Échec du changement de statut');
    }
  }

  async deleteSubCategory(categoryId: number, subCategory: SubCategory): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Supprimer la sous-catégorie',
      message: `Êtes-vous sûr de vouloir supprimer « ${subCategory.name} » ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });

    if (!ok) return;

    try {
      await this.categoriesSvc.removeSubCategory(categoryId, subCategory.id);
      await this.loadData();
      this.toast.success('Sous-catégorie supprimée');
    } catch (error) {
      console.error(error);
      this.toast.error('Échec de la suppression');
    }
  }
}
