// FILE: src/app/features/promotions/pages/promotions-list.component.ts
import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PromotionsStore } from '../services/promotions-store';
import { Promotion } from '../models/promotion.model';
import { ToastService } from '../../../shared/services/toast.service';
import { AdminHeaderComponent } from '../../../shared/components/admin-header/admin-header.component';

interface PromotionKPIs {
  total: number;
  active: number;
  codes: number;
  automatic: number;
}

type StatusFilter = 'all' | 'active' | 'inactive';
type TypeFilter = 'all' | 'automatic' | 'code';
type SortBy = 'name_asc' | 'start_desc' | 'status';

@Component({
  selector: 'app-promotions-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AdminHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <app-admin-header
        title="Gestion des Promotions"
        [description]="store.count() + ' promotion(s) · ' + store.activeCount() + ' active(s)'"
        icon="fa-percent"
        gradientClass="bg-gradient-to-br from-orange-500 to-red-500"
      >
        <div actions class="flex flex-wrap items-center gap-3">
          <button
            (click)="refresh()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <i class="fa-solid fa-arrows-rotate text-sm"></i>
            Actualiser
          </button>

          <button
            (click)="exportCsv()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            [disabled]="store.loading() || paginatedPromotions().length === 0"
            title="Exporter les promotions filtrées"
          >
            <i class="fa-solid fa-file-csv"></i>
            Export CSV
          </button>

          <button
            (click)="navigateToCreate()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
          >
            <i class="fa-solid fa-plus"></i>
            Nouvelle promotion
          </button>
        </div>
      </app-admin-header>

      <!-- Content -->
      <div class="container-wide pb-8">
        <!-- Filtres & outils -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <!-- Recherche -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2" for="search"
                >Recherche</label
              >
              <div class="relative">
                <input
                  id="search"
                  type="text"
                  [ngModel]="searchTerm()"
                  (ngModelChange)="searchTerm.set($event)"
                  placeholder="Nom ou code promo…"
                  class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autocomplete="off"
                />
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-500"></i>
                <button
                  *ngIf="searchTerm()"
                  type="button"
                  (click)="clearSearch()"
                  class="absolute right-2 top-1.5 px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                  aria-label="Effacer la recherche"
                >
                  Effacer
                </button>
              </div>
            </div>

            <!-- Statut -->
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Statut</span>
              <select
                [ngModel]="filterStatus()"
                (ngModelChange)="filterStatus.set($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Toutes les promotions</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </div>

            <!-- Type -->
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Type</span>
              <select
                [ngModel]="filterType()"
                (ngModelChange)="filterType.set($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tous les types</option>
                <option value="automatic">Automatiques</option>
                <option value="code">Codes promo</option>
              </select>
            </div>

            <!-- Tri -->
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Trier par</span>
              <select
                [ngModel]="sortBy()"
                (ngModelChange)="sortBy.set($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="name_asc">Nom (A→Z)</option>
                <option value="start_desc">Début (récent → ancien)</option>
                <option value="status">Statut (Actives d’abord)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Promotions</p>
                @if (store.loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ kpis().total }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-percent text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Actives</p>
                @if (store.loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ kpis().active }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Codes Promo</p>
                @if (store.loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ kpis().codes }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-ticket text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Automatiques</p>
                @if (store.loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ kpis().automatic }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-bolt text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        @if (store.loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
          <div class="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div class="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          }
        </div>
        }

        <!-- Empty state -->
        @else if (paginatedPromotions().length === 0) {
        <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i class="fa-solid fa-tags text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune promotion</h3>
          <p class="text-gray-600 mb-4">
            @if (hasAnyFilterApplied()) { Aucun résultat. Modifiez vos filtres ou réinitialisez la
            recherche. } @else { Commencez par créer votre première promotion. }
          </p>
          <div class="flex items-center justify-center gap-3">
            <button
              *ngIf="hasAnyFilterApplied()"
              (click)="resetFilters()"
              class="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </button>
            <button
              (click)="navigateToCreate()"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Créer une promotion
            </button>
          </div>
        </div>
        }

        <!-- Promotions list -->
        @else {
        <div class="space-y-3">
          @for (promotion of paginatedPromotions(); track promotion.id) {
          <div
            class="rounded-lg p-6 hover:shadow-md transition-shadow border border-l-4"
            [ngClass]="getCardClass(promotion)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- Header -->
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">{{ promotion.name }}</h3>

                  <span
                    [class]="
                      promotion.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    "
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ promotion.isActive ? 'Active' : 'Inactive' }}
                  </span>

                  <span
                    [class]="getTypeBadgeClass(promotion.type)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ promotion.type === 'automatic' ? 'Automatique' : 'Code promo' }}
                  </span>

                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    [ngClass]="getScheduleBadgeClass(promotion)"
                  >
                    {{ getScheduleLabel(promotion) }}
                  </span>

                  <span
                    *ngIf="willExpireSoon(promotion)"
                    class="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800"
                    title="Expire bientôt"
                  >
                    <i class="fa-solid fa-hourglass-half mr-1"></i> Bientôt
                  </span>

                  @if (promotion.code) {
                  <span
                    class="px-2 py-1 text-xs font-mono font-bold bg-indigo-100 text-indigo-800 rounded"
                  >
                    {{ promotion.code }}
                  </span>
                  <button
                    type="button"
                    class="px-2 py-1 text-xs rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                    (click)="copyCode(promotion.code!)"
                    [disabled]="isWorking(promotion.id)"
                    title="Copier le code"
                  >
                    <i class="fa-regular fa-copy"></i>
                  </button>
                  }
                </div>

                @if (promotion.description) {
                <p class="text-sm text-gray-600 mb-3">{{ promotion.description }}</p>
                }

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">Réduction:</span>
                    <span class="ml-2 font-medium text-gray-900">
                      @if (promotion.discountType === 'percentage') { {{ promotion.discountValue }}%
                      } @else { {{ promotion.discountValue }}€ }
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">Portée:</span>
                    <span class="ml-2 font-medium text-gray-900">{{
                      getScopeLabel(promotion.scope)
                    }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Début:</span>
                    <span class="ml-2 font-medium text-gray-900">{{
                      promotion.startDate | date : 'dd/MM/yyyy'
                    }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Fin:</span>
                    <span class="ml-2 font-medium text-gray-900">{{
                      promotion.endDate ? (promotion.endDate | date : 'dd/MM/yyyy') : 'Illimitée'
                    }}</span>
                  </div>
                </div>

                @if (promotion.conditions) {
                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                  @if (promotion.conditions.minAmount) {
                  <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded"
                    >Min. {{ promotion.conditions.minAmount }}€</span
                  >
                  } @if (promotion.conditions.minQuantity) {
                  <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded"
                    >Min. {{ promotion.conditions.minQuantity }} produits</span
                  >
                  } @if (promotion.conditions.maxUsagePerUser) {
                  <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded"
                    >{{ promotion.conditions.maxUsagePerUser }} utilisation(s)/utilisateur</span
                  >
                  } @if (promotion.conditions.maxUsageTotal) {
                  <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded"
                    >{{ promotion.currentUsage ?? 0 }}/{{
                      promotion.conditions.maxUsageTotal
                    }}
                    utilisations</span
                  >
                  }
                </div>
                }
              </div>

              <div class="flex items-center gap-2 ml-4">
                <button
                  (click)="toggleActive(promotion)"
                  [title]="promotion.isActive ? 'Désactiver' : 'Activer'"
                  class="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  [disabled]="isWorking(promotion.id)"
                >
                  <i
                    [class]="
                      promotion.isActive
                        ? 'fa-solid fa-toggle-on text-green-600'
                        : 'fa-solid fa-toggle-off text-gray-400'
                    "
                    class="text-xl"
                  ></i>
                </button>

                <button
                  (click)="editPromotion(promotion.id)"
                  class="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  [disabled]="isWorking(promotion.id)"
                  title="Modifier"
                >
                  <i class="fa-solid fa-pen-to-square text-gray-600"></i>
                </button>

                <button
                  (click)="deletePromotion(promotion)"
                  class="p-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  [disabled]="isWorking(promotion.id)"
                  title="Supprimer"
                >
                  <i class="fa-solid fa-trash text-red-600"></i>
                </button>
              </div>
            </div>
          </div>
          }
        </div>

        <!-- Pagination -->
        <div class="mt-6 flex items-center justify-between" *ngIf="totalPages() > 1">
          <div class="text-sm text-gray-600">
            Page {{ page() }} / {{ totalPages() }} · {{ filteredPromotions().length }} résultat(s)
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
              (click)="prevPage()"
              [disabled]="page() === 1"
            >
              Précédent
            </button>
            <button
              class="px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
              (click)="nextPage()"
              [disabled]="page() === totalPages()"
            >
              Suivant
            </button>

            <select
              [ngModel]="pageSize()"
              (ngModelChange)="setPageSize($event)"
              class="ml-3 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              title="Taille de page"
            >
              <option [ngValue]="5">5</option>
              <option [ngValue]="10">10</option>
              <option [ngValue]="20">20</option>
            </select>
          </div>
        </div>
        }
      </div>
    </div>
  `,
})
export class PromotionsListComponent implements OnInit {
  readonly store = inject(PromotionsStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  filterStatus = signal<StatusFilter>('all');
  filterType = signal<TypeFilter>('all');
  sortBy = signal<SortBy>('name_asc');
  searchTerm = signal<string>('');

  page = signal(1);
  pageSize = signal<5 | 10 | 20>(10);

  private workingIds = signal<Set<number>>(new Set<number>());
  filteredPromotions = signal<Promotion[]>([]);

  kpis = computed<PromotionKPIs>(() => {
    const all = this.store.promotions();
    return {
      total: all.length,
      active: all.filter((p) => p.isActive).length,
      codes: all.filter((p) => p.type === 'code').length,
      automatic: all.filter((p) => p.type === 'automatic').length,
    };
  });

  totalPages = computed(() => {
    const count = this.filteredPromotions().length;
    const size = this.pageSize();
    return Math.max(1, Math.ceil(count / size));
  });

  paginatedPromotions = computed(() => {
    const list = this.filteredPromotions();
    const p = this.page();
    const size = this.pageSize();
    const start = (p - 1) * size;
    return list.slice(start, start + size);
  });

  constructor() {
    effect(
      () => {
        const all = this.store.promotions();
        const status = this.filterStatus();
        const type = this.filterType();
        const sort = this.sortBy();
        const query = this.searchTerm().trim().toLowerCase();

        let arr = all;

        if (query) {
          arr = arr.filter((p) => {
            const fields = [p.name, p.code ?? ''].map((s) => s.toLowerCase());
            return fields.some((f) => f.includes(query));
          });
        }

        if (status === 'active') arr = arr.filter((p) => p.isActive);
        else if (status === 'inactive') arr = arr.filter((p) => !p.isActive);

        if (type === 'automatic') arr = arr.filter((p) => p.type === 'automatic');
        else if (type === 'code') arr = arr.filter((p) => p.type === 'code');

        const now = Date.now();
        const sorters: Record<SortBy, (a: Promotion, b: Promotion) => number> = {
          name_asc: (a, b) => a.name.localeCompare(b.name),
          start_desc: (a, b) =>
            (new Date(b.startDate).getTime() || 0) - (new Date(a.startDate).getTime() || 0),
          status: (a, b) => {
            const ra = this.rankStatus(now, a);
            const rb = this.rankStatus(now, b);
            return ra - rb || a.name.localeCompare(b.name);
          },
        };
        arr = [...arr].sort(sorters[sort]);

        this.filteredPromotions.set(arr);
        this.page.set(1);
      },
      { allowSignalWrites: true }
    );
  }

  async ngOnInit(): Promise<void> {
    await this.store.loadAll();
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }
  hasAnyFilterApplied(): boolean {
    return (
      !!this.searchTerm() ||
      this.filterStatus() !== 'all' ||
      this.filterType() !== 'all' ||
      this.sortBy() !== 'name_asc'
    );
  }
  resetFilters(): void {
    this.searchTerm.set('');
    this.filterStatus.set('all');
    this.filterType.set('all');
    this.sortBy.set('name_asc');
    this.page.set(1);
  }

  setPageSize(size: 5 | 10 | 20): void {
    this.pageSize.set(size);
    const total = this.totalPages();
    if (this.page() > total) this.page.set(total);
  }
  nextPage(): void {
    if (this.page() < this.totalPages()) this.page.update((v) => v + 1);
  }
  prevPage(): void {
    if (this.page() > 1) this.page.update((v) => v - 1);
  }

  async refresh(): Promise<void> {
    await this.store.loadAll();
    this.toast.info('Liste actualisée');
  }

  isWorking(id: number): boolean {
    return this.workingIds().has(id);
  }
  private setWorking(id: number, on: boolean): void {
    const next = new Set(this.workingIds());
    if (on) next.add(id);
    else next.delete(id);
    this.workingIds.set(next);
  }

  async toggleActive(promotion: Promotion): Promise<void> {
    this.setWorking(promotion.id, true);
    try {
      const success = await this.store.toggleActive(promotion.id);
      if (success)
        this.toast.success(promotion.isActive ? 'Promotion désactivée' : 'Promotion activée');
      else this.toast.error('Erreur lors de la modification');
    } finally {
      this.setWorking(promotion.id, false);
    }
  }

  async deletePromotion(promotion: Promotion): Promise<void> {
    if (!confirm(`Supprimer la promotion "${promotion.name}" ?`)) return;
    this.setWorking(promotion.id, true);
    try {
      const success = await this.store.delete(promotion.id);
      if (success) this.toast.success('Promotion supprimée');
      else this.toast.error('Erreur lors de la suppression');
    } finally {
      this.setWorking(promotion.id, false);
    }
  }

  editPromotion(id: number): void {
    void this.router.navigate(['/admin/promotions/edit', id]);
  }
  navigateToCreate(): void {
    void this.router.navigate(['/admin/promotions/new']);
  }

  getScopeLabel(scope: string): string {
    const labels: Record<string, string> = {
      'site-wide': 'Tout le site',
      category: 'Catégorie',
      subcategory: 'Sous-catégorie',
      product: 'Produits spécifiques',
      size: 'Tailles',
      cart: 'Panier',
      shipping: 'Livraison',
      'buy-x-get-y': 'X achetés = Y offerts',
      'user-segment': 'Segment utilisateur',
    };
    return labels[scope] || scope;
  }
  getTypeBadgeClass(type: string): string {
    return type === 'automatic' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  }
  getCardClass(p: Promotion): string {
    return p.isActive
      ? 'bg-green-50 border-green-200 border-l-green-400'
      : 'bg-gray-50 border-gray-200 border-l-gray-400';
  }

  getScheduleLabel(p: Promotion): string {
    const now = Date.now();
    const start = new Date(p.startDate).getTime();
    const end = p.endDate ? new Date(p.endDate).getTime() : Number.POSITIVE_INFINITY;
    if (now < start) return 'Programmé';
    if (now > end) return 'Expiré';
    return 'En cours';
  }
  getScheduleBadgeClass(p: Promotion): string {
    const label = this.getScheduleLabel(p);
    if (label === 'Programmé') return 'bg-amber-100 text-amber-800';
    if (label === 'Expiré') return 'bg-red-100 text-red-800';
    return 'bg-emerald-100 text-emerald-800';
  }
  willExpireSoon(p: Promotion): boolean {
    if (!p.endDate) return false;
    const end = new Date(p.endDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  }
  private rankStatus(now: number, p: Promotion): number {
    const start = new Date(p.startDate).getTime();
    const end = p.endDate ? new Date(p.endDate).getTime() : Number.POSITIVE_INFINITY;
    if (now >= start && now <= end) return 0;
    if (now < start) return 1;
    return 2;
  }

  async copyCode(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.toast.success('Code copié');
    } catch {
      this.toast.error('Impossible de copier le code');
    }
  }

  exportCsv(): void {
    const cols = [
      'id',
      'name',
      'type',
      'code',
      'discountType',
      'discountValue',
      'scope',
      'startDate',
      'endDate',
      'isActive',
      'scheduleStatus',
    ] as const;

    const rows = this.filteredPromotions().map((p) => {
      const schedule = this.getScheduleLabel(p);
      return [
        p.id,
        p.name,
        p.type,
        p.code ?? '',
        p.discountType,
        p.discountValue,
        p.scope,
        new Date(p.startDate).toISOString(),
        p.endDate ? new Date(p.endDate).toISOString() : '',
        p.isActive ? 'true' : 'false',
        schedule,
      ];
    });

    const header = cols.join(',');
    const csv = [
      header,
      ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promotions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
