import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesListComponent } from '../../favorites/components/favorites-list.component';

@Component({
    standalone: true,
    selector: 'app-favorites-page',
    imports: [CommonModule, FavoritesListComponent],
    template: `
    <div class="max-w-6xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-4">Mes favoris</h1>
      <app-favorites-list layout="grid"></app-favorites-list>
    </div>
  `,
})
export class FavoritesPageComponent { }
