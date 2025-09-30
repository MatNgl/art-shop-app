import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { OrderService } from '../../../orders/services/order';
import type { Order, OrderStatus } from '../../../orders/models/order.model';
import { AuthService } from '../../../auth/services/auth';

type SortBy =
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'total_desc'
  | 'total_asc'
  | 'status'
  | 'customer';

type DateFilter = '' | 'today' | 'week' | 'month' | 'year';

@Component({
  selector: 'app-admin-orders',
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
                <span class="text-gray-900">Commandes</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
              <p class="text-gray-600 mt-1">Consultez et mettez à jour l'état des commandes</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                (click)="refresh()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <i class="fa-solid fa-arrows-rotate text-sm"></i> Actualiser
              </button>
              <button
                (click)="exportCsv()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                <i class="fa-solid fa-download text-sm"></i> Exporter CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Commandes</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().total }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-receipt text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">En cours</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().inProgress }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-truck-fast text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Livrées</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().delivered }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-box-open text-green-600 text-xl"></i>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">CA (7j)</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
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
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Recherche</span>
              <input
                type="text"
                [ngModel]="search()"
                (ngModelChange)="search.set($event)"
                placeholder="ID, client, email, produit..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Statut</span>
              <select
                [ngModel]="status()"
                (ngModelChange)="onStatusChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                (ngModelChange)="dateFilter.set($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt_desc">Plus récentes</option>
                <option value="createdAt_asc">Plus anciennes</option>
                <option value="total_desc">Montant ↓</option>
                <option value="total_asc">Montant ↑</option>
                <option value="status">Statut</option>
                <option value="customer">Client A-Z</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Commandes ({{ filtered().length }})</h3>
            <div class="text-sm text-gray-500">
              {{ filtered().length }} / {{ orders().length }} commandes
            </div>
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
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Commande
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Client
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Montant
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Statut
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (o of filtered(); track o.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">#{{ o.id }}</div>
                    <div class="text-xs text-gray-500">Articles: {{ o.items.length }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                      {{ o.customer.firstName }} {{ o.customer.lastName }}
                    </div>
                    <div class="text-xs text-gray-500">{{ o.customer.email }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ o.total | number : '1.2-2' }} €
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="badge(o.status)"
                    >
                      <i class="fa-solid mr-1" [ngClass]="statusIcon(o.status)"></i>
                      {{ span(o.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{{ formatDate(o.createdAt) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button
                        [routerLink]="['/admin/orders', o.id]"
                        class="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded"
                        title="Voir les détails"
                      >
                        <i class="fa-solid fa-eye"></i>
                      </button>

                      <select
                        class="text-sm border rounded px-2 py-1"
                        [ngModel]="o.status"
                        (ngModelChange)="changeStatus(o, $event)"
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
            <i class="fa-solid fa-receipt text-4xl text-gray-400 mb-4"></i>
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

  // Filtres (tout en signals)
  search = signal<string>('');
  status = signal<'' | OrderStatus>('');
  dateFilter = signal<DateFilter>('');
  sortBy = signal<SortBy>('createdAt_desc');

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

  filtered = computed(() => {
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

    // date
    const dateFilter = this.dateFilter();
    if (dateFilter) {
      const now = new Date();
      arr = arr.filter((o) => {
        const d = new Date(o.createdAt);
        switch (dateFilter) {
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
        case 'status':
          return this.span(a.status).localeCompare(this.span(b.status));
        case 'customer':
          return `${a.customer.firstName} ${a.customer.lastName}`.localeCompare(
            `${b.customer.firstName} ${b.customer.lastName}`
          );
        default:
          return 0;
      }
    });

    return arr;
  });

  async ngOnInit() {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }
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
    this.load();
  }

  onStatusChange(val: string) {
    this.status.set(val as OrderStatus);
  }

  onSortChange(val: string) {
    this.sortBy.set(val as SortBy);
  }

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

  exportCsv() {
    const headers = [
      'ID',
      'Client',
      'Email',
      'Articles',
      'Total (€)',
      'Statut',
      'Créée le',
      'Paiement',
    ];
    const rows = this.filtered().map((o) =>
      [
        o.id,
        `"${o.customer.firstName} ${o.customer.lastName}"`,
        `"${o.customer.email}"`,
        o.items.length,
        o.total.toFixed(2).replace('.', ','),
        this.span(o.status),
        `"${this.formatDate(o.createdAt)}"`,
        o.payment.method + (o.payment.last4 ? ` ****${o.payment.last4}` : ''),
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Export CSV des commandes généré');
  }

  // UI helpers
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
}
