// src/app/features/subscriptions/components/plan-card/plan-card.component.ts
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlan, SubscriptionTerm } from '../../models/subscription.model';
import { PricePipe } from '../../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './plan-card.component.scss',
  template: `
    <article
      class="glass-card"
      tabindex="0"
      (keyup.enter)="viewDetails.emit()"
      [attr.aria-label]="'Plan ' + plan.name"
    >
      <div class="card-header">
        <div class="card-title">
          <h2>{{ plan.name }}</h2>
          <p>{{ plan.description }}</p>
        </div>
        <span class="loyalty-badge">
          x{{ plan.loyaltyMultiplier }} points
        </span>
      </div>

      <div class="pricing-section">
        <div *ngIf="term === 'monthly'; else annual" class="price-main">
          {{ plan.monthlyPrice | price }}
          <span class="price-period">/mois</span>
        </div>
        <ng-template #annual>
          <div class="price-main">
            {{ plan.annualPrice | price }}
            <span class="price-period">/an</span>
          </div>
          <div class="price-annual-info">
            ≈ {{ averageAnnualMonthlyPrice | price }} / mois
            <span *ngIf="plan.monthsOfferedOnAnnual > 0" class="price-months">
              — {{ 12 - plan.monthsOfferedOnAnnual }}/12 facturés
            </span>
          </div>
        </ng-template>
      </div>

      <ul class="perks-list">
        <li *ngFor="let perk of plan.perksShort | slice : 0 : 4" class="perk-item">
          <span class="perk-bullet"></span>
          <span>{{ perk }}</span>
        </li>
      </ul>

      <div class="card-footer">
        <button
          type="button"
          class="btn-details"
          (click)="viewDetails.emit()"
        >
          Voir détails
        </button>
      </div>
    </article>
  `,
})
export class PlanCardComponent {
  @Input({ required: true }) plan!: SubscriptionPlan;
  @Input({ required: true }) term!: SubscriptionTerm;
  @Input({ required: true }) averageAnnualMonthlyPrice!: number;

  @Output() viewDetails = new EventEmitter<void>();
}
