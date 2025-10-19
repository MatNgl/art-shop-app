import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionStore } from '../../../subscriptions/services/subscription-store';
import { SubscriptionBillingService } from '../../../subscriptions/services/subscription-billing.service';
import { ToastService } from '../../../../shared/services/toast.service';
import type { SubscriptionPlan } from '../../../subscriptions/models/subscription.model';
import { AuthService } from '../../../auth/services/auth';

@Component({
  selector: 'app-change-plan-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="button"
      tabindex="0"
      aria-label="Fermer la modale de changement de plan"
      (click)="onClose()"
      (keyup.enter)="onClose()"
      (keyup.space)="onClose()"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="changePlanTitle"
        tabindex="0"
        (click)="$event.stopPropagation()"
        (keyup.enter)="$event.stopPropagation()"
        (keyup.space)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="px-8 py-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h2 id="changePlanTitle" class="text-2xl font-bold text-gray-900">Changer de plan</h2>
              <p class="text-sm text-gray-500 mt-1">
                Plan actuel :
                <span class="font-semibold text-purple-600">{{ currentPlan()?.name }}</span>
              </p>
            </div>
            <button
              type="button"
              (click)="onClose()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <i class="fa-solid fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        <!-- Plans Grid -->
        <div class="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (plan of availablePlans(); track plan.id) {
            <button
              type="button"
              class="relative w-full text-left border-2 rounded-xl p-6 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-100"
              [class.border-purple-500]="selectedPlanId() === plan.id"
              [class.bg-purple-50]="selectedPlanId() === plan.id"
              [class.border-gray-200]="selectedPlanId() !== plan.id"
              [class.hover:border-gray-300]="selectedPlanId() !== plan.id"
              (click)="selectPlan(plan.id)"
              [attr.aria-pressed]="selectedPlanId() === plan.id"
              [attr.aria-current]="currentPlan()?.id === plan.id ? 'true' : null"
            >
              <!-- Badge if current -->
              @if (currentPlan()?.id === plan.id) {
              <div class="absolute top-4 right-4">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"
                >
                  <i class="fa-solid fa-check mr-1"></i>
                  Actuel
                </span>
              </div>
              }

              <!-- Plan name -->
              <div class="mb-4">
                <h3 class="text-xl font-bold text-gray-900">{{ plan.name }}</h3>
              </div>

              <!-- Price -->
              <div class="mb-6">
                <div class="flex items-baseline gap-2">
                  <span class="text-4xl font-bold text-gray-900">
                    {{
                      term() === 'monthly'
                        ? plan.monthlyPrice
                        : (plan.annualPrice / 12 | number : '1.0-0')
                    }}€</span
                  >
                  <span class="text-gray-500">/mois</span>
                </div>
                @if (term() === 'annual' && plan.monthsOfferedOnAnnual > 0) {
                <p class="text-sm text-green-600 font-medium mt-1">
                  {{ plan.monthsOfferedOnAnnual }} mois offert(s)
                </p>
                }
              </div>

              <!-- Features -->
              <ul class="space-y-3 mb-6">
                @for (perk of plan.perksShort; track $index) {
                <li class="flex items-start gap-2 text-sm text-gray-700">
                  <i class="fa-solid fa-check text-purple-600 mt-0.5"></i>
                  <span>{{ perk }}</span>
                </li>
                }
              </ul>

              <!-- Loyalty multiplier -->
              <div class="pt-4 border-t border-gray-200">
                <div class="flex items-center gap-2 text-sm">
                  <i class="fa-solid fa-star text-amber-500"></i>
                  <span class="text-gray-700"> Points fidélité ×{{ plan.loyaltyMultiplier }} </span>
                </div>
              </div>

              <!-- Change type badge -->
              @if (currentPlan() && currentPlan()!.id !== plan.id) {
              <div class="mt-4">
                @if (getChangeType(plan) === 'upgrade') {
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"
                >
                  <i class="fa-solid fa-arrow-up mr-1"></i>
                  Amélioration
                </span>
                } @else {
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700"
                >
                  <i class="fa-solid fa-arrow-down mr-1"></i>
                  Réduction
                </span>
                }
              </div>
              }
            </button>
            }
          </div>

          <!-- Info box -->
          @if (selectedPlanId() && selectedPlanId() !== currentPlan()?.id) {
          <div class="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <div class="flex items-start gap-3">
              <i class="fa-solid fa-info-circle text-blue-600 text-xl mt-0.5"></i>
              <div class="flex-1">
                <h4 class="font-semibold text-blue-900 mb-2">Informations importantes</h4>
                @if (getChangeType(getSelectedPlan()!) === 'upgrade') {
                <ul class="text-sm text-blue-800 space-y-1">
                  <li>• Le changement prendra effet <strong>au prochain renouvellement</strong></li>
                  <li>• Vous profiterez des avantages dès le début de la prochaine période</li>
                  <li>• Le nouveau prix sera appliqué à partir du prochain paiement</li>
                </ul>
                } @else {
                <ul class="text-sm text-blue-800 space-y-1">
                  <li>• Le changement prendra effet <strong>au prochain renouvellement</strong></li>
                  <li>
                    • Vous continuerez à bénéficier de votre plan actuel jusqu'à la fin de la
                    période
                  </li>
                  <li>• Le nouveau prix (inférieur) sera appliqué dès le prochain paiement</li>
                </ul>
                }
              </div>
            </div>
          </div>
          }
        </div>

        <!-- Footer -->
        <div
          class="px-8 py-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between"
        >
          <button
            type="button"
            (click)="onClose()"
            class="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            type="button"
            (click)="confirmChange()"
            [disabled]="!selectedPlanId() || selectedPlanId() === currentPlan()?.id || loading()"
            class="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (loading()) {
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Changement... } @else {
            <i class="fa-solid fa-check mr-2"></i>
            Confirmer le changement }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ChangePlanModalComponent {
  private subscriptionStore = inject(SubscriptionStore);
  private billingSvc = inject(SubscriptionBillingService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  closed = output<void>();
  planChanged = output<void>();

  loading = signal(false);
  selectedPlanId = signal<number | null>(null);

  currentPlan = computed(() => {
    const sub = this.subscriptionStore.active();
    if (!sub) return null;
    return this.subscriptionStore.plans().find((p) => p.id === sub.planId);
  });

  term = computed(() => this.subscriptionStore.active()?.term ?? 'monthly');

  availablePlans = computed(() => {
    return this.subscriptionStore.publicPlans();
  });

  getSelectedPlan(): SubscriptionPlan | null {
    const id = this.selectedPlanId();
    if (!id) return null;
    return this.availablePlans().find((p) => p.id === id) ?? null;
  }

  selectPlan(planId: number) {
    this.selectedPlanId.set(planId);
  }

  getChangeType(plan: SubscriptionPlan): 'upgrade' | 'downgrade' {
    const current = this.currentPlan();
    if (!current) return 'upgrade';

    const term = this.term();
    const currentPrice = term === 'monthly' ? current.monthlyPrice : current.annualPrice;
    const newPrice = term === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

    return newPrice > currentPrice ? 'upgrade' : 'downgrade';
  }

  async confirmChange() {
    const planId = this.selectedPlanId();
    if (!planId || planId === this.currentPlan()?.id) return;

    this.loading.set(true);

    try {
      const result = this.subscriptionStore.upgradePlan(planId, false); // Au prochain renouvellement

      if (result.success) {
        const plan = this.getSelectedPlan();
        const changeType = plan ? this.getChangeType(plan) : 'upgrade';

        // Enregistrer dans l'historique
        const user = this.auth.getCurrentUser();
        if (user && this.currentPlan() && plan) {
          this.billingSvc.recordPlanChange({
            userId: user.id,
            subscriptionId: result.data.id,
            fromPlanId: this.currentPlan()!.id,
            toPlanId: plan.id,
            fromPlanName: this.currentPlan()!.name,
            toPlanName: plan.name,
            changeType,
            changedAt: new Date().toISOString(),
            effectiveAt: result.data.currentPeriodEnd,
            previousPrice: this.currentPlan()!.monthlyPrice,
            newPrice: plan.monthlyPrice,
          });
        }

        this.toast.success(`Votre plan sera changé au prochain renouvellement`);
        this.planChanged.emit();
        this.onClose();
      } else {
        this.toast.error(result.error ?? 'Erreur lors du changement de plan');
      }
    } catch (e) {
      console.error(e);
      this.toast.error('Une erreur est survenue');
    } finally {
      this.loading.set(false);
    }
  }

  onClose() {
    this.closed.emit();
  }
}
