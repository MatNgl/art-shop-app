import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../features/catalog/models/product.model';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink, PricePipe],
  template: `
    <div class="product-carousel">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-900">{{ title }}</h2>
        @if (products().length > 0) {
        <div class="flex gap-2">
          <button
            type="button"
            (click)="scrollLeft()"
            [disabled]="scrollPosition() === 0"
            class="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Précédent"
          >
            <svg
              class="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            (click)="scrollRight()"
            [disabled]="!canScrollRight()"
            class="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Suivant"
          >
            <svg
              class="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        }
      </div>

      @if (products().length === 0) {
      <div class="text-center py-12 text-gray-500">
        <p>{{ emptyMessage }}</p>
      </div>
      } @else {
      <div
        #carouselContainer
        class="carousel-container overflow-x-auto scroll-smooth hide-scrollbar"
        (scroll)="onScroll($event)"
      >
        <div class="carousel-track flex gap-4">
          @for (product of products(); track product.id) {
          <a
            [routerLink]="['/product', product.id]"
            class="carousel-item flex-shrink-0 w-64 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="relative aspect-square overflow-hidden rounded-t-xl">
              <img
                [src]="product.images[0] || '/assets/placeholder.jpg'"
                [alt]="product.title"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              @if (product.reducedPrice) {
              <div
                class="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md"
              >
                -{{ getDiscountPercent(product) }}%
              </div>
              }
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 truncate mb-1">
                {{ product.title }}
              </h3>
              <div class="flex items-baseline gap-2 mt-2">
                @if (product.reducedPrice) {
                <span class="text-lg font-bold text-red-600">{{
                  product.reducedPrice | price
                }}</span>
                <span class="text-sm text-gray-400 line-through">{{
                  product.originalPrice | price
                }}</span>
                } @else {
                <span class="text-lg font-bold text-gray-900">{{
                  product.originalPrice | price
                }}</span>
                }
              </div>
            </div>
          </a>
          }
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .carousel-container {
        -webkit-overflow-scrolling: touch;
      }

      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }

      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .carousel-track {
        padding-bottom: 8px;
      }

      .carousel-item {
        min-width: 16rem;
      }
    `,
  ],
})
export class ProductCarouselComponent {
  @Input() title = 'Produits';
  @Input() emptyMessage = 'Aucun produit à afficher';
  @Input() set productList(value: Product[]) {
    this.products.set(value);
  }

  products = signal<Product[]>([]);
  scrollPosition = signal(0);

  scrollLeft(): void {
    const container = document.querySelector('.carousel-container') as HTMLElement;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }

  scrollRight(): void {
    const container = document.querySelector('.carousel-container') as HTMLElement;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    this.scrollPosition.set(target.scrollLeft);
  }

  canScrollRight(): boolean {
    const container = document.querySelector('.carousel-container') as HTMLElement;
    if (!container) return false;
    return container.scrollLeft < container.scrollWidth - container.clientWidth - 10;
  }

  getDiscountPercent(product: Product): number {
    if (!product.reducedPrice || !product.originalPrice) return 0;
    return Math.round(((product.originalPrice - product.reducedPrice) / product.originalPrice) * 100);
  }
}
