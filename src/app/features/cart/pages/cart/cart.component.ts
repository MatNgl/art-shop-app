import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../services/cart-store';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Mon panier</h1>

      @if (cart.empty()) {
      <div class="bg-white rounded-xl p-8 shadow text-center">
        <p class="text-gray-700 mb-4">Votre panier est vide.</p>
        <a
          routerLink="/catalog"
          class="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Parcourir le catalogue
        </a>
      </div>
      } @else {
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Liste des items -->
        <section class="lg:col-span-2 space-y-4">
          @for (it of cart.items(); track it.productId) {
          <div class="bg-white rounded-xl shadow p-4 flex items-center gap-4">
            <img [src]="it.imageUrl" [alt]="it.title" class="w-24 h-24 object-cover rounded-md" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <h3 class="font-semibold text-gray-900 truncate">{{ it.title }}</h3>
                  @if (it.artistName) {
                  <p class="text-sm text-gray-500 mt-0.5 truncate">{{ it.artistName }}</p>
                  }
                </div>
                <button
                  (click)="cart.remove(it.productId)"
                  class="text-sm text-red-600 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>

              <div class="mt-3 flex items-center justify-between">
                <div class="inline-flex items-center rounded-full border border-gray-300 bg-white">
                  <button
                    type="button"
                    class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-l-full"
                    (click)="cart.dec(it.productId)"
                    [disabled]="it.qty <= 1"
                  >
                    –
                  </button>
                  <span class="px-4 font-semibold tabular-nums select-none">{{ it.qty }}</span>
                  <button
                    type="button"
                    class="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-r-full"
                    (click)="cart.inc(it.productId)"
                    [disabled]="it.qty >= it.maxStock"
                  >
                    +
                  </button>
                </div>
                <div class="text-right">
                  <div class="text-gray-900 font-semibold">
                    {{ it.unitPrice * it.qty | number : '1.2-2' }} €
                  </div>
                  <div class="text-xs text-gray-500">
                    ({{ it.unitPrice | number : '1.2-2' }} € / unité)
                  </div>
                </div>
              </div>
            </div>
          </div>
          }
        </section>

        <!-- Récap -->
        <aside class="bg-white rounded-xl shadow p-6 h-fit">
          <h2 class="font-semibold text-gray-900 mb-4">Résumé</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-600">Articles ({{ cart.count() }})</dt>
              <dd class="text-gray-900">{{ cart.subtotal() | number : '1.2-2' }} €</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">TVA (20%)</dt>
              <dd class="text-gray-900">{{ cart.taxes() | number : '1.2-2' }} €</dd>
            </div>
            <div class="flex justify-between pt-2 border-t">
              <dt class="font-semibold text-gray-900">Total</dt>
              <dd class="font-semibold text-gray-900">{{ cart.total() | number : '1.2-2' }} €</dd>
            </div>
          </dl>

          <p class="mt-3 text-xs text-gray-500">
            Taxes incluses. <span class="underline decoration-dotted">Frais d’expédition</span>
            calculés à l’étape de paiement.
          </p>

          <a
            routerLink="/cart"
            class="mt-4 w-full inline-flex items-center justify-center px-4 py-2 rounded-md
                      bg-blue-600 text-white hover:bg-blue-700"
          >
            Passer commande
          </a>

          <button
            class="mt-2 w-full inline-flex items-center justify-center px-4 py-2 rounded-md
                           bg-gray-100 text-gray-800 hover:bg-gray-200"
            (click)="cart.clear()"
          >
            Vider le panier
          </button>
        </aside>
      </div>
      }
    </div>
  `,
})
export class CartComponent {
  cart = inject(CartStore);
}
