import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { CategoryService } from '../../../catalog/services/category';
import { Category } from '../../../catalog/models/category.model';
import { ProductService } from '../../../catalog/services/product';
import { Product } from '../../../catalog/models/product.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  avgProducts: number;
}

type SortBy = 'createdAt_desc' | 'name' | 'products_desc' | 'products_asc';

/** Extrais de façon sûre tous les IDs de catégorie possibles depuis un Product,
 *  en gérant plusieurs schémas (categoryId, category?.id, categoryIds:number[]). */
function extractCategoryIds(p: Product): number[] {
  const ids: number[] = [];
  const rec = p as unknown as Record<string, unknown>;

  // 1) categoryId: number
  const categoryId = rec['categoryId'];
  if (typeof categoryId === 'number') ids.push(categoryId);

  // 2) category?.id: number
  const category = rec['category'];
  if (category && typeof category === 'object') {
    const cid = (category as Record<string, unknown>)['id'];
    if (typeof cid === 'number') ids.push(cid);
  }

  // 3) categoryIds: number[]
  const categoryIds = rec['categoryIds'];
  if (Array.isArray(categoryIds)) {
    for (const v of categoryIds) {
      if (typeof v === 'number') ids.push(v);
    }
  }

  // unicité
  return Array.from(new Set(ids));
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
              <p class="text-gray-600 mt-1">Créez, modifiez et organisez vos catégories</p>
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
                    Statut
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Créée le
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (cat of filteredCategories(); track cat.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-full border flex items-center justify-center"
                        [style.background]="cat.color || '#eef2ff'"
                      >
                        <i class="fa-solid text-xs" [ngClass]="cat.icon || 'fa-tags'"></i>
                      </div>
                      <div class="min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">{{ cat.name }}</div>
                        <div class="text-xs text-gray-400 truncate">ID: {{ cat.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm">{{ cat.slug }}</td>

                  <!-- ✅ Compte produit fiable -->
                  <td class="px-6 py-4 text-sm">{{ productCount(cat.id) }}</td>

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
                  <td class="px-6 py-4 text-sm text-gray-500">{{ formatDate(cat.createdAt) }}</td>
                  <td class="px-6 py-4 text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button
                        (click)="editCategory(cat)"
                        class="text-green-600 hover:bg-green-50 px-2 py-1 rounded"
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
  /** Tous les produits pour calculer les compteurs */
  private products = signal<Product[]>([]);
  loading = signal(true);

  searchTerm = signal<string>('');
  selectedStatus = signal<string>(''); // '' | 'active' | 'inactive'
  sortBy = signal<SortBy>('createdAt_desc');

  /** Map<CategoryId, Count> recalculée quand la liste produits change */
  private productCountMap = computed<Map<number, number>>(() => {
    const map = new Map<number, number>();
    for (const p of this.products()) {
      const ids = extractCategoryIds(p);
      for (const id of ids) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return map;
  });

  /** Stats globales basées sur le vrai comptage */
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

  /** Liste filtrée/triée — utilise le vrai nombre de produits */
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

  /** Helper lu par le template */
  productCount = (categoryId: number): number => this.productCountMap().get(categoryId) ?? 0;

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

  formatDate(d: string | Date): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
