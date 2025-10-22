import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { OrderService } from '../../orders/services/order';
import type { Order, OrderStatus } from '../../orders/models/order.model';
import { AuthService } from '../../auth/services/auth';
import { AdminHeaderComponent } from '../../../shared/components/admin-header/admin-header.component';
import { SubscriptionService } from '../../subscriptions/services/subscription.service';
import type {
  UserSubscription,
  SubscriptionPlan,
} from '../../subscriptions/models/subscription.model';

interface SubscriptionOrderView {
  subscription: UserSubscription;
  plan: SubscriptionPlan;
  user: {
    id: number;
    name: string;
    email: string;
  };
  nextBillingDate: string;
  monthlyOrders: Order[];
  status: 'active' | 'paused' | 'canceled';
}

@Component({
  selector: 'app-subscription-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AdminHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <app-admin-header
        title="Commandes d'Abonnement"
        description="Gérez les abonnements actifs et leurs commandes mensuelles"
        icon="fa-crown"
        gradientClass="bg-gradient-to-br from-purple-500 to-pink-500"
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
        </div>
      </app-admin-header>

      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Abonnements Actifs</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">
                  {{ stats().activeSubscriptions }}
                </p>
                }
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-crown text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Revenus Mensuels</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">
                  {{ stats().monthlyRevenue | number : '1.0-0' }}€
                </p>
                }
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-euro-sign text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Renouvellements (7j)</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().renewalsNext7Days }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-calendar-check text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">En Pause</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">
                  {{ stats().pausedSubscriptions }}
                </p>
                }
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-pause text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Recherche</span>
              <input
                type="text"
                [ngModel]="search()"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Nom, email, plan..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
              />
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Statut</span>
              <select
                [ngModel]="statusFilter()"
                (ngModelChange)="onStatusChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
              >
                <option value="">Tous</option>
                <option value="active">Actif</option>
                <option value="paused">En pause</option>
                <option value="canceled">Annulé</option>
              </select>
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Plan</span>
              <select
                [ngModel]="planFilter()"
                (ngModelChange)="onPlanChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
              >
                <option value="">Tous les plans</option>
                @for (plan of allPlans(); track plan.id) {
                <option [value]="plan.id">{{ plan.name }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <!-- Liste des abonnements -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              Abonnements ({{ filteredSubscriptions().length }})
            </h3>
          </div>

          @if (loading()) {
          <div class="p-6">
            <div class="space-y-4">
              @for (i of [1,2,3,4,5]; track i) {
              <div class="h-24 bg-gray-100 rounded animate-pulse"></div>
              }
            </div>
          </div>
          } @else if (filteredSubscriptions().length > 0) {
          <div class="divide-y divide-gray-200">
            @for (item of filteredSubscriptions(); track item.subscription.id) {
            <div class="p-6 hover:bg-gray-50 transition-colors">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <div
                      class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold"
                    >
                      {{ getInitials(item.user.name) }}
                    </div>
                    <div>
                      <h4 class="text-base font-semibold text-gray-900">{{ item.user.name }}</h4>
                      <p class="text-sm text-gray-500">{{ item.user.email }}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p class="text-xs text-gray-500 uppercase">Plan</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700"
                        >
                          <i class="fa-solid fa-crown"></i>
                          {{ item.plan.name }}
                        </span>
                        <span class="text-xs text-gray-600">
                          ({{ item.subscription.term === 'monthly' ? 'Mensuel' : 'Annuel' }})
                        </span>
                      </div>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500 uppercase">Statut</p>
                      <span class="mt-1" [ngClass]="getStatusBadge(item.subscription.status)">
                        {{ getStatusLabel(item.subscription.status) }}
                      </span>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500 uppercase">Prochain renouvellement</p>
                      <p class="text-sm font-medium text-gray-900 mt-1">
                        {{ formatDate(item.subscription.currentPeriodEnd) }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ getRemainingDays(item.subscription.currentPeriodEnd) }}
                      </p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500 uppercase">Multiplicateur</p>
                      <p class="text-sm font-medium text-gray-900 mt-1">
                        ×{{ item.subscription.appliedMultiplier }}
                      </p>
                    </div>
                  </div>

                  @if (item.monthlyOrders.length > 0) {
                  <div class="mt-4 pt-4 border-t border-gray-100">
                    <p class="text-xs font-medium text-gray-700 uppercase mb-2">
                      Commandes mensuelles ({{ item.monthlyOrders.length }})
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                      @for (order of item.monthlyOrders; track order.id) {
                      <a
                        [routerLink]="['/admin/orders', order.id]"
                        class="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div class="flex items-center gap-2">
                          <i class="fa-solid fa-receipt text-xs text-gray-400"></i>
                          <span class="text-xs font-medium text-gray-700">#{{ order.id }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-gray-500">{{
                            formatDate(order.createdAt)
                          }}</span>
                          <span [ngClass]="getOrderStatusBadge(order.status)" class="text-xs">
                            {{ getOrderStatusLabel(order.status) }}
                          </span>
                        </div>
                      </a>
                      }
                    </div>
                  </div>
                  }
                </div>

                <div class="flex items-center gap-2 ml-4">
                  <a
                    [routerLink]="['/admin/users', item.user.id]"
                    class="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-2 rounded transition-colors"
                    title="Voir l'utilisateur"
                  >
                    <i class="fa-solid fa-user text-sm"></i>
                  </a>
                </div>
              </div>
            </div>
            }
          </div>
          } @else {
          <div class="p-12 text-center">
            <i class="fa-solid fa-crown text-5xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-900 mb-2">Aucun abonnement</p>
            <p class="text-sm text-gray-500">Aucun abonnement ne correspond à vos filtres</p>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class SubscriptionOrdersPage implements OnInit {
  private auth = inject(AuthService);
  private ordersSvc = inject(OrderService);
  private subscriptionSvc = inject(SubscriptionService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(true);
  search = signal('');
  statusFilter = signal<'' | 'active' | 'paused' | 'canceled'>('');
  planFilter = signal<number | ''>('');

  allPlans = signal<SubscriptionPlan[]>([]);
  subscriptionOrders = signal<SubscriptionOrderView[]>([]);

  stats = computed(() => {
    const items = this.subscriptionOrders();
    const activeSubscriptions = items.filter((i) => i.subscription.status === 'active').length;
    const pausedSubscriptions = 0; // Plus de statut "paused"

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const renewalsNext7Days = items.filter((i) => {
      const endDate = new Date(i.subscription.currentPeriodEnd);
      return endDate >= now && endDate <= in7Days && i.subscription.status === 'active';
    }).length;

    const monthlyRevenue = items
      .filter((i) => i.subscription.status === 'active')
      .reduce((sum, i) => {
        const price =
          i.subscription.term === 'monthly' ? i.plan.monthlyPrice : i.plan.annualPrice / 12;
        return sum + price;
      }, 0);

    return {
      activeSubscriptions,
      pausedSubscriptions,
      renewalsNext7Days,
      monthlyRevenue,
    };
  });

  filteredSubscriptions = computed(() => {
    let items = this.subscriptionOrders();

    const searchTerm = this.search().trim().toLowerCase();
    if (searchTerm) {
      items = items.filter(
        (i) =>
          i.user.name.toLowerCase().includes(searchTerm) ||
          i.user.email.toLowerCase().includes(searchTerm) ||
          i.plan.name.toLowerCase().includes(searchTerm)
      );
    }

    const status = this.statusFilter();
    if (status) {
      items = items.filter((i) => i.subscription.status === status);
    }

    const plan = this.planFilter();
    if (plan) {
      items = items.filter((i) => i.plan.id === plan);
    }

    return items;
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
      // Charger tous les plans
      this.allPlans.set(this.subscriptionSvc.getAllPlans());

      // Charger toutes les commandes
      const allOrders = await this.ordersSvc.getAll();

      // Filtrer les commandes d'abonnement
      const subscriptionOrders = allOrders.filter((o) => o.orderType === 'subscription');

      // Charger tous les utilisateurs pour avoir leurs infos
      const users = await this.auth.getAllUsers();

      // Construire la vue combinée
      const views: SubscriptionOrderView[] = [];

      // Parcourir tous les plans actifs
      for (const plan of this.allPlans()) {
        // Trouver tous les abonnements pour ce plan
        const planSubs = this.getAllUserSubscriptions().filter((s) => s.planId === plan.id);

        for (const sub of planSubs) {
          const user = users.find((u) => u.id === sub.userId);
          if (!user) continue;

          const monthlyOrders = subscriptionOrders.filter((o) => o.subscriptionId === sub.id);

          views.push({
            subscription: sub,
            plan,
            user: {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
            },
            nextBillingDate: sub.currentPeriodEnd,
            monthlyOrders,
            status: sub.status,
          });
        }
      }

      this.subscriptionOrders.set(views);
    } catch (e) {
      console.error(e);
      this.toast.error('Impossible de charger les abonnements');
    } finally {
      this.loading.set(false);
    }
  }

  private getAllUserSubscriptions(): UserSubscription[] {
    // Récupérer tous les abonnements utilisateurs
    // const allUsers = this.auth.getCurrentUser(); // Pour accéder au service auth
    const subs: UserSubscription[] = [];

    // On va parcourir tous les IDs utilisateurs possibles
    // C'est une approche simplifiée - dans un vrai projet, on aurait une API dédiée
    for (let userId = 1; userId <= 1000; userId++) {
      const sub = this.subscriptionSvc.getActiveForUser(userId);
      if (sub) {
        subs.push(sub);
      }
    }

    return subs;
  }

  refresh() {
    void this.load();
  }

  onSearchChange(val: string) {
    this.search.set(val);
  }

  onStatusChange(val: string) {
    this.statusFilter.set(val as '' | 'active' | 'paused' | 'canceled');
  }

  onPlanChange(val: string) {
    this.planFilter.set(val ? Number(val) : '');
  }

  getStatusBadge(status: string): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'active':
        return `${base} bg-green-100 text-green-800`;
      case 'paused':
        return `${base} bg-orange-100 text-orange-800`;
      case 'canceled':
        return `${base} bg-red-100 text-red-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'paused':
        return 'En pause';
      case 'canceled':
        return 'Annulé';
      default:
        return status;
    }
  }

  getOrderStatusBadge(status: OrderStatus): string {
    switch (status) {
      case 'pending':
        return 'text-gray-700 bg-gray-100';
      case 'processing':
        return 'text-blue-700 bg-blue-100';
      case 'accepted':
        return 'text-indigo-700 bg-indigo-100';
      case 'refused':
        return 'text-red-700 bg-red-100';
      case 'delivered':
        return 'text-green-700 bg-green-100';
    }
  }

  getOrderStatusLabel(status: OrderStatus): string {
    switch (status) {
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
    }
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getRemainingDays(endDate: string): string {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diff < 0) return 'Expiré';
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    return `Dans ${diff} jours`;
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
