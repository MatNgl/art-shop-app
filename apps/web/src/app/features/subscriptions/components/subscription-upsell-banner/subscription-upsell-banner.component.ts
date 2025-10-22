import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../../cart/services/cart-store';
import { SubscriptionStore } from '../../services/subscription-store';
import { AuthService } from '../../../auth/services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-subscription-upsell-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shouldShow()) {
    <div class="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div class="flex items-start gap-3">
        <div class="mt-0.5">⭐</div>
        <div class="flex-1">
          <h3 class="font-semibold text-amber-900">Boostez vos points de fidélité</h3>
          <p class="text-sm text-amber-800 mt-0.5">
            Abonnez-vous pour activer un multiplicateur de points et profiter d’avantages exclusifs.
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <a
              routerLink="/subscriptions"
              class="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600"
            >
              Voir les abonnements
            </a>

            @if (!isAuth()) {
            <a
              routerLink="/login"
              class="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-amber-900 border border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
            >
              Se connecter
            </a>
            }
          </div>
        </div>
      </div>
    </div>
    }
  `,
})
export class SubscriptionUpsellBannerComponent {
  private readonly cart = inject(CartStore);
  private readonly subs = inject(SubscriptionStore);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly hasActiveSubscription = computed(() => {
    const a = this.subs.active();
    return !!a && a.status === 'active';
  });

  readonly cartHasSubscription = computed(() => this.cart.hasSubscription());

  readonly shouldShow = computed(
    () => !this.hasActiveSubscription() && !this.cartHasSubscription()
  );

  isAuth(): boolean {
    return this.auth.isAuthenticated();
  }
}
