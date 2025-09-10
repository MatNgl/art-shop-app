import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Order } from '../../../orders/models/order.model';
import { OrderStore } from '../../../../features/cart/services/order-store';
import { PricePipe } from '../../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-profile-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, NgClass, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Mes commandes</h1>

      @if (!orders().length) {
      <div class="bg-white rounded-xl shadow p-6">
        <p class="text-gray-600">Aucune commande pour l’instant.</p>
        <a class="text-primary-600 underline" routerLink="/">Continuer mes achats</a>
      </div>
      } @else {
      <div class="space-y-4">
        @for (o of orders(); track o.id) {
        <article class="bg-white rounded-xl shadow p-4 md:p-6">
          <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h2 class="font-semibold">
                Commande <span class="font-mono">{{ o.id }}</span>
              </h2>
              <p class="text-sm text-gray-500">Passée le {{ o.createdAt | date : 'medium' }}</p>
            </div>
            <span
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
              [ngClass]="statusBadgeClass(o.status)"
            >
              <span class="size-2 rounded-full" [ngClass]="statusDotClass(o.status)"></span>
              {{ statusLabel(o.status) }}
            </span>
          </header>

          <div class="mt-4 grid md:grid-cols-3 gap-4">
            <ul class="md:col-span-2 divide-y">
              @for (it of o.items; track it.productId) {
              <li class="py-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  @if (it.imageUrl) {
                  <img [src]="it.imageUrl" alt="" class="w-12 h-12 object-cover rounded-md" />
                  }
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate">{{ it.title }}</p>
                    <p class="text-xs text-gray-500">x{{ it.qty }} — {{ it.unitPrice | price }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <a
                    class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                    [routerLink]="['/product', it.productId]"
                    aria-label="Voir la fiche du dessin"
                  >
                    Afficher le dessin
                  </a>

                  <div class="text-sm">{{ it.unitPrice * it.qty | price }}</div>
                </div>
              </li>
              }
            </ul>

            <aside class="bg-gray-50 rounded-lg p-4 h-fit">
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span>Sous-total</span><span>{{ o.subtotal | price }} </span>
                </div>
                <div class="flex justify-between">
                  <span>Taxes</span><span>{{ o.taxes | price }} </span>
                </div>
                <div class="flex justify-between">
                  <span>Livraison</span><span>{{ o.shipping | price }} </span>
                </div>
                <div class="border-t pt-2 font-semibold flex justify-between">
                  <span>Total</span><span>{{ o.total | price }} </span>
                </div>
              </div>

              <div class="mt-4">
                <h3 class="text-sm font-semibold mb-2">Avancement</h3>
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-2 rounded bg-gray-200 overflow-hidden">
                    <div
                      class="h-full"
                      [ngClass]="progressBarClass(o.status)"
                      [style.width.%]="progress(o.status)"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-500">{{ progress(o.status) }}%</span>
                </div>
              </div>
            </aside>
          </div>

          <!-- (Optionnel) boutons de test pour changer le statut côté front -->
          <!--
              <div class="mt-4 flex flex-wrap gap-2 text-xs">
                <button class="px-3 py-1 rounded border" (click)="setStatus(o.id, 'processing')">En cours</button>
                <button class="px-3 py-1 rounded border" (click)="setStatus(o.id, 'accepted')">Acceptée</button>
                <button class="px-3 py-1 rounded border" (click)="setStatus(o.id, 'delivered')">Livrée</button>
                <button class="px-3 py-1 rounded border" (click)="setStatus(o.id, 'refused')">Refusée</button>
              </div>
              -->
        </article>
        }
      </div>
      }
    </div>
  `,
})
export class ProfileOrdersComponent {
  private readonly ordersStore = inject(OrderStore);

  orders = computed<Order[]>(() => this.ordersStore.listOrders());

  setStatus(id: string, status: Order['status']) {
    this.ordersStore.updateStatus(id, status);
    // force le recompute
    this.orders = computed<Order[]>(() => this.ordersStore.listOrders());
  }

  statusLabel(s: Order['status']): string {
    switch (s) {
      case 'processing':
        return 'En cours de traitement';
      case 'accepted':
        return 'Acceptée';
      case 'refused':
        return 'Refusée';
      case 'delivered':
        return 'Livrée';
      case 'pending':
      default:
        return 'En attente';
    }
  }

  statusBadgeClass(s: Order['status']) {
    return {
      'bg-yellow-100 text-yellow-800': s === 'pending' || s === 'processing',
      'bg-green-100 text-green-800': s === 'accepted' || s === 'delivered',
      'bg-red-100 text-red-800': s === 'refused',
    };
  }
  statusDotClass(s: Order['status']) {
    return {
      'bg-yellow-500': s === 'pending' || s === 'processing',
      'bg-green-500': s === 'accepted' || s === 'delivered',
      'bg-red-500': s === 'refused',
    };
  }

  progress(s: Order['status']): number {
    switch (s) {
      case 'pending':
        return 10;
      case 'processing':
        return 40;
      case 'accepted':
        return 70;
      case 'delivered':
        return 100;
      case 'refused':
        return 0;
      default:
        return 0;
    }
  }
  progressBarClass(s: Order['status']) {
    return {
      'bg-yellow-500': s === 'pending' || s === 'processing',
      'bg-green-600': s === 'accepted' || s === 'delivered',
      'bg-red-500': s === 'refused',
    };
  }
}
