import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { Product } from '../../../features/catalog/models/product.model';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, PricePipe],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./product-card.component.scss'],
  template: `
    <div
      class="product-card"
      tabindex="0"
      role="link"
      [attr.aria-label]="'Voir détails : ' + product.title"
      (click)="emitView()"
      (keyup.enter)="emitView()"
    >
      <div class="product-image">
        <!-- Favori -->
        <button
          type="button"
          class="fav-btn"
          (click)="onFav($event)"
          [title]="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          [attr.aria-label]="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
        >
          <i class="fas fa-heart" [class.text-red-500]="isFavorite"></i>
        </button>

        <!-- Illustration -->
        <img [src]="product.imageUrl" [alt]="product.title" />

        <!-- Pourcentage de réduction : UNIQUEMENT en haut à droite -->
        <div *ngIf="discountPercent > 0" class="discount-badge">-{{ discountPercent }}%</div>
        <!-- Badges -->
        <div *ngIf="showNew" class="product-badge new">Nouveau</div>
      </div>

      <!-- Panneau info flottant -->
      <div class="product-info">
        <div class="info-top">
          <p class="product-artist">{{ artistName }}</p>

          <div class="price-right">
            <span class="price-current">
              {{ product.price | price : { currency: 'EUR', minFrac: 0, maxFrac: 0 } }}
            </span>

            <!-- Prix barré si promo (on a retiré le badge % ici pour gagner de la place) -->
            <span
              class="price-original"
              *ngIf="product.originalPrice && product.originalPrice > product.price"
            >
              {{ product.originalPrice | price : { currency: 'EUR', minFrac: 0, maxFrac: 0 } }}
            </span>
          </div>
        </div>

        <h3 class="product-title">{{ product.title }}</h3>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() artistName = 'Artiste inconnu';
  @Input() isFavorite = false;
  @Input() showNew = false;

  @Output() toggleFavorite = new EventEmitter<number>();
  @Output() view = new EventEmitter<number>();

  get discountPercent(): number {
    const { originalPrice, price } = this.product;
    return originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
  }

  emitView() {
    this.view.emit(this.product.id);
  }

  onFav(e: MouseEvent) {
    e.stopPropagation();
    this.toggleFavorite.emit(this.product.id);
  }
}
