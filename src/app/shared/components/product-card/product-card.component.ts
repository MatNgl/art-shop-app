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
      <!-- IMAGE + backfill -->
      <div
        class="product-image"
        [style.--img-url]="'url(' + product.imageUrl + ')'"
        [style.--img-dominant]="dominantColor || '#f1f5f9'"
      >
        <!-- Badges -->
        <div *ngIf="discountPercent > 0" class="discount-badge">-{{ discountPercent }}%</div>
        <div *ngIf="isNew" class="product-badge new">Nouveau</div>

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
        <img
          [src]="product.imageUrl"
          [alt]="product.title"
          [style.object-fit]="imageFit"
          (load)="onImgLoad($event)"
        />
      </div>

      <!-- INFO : titre + prix alignés -->
      <div class="product-info">
        <div class="info-top">
          <h3 class="product-title">{{ product.title }}</h3>
          <div class="price-right">
            @if (product.reducedPrice && product.reducedPrice < product.originalPrice) {
            <!-- Prix réduit + prix de base barré -->
            <span class="price-current">
              @if (product.variants && product.variants.length > 0) {
              <span class="text-xs mr-1">à partir de</span>
              }
              {{ product.reducedPrice | price : { currency: 'EUR', minFrac: 0, maxFrac: 0 } }}
            </span>
            <span class="price-original">
              {{ product.originalPrice | price : { currency: 'EUR', minFrac: 0, maxFrac: 0 } }}
            </span>
            } @else {
            <!-- Prix normal -->
            <span class="price-current">
              @if (product.variants && product.variants.length > 0) {
              <span class="text-xs mr-1">à partir de</span>
              }
              {{ product.originalPrice | price : { currency: 'EUR', minFrac: 0, maxFrac: 0 } }}
            </span>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() isFavorite = false;
  @Input() imageFit: 'contain' | 'cover' = 'contain';

  @Output() toggleFavorite = new EventEmitter<number>();
  @Output() view = new EventEmitter<number>();

  dominantColor = '#f1f5f9';

  // Constante : 2 semaines en millisecondes
  private readonly TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

  get discountPercent(): number {
    const { reducedPrice, originalPrice } = this.product;
    // reducedPrice = prix réduit, originalPrice = prix de base
    return reducedPrice && reducedPrice < originalPrice
      ? Math.round(((originalPrice - reducedPrice) / originalPrice) * 100)
      : 0;
  }

  get isNew(): boolean {
    if (!this.product.createdAt) return false;

    const createdDate = this.product.createdAt instanceof Date
      ? this.product.createdAt
      : new Date(this.product.createdAt);

    const now = new Date();
    const diff = now.getTime() - createdDate.getTime();

    return diff <= this.TWO_WEEKS_MS;
  }

  emitView() {
    this.view.emit(this.product.id);
  }

  onFav(e: MouseEvent) {
    e.stopPropagation();
    this.toggleFavorite.emit(this.product.id);
  }

  onImgLoad(ev: Event) {
    try {
      const img = ev.target as HTMLImageElement;
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const w = 16,
        h = 16;
      c.width = w;
      c.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 10) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      if (count) {
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        const lighten = (x: number) => Math.min(255, Math.round(x + (255 - x) * 0.25));
        this.dominantColor = `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
      }
    } catch {
      /* ignore */
    }
  }
}
