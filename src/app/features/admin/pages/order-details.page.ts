import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../orders/services/order';
import type { Order, OrderStatus } from '../../orders/models/order.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { AuthService } from '../../auth/services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a>
                <span>•</span>
                <a routerLink="/admin/orders" class="hover:text-gray-700">Commandes</a>
                <span>•</span>
                <span class="text-gray-900">#{{ order()?.id }}</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Commande #{{ order()?.id }}</h1>
            </div>
            <div class="flex items-center gap-3">
              <button
                routerLink="/admin/orders"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <i class="fa-solid fa-arrow-left text-sm"></i> Retour
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-xl shadow-sm p-8">
          <div class="animate-pulse space-y-6">
            <div class="h-32 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      } @else if (order()) {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <!-- En-tête -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                [ngClass]="badge(order()!.status)"
              >
                <i class="fa-solid mr-2" [ngClass]="icon(order()!.status)"></i>
                {{ label(order()!.status) }}
              </span>
              <div class="text-gray-500">Créée le {{ formatDate(order()!.createdAt) }}</div>
            </div>
            <div class="flex items-center gap-2">
              <select
                class="text-sm border rounded px-3 py-2"
                [ngModel]="order()!.status"
                (ngModelChange)="changeStatus($event)"
              >
                <option value="pending">En attente</option>
                <option value="processing">En traitement</option>
                <option value="accepted">Acceptée</option>
                <option value="refused">Refusée</option>
                <option value="delivered">Livrée</option>
              </select>
              <button
                (click)="remove()"
                class="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-2 rounded-lg"
              >
                <i class="fa-solid fa-trash"></i> Supprimer
              </button>
            </div>
          </div>

          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Client</h3>
              <div class="space-y-1 text-sm">
                <div class="text-gray-900">
                  {{ order()!.customer.firstName }} {{ order()!.customer.lastName }}
                </div>
                <div class="text-gray-600">{{ order()!.customer.email }}</div>
                @if (order()!.customer.phone) {
                <div class="text-gray-600">{{ order()!.customer.phone }}</div>
                }
              </div>
              <div class="mt-4">
                <h4 class="text-sm font-medium text-gray-700 mb-1">Adresse de livraison</h4>
                <div class="text-sm text-gray-900">
                  {{ order()!.customer.address.street }}<br />
                  {{ order()!.customer.address.zip }} {{ order()!.customer.address.city }}<br />
                  {{ order()!.customer.address.country }}
                </div>
              </div>

              <div class="mt-4 text-sm text-gray-600">
                Paiement : {{ order()!.payment.method
                }}<span *ngIf="order()!.payment.last4"> ****{{ order()!.payment.last4 }}</span>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Résumé</h3>
              <div class="text-sm space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Sous-total</span
                  ><span class="text-gray-900">{{ order()!.subtotal | number : '1.2-2' }} €</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Livraison</span
                  ><span class="text-gray-900">{{ order()!.shipping | number : '1.2-2' }} €</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Taxes</span
                  ><span class="text-gray-900">{{ order()!.taxes | number : '1.2-2' }} €</span>
                </div>
                <div class="border-t my-2"></div>
                <div class="flex items-center justify-between font-semibold">
                  <span>Total</span><span>{{ order()!.total | number : '1.2-2' }} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Articles -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">
              Articles ({{ order()!.items.length }})
            </h2>
          </div>
          <div class="p-6">
            <div class="divide-y">
              @for (it of order()!.items; track it.productId) {
              <div class="py-3 flex items-center justify-between">
                <div class="text-sm">
                  <div class="text-gray-900">{{ it.title }}</div>
                  <div class="text-gray-500">x{{ it.qty }}</div>
                </div>
                <div class="text-sm text-gray-900">
                  {{ it.unitPrice * it.qty | number : '1.2-2' }} €
                </div>
              </div>
              }
            </div>
          </div>
        </div>

        <!-- Notes (facultatif) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Notes internes</h2>
          </div>
          <div class="p-6">
            <textarea
              class="w-full border rounded-lg px-3 py-2"
              rows="4"
              [(ngModel)]="notes"
              placeholder="Notes liées à la commande..."
            ></textarea>
            <div class="mt-3">
              <button
                (click)="saveNotes()"
                class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
      } @else {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-xl shadow-sm p-8 text-center">
          <i class="fa-solid fa-triangle-exclamation text-4xl text-gray-400 mb-4"></i>
          <p class="text-lg font-medium text-gray-900 mb-2">Commande introuvable</p>
          <p class="text-gray-500 mb-6">La commande demandée n'existe pas ou a été supprimée.</p>
          <button
            routerLink="/admin/orders"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <i class="fa-solid fa-arrow-left"></i> Retour aux commandes
          </button>
        </div>
      </div>
      }
    </div>
  `,
})
export class OrderDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orders = inject(OrderService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);

  order = signal<Order | null>(null);
  loading = signal(true);
  notes = '';

  async ngOnInit() {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/admin/orders']);
      return;
    }

    await this.load(id);
  }

  private async load(id: string) {
    this.loading.set(true);
    try {
      const o = await this.orders.getById(id);
      this.order.set(o);
      this.notes = o.notes ?? ''; // ✅ plus de ts-expect-error
    } catch (e) {
      console.error(e);
      this.toast.error('Impossible de charger la commande');
      this.order.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async changeStatus(raw: string) {
    const o = this.order();
    if (!o) return;
    try {
      const updated = await this.orders.updateStatus(o.id, raw as OrderStatus);
      this.order.set(updated);
      this.toast.success(`Statut mis à jour en ${this.label(updated.status)}`);
    } catch {
      this.toast.error('Mise à jour du statut impossible');
    }
  }

  async saveNotes() {
    const o = this.order();
    if (!o) return;
    try {
      const updated = await this.orders.updateNotes(o.id, this.notes);
      this.order.set(updated);
      this.toast.success('Notes enregistrées');
    } catch {
      this.toast.error("Impossible d'enregistrer les notes");
    }
  }

  async remove() {
    const o = this.order();
    if (!o) return;
    const ok = await this.confirm.ask({
      title: 'Supprimer la commande',
      message: `Cette action supprimera définitivement la commande #${o.id}.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
      requireText: { placeholder: 'Tapez "SUPPRIMER" pour confirmer', requiredValue: 'SUPPRIMER' },
    });
    if (!ok) return;

    try {
      await this.orders.delete(o.id);
      this.toast.success(`Commande #${o.id} supprimée`);
      this.router.navigate(['/admin/orders']);
    } catch {
      this.toast.error('Suppression impossible');
    }
  }

  // UI helpers
  label(s: OrderStatus): string {
    switch (s) {
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En traitement';
      case 'accepted':
        return 'Acceptée';
      case 'refused':
        return 'Refusée';
      case 'delivered':
        return 'Livrée';
    }
  }

  badge(s: OrderStatus): string {
    switch (s) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-indigo-100 text-indigo-800';
      case 'refused':
        return 'bg-red-100 text-red-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
    }
  }

  icon(s: OrderStatus): string {
    switch (s) {
      case 'pending':
        return 'fa-hourglass-half';
      case 'processing':
        return 'fa-gears';
      case 'accepted':
        return 'fa-check';
      case 'refused':
        return 'fa-ban';
      case 'delivered':
        return 'fa-box-open';
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
