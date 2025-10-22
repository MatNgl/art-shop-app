import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubscriptionPlan, SubscriptionTerm } from '../../models/subscription.model';
import { CartStore } from '../../../cart/services/cart-store';
import { ToastService } from '../../../../shared/services/toast.service';
import { PricePipe } from '../../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-subscription-payment-button',
  standalone: true,
  imports: [CommonModule, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="onSubscribe()"
      class="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    >
      <i class="fa-solid fa-credit-card mr-2" aria-hidden="true"></i>
      S'abonner maintenant — {{ price() | price }}
    </button>
  `,
})
export class SubscriptionPaymentButtonComponent {
  plan = input.required<SubscriptionPlan>();
  term = input.required<SubscriptionTerm>();

  private readonly cart = inject(CartStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  price(): number {
    const t = this.term();
    return t === 'monthly' ? this.plan().monthlyPrice : this.plan().annualPrice;
  }

  onSubscribe(): void {
    this.cart.addSubscription({ plan: this.plan(), term: this.term() });
    this.router.navigate(['/cart']);
  }
}
