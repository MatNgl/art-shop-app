import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FidelityStore } from '../../services/fidelity-store';
import { FidelityCalculatorService } from '../../services/fidelity-calculator.service';

@Component({
  selector: 'app-fidelity-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-star text-purple-600 text-xl"></i>
          <h3 class="text-lg font-bold text-gray-800">Programme de fidélité</h3>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-purple-700">{{ currentPoints() }}</div>
          <div class="text-xs text-gray-500">points disponibles</div>
        </div>
      </div>

      @if (nextReward()) {
        <!-- Progress bar -->
        <div class="mb-3">
          <div class="flex items-center justify-between text-sm mb-1">
            <span class="text-gray-600 font-medium">Prochain palier</span>
            <span class="text-purple-700 font-semibold">
              {{ nextReward()!.label }}
            </span>
          </div>
          <div class="h-3 bg-gray-200 rounded-full overflow-hidden relative">
            <div
              class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              [style.width.%]="progressPercent()"
              role="progressbar"
              [attr.aria-valuenow]="progressPercent()"
              [attr.aria-valuemin]="0"
              [attr.aria-valuemax]="100"
            ></div>
          </div>
          <div class="text-xs text-gray-500 mt-1" role="status" aria-live="polite">
            Encore <strong class="text-purple-700">{{ pointsToNext() }} points</strong> pour débloquer
            <strong>{{ nextReward()!.label }}</strong>
          </div>
        </div>
      } @else {
        <div class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <i class="fa-solid fa-check-circle mr-2"></i>
          Vous avez débloqué tous les paliers ! Profitez de vos récompenses.
        </div>
      }

      <!-- Milestones (paliers atteints / à venir) -->
      <div class="space-y-2">
        @for (reward of visibleRewards(); track reward.id) {
          <div
            class="flex items-center gap-3 p-3 rounded-lg border transition-all"
            [class.bg-purple-100]="reward.pointsRequired <= currentPoints()"
            [class.border-purple-300]="reward.pointsRequired <= currentPoints()"
            [class.bg-white]="reward.pointsRequired > currentPoints()"
            [class.border-gray-200]="reward.pointsRequired > currentPoints()"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              [class.bg-purple-600]="reward.pointsRequired <= currentPoints()"
              [class.text-white]="reward.pointsRequired <= currentPoints()"
              [class.bg-gray-200]="reward.pointsRequired > currentPoints()"
              [class.text-gray-400]="reward.pointsRequired > currentPoints()"
            >
              @if (reward.pointsRequired <= currentPoints()) {
                <i class="fa-solid fa-check text-lg"></i>
              } @else {
                <i class="fa-solid fa-lock text-sm"></i>
              }
            </div>
            <div class="flex-1">
              <div class="font-semibold text-sm text-gray-800">{{ reward.label }}</div>
              <div class="text-xs text-gray-500">{{ reward.pointsRequired }} points requis</div>
            </div>
            @if (reward.pointsRequired <= currentPoints()) {
              <div class="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded">
                Débloqué
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [],
})
export class FidelityProgressComponent {
  private readonly fidelityStore = inject(FidelityStore);
  private readonly calculator = inject(FidelityCalculatorService);

  // Input : userId pour afficher le compte
  userId = input.required<number>();

  // Signals dérivés
  readonly currentPoints = computed(() => this.fidelityStore.getPoints(this.userId()));
  readonly allRewards = computed(() => this.fidelityStore.rewards().filter((r) => r.isActive));

  readonly nextReward = computed(() => {
    return this.calculator.findNextReward(this.currentPoints(), this.allRewards());
  });

  readonly pointsToNext = computed(() => {
    const next = this.nextReward();
    return next ? Math.max(0, next.pointsRequired - this.currentPoints()) : 0;
  });

  readonly progressPercent = computed(() => {
    const next = this.nextReward();
    if (!next) return 100;

    const current = this.currentPoints();
    // Trouver le palier précédent pour calculer la progression relative
    const previousReward = this.allRewards()
      .filter((r) => r.pointsRequired <= current)
      .sort((a, b) => b.pointsRequired - a.pointsRequired)[0];

    const start = previousReward?.pointsRequired ?? 0;
    const end = next.pointsRequired;
    const range = end - start;

    if (range === 0) return 100;
    return Math.min(100, Math.max(0, ((current - start) / range) * 100));
  });

  readonly visibleRewards = computed(() => {
    // Afficher tous les paliers (atteints + à venir) triés par points requis
    return this.allRewards().sort((a, b) => a.pointsRequired - b.pointsRequired);
  });
}
