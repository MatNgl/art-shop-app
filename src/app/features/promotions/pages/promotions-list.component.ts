import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PromotionsStore } from '../services/promotions-store';
import { Promotion } from '../models/promotion.model';
import { ToastService } from '../../../shared/services/toast.service';

interface PromotionKPIs {
  total: number;
  active: number;
  codes: number;
  automatic: number;
}

@Component({
  selector: 'app-promotions-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
                <span class="text-gray-900">Promotions</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Gestion des Promotions</h1>
              <p class="text-gray-600 mt-1">
                {{ store.count() }} promotion(s) · {{ store.activeCount() }} active(s)
              </p>
            </div>
            <div class="flex items-center gap-3">
              <button
                (click)="refresh()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <i class="fa-solid fa-arrows-rotate text-sm"></i>
                Actualiser
              </button>
              <button
                (click)="navigateToCreate()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
              >
                <i class="fa-solid fa-plus"></i>
                Nouvelle promotion
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <!-- Stats KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

        <!-- Filtres -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="flex flex-wrap items-end gap-4">
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Statut</span>
              <select
                [ngModel]="filterStatus()"
                (ngModelChange)="filterStatus.set($event); updateFilteredPromotions()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Toutes les promotions</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </div>

            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Type</span>
              <select
                [ngModel]="filterType()"
                (ngModelChange)="filterType.set($event); updateFilteredPromotions()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tous les types</option>
                <option value="automatic">Automatiques</option>
                <option value="code">Codes promo</option>
              </select>
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
        @else if (filteredPromotions().length === 0) {
        <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i class="fa-solid fa-tags text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune promotion</h3>
          <p class="text-gray-600 mb-4">
            @if (filterStatus() !== 'all') { Aucune promotion
            {{ filterStatus() === 'active' ? 'active' : 'inactive' }} trouvée. } @else { Commencez
            par créer votre première promotion. }
          </p>
          @if (filterStatus() === 'all') {
          <button
            (click)="navigateToCreate()"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Créer une promotion
          </button>
          }
        </div>
        }

        <!-- Promotions list -->
        @else {
        <div class="space-y-3">
          @for (promotion of filteredPromotions(); track promotion.id) {
          <div
            class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- Header -->
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">{{ promotion.name }}</h3>

                  <!-- Badges -->
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

                  @if (promotion.code) {
                  <span
                    class="px-2 py-1 text-xs font-mono font-bold bg-indigo-100 text-indigo-800 rounded"
                  >
                    {{ promotion.code }}
                  </span>
                  }
                </div>

                <!-- Description -->
                @if (promotion.description) {
                <p class="text-sm text-gray-600 mb-3">{{ promotion.description }}</p>
                }

                <!-- Details -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">Réduction:</span>
                    <span class="ml-2 font-medium text-gray-900">
                      @if (promotion.discountType === 'percentage') {
                      {{ promotion.discountValue }}% } @else { {{ promotion.discountValue }}€ }
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
                    <span class="ml-2 font-medium text-gray-900">
                      {{ promotion.startDate | date : 'dd/MM/yyyy' }}
                    </span>
                  </div>

                  <div>
                    <span class="text-gray-500">Fin:</span>
                    <span class="ml-2 font-medium text-gray-900">
                      {{
                        promotion.endDate ? (promotion.endDate | date : 'dd/MM/yyyy') : 'Illimitée'
                      }}
                    </span>
                  </div>
                </div>

                <!-- Conditions -->
                @if (promotion.conditions) {
                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                  @if (promotion.conditions.minAmount) {
                  <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                    Min. {{ promotion.conditions.minAmount }}€
                  </span>
                  } @if (promotion.conditions.minQuantity) {
                  <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                    Min. {{ promotion.conditions.minQuantity }} produits
                  </span>
                  } @if (promotion.conditions.maxUsagePerUser) {
                  <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                    {{ promotion.conditions.maxUsagePerUser }} utilisation(s)/utilisateur
                  </span>
                  } @if (promotion.conditions.maxUsageTotal) {
                  <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                    {{ promotion.currentUsage ?? 0 }}/{{ promotion.conditions.maxUsageTotal }}
                    utilisations
                  </span>
                  }
                </div>
                }
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 ml-4">
                <button
                  (click)="toggleActive(promotion)"
                  [title]="promotion.isActive ? 'Désactiver' : 'Activer'"
                  class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                  class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Modifier"
                >
                  <i class="fa-solid fa-pen-to-square text-gray-600"></i>
                </button>

                <button
                  (click)="deletePromotion(promotion)"
                  class="p-2 rounded-lg hover:bg-red-100 transition-colors"
                  title="Supprimer"
                >
                  <i class="fa-solid fa-trash text-red-600"></i>
                </button>
              </div>
            </div>
          </div>
          }
        </div>
        }
      </div>
    </div>
  `,
})
export class PromotionsListComponent implements OnInit, OnDestroy {
  readonly store = inject(PromotionsStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  filterType = signal<'all' | 'automatic' | 'code'>('all');

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

  async ngOnInit(): Promise<void> {
    await this.store.loadAll();
    this.updateFilteredPromotions();
  }

  ngOnDestroy(): void {
    // Subscribe to filter changes
    // const filter = this.filterStatus();
    this.updateFilteredPromotions();
  }

  updateFilteredPromotions(): void {
    const allPromotions = this.store.promotions();
    const statusFilter = this.filterStatus();
    const typeFilter = this.filterType();

    let filtered = allPromotions;

    // Filtre par statut
    if (statusFilter === 'active') {
      filtered = filtered.filter((p) => p.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((p) => !p.isActive);
    }

    // Filtre par type
    if (typeFilter === 'automatic') {
      filtered = filtered.filter((p) => p.type === 'automatic');
    } else if (typeFilter === 'code') {
      filtered = filtered.filter((p) => p.type === 'code');
    }

    this.filteredPromotions.set(filtered);
  }

  async refresh(): Promise<void> {
    await this.store.loadAll();
    this.updateFilteredPromotions();
    this.toast.info('Liste actualisée');
  }

  async toggleActive(promotion: Promotion): Promise<void> {
    const success = await this.store.toggleActive(promotion.id);
    if (success) {
      this.toast.success(promotion.isActive ? 'Promotion désactivée' : 'Promotion activée');
      this.updateFilteredPromotions();
    } else {
      this.toast.error('Erreur lors de la modification');
    }
  }

  async deletePromotion(promotion: Promotion): Promise<void> {
    if (!confirm(`Supprimer la promotion "${promotion.name}" ?`)) return;

    const success = await this.store.delete(promotion.id);
    if (success) {
      this.toast.success('Promotion supprimée');
      this.updateFilteredPromotions();
    } else {
      this.toast.error('Erreur lors de la suppression');
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
    };
    return labels[scope] || scope;
  }

  getTypeBadgeClass(type: string): string {
    return type === 'automatic' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  }
}
