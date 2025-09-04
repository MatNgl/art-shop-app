import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { ProductService } from '../../../catalog/services/product';
import { Product } from '../../../catalog/models/product.model';
import { ProductTileComponent } from '../../../../shared/components/product-tile/product-tile.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, ProductTileComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Mes favoris</h1>
        @if (!loading()) {
        <span class="text-sm text-gray-500">{{ products().length }} œuvre(s)</span>
        }
      </div>

      @if (loading()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @for (i of [1,2,3,4,5,6,7,8]; track i) {
        <div class="rounded-2xl overflow-hidden shadow bg-white">
          <div class="h-64 bg-gray-200 animate-pulse"></div>
          <div class="p-3">
            <div class="h-4 w-2/3 bg-gray-200 rounded mb-2 animate-pulse"></div>
            <div class="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        }
      </div>
      } @else if (products().length === 0) {
      <div class="text-gray-600">
        Aucun favori pour l’instant.
        <a routerLink="/catalog" class="text-blue-600 hover:text-blue-700 underline">
          Parcourir le catalogue </a
        >.
      </div>
      } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @for (p of products(); track trackById) {
        <app-product-tile [product]="p"></app-product-tile>
        }
      </div>
      }
    </div>
  `,
})
export class FavoritesComponent implements OnInit {
  private readonly fav = inject(FavoritesStore);
  private readonly productsSvc = inject(ProductService);

  loading = signal(true);
  products = signal<Product[]>([]);

  async ngOnInit() {
    const all = await this.productsSvc.getAllProducts();
    const ids = new Set(this.fav.ids());
    this.products.set(all.filter((p) => ids.has(p.id)));
    this.loading.set(false);
  }

  trackById = (_: number, p: Product) => p.id;
}
