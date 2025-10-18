import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../../subscriptions/services/subscription.service';
import { SubscriptionPlan } from '../../../subscriptions/models/subscription.model';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { AdminHeaderComponent } from '../../../../shared/components/admin-header/admin-header.component';

interface SubscriptionKPIs {
  total: number;
  active: number;
  public: number;
  deprecated: number;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'deprecated';
type VisibilityFilter = 'all' | 'public' | 'admin';
type SortBy = 'order_asc' | 'name_asc' | 'price_asc';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, PricePipe, AdminHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <app-admin-header
        title="Gestion des Abonnements"
        [description]="kpis().total + ' plan(s) · ' + kpis().active + ' actif(s)'"
        icon="fa-crown"
        gradientClass="bg-gradient-to-br from-purple-500 to-blue-500"
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
            (click)="navigateToCreate()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <i class="fa-solid fa-plus"></i>
            Nouveau plan
          </button>
        </div>
      </app-admin-header>

      <!-- Content -->
      <div class="container-wide pb-8">
        <!-- Filtres -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <!-- Recherche -->
            <div class="md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-2" for="search">Recherche</label>
              <div class="relative">
                <input
                  id="search"
                  type="text"
                  [ngModel]="searchTerm()"
                  (ngModelChange)="searchTerm.set($event)"
                  placeholder="Nom ou slug…"
                  class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autocomplete="off"
                />
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-500"></i>
                <button
                  *ngIf="searchTerm()"
                  type="button"
                  (click)="clearSearch()"
                  class="absolute right-2 top-1.5 px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                  aria-label="Effacer"
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
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="deprecated">Dépréciés</option>
              </select>
            </div>

            <!-- Visibilité -->
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Visibilité</span>
              <select
                [ngModel]="filterVisibility()"
                (ngModelChange)="filterVisibility.set($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Toutes</option>
                <option value="public">Public</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <!-- Tri -->
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Trier par</span>
              <select
                [ngModel]="sortBy()"
                (ngModelChange)="sortBy.set($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="order_asc">Ordre d'affichage</option>
                <option value="name_asc">Nom (A→Z)</option>
                <option value="price_asc">Prix (croissant)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Plans</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ kpis().total }}</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-crown text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Actifs</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ kpis().active }}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Publics</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ kpis().public }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-eye text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Dépréciés</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ kpis().deprecated }}</p>
              </div>
              <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-ban text-red-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Multiplicateur
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (plan of filteredPlans(); track plan.id) {
                  <tr
                    class="transition-colors"
                    [class.bg-green-50]="plan.isActive && !plan.deprecated"
                    [class.hover:bg-green-100]="plan.isActive && !plan.deprecated"
                    [class.hover:bg-gray-50]="!plan.isActive || plan.deprecated"
                  >
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          {{ plan.name[0] }}
                        </div>
                        <div>
                          <div class="font-medium text-gray-900">{{ plan.name }}</div>
                          <div class="text-sm text-gray-500">{{ plan.slug }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm">
                        <div class="font-medium text-gray-900">{{ plan.monthlyPrice | price }}<span class="text-gray-500">/mois</span></div>
                        <div class="text-gray-500">{{ plan.annualPrice | price }}<span class="text-gray-500">/an</span></div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                        ×{{ plan.loyaltyMultiplier }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="statusBadge(plan.isActive, plan.deprecated)">
                        {{ statusLabel(plan.isActive, plan.deprecated) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          (click)="navigateToEdit(plan.id)"
                          class="p-2 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <i class="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          (click)="toggleActiveAndVisibility(plan)"
                          [class]="activeButtonClass(plan.isActive, plan.deprecated)"
                          [title]="getActiveTooltip(plan.isActive, plan.deprecated)"
                        >
                          <i [class]="getActiveIcon(plan.isActive, plan.deprecated)"></i>
                        </button>
                        <button
                          type="button"
                          (click)="deletePlan(plan)"
                          class="p-2 rounded-lg text-red-600 hover:text-red-900 hover:bg-red-50 transition-colors"
                          title="Marquer comme déprécié"
                        >
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-6 py-12 text-center">
                      <div class="flex flex-col items-center gap-3">
                        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <i class="fa-solid fa-crown text-gray-400 text-2xl"></i>
                        </div>
                        <p class="text-gray-500">Aucun plan d'abonnement trouvé.</p>
                        @if (hasActiveFilters()) {
                          <button
                            type="button"
                            (click)="resetFilters()"
                            class="text-sm text-purple-600 hover:text-purple-700 underline"
                          >
                            Réinitialiser les filtres
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminSubscriptionsComponent {
  private readonly service = inject(SubscriptionService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  plans = signal<SubscriptionPlan[]>([]);

  // Filtres
  searchTerm = signal<string>('');
  filterStatus = signal<StatusFilter>('all');
  filterVisibility = signal<VisibilityFilter>('all');
  sortBy = signal<SortBy>('order_asc');

  filteredPlans = computed(() => {
    let result = [...this.plans()];

    // Filtre recherche
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.slug.toLowerCase().includes(search)
      );
    }

    // Filtre statut
    const status = this.filterStatus();
    if (status === 'active') {
      result = result.filter(p => p.isActive && !p.deprecated);
    } else if (status === 'inactive') {
      result = result.filter(p => !p.isActive && !p.deprecated);
    } else if (status === 'deprecated') {
      result = result.filter(p => p.deprecated);
    }

    // Filtre visibilité
    const visibility = this.filterVisibility();
    if (visibility !== 'all') {
      result = result.filter(p => p.visibility === visibility);
    }

    // Tri
    const sort = this.sortBy();
    if (sort === 'order_asc') {
      result.sort((a, b) => a.displayOrder - b.displayOrder);
    } else if (sort === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'price_asc') {
      result.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    }

    return result;
  });

  kpis = computed<SubscriptionKPIs>(() => {
    const all = this.plans();
    return {
      total: all.length,
      active: all.filter(p => p.isActive && !p.deprecated).length,
      public: all.filter(p => p.visibility === 'public').length,
      deprecated: all.filter(p => p.deprecated).length,
    };
  });

  hasActiveFilters = computed(() =>
    this.searchTerm() !== '' ||
    this.filterStatus() !== 'all' ||
    this.filterVisibility() !== 'all'
  );

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.plans.set(this.service.getAllPlans());
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.filterStatus.set('all');
    this.filterVisibility.set('all');
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/subscriptions/new']);
  }

  navigateToEdit(planId: number): void {
    this.router.navigate(['/admin/subscriptions', planId, 'edit']);
  }

  statusBadge(isActive: boolean, deprecated: boolean): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold';
    if (deprecated) return `${base} bg-red-100 text-red-700`;
    if (isActive) return `${base} bg-green-100 text-green-700`;
    return `${base} bg-yellow-100 text-yellow-700`;
  }

  statusLabel(isActive: boolean, deprecated: boolean): string {
    if (deprecated) return 'Déprécié';
    if (isActive) return 'Actif';
    return 'Inactif';
  }

  activeButtonClass(isActive: boolean, deprecated: boolean): string {
    const base = 'p-2 rounded-lg transition-colors';
    if (deprecated) return `${base} text-gray-300 cursor-not-allowed`;
    return isActive
      ? `${base} text-green-600 hover:text-green-900 hover:bg-green-50`
      : `${base} text-gray-400 hover:text-gray-900 hover:bg-gray-100`;
  }

  getActiveIcon(isActive: boolean, deprecated: boolean): string {
    if (deprecated) return 'fa-solid fa-ban';
    return isActive ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
  }

  getActiveTooltip(isActive: boolean, deprecated: boolean): string {
    if (deprecated) return 'Plan déprécié (non modifiable)';
    return isActive
      ? 'Désactiver le plan (sera masqué pour les nouveaux utilisateurs)'
      : 'Activer le plan (sera visible publiquement)';
  }

  toggleActiveAndVisibility(plan: SubscriptionPlan): void {
    if (plan.deprecated) {
      this.toast.warning('Impossible de modifier un plan déprécié');
      return;
    }

    const newActive = !plan.isActive;
    const newVis = newActive ? 'public' : 'admin';

    // Mettre à jour l'état actif
    const resActive = this.service.setPlanActive(plan.id, newActive);
    if (!resActive.success) {
      this.toast.error(resActive.error ?? 'Erreur lors du changement de statut');
      return;
    }

    // Mettre à jour la visibilité
    const resVis = this.service.setPlanVisibility(plan.id, newVis);
    if (!resVis.success) {
      this.toast.error(resVis.error ?? 'Erreur lors du changement de visibilité');
      return;
    }

    this.toast.success(
      newActive
        ? 'Plan activé et rendu visible publiquement'
        : 'Plan désactivé et masqué'
    );
    this.refresh();
  }

  async deletePlan(plan: SubscriptionPlan): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Marquer comme déprécié',
      message: `Êtes-vous sûr de vouloir marquer le plan "${plan.name}" comme déprécié ? Il ne sera plus proposé aux nouveaux utilisateurs.`,
      variant: 'danger',
      confirmText: 'Oui, marquer comme déprécié',
      cancelText: 'Annuler',
    });
    if (!confirmed) return;

    const res = this.service.setPlanDeprecated(plan.id, true);
    if (res.success) {
      this.toast.success('Plan marqué comme déprécié');
      this.refresh();
    } else {
      this.toast.error(res.error ?? 'Erreur');
    }
  }
}
