import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionBillingService } from '../../subscriptions/services/subscription-billing.service';
import { PricePipe } from '../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-plan-change-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PricePipe],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div class="container-wide py-6">
          <div class="flex items-start md:items-center justify-between gap-4">
            <div>
              <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a>
                <span>•</span>
                <span class="text-gray-900">Historique des changements de plan</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Historique des changements de plan</h1>
              <p class="text-sm text-gray-600 mt-1">
                Tous les changements de plans d'abonnement effectués
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="container-wide pb-12">
        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[200px]">
              <span class="block text-sm font-medium text-gray-700 mb-2"> Type de changement </span>
              <select
                [(ngModel)]="filterType"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Tous</option>
                <option value="upgrade">Upgrades</option>
                <option value="downgrade">Downgrades</option>
              </select>
            </div>

            <div class="flex items-end">
              <button
                (click)="resetFilters()"
                class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i class="fa-solid fa-rotate-right mr-2"></i>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-history text-blue-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">{{ totalChanges() }}</p>
                <p class="text-sm text-gray-600">Total de changements</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-arrow-up text-green-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">{{ upgradeCount() }}</p>
                <p class="text-sm text-gray-600">Upgrades</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-arrow-down text-orange-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">{{ downgradeCount() }}</p>
                <p class="text-sm text-gray-600">Downgrades</p>
              </div>
            </div>
          </div>
        </div>

        <!-- History Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Utilisateur
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Changement
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Prix
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Effectif le
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (change of filteredChanges(); track change.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(change.changedAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <a
                      [routerLink]="['/admin/users', change.userId]"
                      class="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      ID {{ change.userId }}
                    </a>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-700">{{ change.fromPlanName }}</span>
                      <i class="fa-solid fa-arrow-right text-gray-400 text-xs"></i>
                      <span class="font-medium text-gray-900">{{ change.toPlanName }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getChangeBadgeClass(change.changeType)">
                      <i
                        class="fa-solid mr-1"
                        [ngClass]="
                          change.changeType === 'upgrade' ? 'fa-arrow-up' : 'fa-arrow-down'
                        "
                      ></i>
                      {{ change.changeType === 'upgrade' ? 'Upgrade' : 'Downgrade' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-500 line-through">{{
                        change.previousPrice | price
                      }}</span>
                      <i class="fa-solid fa-arrow-right text-gray-400 text-xs"></i>
                      <span class="font-medium text-gray-900">{{ change.newPrice | price }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {{ formatDate(change.effectiveAt) }}
                  </td>
                </tr>
                } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fa-solid fa-inbox text-4xl text-gray-300 mb-4"></i>
                    <p>Aucun changement de plan trouvé</p>
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
export class PlanChangeHistoryPage {
  private readonly billingSvc = inject(SubscriptionBillingService);

  filterType = signal<'all' | 'upgrade' | 'downgrade'>('all');

  allChanges = computed(() => {
    return [...this.billingSvc.getAllPlanHistory()].sort(
      (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    );
  });

  filteredChanges = computed(() => {
    const type = this.filterType();
    if (type === 'all') return this.allChanges();
    return this.allChanges().filter((c) => c.changeType === type);
  });

  totalChanges = computed(() => this.allChanges().length);
  upgradeCount = computed(() => this.allChanges().filter((c) => c.changeType === 'upgrade').length);
  downgradeCount = computed(
    () => this.allChanges().filter((c) => c.changeType === 'downgrade').length
  );

  resetFilters(): void {
    this.filterType.set('all');
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getChangeBadgeClass(type: 'upgrade' | 'downgrade'): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    return type === 'upgrade'
      ? `${base} bg-green-100 text-green-800`
      : `${base} bg-orange-100 text-orange-800`;
  }
}
