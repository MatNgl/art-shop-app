import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesStore } from '../services/favorites-store';
import { ProductService } from '../../catalog/services/product';
import { Product } from '../../catalog/models/product.model';
import { ProductTileComponent } from '../../../shared/components/product-tile/product-tile.component';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductTileComponent],
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
      <!-- Empty state harmonisé avec Cart -->
      <div class="bg-white rounded-xl p-8 shadow text-center">
        <p class="text-gray-700 mb-4">Vous n'avez pas encore de favoris.</p>
        <a
          routerLink="/catalog"
          class="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Parcourir le catalogue
        </a>
      </div>
      } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @for (p of products(); track p.id) {
        <app-product-tile [product]="p"></app-product-tile>
        }
      </div>
      }
    </div>
  `,
})
export class FavoritesPageComponent implements OnInit {
  private readonly fav = inject(FavoritesStore);
  private readonly productsSvc = inject(ProductService);

  loading = signal(true);
  products = signal<Product[]>([]);

  async ngOnInit() {
    try {
      const all = await this.productsSvc.getAllProducts();
      const ids = new Set(this.fav.ids());
      this.products.set(all.filter((p) => ids.has(p.id)));
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      this.products.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  trackById = (_: number, p: Product) => p.id;
}
