import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth';
import { FidelityStore } from '../../services/fidelity-store';
import { FidelityCalculatorService, AppliedFidelityDiscount } from '../../services/fidelity-calculator.service';
import { FidelityReward } from '../../models/fidelity.models';

export interface SelectedFidelityReward {
  reward: FidelityReward;
  appliedDiscount: AppliedFidelityDiscount;
}

@Component({
  selector: 'app-checkout-fidelity-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isEnabled() && currentUser() && availableRewards().length > 0) {
      <div class="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <i class="fa-solid fa-star text-xl text-white"></i>
            </div>
            <div class="flex-1">
              <h2 class="text-lg font-bold text-white">Programme de fidélité</h2>
              <p class="text-xs text-purple-100">Utilisez vos points pour obtenir une récompense</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-white">{{ currentPoints() }}</div>
              <div class="text-xs text-purple-100">points disponibles</div>
            </div>
          </div>
        </div>

        <div class="p-6">
          <!-- Info: une seule récompense par commande -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
            <i class="fa-solid fa-info-circle mr-2"></i>
            <strong>Une seule récompense fidélité</strong> peut être appliquée par commande (non cumulable avec d'autres coupons).
          </div>

          <!-- Récompenses disponibles (radio cards) -->
          <div class="space-y-3">
            <!-- Option: Aucune récompense -->
            <label
              class="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all"
              [class.border-gray-300]="!selectedRewardId()"
              [class.bg-gray-50]="!selectedRewardId()"
              [class.border-purple-500]="!selectedRewardId()"
              [class.bg-purple-50]="!selectedRewardId()"
            >
              <input
                type="radio"
                name="fidelityReward"
                [value]="null"
                [checked]="!selectedRewardId()"
                (change)="selectReward(null)"
                class="mt-1"
              />
              <div class="flex-1">
                <div class="font-semibold text-gray-800">Ne pas utiliser de récompense</div>
                <div class="text-xs text-gray-600">Conserver mes points pour une prochaine commande</div>
              </div>
            </label>

            <!-- Récompenses disponibles -->
            @for (reward of availableRewards(); track reward.id) {
              <label
                class="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md"
                [class.border-gray-300]="selectedRewardId() !== reward.id"
                [class.bg-white]="selectedRewardId() !== reward.id"
                [class.border-purple-500]="selectedRewardId() === reward.id"
                [class.bg-purple-50]="selectedRewardId() === reward.id"
              >
                <input
                  type="radio"
                  name="fidelityReward"
                  [value]="reward.id"
                  [checked]="selectedRewardId() === reward.id"
                  (change)="selectReward(reward.id)"
                  class="mt-1"
                />
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  [class.bg-purple-600]="selectedRewardId() === reward.id"
                  [class.text-white]="selectedRewardId() === reward.id"
                  [class.bg-gray-200]="selectedRewardId() !== reward.id"
                  [class.text-gray-500]="selectedRewardId() !== reward.id"
                >
                  @if (reward.type === 'shipping') {
                    <i class="fa-solid fa-truck text-xl"></i>
                  }
                  @if (reward.type === 'amount') {
                    <i class="fa-solid fa-euro-sign text-xl"></i>
                  }
                  @if (reward.type === 'percent') {
                    <i class="fa-solid fa-percent text-xl"></i>
                  }
                  @if (reward.type === 'gift') {
                    <i class="fa-solid fa-gift text-xl"></i>
                  }
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <div class="font-bold text-gray-800">{{ reward.label }}</div>
                    <div class="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded">
                      {{ reward.pointsRequired }} pts
                    </div>
                  </div>
                  <div class="text-xs text-gray-600 mb-2">{{ reward.description }}</div>
                  @if (selectedRewardId() === reward.id) {
                    <div class="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded inline-block">
                      <i class="fa-solid fa-check mr-1"></i>
                      Récompense sélectionnée
                    </div>
                  }
                </div>
              </label>
            }
          </div>

          <!-- Points restants après utilisation -->
          @if (selectedRewardId()) {
            <div class="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-700">Points après utilisation :</span>
                <span class="font-bold text-purple-700">{{ remainingPoints() }} pts</span>
              </div>
            </div>
          }
        </div>
      </div>
    }

    @if (isEnabled() && currentUser() && availableRewards().length === 0) {
      <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <i class="fa-solid fa-star text-purple-600 text-xl mt-0.5"></i>
          <div>
            <div class="text-sm font-semibold text-gray-800 mb-1">
              Aucune récompense disponible
            </div>
            <div class="text-xs text-gray-600">
              Vous avez actuellement <strong>{{ currentPoints() }} points</strong>.
              Continuez à cumuler pour débloquer des récompenses !
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [],
})
export class CheckoutFidelitySelectorComponent {
  private readonly auth = inject(AuthService);
  private readonly fidelityStore = inject(FidelityStore);
  private readonly calculator = inject(FidelityCalculatorService);

  // Événement émis lors de la sélection/déselection d'une récompense
  rewardSelected = output<SelectedFidelityReward | null>();

  readonly selectedRewardId = signal<number | null>(null);

  readonly isEnabled = computed(() => this.fidelityStore.isEnabled());
  readonly currentUser = computed(() => this.auth.currentUser$());

  readonly currentPoints = computed(() => {
    const user = this.currentUser();
    return user ? this.fidelityStore.getPoints(user.id) : 0;
  });

  readonly allRewards = computed(() => this.fidelityStore.rewards().filter((r) => r.isActive));

  readonly availableRewards = computed(() => {
    return this.calculator.findAvailableRewards(this.currentPoints(), this.allRewards());
  });

  readonly remainingPoints = computed(() => {
    const rewardId = this.selectedRewardId();
    if (!rewardId) return this.currentPoints();

    const reward = this.allRewards().find((r) => r.id === rewardId);
    if (!reward) return this.currentPoints();

    return Math.max(0, this.currentPoints() - reward.pointsRequired);
  });

  selectReward(rewardId: number | null): void {
    this.selectedRewardId.set(rewardId);

    if (!rewardId) {
      this.rewardSelected.emit(null);
      return;
    }

    const reward = this.allRewards().find((r) => r.id === rewardId);
    if (!reward) {
      this.rewardSelected.emit(null);
      return;
    }

    // Calculer le discount appliqué (placeholder pour le montant, sera recalculé dans le checkout avec le vrai montant)
    const appliedDiscount = this.calculator.applyReward(reward, 100);
    if (!appliedDiscount) {
      this.rewardSelected.emit(null);
      return;
    }

    this.rewardSelected.emit({ reward, appliedDiscount });
  }
}
