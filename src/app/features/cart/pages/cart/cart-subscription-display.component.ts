import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartSubscriptionItem } from '../../models/cart.model';
import { PricePipe } from '../../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-cart-subscription-display',
  standalone: true,
  imports: [CommonModule, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow p-4 flex items-center gap-4 border-2 border-purple-200">
      <!-- Icon -->
      <div class="flex-shrink-0 w-24 h-24 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 rounded-md text-white">
        <i class="fa-solid fa-star text-4xl" aria-hidden="true"></i>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900 truncate">{{ subscription().snapshot.planName }}</h3>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Abonnement
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-0.5">
              {{ termLabel() }}
            </p>
            @if (subscription().snapshot.monthsOfferedOnAnnual > 0 && subscription().snapshot.term === 'annual') {
              <p class="text-xs text-green-600 font-medium mt-1">
                <i class="fa-solid fa-gift mr-1"></i>
                {{ subscription().snapshot.monthsOfferedOnAnnual }} mois offert{{subscription().snapshot.monthsOfferedOnAnnual > 1 ? 's' : ''}}
              </p>
            }
            <p class="text-xs text-purple-600 mt-1">
              <i class="fa-solid fa-sparkles mr-1"></i>
              Multiplicateur fidélité ×{{ subscription().snapshot.loyaltyMultiplier }}
            </p>
          </div>
          <button
            type="button"
            (click)="remove.emit()"
            class="text-sm text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 rounded"
            aria-label="Retirer l'abonnement du panier"
          >
            Supprimer
          </button>
        </div>

        <div class="mt-3 flex items-center justify-end">
          <div class="text-right">
            <div class="text-gray-900 font-semibold text-lg">
              {{ subscription().snapshot.priceCharged | price }}
            </div>
            <div class="text-xs text-gray-500">
              {{ termLabel() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CartSubscriptionDisplayComponent {
  subscription = input.required<CartSubscriptionItem>();
  remove = output<void>();

  termLabel(): string {
    const term = this.subscription().snapshot.term;
    return term === 'monthly' ? 'Facturation mensuelle' : 'Facturation annuelle';
  }
}
