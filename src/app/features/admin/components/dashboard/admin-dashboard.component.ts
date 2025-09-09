// src/app/features/admin/components/dashboard/admin-dashboard.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { CartStore } from '../../../cart/services/cart-store';
import { OrderStore } from '../../../cart/services/order-store';
import { ProductService } from '../../../catalog/services/product';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { ArtistService } from '../../../catalog/services/artist';
import { Artist, Product } from '../../../catalog/models/product.model';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrder: number;
  totalProducts: number;
}
interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}
interface CategoryStats {
  category: string;
  revenue: number;
  percentage: number;
  color: string;
}
interface TopProduct {
  id: number;
  title: string;
  artist: string;
  revenue: number;
  sales: number;
  image: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PricePipe],
  template: `
    <!-- Conteneur: largeur max + marges -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <!-- En-tête -->
      <div class="bg-white shadow-sm border border-gray-200 rounded-xl">
        <div class="px-6 py-5">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <p class="text-gray-600 mt-1">Vue d'ensemble de votre boutique</p>
            </div>
            <div class="flex items-center gap-3">
              <select
                [(ngModel)]="selectedPeriod"
                (change)="onPeriodChange()"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">90 derniers jours</option>
              </select>
              <button
                (click)="refreshData()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- CA -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              @if (loading()) {
              <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
              } @else {
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ stats().totalRevenue | price }}
              </p>
              }
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 text-sm">
            <span class="text-green-600 font-medium">+12.5%</span>
            <span class="text-gray-600 ml-2">vs période précédente</span>
          </div>
        </div>

        <!-- Commandes -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Commandes</p>
              @if (loading()) {
              <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
              } @else {
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().totalOrders }}</p>
              }
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 text-sm">
            <span class="text-blue-600 font-medium">+8.2%</span>
            <span class="text-gray-600 ml-2">vs période précédente</span>
          </div>
        </div>

        <!-- Panier moyen -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Panier moyen</p>
              @if (loading()) {
              <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
              } @else {
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ stats().averageOrder | price }}
              </p>
              }
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 text-sm">
            <span class="text-purple-600 font-medium">+5.1%</span>
            <span class="text-gray-600 ml-2">vs période précédente</span>
          </div>
        </div>

        <!-- Produits -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Produits actifs</p>
              @if (loading()) {
              <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
              } @else {
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().totalProducts }}</p>
              }
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 text-sm">
            <span class="text-orange-600 font-medium">{{ newProductsCount() }}</span>
            <span class="text-gray-600 ml-2">nouveaux ce mois</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Sales Chart -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Évolution des ventes</h3>
            <div class="flex items-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span class="text-gray-600">Revenus</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <span class="text-gray-600">Commandes</span>
              </div>
            </div>
          </div>

          @if (loading()) {
          <div class="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
          } @else {
          <div class="h-64 relative">
            <svg viewBox="0 0 800 200" class="w-full h-full">
              <g stroke="#f3f4f6" stroke-width="1">
                @for (i of [0,1,2,3,4]; track i) {
                <line x1="0" [attr.y1]="40 * i" x2="800" [attr.y2]="40 * i" />
                } @for (i of salesChartData(); track $index) {
                <line
                  [attr.x1]="(800 / salesChartData().length) * $index"
                  y1="0"
                  [attr.x2]="(800 / salesChartData().length) * $index"
                  y2="200"
                />
                }
              </g>

              <!-- Revenue line -->
              <polyline
                fill="none"
                stroke="#3b82f6"
                stroke-width="3"
                [attr.points]="getRevenuePoints()"
              />
              <!-- Orders line -->
              <polyline
                fill="none"
                stroke="#10b981"
                stroke-width="3"
                [attr.points]="getOrdersPoints()"
              />

              <!-- Points -->
              @for (point of salesChartData(); track $index) {
              <circle
                [attr.cx]="(800 / salesChartData().length) * $index"
                [attr.cy]="180 - (point.revenue / getMaxRevenue()) * 160"
                r="4"
                fill="#3b82f6"
              />
              <circle
                [attr.cx]="(800 / salesChartData().length) * $index"
                [attr.cy]="180 - (point.orders / getMaxOrders()) * 160"
                r="4"
                fill="#10b981"
              />
              }
            </svg>

            <!-- Y-axis labels -->
            <div
              class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12"
            >
              <span>{{ getMaxRevenue() | price }}</span>
              <span>{{ getMaxRevenue() * 0.75 | price }}</span>
              <span>{{ getMaxRevenue() * 0.5 | price }}</span>
              <span>{{ getMaxRevenue() * 0.25 | price }}</span>
              <span>0€</span>
            </div>
          </div>

          <!-- X-axis labels -->
          <div class="mt-4">
            <div
              class="grid"
              [ngStyle]="{
                'grid-template-columns': 'repeat(' + salesChartData().length + ', minmax(0,1fr))'
              }"
            >
              @for (point of salesChartData(); let i = $index; track i) {
              <div
                class="text-[10px] text-gray-500 text-center whitespace-nowrap"
                [class.opacity-0]="!shouldShowLabel(i)"
              >
                {{ shouldShowLabel(i) ? formatDate(point.date) : ' ' }}
              </div>
              }
            </div>
          </div>
          }
        </div>

        <!-- Category breakdown (séparée, plus d'imbrication) -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Répartition par catégorie</h3>

          @if (loading()) {
          <div class="space-y-4">
            @for (i of [1,2,3,4,5]; track i) {
            <div class="h-8 bg-gray-100 rounded animate-pulse"></div>
            }
          </div>
          } @else {
          <div class="space-y-4">
            @for (cat of categoryStats(); track cat.category) {
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded-full" [style.background-color]="cat.color"></div>
                <span class="text-sm font-medium text-gray-900">{{ cat.category }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-600">{{ cat.revenue | price }}</span>
                <span class="text-sm font-medium text-gray-900">{{ cat.percentage }}%</span>
              </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-500"
                [style.width.%]="cat.percentage"
                [style.background-color]="cat.color"
              ></div>
            </div>
            }
          </div>
          }
        </div>
      </div>

      <!-- Top Products Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Top 5 des meilleures ventes</h3>
        </div>

        @if (loading()) {
        <div class="p-6">
          <div class="space-y-4">
            @for (i of [1,2,3,4,5]; track i) {
            <div class="h-16 bg-gray-100 rounded animate-pulse"></div>
            }
          </div>
        </div>
        } @else {
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
                  Artiste
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ventes
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Revenus
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (product of topProducts(); track product.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <img
                      [src]="product.image"
                      [alt]="product.title"
                      class="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ product.title }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ product.artist }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ product.sales }} ventes
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ product.revenue | price }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    [routerLink]="['/product', product.id]"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Voir
                  </button>
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        }
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cartStore = inject(CartStore);
  private orderStore = inject(OrderStore);
  private productService = inject(ProductService);
  private artistService = inject(ArtistService);

  selectedPeriod = '30';
  loading = signal(true);

  private _stats = signal<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    totalProducts: 0,
  });
  stats = this._stats.asReadonly();

  private _salesChartData = signal<SalesData[]>([]);
  salesChartData = this._salesChartData.asReadonly();

  private _categoryStats = signal<CategoryStats[]>([]);
  categoryStats = this._categoryStats.asReadonly();

  private _topProducts = signal<TopProduct[]>([]);
  topProducts = this._topProducts.asReadonly();

  newProductsCount = computed(() => Math.floor(Math.random() * 10) + 3);

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading.set(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      await this.generateMockStats();
      await this.generateMockChartData();
      await this.generateMockCategoryStats();
      await this.generateMockTopProducts();
    } finally {
      this.loading.set(false);
    }
  }

  private async generateMockStats() {
    const totalRevenue = Math.floor(Math.random() * 50000) + 25000;
    const totalOrders = Math.floor(Math.random() * 200) + 150;
    const averageOrder = totalRevenue / totalOrders;
    const products = await this.productService.getAllProducts();
    const totalProducts = products.length;
    this._stats.set({ totalRevenue, totalOrders, averageOrder, totalProducts });
  }

  private async generateMockChartData() {
    const days = parseInt(this.selectedPeriod, 10);
    const data: SalesData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 2000) + 500,
        orders: Math.floor(Math.random() * 15) + 5,
      });
    }
    this._salesChartData.set(data);
  }

  private async generateMockCategoryStats() {
    const cats = [
      { name: 'Peinture', color: '#3b82f6' },
      { name: 'Photographie', color: '#10b981' },
      { name: 'Art Numérique', color: '#f59e0b' },
      { name: 'Dessin', color: '#ef4444' },
      { name: 'Sculpture', color: '#8b5cf6' },
    ];
    const total = this.stats().totalRevenue;
    let remaining = 100;
    const stats = cats.map((c, idx) => {
      const isLast = idx === cats.length - 1;
      const pct = isLast ? remaining : Math.floor(Math.random() * (remaining / 2)) + 10;
      remaining -= pct;
      return {
        category: c.name,
        revenue: (total * pct) / 100,
        percentage: Math.max(pct, 0),
        color: c.color,
      };
    });
    this._categoryStats.set(stats);
  }

  private resolveArtistName(p: Product, byId: Map<number, Artist>): string {
    return p.artist?.name ?? byId.get(p.artistId)?.name ?? 'Artiste inconnu';
  }

  private async generateMockTopProducts() {
    const [products, artists] = await Promise.all([
      this.productService.getAllProducts(),
      this.artistService.getAll(),
    ]);
    const byId = new Map(artists.map((a) => [a.id, a]));

    const top = [...products]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map((p, i) => ({
        id: p.id,
        title: p.title,
        artist: this.resolveArtistName(p, byId),
        revenue: Math.floor(Math.random() * 5000) + 1000 - i * 200,
        sales: Math.floor(Math.random() * 25) + 5 - i,
        image: p.images?.[0] ?? '',
      }))
      .sort((a, b) => b.revenue - a.revenue);

    this._topProducts.set(top);
  }

  onPeriodChange() {
    this.loadDashboardData();
  }
  refreshData() {
    this.loadDashboardData();
  }

  getMaxRevenue(): number {
    const max = Math.max(...this.salesChartData().map((d) => d.revenue));
    return Math.ceil(max / 1000) * 1000;
  }
  getMaxOrders(): number {
    return Math.max(...this.salesChartData().map((d) => d.orders));
  }

  getRevenuePoints(): string {
    const data = this.salesChartData();
    const max = this.getMaxRevenue();
    return data
      .map((p, i) => `${(800 / data.length) * i},${180 - (p.revenue / max) * 160}`)
      .join(' ');
  }
  getOrdersPoints(): string {
    const data = this.salesChartData();
    const max = this.getMaxOrders();
    return data
      .map((p, i) => `${(800 / data.length) * i},${180 - (p.orders / max) * 160}`)
      .join(' ');
  }

  // Labels X: limiter et garder le dernier
  labelStep(): number {
    const n = this.salesChartData().length || 1;
    return Math.max(1, Math.ceil(n / 12));
  }
  shouldShowLabel(i: number): boolean {
    const n = this.salesChartData().length || 1;
    return i % this.labelStep() === 0 || i === n - 1;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }
}
