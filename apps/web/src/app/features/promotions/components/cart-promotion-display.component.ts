import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartPromotionResult } from '../models/promotion.model';

@Component({
  selector: 'app-cart-promotion-display',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (promotionResult && promotionResult.appliedPromotions.length > 0) {
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-gray-900">Promotions actives</h3>

      @for (applied of promotionResult.appliedPromotions; track applied.promotion.id) {
      <div class="bg-green-50 border border-green-200 rounded-lg p-3">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5">
            <i class="fa-solid fa-tag text-green-600"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-green-900">{{ applied.promotion.name }}</p>
              <span class="text-sm font-semibold text-green-700 whitespace-nowrap">
                -{{ applied.discountAmount.toFixed(2) }}€
              </span>
            </div>
            <p class="text-xs text-green-700 mt-1">{{ applied.message }}</p>
            @if (applied.promotion.code) {
            <div class="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-green-300 rounded text-xs font-mono text-green-800">
              <i class="fa-solid fa-ticket text-xs"></i>
              {{ applied.promotion.code }}
            </div>
            }
          </div>
        </div>
      </div>
      }

      @if (promotionResult.freeShipping) {
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-truck text-blue-600"></i>
          <p class="text-sm font-medium text-blue-900">Livraison gratuite</p>
        </div>
      </div>
      }

      @if (promotionResult.totalDiscount > 0) {
      <div class="pt-2 border-t border-green-200">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-green-900">Total des promotions</span>
          <span class="text-sm font-bold text-green-700">-{{ promotionResult.totalDiscount.toFixed(2) }}€</span>
        </div>
      </div>
      }
    </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CartPromotionDisplayComponent {
  @Input() promotionResult: CartPromotionResult | null = null;
}
