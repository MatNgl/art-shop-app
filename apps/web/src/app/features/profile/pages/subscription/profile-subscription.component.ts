import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SubscriptionStore } from '../../../subscriptions/services/subscription-store';
import { AuthHttpService as AuthService } from '../../../auth/services/auth-http.service';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { ChangePlanModalComponent } from '../../components/change-plan-modal/change-plan-modal.component';

@Component({
  selector: 'app-profile-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink, PricePipe, ChangePlanModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./profile-subscription.component.scss'],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6 text-gray-900">Mon abonnement</h1>

      @if (!isAuthenticated()) {
        <div class="card-glass">
          <p class="text-gray-700">Vous devez être connecté.</p>
        </div>
      } @else if (activeSub(); as sub) {
        <!-- Abonnement actif -->
        <div class="subscription-card">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">{{ planName() }}</h2>
              <p class="text-gray-600 mt-1">{{ planDescription() }}</p>
            </div>
            <span [class]="statusBadge(sub.status)">
              {{ statusLabel(sub.status) }}
            </span>
          </div>

          <dl class="grid gap-4 sm:grid-cols-2 mt-6">
            <div>
              <dt class="text-sm text-gray-600">Période actuelle</dt>
              <dd class="text-gray-900 font-medium">
                {{ formatDate(sub.currentPeriodStart) }} → {{ formatDate(sub.currentPeriodEnd) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-600">Formule</dt>
              <dd class="text-gray-900 font-medium">
                {{ sub.term === 'monthly' ? 'Mensuelle' : 'Annuelle' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-600">Prochain prélèvement</dt>
              <dd class="text-gray-900 font-medium">
                {{ formatDate(sub.currentPeriodEnd) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-600">Multiplicateur fidélité</dt>
              <dd class="text-purple-600 font-bold">×{{ sub.appliedMultiplier }}</dd>
            </div>
          </dl>

          <!-- Actions -->
          <div class="mt-6 flex flex-wrap gap-3">
            @if (sub.status === 'active') {
              <button
                type="button"
                (click)="showChangePlanModal()"
                class="btn btn--primary"
              >
                <i class="fa-solid fa-repeat mr-2"></i>
                Changer de plan
              </button>
            }
            @if (sub.status !== 'canceled') {
              <button type="button" (click)="confirmCancelSub()" class="btn btn--danger">
                <i class="fa-solid fa-xmark mr-2"></i>
                Annuler l'abonnement
              </button>
            }
          </div>
        </div>

        <!-- Upgrade modal si nécessaire -->
        @if (showingUpgrade()) {
          <div class="card-glass mt-6">
            <h3 class="font-semibold text-lg mb-4 text-gray-900">Plans disponibles</h3>
            <div class="space-y-3">
              @for (plan of availableUpgrades(); track plan.id) {
                <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-white/40 transition-all">
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">{{ plan.name }}</h4>
                    <p class="text-sm text-gray-600">{{ plan.description }}</p>
                    <p class="text-xs text-purple-600 mt-1">×{{ plan.loyaltyMultiplier }} fidélité</p>
                  </div>
                  <div class="text-right ml-4">
                    <div class="font-bold text-gray-900">{{ getPrice(plan) | price }}</div>
                    <button
                      type="button"
                      (click)="upgradeTo(plan.id)"
                      class="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      Choisir
                    </button>
                  </div>
                </div>
              }
            </div>
            <button
              type="button"
              (click)="showingUpgrade.set(false)"
              class="mt-4 btn btn--secondary"
            >
              Annuler
            </button>
          </div>
        }
      } @else {
        <!-- Aucun abonnement -->
        <div class="card-glass text-center">
          <p class="text-gray-700 mb-4">Vous n'avez pas d'abonnement actif.</p>
          <a routerLink="/subscriptions" class="btn btn--primary">
            <i class="fa-solid fa-star mr-2"></i>
            Découvrir nos abonnements
          </a>
        </div>
      }
    </div>

    <!-- Modal changement de plan -->
    @if (showChangePlan()) {
      <app-change-plan-modal
        (closed)="onModalClosed()"
        (planChanged)="onPlanChanged()"
      />
    }
  `,
})
export class ProfileSubscriptionComponent {
  private readonly store = inject(SubscriptionStore);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  activeSub = this.store.active;
  showingUpgrade = signal(false);
  showChangePlan = signal(false);

  isAuthenticated = () => this.auth.isAuthenticated();

  planName = computed(() => {
    const sub = this.activeSub();
    if (!sub) return '';
    const plan = this.store.plans().find(p => p.id === sub.planId);
    return plan?.name ?? 'Abonnement';
  });

  planDescription = computed(() => {
    const sub = this.activeSub();
    if (!sub) return '';
    const plan = this.store.plans().find(p => p.id === sub.planId);
    return plan?.description ?? '';
  });

  canUpgrade = computed(() => {
    const sub = this.activeSub();
    if (!sub) return false;
    const currentPlan = this.store.plans().find(p => p.id === sub.planId);
    if (!currentPlan) return false;
    return this.store.publicPlans().some(p => p.displayOrder > currentPlan.displayOrder);
  });

  availableUpgrades = computed(() => {
    const sub = this.activeSub();
    if (!sub) return [];
    const currentPlan = this.store.plans().find(p => p.id === sub.planId);
    if (!currentPlan) return [];
    return this.store.publicPlans().filter(p => p.displayOrder > currentPlan.displayOrder);
  });

  getPrice(plan: { monthlyPrice: number; annualPrice: number }): number {
    const term = this.activeSub()?.term ?? 'monthly';
    return term === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  }

  statusBadge(status: string): string {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'active': return `${base} bg-green-100 text-green-700`;
      case 'canceled': return `${base} bg-red-100 text-red-700`;
      default: return `${base} bg-gray-100 text-gray-700`;
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'canceled': return 'Annulé';
      default: return status;
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR');
  }

  showUpgradeOptions(): void {
    this.showingUpgrade.set(true);
  }

  upgradeTo(planId: number): void {
    const res = this.store.upgradePlan(planId, false);
    if (res.success) {
      this.toast.success('Plan mis à niveau ! Changement effectif au prochain renouvellement.');
      this.showingUpgrade.set(false);
    } else {
      this.toast.error(res.error ?? 'Impossible de changer de plan.');
    }
  }


  showChangePlanModal(): void {
    this.showChangePlan.set(true);
  }

  onModalClosed(): void {
    this.showChangePlan.set(false);
  }

  onPlanChanged(): void {
    this.showChangePlan.set(false);
    this.store.refresh();
  }

  async confirmCancelSub(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Confirmer l\'annulation',
      message: 'Êtes-vous sûr de vouloir annuler votre abonnement ? Il restera actif jusqu\'à la fin de la période en cours.',
      variant: 'danger',
      confirmText: 'Oui, annuler',
      cancelText: 'Non, garder',
    });

    if (!confirmed) return;

    const res = this.store.cancel();
    if (res.success) {
      this.toast.info('Abonnement annulé. Valable jusqu\'à la fin de la période en cours.');
    } else {
      this.toast.error(res.error ?? 'Erreur lors de l\'annulation.');
    }
  }
}
