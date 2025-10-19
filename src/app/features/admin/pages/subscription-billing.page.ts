import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../auth/services/auth';
import { AdminHeaderComponent } from '../../../shared/components/admin-header/admin-header.component';
import { SubscriptionBillingService } from '../../subscriptions/services/subscription-billing.service';
import type { PendingSubscriptionOrder } from '../../subscriptions/models/subscription.model';

@Component({
  selector: 'app-subscription-billing',
  standalone: true,
  imports: [CommonModule, AdminHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <app-admin-header
        title="Facturation des Abonnements"
        description="Générez les commandes mensuelles pour tous les abonnements actifs"
        icon="fa-file-invoice-dollar"
        gradientClass="bg-gradient-to-br from-green-500 to-teal-500"
      >
        <div actions class="flex items-center gap-3">
          <button
            (click)="generateOrders()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            [disabled]="loading()"
          >
            <i class="fa-solid fa-bolt text-sm" [class.animate-pulse]="loading()"></i>
            {{ loading() ? 'Génération...' : 'Générer Commandes du Mois' }}
          </button>
        </div>
      </app-admin-header>

      <div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Mois prochain</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ nextMonthLabel() }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-calendar text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Commandes à générer</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().toGenerate }}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-list-check text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Déjà générées</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().generated }}</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-check text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Revenus attendus</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().expectedRevenue | number:'1.0-0' }}€</p>
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-euro-sign text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Info box -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div class="flex items-start gap-3">
            <i class="fa-solid fa-info-circle text-blue-600 text-xl mt-0.5"></i>
            <div>
              <h3 class="font-semibold text-blue-900 mb-2">Fonctionnement de la génération</h3>
              <ul class="text-sm text-blue-800 space-y-1">
                <li>• Toutes les commandes d'abonnement sont générées pour le <strong>1er du mois prochain</strong></li>
                <li>• Peu importe la date de souscription, le paiement mensuel est dû au début du mois</li>
                <li>• Les commandes sont créées avec le statut "En attente" et de type "Abonnement"</li>
                <li>• Les abonnements annuels génèrent une commande tous les 12 mois</li>
              </ul>
            </div>
          </div>
        </div>

        @if (lastGeneration()) {
        <div class="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div class="flex items-start gap-3">
            <i class="fa-solid fa-check-circle text-green-600 text-xl mt-0.5"></i>
            <div>
              <h3 class="font-semibold text-green-900 mb-2">Dernière génération réussie</h3>
              <p class="text-sm text-green-800">
                {{ lastGeneration()!.success }} commande(s) créée(s) ·
                @if (lastGeneration()!.failed > 0) {
                  <span class="text-red-600">{{ lastGeneration()!.failed }} échec(s)</span>
                }
                @if (lastGeneration()!.failed === 0) {
                  <span class="text-green-600">Aucun échec</span>
                }
              </p>
            </div>
          </div>
        </div>
        }

        <!-- Liste des commandes à générer -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              Commandes planifiées ({{ pendingOrders().length }})
            </h3>
          </div>

          @if (pendingOrders().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date prévue
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (order of pendingOrders(); track order.subscriptionId) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">User #{{ order.userId }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ order.planName }}</div>
                    <div class="text-xs text-gray-500">{{ order.term === 'monthly' ? 'Mensuel' : 'Annuel' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-gray-900">{{ order.amount | number:'1.2-2' }}€</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ formatDate(order.dueDate) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [ngClass]="getStatusBadge(order.status)">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
          } @else {
          <div class="p-12 text-center">
            <i class="fa-solid fa-inbox text-5xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-900 mb-2">Aucune commande planifiée</p>
            <p class="text-sm text-gray-500">Cliquez sur "Générer Commandes du Mois" pour créer les commandes d'abonnement</p>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class SubscriptionBillingPage implements OnInit {
  private auth = inject(AuthService);
  private billingSvc = inject(SubscriptionBillingService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(false);
  pendingOrders = signal<PendingSubscriptionOrder[]>([]);
  lastGeneration = signal<{ success: number; failed: number } | null>(null);

  stats = computed(() => {
    const orders = this.pendingOrders();
    const toGenerate = orders.filter(o => o.status === 'pending').length;
    const generated = orders.filter(o => o.status === 'generated').length;
    const expectedRevenue = orders.reduce((sum, o) => sum + o.amount, 0);

    return { toGenerate, generated, expectedRevenue };
  });

  nextMonthLabel = computed(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  async ngOnInit() {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    this.loadPendingOrders();
  }

  loadPendingOrders() {
    this.pendingOrders.set(this.billingSvc.getPendingOrdersForNextMonth());
  }

  async generateOrders() {
    this.loading.set(true);
    try {
      const result = await this.billingSvc.generateMonthlyOrders();

      this.lastGeneration.set({
        success: result.success,
        failed: result.failed,
      });

      if (result.failed === 0) {
        this.toast.success(`${result.success} commande(s) générée(s) avec succès`);
      } else {
        this.toast.warning(`${result.success} commande(s) générée(s), ${result.failed} échec(s)`);
      }

      this.loadPendingOrders();
    } catch (e) {
      console.error(e);
      this.toast.error('Erreur lors de la génération des commandes');
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  getStatusBadge(status: string): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${base} bg-yellow-100 text-yellow-800`;
      case 'generated':
        return `${base} bg-green-100 text-green-800`;
      case 'failed':
        return `${base} bg-red-100 text-red-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'generated': return 'Générée';
      case 'failed': return 'Échec';
      default: return status;
    }
  }
}
