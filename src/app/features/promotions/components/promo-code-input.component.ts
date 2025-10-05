import { Component, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionService } from '../services/promotion.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PromotionApplicationResult } from '../models/promotion.model';
import { Product } from '../../catalog/models/product.model';

@Component({
  selector: 'app-promo-code-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="promo-code-container">
      <div class="promo-code-header">
        <h3 class="text-sm font-semibold text-gray-900">Code promo</h3>
        @if (appliedPromo()) {
          <button
            type="button"
            (click)="removePromoCode()"
            class="text-xs text-red-600 hover:text-red-700"
          >
            Retirer
          </button>
        }
      </div>

      @if (!appliedPromo()) {
        <div class="promo-code-input-group">
          <input
            type="text"
            [(ngModel)]="promoCode"
            placeholder="Entrez votre code"
            class="promo-code-input"
            [disabled]="applying()"
            (keyup.enter)="applyPromoCode()"
          />
          <button
            type="button"
            (click)="applyPromoCode()"
            [disabled]="applying() || !promoCode.trim()"
            class="promo-code-button"
          >
            @if (applying()) {
              <i class="fa-solid fa-spinner fa-spin"></i>
            } @else {
              Appliquer
            }
          </button>
        </div>
      } @else {
        <div class="promo-code-applied">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-check-circle text-green-600"></i>
            <span class="font-medium text-gray-900">{{ appliedPromo()!.promotion?.code }}</span>
          </div>
          <span class="text-sm text-gray-600">{{ appliedPromo()!.promotion?.description }}</span>
          <span class="text-sm font-semibold text-green-600">
            -{{ discountAmount() | number: '1.2-2' }}€
          </span>
        </div>
      }
    </div>
  `,
  styles: [`
    .promo-code-container {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }

    .promo-code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .promo-code-input-group {
      display: flex;
      gap: 8px;
    }

    .promo-code-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      text-transform: uppercase;
      transition: border-color 0.2s;
    }

    .promo-code-input:focus {
      outline: none;
      border-color: #6366f1;
      ring: 2px;
      ring-color: rgba(99, 102, 241, 0.2);
    }

    .promo-code-input:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .promo-code-button {
      padding: 8px 16px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      white-space: nowrap;
    }

    .promo-code-button:hover:not(:disabled) {
      background: #4f46e5;
    }

    .promo-code-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .promo-code-applied {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
    }
  `],
})
export class PromoCodeInputComponent {
  private readonly promotionService = inject(PromotionService);
  private readonly toast = inject(ToastService);

  promoCode = '';
  applying = signal(false);
  appliedPromo = signal<PromotionApplicationResult | null>(null);
  discountAmount = signal(0);

  // Events
  promoApplied = output<PromotionApplicationResult>();
  promoRemoved = output<void>();

  async applyPromoCode(): Promise<void> {
    const code = this.promoCode.trim().toUpperCase();
    if (!code) return;

    this.applying.set(true);

    try {
      // On ne peut pas vraiment calculer sans le panier complet
      // Pour l'instant, on vérifie juste que le code existe
      const promotion = await this.promotionService.getByCode(code);

      if (!promotion) {
        this.toast.error('Code promo invalide');
        return;
      }

      const result: PromotionApplicationResult = {
        success: true,
        promotion,
        discountAmount: 0, // Sera calculé par le parent avec le panier complet
        message: `Code "${code}" appliqué`,
      };

      this.appliedPromo.set(result);
      this.discountAmount.set(0);
      this.promoApplied.emit(result);
      this.toast.success(result.message!);
      this.promoCode = '';
    } catch (error) {
      this.toast.error('Erreur lors de l\'application du code promo');
    } finally {
      this.applying.set(false);
    }
  }

  removePromoCode(): void {
    this.appliedPromo.set(null);
    this.discountAmount.set(0);
    this.promoCode = '';
    this.promoRemoved.emit();
    this.toast.info('Code promo retiré');
  }

  /**
   * Méthode publique pour mettre à jour le montant de réduction calculé par le parent
   */
  updateDiscountAmount(amount: number): void {
    this.discountAmount.set(amount);
    const current = this.appliedPromo();
    if (current) {
      this.appliedPromo.set({
        ...current,
        discountAmount: amount,
      });
    }
  }

  /**
   * Récupère le code promo appliqué
   */
  getAppliedPromotion(): PromotionApplicationResult | null {
    return this.appliedPromo();
  }
}
