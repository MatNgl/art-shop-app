import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../catalog/models/product.model';
import { Promotion } from '../models/promotion.model';
import { ProductPromotionService } from '../services/product-promotion.service';

@Component({
  selector: 'app-promotion-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (promotion()) {
      <div class="promotion-badge">
        @if (promotion()!.discountType === 'percentage') {
          -{{ promotion()!.discountValue }}%
        } @else {
          -{{ promotion()!.discountValue }}€
        }
      </div>
    }
  `,
  styles: [`
    .promotion-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 2;
    }
  `],
})
export class PromotionBadgeComponent implements OnInit {
  @Input({ required: true }) product!: Product;

  private readonly productPromotionService = inject(ProductPromotionService);
  promotion = signal<Promotion | null>(null);

  async ngOnInit(): Promise<void> {
    const promo = await this.productPromotionService.getBestPromotionForProduct(this.product);
    this.promotion.set(promo);
  }
}
