import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { OrderService } from '../../../orders/services/order';
import type { Order, OrderStatus, PaymentBrand } from '../../../orders/models/order.model';
import { AuthService } from '../../../auth/services/auth';
import { HighlightPipe } from '../../../../shared/pipes/highlight.pipe';
import { AdminHeaderComponent } from '../../../../shared/components/admin-header/admin-header.component';

type SortBy =
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'total_desc'
  | 'total_asc'
  | 'status'
  | 'status_asc'
  | 'status_desc'
  | 'customer'
  | 'customer_asc'
  | 'customer_desc'
  | 'id_asc'
  | 'id_desc';

type DateFilter = '' | 'today' | 'week' | 'month' | 'year';

interface PaginationState {
  page: number;
  pageSize: number;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HighlightPipe, NgClass, AdminHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <app-admin-header
        title="Gestion des Commandes"
        description="Consultez et mettez à jour l'état des commandes"
        icon="fa-receipt"
        gradientClass="bg-gradient-to-br from-indigo-500 to-purple-500"
      >
        <div actions class="flex items-center gap-3">
          <button
            (click)="refresh()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            [disabled]="loading()"
          >
            <i class="fa-solid fa-arrows-rotate text-sm" [class.animate-spin]="loading()"></i>
            Actualiser
          </button>
          <button
            (click)="exportCsv()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            [disabled]="filtered().length === 0"
          >
            <i class="fa-solid fa-download text-sm"></i>
            Exporter CSV
          </button>
        </div>
      </app-admin-header>

      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Commandes</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().total }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-receipt text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">En cours</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().inProgress }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-truck-fast text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Livrées</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().delivered }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-box-open text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">CA (7j)</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">
                  {{ stats().revenue7d | number : '1.0-0' }} €
                </p>
                }
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-euro-sign text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Recherche</span>
              <input
                type="text"
                [ngModel]="search()"
                (ngModelChange)="onSearchChange($event)"
                placeholder="ID, client, email, produit..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Type</span>
              <select
                [ngModel]="typeFilter()"
                (ngModelChange)="onTypeChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              >
                <option value="">Toutes</option>
                <option value="product">Produits</option>
                <option value="subscription">Abonnements</option>
              </select>
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Statut</span>
              <select
                [ngModel]="status()"
                (ngModelChange)="onStatusChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              >
                <option value="">Tous</option>
                <option value="pending">En attente</option>
                <option value="processing">En traitement</option>
                <option value="accepted">Acceptée</option>
                <option value="refused">Refusée</option>
                <option value="delivered">Livrée</option>
              </select>
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Date</span>
              <select
                [ngModel]="dateFilter()"
                (ngModelChange)="onDateChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              >
                <option value="">Toutes</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Tri</span>
              <select
                [ngModel]="sortBy()"
                (ngModelChange)="onSortChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              >
                <option value="createdAt_desc">Plus récentes</option>
                <option value="createdAt_asc">Plus anciennes</option>
                <option value="total_desc">Montant ↓</option>
                <option value="total_asc">Montant ↑</option>
                <option value="id_desc">ID ↓</option>
                <option value="id_asc">ID ↑</option>
                <option value="status_asc">Statut A→Z</option>
                <option value="status_desc">Statut Z→A</option>
                <option value="customer_asc">Client A→Z</option>
                <option value="customer_desc">Client Z→A</option>
              </select>
            </div>
          </div>

          <!-- Chips rapides -->
          <div class="flex flex-wrap gap-2">
            <button
              (click)="quickFilter('today')"
              class="px-3 py-1 rounded-full text-xs font-medium"
              [class.bg-blue-100]="dateFilter() === 'today'"
              [class.text-blue-800]="dateFilter() === 'today'"
              [class.bg-gray-100]="dateFilter() !== 'today'"
              [class.text-gray-700]="dateFilter() !== 'today'"
            >
              Aujourd'hui
            </button>
            <button
              (click)="quickFilter('week')"
              class="px-3 py-1 rounded-full text-xs font-medium"
              [class.bg-blue-100]="dateFilter() === 'week'"
              [class.text-blue-800]="dateFilter() === 'week'"
              [class.bg-gray-100]="dateFilter() !== 'week'"
              [class.text-gray-700]="dateFilter() !== 'week'"
            >
              Cette semaine
            </button>
            <button
              (click)="quickStatusFilter('pending')"
              class="px-3 py-1 rounded-full text-xs font-medium"
              [class.bg-gray-100]="status() === 'pending'"
              [class.text-gray-800]="status() === 'pending'"
              [class.bg-gray-50]="status() !== 'pending'"
              [class.text-gray-600]="status() !== 'pending'"
            >
              En attente
            </button>
            <button
              (click)="quickStatusFilter('processing')"
              class="px-3 py-1 rounded-full text-xs font-medium"
              [class.bg-blue-100]="status() === 'processing'"
              [class.text-blue-800]="status() === 'processing'"
              [class.bg-gray-50]="status() !== 'processing'"
              [class.text-gray-600]="status() !== 'processing'"
            >
              En traitement
            </button>
            <button
              (click)="quickStatusFilter('delivered')"
              class="px-3 py-1 rounded-full text-xs font-medium"
              [class.bg-green-100]="status() === 'delivered'"
              [class.text-green-800]="status() === 'delivered'"
              [class.bg-gray-50]="status() !== 'delivered'"
              [class.text-gray-600]="status() !== 'delivered'"
            >
              Livrées
            </button>

            @if (search() || status() || dateFilter()) {
            <button
              (click)="resetFilters()"
              class="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
            >
              <i class="fa-solid fa-times mr-1"></i> Réinitialiser
            </button>
            }
          </div>
        </div>

        <!-- Bulk bar -->
        @if (selectedIds().size > 0) {
        <div
          class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between"
        >
          <div class="flex items-center gap-4">
            <span class="text-sm font-medium text-blue-900">
              {{ selectedIds().size }} commande(s) sélectionnée(s)
            </span>
            <div class="h-6 w-px bg-blue-200"></div>
            <div class="flex gap-2">
              <button
                (click)="bulkUpdateStatus('processing')"
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                → En traitement
              </button>
              <button
                (click)="bulkUpdateStatus('accepted')"
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                → Accepter
              </button>
              <button
                (click)="bulkUpdateStatus('delivered')"
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                → Livrer
              </button>
              <button
                (click)="bulkDelete()"
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                <i class="fa-solid fa-trash mr-1"></i> Supprimer
              </button>
            </div>
          </div>
          <button
            (click)="clearSelection()"
            class="text-sm text-blue-700 hover:text-blue-900 font-medium"
          >
            Désélectionner
          </button>
        </div>
        }

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Commandes ({{ paginatedOrders().length }} / {{ filtered().length }})
            </h3>
          </div>

          @if (loading()) {
          <div class="p-6">
            <div class="space-y-4">
              @for (i of [1,2,3,4,5]; track i) {
              <div class="h-20 bg-gray-100 rounded animate-pulse"></div>
              }
            </div>
          </div>
          } @else if (filtered().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full table-fixed">
              <colgroup>
                <col style="width: 3rem" />
                <col style="width: 12rem" />
                <col style="width: 20rem" />
                <col style="width: 12rem" />
                <col style="width: 12rem" />
                <col style="width: 11rem" />
                <col style="width: 16rem" />
              </colgroup>
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      [checked]="isAllSelected()"
                      [indeterminate]="isSomeSelected()"
                      (change)="toggleSelectAll()"
                      class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    (click)="toggleSort('id')"
                  >
                    <div class="flex items-center gap-1">
                      Commande <i class="fa-solid text-xs" [ngClass]="getSortIcon('id')"></i>
                    </div>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    (click)="toggleSort('customer')"
                  >
                    <div class="flex items-center gap-1">
                      Client <i class="fa-solid text-xs" [ngClass]="getSortIcon('customer')"></i>
                    </div>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    (click)="toggleSort('total')"
                  >
                    <div class="flex items-center gap-1">
                      Montant <i class="fa-solid text-xs" [ngClass]="getSortIcon('total')"></i>
                    </div>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    (click)="toggleSort('status')"
                  >
                    <div class="flex items-center gap-1">
                      Statut <i class="fa-solid text-xs" [ngClass]="getSortIcon('status')"></i>
                    </div>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    (click)="toggleSort('createdAt')"
                  >
                    <div class="flex items-center gap-1">
                      Date <i class="fa-solid text-xs" [ngClass]="getSortIcon('createdAt')"></i>
                    </div>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody class="divide-y divide-gray-200">
                @for (o of paginatedOrders(); track o.id) {
                <tr
                  class="transition-colors"
                  [class.bg-blue-50]="isSelected(o.id)"
                  [class.odd:bg-white]="!isSelected(o.id)"
                  [class.even:bg-gray-50]="!isSelected(o.id)"
                  [class.hover:bg-gray-100]="!isSelected(o.id)"
                >
                  <td class="px-4 py-4">
                    <input
                      type="checkbox"
                      [checked]="isSelected(o.id)"
                      (change)="toggleSelect(o.id)"
                      class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>

                  <!-- ID Commande -> LIEN vers le détail -->
                  <td class="px-4 py-4">
                    <a
                      [routerLink]="['/admin/orders', o.id]"
                      class="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      [attr.aria-label]="'Voir le détail de la commande #' + o.id"
                      [title]="'Voir le détail de la commande #' + o.id"
                    >
                      <span
                        class="text-sm font-medium"
                        [innerHTML]="'#' + o.id | highlight : search()"
                      ></span>
                      <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
                    </a>
                    <div class="text-xs text-gray-500">{{ o.items.length }} article(s)</div>
                  </td>

                  <td class="px-4 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold"
                      >
                        {{ getInitials(o.customer.firstName, o.customer.lastName) }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <div
                          class="text-sm text-gray-900 truncate"
                          [innerHTML]="
                            o.customer.firstName + ' ' + o.customer.lastName | highlight : search()
                          "
                        ></div>
                        <div
                          class="text-xs text-gray-500 truncate"
                          [innerHTML]="o.customer.email | highlight : search()"
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-gray-900">
                      {{ o.total | number : '1.2-2' }} €
                    </div>
                  </td>

                  <td class="px-4 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="badge(o.status)"
                    >
                      <i class="fa-solid mr-1 text-xs" [ngClass]="statusIcon(o.status)"></i>
                      {{ span(o.status) }}
                    </span>
                  </td>

                  <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ formatDate(o.createdAt) }}</div>
                    <div class="text-xs text-gray-500">{{ formatTime(o.createdAt) }}</div>
                  </td>

                  <td class="px-4 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-1">
                      <button
                        [routerLink]="['/admin/orders', o.id]"
                        class="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded"
                        title="Voir le détail"
                        aria-label="Voir le détail"
                      >
                        <i class="fa-solid fa-eye text-sm"></i>
                      </button>
                      <select
                        class="text-xs border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        [ngModel]="o.status"
                        (ngModelChange)="changeStatus(o, $event)"
                        aria-label="Changer le statut"
                      >
                        <option value="pending">En attente</option>
                        <option value="processing">En traitement</option>
                        <option value="accepted">Acceptée</option>
                        <option value="refused">Refusée</option>
                        <option value="delivered">Livrée</option>
                      </select>
                      <button
                        (click)="remove(o)"
                        class="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded"
                        title="Supprimer la commande"
                        aria-label="Supprimer la commande"
                      >
                        <i class="fa-solid fa-trash text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-700">
                Page <span class="font-medium">{{ pagination().page }}</span> sur
                <span class="font-medium">{{ totalPages() }}</span> •
                <span class="font-medium">{{ filtered().length }}</span> résultat(s)
              </div>
              <select
                [ngModel]="pagination().pageSize"
                (ngModelChange)="changePageSize($event)"
                class="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                aria-label="Taille de page"
              >
                <option [value]="25">25 / page</option>
                <option [value]="50">50 / page</option>
                <option [value]="100">100 / page</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="previousPage()"
                [disabled]="pagination().page === 1"
                class="px-4 py-2 text-sm font-medium rounded-lg border"
                [class.text-gray-400]="pagination().page === 1"
                [class.cursor-not-allowed]="pagination().page === 1"
              >
                <i class="fa-solid fa-chevron-left mr-2"></i> Précédent
              </button>
              <button
                (click)="nextPage()"
                [disabled]="pagination().page >= totalPages()"
                class="px-4 py-2 text-sm font-medium rounded-lg border"
                [class.text-gray-400]="pagination().page >= totalPages()"
                [class.cursor-not-allowed]="pagination().page >= totalPages()"
              >
                Suivant <i class="fa-solid fa-chevron-right ml-2"></i>
              </button>
            </div>
          </div>
          } @else {
          <div class="p-12 text-center">
            <i class="fa-solid fa-receipt text-5xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-900 mb-2">Aucune commande</p>
            <p class="text-sm text-gray-500">Aucune commande ne correspond à vos filtres</p>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private auth = inject(AuthService);
  private ordersSvc = inject(OrderService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private router = inject(Router);

  orders = signal<Order[]>([]);
  loading = signal(true);

  // Filtres
  search = signal<string>('');
  status = signal<'' | OrderStatus>('');
  dateFilter = signal<DateFilter>('');
  typeFilter = signal<'' | 'product' | 'subscription'>('');
  sortBy = signal<SortBy>('createdAt_desc');

  // Pagination
  pagination = signal<PaginationState>({ page: 1, pageSize: 25 });

  // Sélection
  selectedIds = signal<Set<string>>(new Set());

  // État tri (icônes)
  private sortState = signal<SortState>({ field: 'createdAt', direction: 'desc' });

  // Clés localStorage
  private readonly SORT_KEY = 'admin_orders_sort';
  private readonly PAGESIZE_KEY = 'admin_orders_pagesize';

  stats = computed(() => {
    const arr = this.orders();
    const inProgress = arr.filter(
      (o) => o.status === 'pending' || o.status === 'processing'
    ).length;
    const delivered = arr.filter((o) => o.status === 'delivered').length;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const revenue7d = arr
      .filter((o) => new Date(o.createdAt) >= weekAgo && o.status !== 'refused')
      .reduce((sum, o) => sum + o.total, 0);

    return { total: arr.length, inProgress, delivered, revenue7d };
  });

  filtered = computed((): Order[] => {
    let arr = [...this.orders()];

    // recherche
    const searchTerm = this.search().trim().toLowerCase();
    if (searchTerm) {
      arr = arr.filter(
        (o) =>
          String(o.id).toLowerCase().includes(searchTerm) ||
          (o.customer.email?.toLowerCase() ?? '').includes(searchTerm) ||
          `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(searchTerm) ||
          o.items.some((i) => i.title.toLowerCase().includes(searchTerm))
      );
    }

    // statut
    if (this.status()) {
      arr = arr.filter((o) => o.status === this.status());
    }

    // type (produit vs abonnement)
    const type = this.typeFilter();
    if (type) {
      arr = arr.filter((o) => (o.orderType ?? 'product') === type);
    }

    // date
    const df = this.dateFilter();
    if (df) {
      const now = new Date();
      arr = arr.filter((o) => {
        const d = new Date(o.createdAt);
        switch (df) {
          case 'today':
            return d.toDateString() === now.toDateString();
          case 'week': {
            const w = new Date();
            w.setDate(w.getDate() - 7);
            return d >= w;
          }
          case 'month':
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          case 'year':
            return d.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // tri
    arr.sort((a, b) => {
      switch (this.sortBy()) {
        case 'createdAt_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'createdAt_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'total_asc':
          return a.total - b.total;
        case 'total_desc':
          return b.total - a.total;
        case 'id_asc':
          return String(a.id).localeCompare(String(b.id));
        case 'id_desc':
          return String(b.id).localeCompare(String(a.id));

        // tri client
        case 'customer':
        case 'customer_asc':
          return `${a.customer.firstName} ${a.customer.lastName}`.localeCompare(
            `${b.customer.firstName} ${b.customer.lastName}`
          );
        case 'customer_desc':
          return `${b.customer.firstName} ${b.customer.lastName}`.localeCompare(
            `${a.customer.firstName} ${a.customer.lastName}`
          );

        // tri statut (par libellé)
        case 'status':
        case 'status_asc':
          return this.span(a.status).localeCompare(this.span(b.status));
        case 'status_desc':
          return this.span(b.status).localeCompare(this.span(a.status));

        default:
          return 0;
      }
    });

    return arr;
  });

  totalPages = computed(() => {
    const total = this.filtered().length;
    const size = this.pagination().pageSize;
    return Math.ceil(total / size) || 1;
  });

  paginatedOrders = computed(() => {
    const arr = this.filtered();
    const { page, pageSize } = this.pagination();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return arr.slice(start, end);
  });

  async ngOnInit() {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    this.restoreSort();
    this.restorePageSize();

    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.orders.set(await this.ordersSvc.getAll());
    } catch (e) {
      console.error(e);
      this.toast.error('Impossible de charger les commandes');
    } finally {
      this.loading.set(false);
    }
  }

  refresh() {
    void this.load();
  }

  // === Handlers filtres/tri
  onSearchChange(val: string) {
    this.search.set(val);
    this.setPage(1);
  }

  onDateChange(val: DateFilter) {
    this.dateFilter.set(val);
    this.setPage(1);
  }

  onStatusChange(val: string) {
    this.status.set(val as OrderStatus);
    this.setPage(1);
  }

  onTypeChange(val: string) {
    this.typeFilter.set(val as '' | 'product' | 'subscription');
    this.setPage(1);
  }

  onSortChange(val: string) {
    this.sortBy.set(val as SortBy);
    const [field, dir] = val.split('_');
    this.sortState.set({ field, direction: (dir as 'asc' | 'desc') || 'asc' });
    this.saveSort(val);
  }

  toggleSort(field: string) {
    const current = this.sortState();
    const newDir = current.field === field && current.direction === 'asc' ? 'desc' : 'asc';
    const newSortBy = `${field}_${newDir}` as unknown as SortBy;
    this.sortBy.set(newSortBy);
    this.sortState.set({ field, direction: newDir });
    this.saveSort(newSortBy);
  }

  getSortIcon(field: string): string {
    const current = this.sortState();
    if (current.field !== field) return 'fa-sort text-gray-400';
    return current.direction === 'asc' ? 'fa-sort-up text-blue-600' : 'fa-sort-down text-blue-600';
  }

  quickFilter(filter: Exclude<DateFilter, ''>) {
    this.dateFilter.set(this.dateFilter() === filter ? '' : filter);
    this.setPage(1);
  }

  quickStatusFilter(statusValue: OrderStatus) {
    this.status.set(this.status() === statusValue ? '' : statusValue);
    this.setPage(1);
  }

  resetFilters() {
    this.search.set('');
    this.status.set('');
    this.dateFilter.set('');
    this.setPage(1);
  }

  // === Pagination
  setPage(page: number) {
    const { pageSize } = this.pagination();
    this.pagination.set({ page, pageSize });
  }

  previousPage() {
    if (this.pagination().page > 1) {
      this.setPage(this.pagination().page - 1);
    }
  }

  nextPage() {
    if (this.pagination().page < this.totalPages()) {
      this.setPage(this.pagination().page + 1);
    }
  }

  changePageSize(size: number) {
    this.pagination.set({ page: 1, pageSize: size });
    this.savePageSize(size);
  }

  // === Sélection
  toggleSelect(id: string) {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  toggleSelectAll() {
    const paginated = this.paginatedOrders();
    const current = new Set(this.selectedIds());
    const allSelected = paginated.every((o) => current.has(o.id));

    if (allSelected) {
      paginated.forEach((o) => current.delete(o.id));
    } else {
      paginated.forEach((o) => current.add(o.id));
    }
    this.selectedIds.set(current);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  isAllSelected(): boolean {
    const paginated = this.paginatedOrders();
    if (paginated.length === 0) return false;
    return paginated.every((o) => this.selectedIds().has(o.id));
  }

  isSomeSelected(): boolean {
    const paginated = this.paginatedOrders();
    if (paginated.length === 0) return false;
    const selected = paginated.filter((o) => this.selectedIds().has(o.id)).length;
    return selected > 0 && selected < paginated.length;
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  // === Actions ligne
  async changeStatus(o: Order, raw: string) {
    const status = raw as OrderStatus;
    try {
      await this.ordersSvc.updateStatus(o.id, status);
      await this.load();
      this.toast.success(`Statut de la commande #${o.id} mis à jour en ${this.span(status)}`);
    } catch {
      this.toast.error('Impossible de mettre à jour le statut');
    }
  }

  async remove(o: Order) {
    const ok = await this.confirm.ask({
      title: 'Supprimer la commande',
      message: `Cette action supprimera définitivement la commande #${o.id}.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
      requireText: { placeholder: 'Tapez "SUPPRIMER" pour confirmer', requiredValue: 'SUPPRIMER' },
    });
    if (!ok) return;

    try {
      await this.ordersSvc.delete(o.id);
      await this.load();
      this.toast.success(`Commande #${o.id} supprimée`);
    } catch {
      this.toast.error('Suppression impossible');
    }
  }

  // === Actions bulk
  async bulkUpdateStatus(status: OrderStatus) {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const ok = await this.confirm.ask({
      title: 'Mise à jour groupée',
      message: `Voulez-vous vraiment changer le statut de ${ids.length} commande(s) en "${this.span(
        status
      )}" ?`,
      confirmText: 'Confirmer',
      cancelText: 'Annuler',
      variant: 'warning',
    });
    if (!ok) return;

    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.ordersSvc.updateStatus(id, status);
        success++;
      } catch {
        failed++;
      }
    }

    await this.load();
    this.clearSelection();

    if (failed === 0) {
      this.toast.success(`${success} commande(s) mise(s) à jour`);
    } else {
      this.toast.warning(`${success} réussie(s), ${failed} échouée(s)`);
    }
  }

  async bulkDelete() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const ok = await this.confirm.ask({
      title: 'Suppression groupée',
      message: `Cette action supprimera définitivement ${ids.length} commande(s).`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
      requireText: { placeholder: 'Tapez "SUPPRIMER" pour confirmer', requiredValue: 'SUPPRIMER' },
    });
    if (!ok) return;

    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.ordersSvc.delete(id);
        success++;
      } catch {
        failed++;
      }
    }

    await this.load();
    this.clearSelection();

    if (failed === 0) {
      this.toast.success(`${success} commande(s) supprimée(s)`);
    } else {
      this.toast.warning(`${success} supprimée(s), ${failed} échouée(s)`);
    }
  }

  // === Export CSV
  exportCsv(): void {
    try {
      const csvContent = this.generateCsvContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      this.toast.success('Export CSV des commandes généré avec succès');
    } catch (err) {
      console.error('Erreur lors de l’export:', err);
      this.toast.error("Impossible de générer l'export CSV");
    }
  }

  private generateCsvContent(): string {
    const headers = [
      'ID',
      'Client',
      'Email',
      'Téléphone',
      'Ville',
      'Pays',
      'Statut',
      'Subtotal (€)',
      'Taxes (€)',
      'Frais de port (€)',
      'Total (€)',
      'Paiement (method)',
      'Paiement (brand)',
      'Carte (last4)',
      'Créée le',
      'Créée à',
      'Nb articles',
    ];
    const rows = this.filtered().map((o) => {
      const city = o.customer.address?.city ?? '';
      const country = o.customer.address?.country ?? '';
      const tel = o.customer.phone ?? '';
      const brand = this.paymentBrandLabel(o.payment.brand);
      return [
        `"${o.id}"`,
        `"${`${o.customer.firstName} ${o.customer.lastName}`}"`,
        `"${o.customer.email}"`,
        `"${tel}"`,
        `"${city}"`,
        `"${country}"`,
        `"${this.span(o.status)}"`,
        o.subtotal.toFixed(2).replace('.', ','),
        o.taxes.toFixed(2).replace('.', ','),
        o.shipping.toFixed(2).replace('.', ','),
        o.total.toFixed(2).replace('.', ','),
        o.payment.method,
        brand,
        o.payment.last4 ? `****${o.payment.last4}` : '',
        `"${this.formatDate(o.createdAt)}"`,
        `"${this.formatTime(o.createdAt)}"`,
        String(o.items.length),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private paymentBrandLabel(brand?: PaymentBrand): string {
    switch (brand) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      case 'paypal':
        return 'PayPal';
      case 'other':
        return 'Autre';
      default:
        return '';
    }
  }

  // === Prefs (localStorage)
  private saveSort(sort: string) {
    try {
      localStorage.setItem(this.SORT_KEY, sort);
    } catch {
      /* noop */
    }
  }

  private restoreSort() {
    try {
      const saved = localStorage.getItem(this.SORT_KEY);
      if (saved) {
        this.sortBy.set(saved as SortBy);
        const [field, dir] = saved.split('_');
        this.sortState.set({ field, direction: (dir as 'asc' | 'desc') || 'asc' });
      }
    } catch {
      /* noop */
    }
  }

  private savePageSize(size: number) {
    try {
      localStorage.setItem(this.PAGESIZE_KEY, String(size));
    } catch {
      /* noop */
    }
  }

  private restorePageSize() {
    try {
      const saved = localStorage.getItem(this.PAGESIZE_KEY);
      if (saved) {
        const size = parseInt(saved, 10);
        if ([25, 50, 100].includes(size)) {
          this.pagination.set({ ...this.pagination(), pageSize: size });
        }
      }
    } catch {
      /* noop */
    }
  }

  // === UI helpers
  span(s: OrderStatus | string): string {
    switch (s) {
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En traitement';
      case 'accepted':
        return 'Acceptée';
      case 'refused':
        return 'Refusée';
      case 'delivered':
        return 'Livrée';
      default:
        return '—';
    }
  }

  badge(s: OrderStatus): string {
    switch (s) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-indigo-100 text-indigo-800';
      case 'refused':
        return 'bg-red-100 text-red-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
    }
  }

  statusIcon(s: OrderStatus): string {
    switch (s) {
      case 'pending':
        return 'fa-hourglass-half';
      case 'processing':
        return 'fa-gears';
      case 'accepted':
        return 'fa-check';
      case 'refused':
        return 'fa-ban';
      case 'delivered':
        return 'fa-box-open';
    }
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatTime(d: string): string {
    return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
}
