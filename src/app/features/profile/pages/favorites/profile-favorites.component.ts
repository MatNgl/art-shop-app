import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { ProductService } from '../../../catalog/services/product';
import { Product } from '../../../catalog/models/product.model';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-profile-favorites',
  imports: [CommonModule, RouterLink, PricePipe],
  template: `
    <section class="px-4 py-6">
      <header class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold mb-6">Mes favoris</h1>
        <a routerLink="/favorites" class="text-sm text-blue-600 hover:underline">
          Voir tout ({{ products().length }})
        </a>
      </header>

      @if (loading()) {
      <div class="space-y-3">
        @for (i of [1,2,3,4]; track i) {
        <div class="flex items-center gap-3 p-3 rounded-lg bg-white border animate-pulse">
          <div class="w-16 h-16 bg-gray-200 rounded-lg"></div>
          <div class="flex-1 min-w-0">
            <div class="h-4 w-2/3 bg-gray-200 rounded mb-2"></div>
            <div class="h-3 w-1/3 bg-gray-200 rounded mb-1"></div>
            <div class="h-3 w-1/4 bg-gray-200 rounded"></div>
          </div>
        </div>
        }
      </div>
      } @else if (products().length === 0) {
      <div class="bg-white rounded-xl p-6 text-center border">
        <i class="fa-solid fa-heart text-4xl text-gray-300 mb-3"></i>
        <p class="text-gray-600 mb-3">Aucun favori pour le moment.</p>
        <a routerLink="/catalog" class="text-blue-600 hover:underline">Découvrir le catalogue</a>
      </div>
      } @else {
      <div class="space-y-3">
        @for (product of limitedProducts(); track product.id) {
        <div
          class="flex items-center gap-4 p-3 rounded-lg bg-white border hover:shadow-sm transition-shadow"
        >
          <a [routerLink]="['/product', product.id]" class="shrink-0">
            <img
              [src]="
                product.imageUrl ||
                (product.images && product.images[0]) ||
                '/assets/products/' + product.id + '.jpg'
              "
              [alt]="product.title"
              class="w-16 h-16 object-cover rounded-lg"
            />
          </a>

          <div class="flex-1 min-w-0">
            <a [routerLink]="['/product', product.id]" class="block">
              <h3 class="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                {{ product.title }}
              </h3>
            </a>
            <div class="flex items-baseline gap-1 mt-1">
              @if (product.variants && product.variants.length > 0) {
                <span class="text-xs text-gray-500">à partir de</span>
              }
              <span class="text-sm font-semibold text-gray-900">{{ product.reducedPrice ?? product.originalPrice | price }}</span>
            </div>
          </div>

          <button
            class="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            (click)="removeFavorite(product.id)"
          >
            Retirer
          </button>
        </div>
        }
      </div>

      @if (products().length > 8) {
      <div class="mt-4 text-center">
        <a routerLink="/favorites" class="text-blue-600 hover:underline">
          Voir les {{ products().length - 8 }} autres favoris
        </a>
      </div>
      } }
    </section>
  `,
})
export class ProfileFavoritesComponent implements OnInit {
  private readonly fav = inject(FavoritesStore);
  private readonly productsSvc = inject(ProductService);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  products = signal<Product[]>([]);
  limitedProducts = signal<Product[]>([]);

  async ngOnInit() {
    try {
      const all = await this.productsSvc.getAllProducts();
      const ids = new Set(this.fav.ids());
      const favoriteProducts = all.filter((p) => ids.has(p.id));

      this.products.set(favoriteProducts);
      this.limitedProducts.set(favoriteProducts.slice(0, 8));
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      this.products.set([]);
      this.limitedProducts.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  removeFavorite(productId: number) {
    this.fav.remove(productId);
    this.toast.success('Retiré des favoris');
    const currentProducts = this.products().filter((p) => p.id !== productId);
    this.products.set(currentProducts);
    this.limitedProducts.set(currentProducts.slice(0, 8));
  }
}
