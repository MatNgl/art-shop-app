import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesListComponent } from '../../../favorites/components/favorites-list.component';

@Component({
  standalone: true,
  selector: 'app-profile-favorites',
  imports: [CommonModule, RouterLink, FavoritesListComponent],
  template: `
    <section class="max-w-3xl mx-auto px-4 py-6">
      <header class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold">Mes favoris</h2>
        <a routerLink="/favorites" class="text-sm text-blue-600 hover:underline">
          Voir tout
        </a>
      </header>

      <!-- Affichage compact limité à 8 éléments -->
      <app-favorites-list layout="compact" [limit]="8"></app-favorites-list>
    </section>
  `,
})
export class ProfileFavoritesComponent { }
