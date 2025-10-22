import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionStore } from '../../services/subscription-store';
import { SubscriptionPlan, SubscriptionTerm } from '../../models/subscription.model';
import { PlanCardComponent } from '../../components/plan-card/plan-card.component';
import { PlanDetailModalComponent } from '../../components/plan-detail-modal/plan-detail-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { CartStore } from '../../../cart/services/cart-store';

@Component({
  selector: 'app-subscriptions-catalog',
  standalone: true,
  imports: [CommonModule, PlanCardComponent, PlanDetailModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './subscriptions-catalog.component.scss',
  template: `
    <div class="subscription-hero">
      <div class="relative z-10">
        <section class="container mx-auto px-4 py-12">
          <header class="mb-12 text-center">
            <h1 class="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">Abonnements</h1>
            <p class="mt-3 text-lg text-gray-700 max-w-2xl mx-auto">
              Recevez des cadeaux chaque mois et boostez vos points fidélité.
            </p>

        <div
          class="mt-6 inline-flex items-center gap-2 rounded-xl px-2 py-1 glass-toggle"
          role="group"
          aria-label="Choisir la facturation"
        >
          <button
            class="px-4 py-2 rounded-lg focus:outline-none focus-visible:ring"
            [class.active]="preferredTerm() === 'monthly'"
            (click)="setTerm('monthly')"
            (keyup.enter)="setTerm('monthly')"
          >
            Mensuel
          </button>
          <button
            class="px-4 py-2 rounded-lg focus:outline-none focus-visible:ring"
            [class.active]="preferredTerm() === 'annual'"
            (click)="setTerm('annual')"
            (keyup.enter)="setTerm('annual')"
          >
            Annuel
            <span class="ml-1 text-xs opacity-70">
              (jusqu'à {{ monthsOfferedMax() }} mois offerts)
            </span>
          </button>
        </div>
      </header>

      <div
        class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        aria-label="Plans disponibles"
      >
        <app-plan-card
          *ngFor="let plan of plans()"
          role="listitem"
          [plan]="plan"
          [term]="preferredTerm()"
          [averageAnnualMonthlyPrice]="averageAnnual(plan)"
          (viewDetails)="openDetails(plan)"
        ></app-plan-card>
      </div>
    </section>
      </div>
    </div>

    <app-plan-detail-modal
      *ngIf="selected()"
      [plan]="selected()!"
      [term]="preferredTerm()"
      [averageAnnualMonthlyPrice]="averageAnnual(selected()!)"
      (closed)="closeDetails()"
      (termChange)="setTerm($event)"
      (addToCart)="onAddToCart($event.planId, $event.term)"
    ></app-plan-detail-modal>
  `,
})
export class SubscriptionsCatalogComponent {
  private readonly store = inject(SubscriptionStore);
  private readonly cart = inject(CartStore);
  private readonly toast = inject(ToastService);

  readonly plans = this.store.publicPlans;
  readonly preferredTerm = this.store.preferredTerm;

  // valeur max de "mois offerts" pour l’affichage
  readonly monthsOfferedMax = computed(() =>
    Math.max(0, ...this.plans().map((p) => Math.max(0, p.monthsOfferedOnAnnual)))
  );

  readonly selected = signal<SubscriptionPlan | null>(null);

  averageAnnual = (plan: SubscriptionPlan): number => this.store.averageMonthlyForAnnual(plan);
  setTerm = (term: SubscriptionTerm): void => this.store.setPreferredTerm(term);

  openDetails(plan: SubscriptionPlan): void {
    this.selected.set(plan);
  }
  closeDetails(): void {
    this.selected.set(null);
  }

  onAddToCart(planId: number, term: SubscriptionTerm): void {
    const plan = this.plans().find((p) => p.id === planId);
    if (!plan) {
      this.toast.error("Ce plan n'est plus disponible.");
      return;
    }

    // Laisse le CartStore appliquer les règles (auth, abo déjà actif, abo déjà présent…)
    this.cart.addSubscription({ plan, term });

    // Fermer le modal dans tous les cas (UX fluide)
    this.closeDetails();
  }
}
