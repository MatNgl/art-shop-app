import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { FidelityStore } from '../../services/fidelity-store';
import { FidelityCalculatorService } from '../../services/fidelity-calculator.service';

@Component({
  selector: 'app-cart-fidelity-preview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (isEnabled() && currentUser()) {
      <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
        <!-- Points à gagner -->
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-star text-lg"></i>
          </div>
          <div class="flex-1">
            <div class="text-sm font-semibold text-gray-800">
              Vous gagnerez <strong class="text-purple-700">{{ pointsToEarn() }} points</strong>
            </div>
            <div class="text-xs text-gray-600">avec cette commande (hors livraison)</div>
          </div>
        </div>

        <!-- Nudge pour prochaine récompense -->
        @if (nextReward()) {
          <div class="bg-white rounded-lg p-3 border border-purple-200">
            <div class="flex items-start gap-2">
              <i class="fa-solid fa-gift text-purple-600 mt-0.5"></i>
              <div class="flex-1 text-xs">
                <div class="font-medium text-gray-800 mb-1">
                  Encore <strong class="text-purple-700">{{ pointsToNext() }} points</strong> pour débloquer :
                </div>
                <div class="text-purple-700 font-semibold">{{ nextReward()!.label }}</div>
              </div>
            </div>
          </div>
        } @else {
          <div class="bg-green-50 rounded-lg p-3 border border-green-200">
            <div class="flex items-center gap-2 text-xs">
              <i class="fa-solid fa-check-circle text-green-600"></i>
              <span class="text-green-700 font-medium">Tous les paliers débloqués !</span>
            </div>
          </div>
        }

        <!-- CTA Voir mes récompenses -->
        <div class="mt-3 text-center">
          <a
            routerLink="/fidelity"
            class="text-xs font-semibold text-purple-700 hover:text-purple-800 underline"
          >
            Voir mon programme de fidélité
            <i class="fa-solid fa-arrow-right ml-1"></i>
          </a>
        </div>
      </div>
    }
  `,
  styles: [],
})
export class CartFidelityPreviewComponent {
  private readonly auth = inject(AuthService);
  private readonly fidelityStore = inject(FidelityStore);
  private readonly calculator = inject(FidelityCalculatorService);

  // Input: montant TTC après promotions (hors livraison)
  cartAmountAfterDiscounts = input.required<number>();

  readonly isEnabled = computed(() => this.fidelityStore.isEnabled());
  readonly currentUser = computed(() => this.auth.currentUser$());

  readonly pointsToEarn = computed(() => {
    const amount = this.cartAmountAfterDiscounts();
    const rate = this.fidelityStore.settings().ratePerEuro;
    return this.calculator.pointsFor(amount, rate);
  });

  readonly currentPoints = computed(() => {
    const user = this.currentUser();
    return user ? this.fidelityStore.getPoints(user.id) : 0;
  });

  readonly futurePoints = computed(() => this.currentPoints() + this.pointsToEarn());

  readonly allRewards = computed(() => this.fidelityStore.rewards().filter((r) => r.isActive));

  readonly nextReward = computed(() => {
    return this.calculator.findNextReward(this.futurePoints(), this.allRewards());
  });

  readonly pointsToNext = computed(() => {
    const next = this.nextReward();
    return next ? Math.max(0, next.pointsRequired - this.futurePoints()) : 0;
  });
}
