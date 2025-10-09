import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PromotionProgress } from '../models/promotion.model';

@Component({
  selector: 'app-promotion-progress-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (progressIndicators && progressIndicators.length > 0) {
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-gray-900">Débloquez des promotions</h3>

      @for (progress of progressIndicators; track progress.promotion.id) {
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <!-- En-tête -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">{{ progress.promotion.name }}</p>
            @if (progress.promotion.description) {
            <p class="text-xs text-gray-600 mt-1">{{ progress.promotion.description }}</p>
            }
          </div>
          @if (!progress.isUnlocked) {
          <div class="flex-shrink-0">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <i class="fa-solid fa-lock mr-1"></i>
              Bloqué
            </span>
          </div>
          } @else {
          <div class="flex-shrink-0">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <i class="fa-solid fa-check mr-1"></i>
              Débloqué
            </span>
          </div>
          }
        </div>

        <!-- Barre de progression -->
        <div class="relative">
          <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
            @if (progress.type === 'amount') {
            <span>{{ progress.current.toFixed(2) }}€ / {{ progress.target.toFixed(2) }}€</span>
            } @else if (progress.type === 'quantity') {
            <span>{{ progress.current }} / {{ progress.target }} articles</span>
            } @else {
            <span>{{ progress.current }} / {{ progress.target }}</span>
            }
            <span class="font-medium">{{ getProgressPercentage(progress) }}%</span>
          </div>

          <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              [class.bg-green-500]="progress.isUnlocked"
              [class.bg-blue-500]="!progress.isUnlocked"
              [style.width.%]="getProgressPercentage(progress)"
            ></div>
          </div>
        </div>

        <!-- Message -->
        <div class="mt-2">
          @if (!progress.isUnlocked) {
          <p class="text-xs font-medium text-blue-700">
            <i class="fa-solid fa-info-circle mr-1"></i>
            {{ progress.message }}
          </p>
          } @else {
          <p class="text-xs font-medium text-green-700">
            <i class="fa-solid fa-check-circle mr-1"></i>
            Promotion débloquée !
          </p>
          }
        </div>

        <!-- Prochain palier (pour progressives) -->
        @if (progress.nextTier) {
        <div class="mt-2 pt-2 border-t border-gray-100">
          <p class="text-xs text-gray-600">
            <i class="fa-solid fa-arrow-up mr-1"></i>
            Prochain palier :
            @if (progress.nextTier.discountType === 'percentage') {
            <span class="font-medium text-gray-900">-{{ progress.nextTier.discountValue }}%</span>
            } @else {
            <span class="font-medium text-gray-900">-{{ progress.nextTier.discountValue }}€</span>
            }
            à partir de {{ progress.nextTier.minAmount }}€
          </p>
        </div>
        }
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
export class PromotionProgressIndicatorComponent {
  @Input() progressIndicators: PromotionProgress[] | null = null;

  getProgressPercentage(progress: PromotionProgress): number {
    if (progress.target <= 0) return 0;
    const percentage = (progress.current / progress.target) * 100;
    return Math.min(100, Math.max(0, percentage));
  }
}
