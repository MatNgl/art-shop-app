import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-16 text-center">
      <div class="bg-white rounded-2xl shadow p-10">
        <h1 class="text-2xl font-bold mb-2">Merci pour votre achat !</h1>
        <p class="text-gray-600">
          Votre commande <span class="font-mono font-semibold">{{ id }}</span> a été confirmée.
        </p>
        <div class="mt-6 space-x-3">
          <a class="inline-block rounded-lg px-4 py-2 bg-primary-600 text-white" routerLink="/"
            >Retour à la boutique</a
          >
          <a class="inline-block rounded-lg px-4 py-2 border" routerLink="/profile/favorites"
            >Voir mes favoris</a
          >
        </div>
      </div>
    </div>
  `,
})
export class ConfirmationComponent {
  id = inject(ActivatedRoute).snapshot.paramMap.get('id');
}
