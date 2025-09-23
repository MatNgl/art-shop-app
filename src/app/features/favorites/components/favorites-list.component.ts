import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesStore, FavoriteItem } from '../../favorites/services/favorites-store';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-favorites-list',
  imports: [CommonModule, RouterLink],
  styles: [`
    .grid-card { @apply rounded-xl border border-gray-200 p-3 hover:shadow-sm transition; }
    .grid-img  { @apply w-full aspect-[4/3] object-cover rounded-lg mb-2; }
    .line      { @apply flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50; }
    .line-img  { @apply w-14 h-14 object-cover rounded-lg; }
    .empty     { @apply text-sm text-gray-500; }
  `],
  template: `
    <ng-container *ngIf="items().length; else empty">
      <div *ngIf="layout === 'grid'; else compactTpl"
           class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <article *ngFor="let p of limited()" class="grid-card">
          <a [routerLink]="['/product', p.productId]">
            <img [src]="thumb(p.productId)" [alt]="label(p.productId)" class="grid-img" />
            <div class="text-sm font-medium text-gray-900 truncate">{{ label(p.productId) }}</div>
            <div class="text-xs text-gray-500 truncate">Ajouté le {{ p.addedAt | date:'short' }}</div>
          </a>
          <button class="mt-2 text-xs text-red-600 hover:text-red-700"
                  (click)="remove(p.productId)">Retirer</button>
        </article>
      </div>

      <ng-template #compactTpl>
        <ul class="divide-y" role="list">
          <li class="line" *ngFor="let p of limited()">
            <img [src]="thumb(p.productId)" [alt]="label(p.productId)" class="line-img" />
            <div class="min-w-0 flex-1">
              <a [routerLink]="['/product', p.productId]" class="block truncate text-sm font-medium text-gray-900">
                {{ label(p.productId) }}
              </a>
              <div class="truncate text-xs text-gray-500">Ajouté le {{ p.addedAt | date:'short' }}</div>
            </div>
            <button class="text-xs text-red-600 hover:text-red-700" (click)="remove(p.productId)">
              Retirer
            </button>
          </li>
        </ul>
      </ng-template>
    </ng-container>

    <ng-template #empty>
      <div class="empty">
        Aucun favori pour le moment.
        <a routerLink="/catalog" class="text-blue-600 hover:underline">Découvrir le catalogue</a>
      </div>
    </ng-template>
  `,
})
export class FavoritesListComponent {
  private store = inject(FavoritesStore);
  private readonly toast = inject(ToastService);

  @Input() layout: 'grid' | 'compact' = 'grid';
  @Input() limit = 0;

  items = this.store.items;

  limited = computed<FavoriteItem[]>(() => {
    const arr = this.items();
    return this.limit && this.limit > 0 ? arr.slice(0, this.limit) : arr;
  });

  label(id: number) { return `Œuvre #${id}`; }
  thumb(id: number) { return `/assets/products/${id}.jpg`; }

  remove(id: number) {
    this.store.remove(id);
    this.toast.success('Retiré des favoris');
  }
}