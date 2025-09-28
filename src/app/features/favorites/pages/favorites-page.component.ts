import { Component, OnInit, inject, signal } from '@angular/core';
import { ToastService } from '../../../shared/services/toast.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FavoritesStore } from '../services/favorites-store';
import { ProductService } from '../../catalog/services/product';
import { Product } from '../../catalog/models/product.model';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { AuthService } from '../../auth/services/auth';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Mes favoris</h1>
        @if (!loading()) {
        <span class="text-sm text-gray-500">{{ products().length }} œuvre(s)</span>
        }
      </div>

      @if (loading()) {
      <div
        class="grid gap-7 items-stretch grid-cols-1
                 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]"
      >
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
      <div
        class="grid gap-7 items-stretch grid-cols-1  [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]"
      >
        @for (p of products(); track p.id) {
        <app-product-card
          [product]="p"
          [isFavorite]="fav.has(p.id)"
          (toggleFavorite)="onToggleFavorite($event)"
          (view)="goToProduct($event)"
        ></app-product-card>
        }
      </div>
      }
    </div>
  `,
})
export class FavoritesPageComponent implements OnInit {
  readonly fav = inject(FavoritesStore);
  private readonly productsSvc = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(true);
  products = signal<Product[]>([]);

  async ngOnInit() {
    try {
      const [all] = await Promise.all([this.productsSvc.getAllProducts()]);

      const ids = new Set(this.fav.ids());
      this.products.set(all.filter((p) => ids.has(p.id)));
    } catch (error) {
      if (!(error instanceof Error)) {
        this.toast.error('Erreur inattendue lors du chargement des favoris.');
      }
      this.products.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  trackById = (_: number, p: Product) => p.id;

  onToggleFavorite = (id: number) => {
    if (!this.auth.isAuthenticated()) {
      this.toast.requireAuth('favorites');
      return;
    }
    const added = this.fav.toggle(id);
    if (!added) {
      // si on retire depuis la page favoris, on l’enlève visuellement
      this.products.update((arr) => arr.filter((p) => p.id !== id));
    }
    this.toast.success(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
  };

  goToProduct = (id: number) => {
    this.router.navigate(['/product', id]);
  };
}
