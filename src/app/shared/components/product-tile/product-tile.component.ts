import { Component, inject, Input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../features/catalog/models/product.model';
import { FavoritesStore } from '../../../features/favorites/services/favorites-store';
import { AuthService } from '../../../features/auth/services/auth';

@Component({
  selector: 'app-product-tile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="group rounded-2xl overflow-hidden shadow bg-white hover:shadow-lg transition">
      <div class="relative">
        <!-- Bouton coeur -->
        <button
          type="button"
          class="absolute top-2 right-2 z-20 rounded-full bg-white/90 backdrop-blur px-2 py-1
                 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 pointer-events-auto"
          (click)="onToggleFavorite($event)"
          [attr.aria-pressed]="isFav()"
          [title]="isFav() ? 'Retirer des favoris' : 'Ajouter aux favoris'"
        >
          <span class="text-lg leading-none">{{ isFav() ? '❤️' : '🤍' }}</span>
        </button>

        <!-- Image + overlay "Voir détails" (overlay non cliquable) -->
        <a [routerLink]="['/product', product.id]" class="block relative z-10">
          <img
            [src]="product.imageUrl"
            [alt]="product.title"
            class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div
            class="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/20
                   transition-colors duration-300 flex items-center justify-center"
          >
            <span
              class="opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0
                     transition-all duration-300 bg-white text-gray-900 px-4 py-2 rounded-full font-semibold"
            >
              Voir Détails
            </span>
          </div>
        </a>
      </div>

      <!-- Infos compactes sous l’image -->
      <div class="p-3">
        <div class="flex items-center justify-between gap-3 mb-1">
          <div class="flex items-center gap-2 min-w-0">
            <img
              [src]="product.artist.profileImage || '/assets/default-avatar.png'"
              [alt]="product.artist.name"
              class="w-6 h-6 rounded-full object-cover"
            />
            <span class="text-sm text-gray-600 truncate">{{ product.artist.name }}</span>
          </div>
          <div class="shrink-0 text-right">
            <span class="text-green-600 font-bold">{{ product.price }}€</span>
            @if (product.originalPrice) {
            <span class="text-xs text-gray-500 line-through ml-2"
              >{{ product.originalPrice }}€</span
            >
            }
          </div>
        </div>

        <h3 class="font-semibold text-gray-900 line-clamp-1">{{ product.title }}</h3>
      </div>
    </div>
  `,
  styles: [
    `
      .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class ProductTileComponent {
  @Input({ required: true }) product!: Product;

  private fav = inject(FavoritesStore);
  private auth = inject(AuthService);

  isFav = computed(() => this.fav.isFavorite(this.product?.id ?? -1));

  onToggleFavorite(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    if (!this.auth.isAuthenticated()) {
      // éventuelle redirection login ici si tu veux
      return;
    }
    this.fav.toggle(this.product.id);
  }
}
