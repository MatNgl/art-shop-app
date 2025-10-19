import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlan, SubscriptionTerm } from '../../models/subscription.model';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { PromotionService } from '../../../promotions/services/promotion.service';

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

        <!-- Bulle points — taille fixe + no wrap -->
        <span
          class="loyalty-badge"
          [attr.aria-label]="'x' + (plan.loyaltyMultiplier | number : '1.1-1' : 'fr') + ' points'"
        >
          x{{ plan.loyaltyMultiplier | number : '1.1-1' : 'fr' }}&nbsp;points
        </span>
      </div>

      <div class="pricing-section">
        <!-- Prix avec promotion si disponible -->
        @if (hasPromotion()) {
        <div class="mb-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold"
          >
            <i class="fa-solid fa-tag"></i>
            -{{ promotionDiscount() | price }}
            @if (promotionInfo().promotion?.discountType === 'percentage') {
            <span>({{ promotionInfo().promotion?.discountValue }}%)</span>
            }
          </span>
        </div>
        }

        <div *ngIf="term === 'monthly'; else annual" class="price-main">
          @if (hasPromotion()) {
          <span class="line-through text-gray-400 text-xl mr-2">
            {{ plan.monthlyPrice | price }}
          </span>
          <span class="text-green-600">
            {{ promotionFinalPrice() | price }}
          </span>
          } @else {
          {{ plan.monthlyPrice | price }}
          }
          <span class="price-period">/mois</span>
        </div>
        <ng-template #annual>
          <div class="price-main">
            @if (hasPromotion()) {
            <span class="line-through text-gray-400 text-xl mr-2">
              {{ plan.annualPrice | price }}
            </span>
            <span class="text-green-600">
              {{ promotionFinalPrice() | price }}
            </span>
            } @else {
            {{ plan.annualPrice | price }}
            }
            <span class="price-period">/an</span>
          </div>
          <div class="price-annual-info">
            @if (hasPromotion()) { ≈ {{ promotionFinalPrice() / 12 | price }} / mois } @else { ≈
            {{ averageAnnualMonthlyPrice | price }} / mois }
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
        <button type="button" class="btn-details" (click)="viewDetails.emit()">Voir détails</button>
      </div>
    </article>
  `,
})
export class PlanCardComponent {
  private readonly promotionSvc = inject(PromotionService);

  @Input({ required: true }) plan!: SubscriptionPlan;
  @Input({ required: true }) term!: SubscriptionTerm;
  @Input({ required: true }) averageAnnualMonthlyPrice!: number;

  @Output() viewDetails = new EventEmitter<void>();

  // Calculer les infos de promotion
  promotionInfo = computed(() => {
    const basePrice = this.term === 'monthly' ? this.plan.monthlyPrice : this.plan.annualPrice;
    return this.promotionSvc.calculateSubscriptionPrice(basePrice, this.plan.id);
  });

  hasPromotion = computed(() => this.promotionInfo().promotion !== null);

  promotionFinalPrice = computed(() => this.promotionInfo().finalPrice);

  promotionDiscount = computed(() => this.promotionInfo().discount);
}
