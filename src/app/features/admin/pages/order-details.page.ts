import { Component, OnInit, effect, inject, signal, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../orders/services/order';
import type { Order, OrderItem, OrderStatus, PaymentBrand } from '../../orders/models/order.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { AuthService } from '../../auth/services/auth';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { ProductService } from '../../catalog/services/product';

type StepKey = 'pending' | 'processing' | 'accepted' | 'delivered' | 'refused';

interface PickingState {
  // key = productId + ':' + (variantId ?? '-')
  items: Record<string, number>; // pickedQty
}

interface WorkflowState {
  picking: boolean;
  qc: boolean; // contrôle qualité
  packing: boolean; // emballage
  labeling: boolean; // étiquetage
  handover: boolean; // remis au transporteur
}

interface ItemEnrichment {
  imageUrl?: string;
  sizeLabel?: string;
  dimensionsText?: string; // ex: "29.7 × 21 cm"
}

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgClass, PricePipe],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-20">
        <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <nav class="flex items-center gap-2 text-sm text-gray-500">
                <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a>
                <span>•</span>
                <a routerLink="/admin/orders" class="hover:text-gray-700">Commandes</a>
                <span>•</span>
                <span class="text-gray-900 truncate">#{{ order()?.id }}</span>
              </nav>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">
                Préparation — {{ order()?.id }}
              </h1>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                (click)="printPickingSlip()"
                class="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white border text-gray-700 hover:bg-gray-50"
                [disabled]="!order()"
                title="Imprimer le bon de préparation"
              >
                <i class="fa-solid fa-print text-sm"></i
                ><span class="hidden sm:inline">Imprimer</span>
              </button>
              <button
                routerLink="/admin/orders"
                class="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Retour aux commandes"
              >
                <i class="fa-solid fa-arrow-left text-sm"></i
                ><span class="hidden sm:inline">Retour</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-xl shadow-sm p-8">
          <div class="animate-pulse space-y-6">
            <div class="h-8 bg-gray-200 rounded w-1/3"></div>
            <div class="h-32 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      } @else if (order()) {

      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <!-- Status timeline + Quick actions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div
            class="px-6 py-4 border-b border-gray-200 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between"
          >
            <div class="flex items-center gap-3 flex-wrap">
              @for (s of steps; track s.key) {
              <div class="flex items-center gap-2">
                <div
                  class="w-9 h-9 rounded-full border flex items-center justify-center"
                  [ngClass]="{
                    'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-indigo-600 shadow-sm':
                      isReached(s.key),
                    'bg-gray-100 text-gray-500 border-gray-200': !isReached(s.key),
                    'bg-red-600 text-white border-red-600':
                      s.key === 'refused' && order()!.status === 'refused'
                  }"
                  [attr.aria-label]="s.label"
                  [title]="s.label"
                >
                  <i class="fa-solid" [ngClass]="s.icon"></i>
                </div>
                <span
                  class="text-sm font-medium"
                  [ngClass]="{
                    'text-gray-900':
                      isReached(s.key) || (s.key === 'refused' && order()!.status === 'refused'),
                    'text-gray-500': !isReached(s.key)
                  }"
                  >{{ s.label }}</span
                >
              </div>
              @if (s.key !== 'refused' && s.key !== 'delivered') {
              <div class="w-8 h-px bg-gray-200 hidden sm:block"></div>
              } }
            </div>

            <div class="flex items-center gap-2">
              <select
                class="text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                [ngModel]="order()!.status"
                (ngModelChange)="changeStatus($event)"
              >
                <option value="pending">En attente</option>
                <option value="processing">En préparation</option>
                <option value="accepted">Acceptée</option>
                <option value="refused">Refusée</option>
                <option value="delivered">Livrée</option>
              </select>

              <!-- CTA contextuels -->
              @if (!allPicked() && order()!.status !== 'refused') {
              <button
                class="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                (click)="setStatus('processing')"
              >
                Marquer “En préparation”
              </button>
              } @if (allPicked() && order()!.status !== 'accepted' && order()!.status !== 'refused')
              {
              <button
                class="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                (click)="setStatus('accepted')"
                title="Tous les articles sont préparés"
              >
                Marquer “Acceptée”
              </button>
              } @if (allPicked() && order()!.status === 'accepted') {
              <button
                class="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                (click)="setStatus('delivered')"
              >
                Marquer “Livrée”
              </button>
              }

              <button
                (click)="remove()"
                class="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                title="Supprimer la commande"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- KPIs -->
          <div class="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div class="text-xs text-blue-700/80">Date de création</div>
              <div class="text-sm font-medium text-blue-900">
                {{ formatDate(order()!.createdAt) }}
              </div>
            </div>
            <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div class="text-xs text-indigo-700/80">Articles</div>
              <div class="text-sm font-medium text-indigo-900">{{ order()!.items.length }}</div>
            </div>
            <div class="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div class="text-xs text-emerald-700/80">Total</div>
              <div class="text-sm font-semibold text-emerald-900">{{ order()!.total | price }}</div>
            </div>
            <div class="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <div class="text-xs text-amber-700/80">Préparation</div>
              <div
                class="text-sm font-medium"
                [ngClass]="allPicked() ? 'text-green-700' : 'text-amber-700'"
              >
                {{ preparedUnits() }} / {{ totalUnits() }} unités
              </div>
            </div>
          </div>
        </div>

        <!-- Main layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- LEFT: Picking checklist -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Checklist de préparation</h2>
                  <p class="text-sm text-gray-500">
                    Coche les quantités réellement préparées (images, tailles, dimensions
                    affichées).
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    (click)="pickAll()"
                    class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Tout préparer
                  </button>
                  <button
                    (click)="resetPicking()"
                    class="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              <div class="p-4 sm:p-6">
                <div class="space-y-4">
                  @for (row of enrichedItems(); track row.key) {
                  <div
                    class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
                    [class.bg-green-50]="pickedQty(row.key) >= row.item.qty"
                  >
                    <!-- Image -->
                    @if (row.imageUrl) {
                    <img
                      loading="lazy"
                      class="w-16 h-16 sm:w-20 sm:h-20 rounded-md border object-cover"
                      [src]="row.imageUrl"
                      [alt]="row.item.title"
                    />
                    } @else {
                    <div
                      class="w-16 h-16 sm:w-20 sm:h-20 rounded-md border bg-gray-100 flex items-center justify-center text-gray-400"
                    >
                      <i class="fa-regular fa-image"></i>
                    </div>
                    }

                    <!-- Infos -->
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-900 truncate">
                        {{ row.item.title }}
                        @if (row.item.variantLabel || row.sizeLabel) {
                        <span
                          class="ml-2 text-sm font-medium text-indigo-700 inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5"
                        >
                          <i class="fa-solid fa-up-right-and-down-left-from-center text-[10px]"></i>
                          {{ row.item.variantLabel ?? row.sizeLabel }}
                        </span>
                        }
                      </div>

                      <div
                        class="text-xs sm:text-[13px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap"
                      >
                        <span
                          >Réf: {{ row.item.productId
                          }}<span *ngIf="row.item.variantId">-{{ row.item.variantId }}</span></span
                        >
                        @if (row.dimensionsText) {
                        <span class="inline-flex items-center gap-1">
                          <i class="fa-regular fa-square text-[10px]"></i>{{ row.dimensionsText }}
                        </span>
                        }
                      </div>

                      <div class="text-xs sm:text-sm text-gray-600 mt-0.5">
                        {{ row.item.unitPrice | price }} × {{ row.item.qty }} =
                        <span class="text-gray-900 font-semibold">{{
                          row.item.unitPrice * row.item.qty | price
                        }}</span>
                      </div>
                    </div>

                    <!-- Picker -->
                    <div class="shrink-0">
                      <div class="flex items-center gap-2">
                        <button
                          class="w-8 h-8 rounded-lg border text-gray-700 hover:bg-gray-50"
                          (click)="dec(row.item)"
                          [disabled]="pickedQty(row.key) <= 0"
                          aria-label="Retirer une unité"
                        >
                          <i class="fa-solid fa-minus text-xs"></i>
                        </button>
                        <input
                          type="number"
                          class="w-16 text-center border rounded-lg py-1"
                          [min]="0"
                          [max]="row.item.qty"
                          [ngModel]="pickedQty(row.key)"
                          (ngModelChange)="setPicked(row.item, clamp($event, 0, row.item.qty))"
                          aria-label="Quantité préparée"
                        />
                        <button
                          class="w-8 h-8 rounded-lg border text-gray-700 hover:bg-gray-50"
                          (click)="inc(row.item)"
                          [disabled]="pickedQty(row.key) >= row.item.qty"
                          aria-label="Ajouter une unité"
                        >
                          <i class="fa-solid fa-plus text-xs"></i>
                        </button>
                      </div>
                      <div class="text-xs mt-1">
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full"
                          [ngClass]="
                            pickedQty(row.key) >= row.item.qty
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          "
                        >
                          {{ pickedQty(row.key) }} / {{ row.item.qty }} prêt(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  }
                </div>
              </div>

              <!-- Footer checklist -->
              <div
                class="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div class="text-sm text-gray-700">
                  Préparé : <span class="font-semibold">{{ preparedUnits() }}</span> /
                  {{ totalUnits() }} unités • Articles OK :
                  <span class="font-semibold">{{ readyItemsCount() }}</span> /
                  {{ order()!.items.length }}
                </div>

                <div class="flex items-center gap-2">
                  <button
                    (click)="printPickingSlip()"
                    class="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
                  >
                    <i class="fa-solid fa-print mr-2 text-xs"></i> Bon de préparation
                  </button>
                  <button
                    *ngIf="allPicked() && order()!.status !== 'accepted'"
                    (click)="setStatus('accepted')"
                    class="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Marquer “Acceptée”
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Trame, Client / Paiement / Notes -->
          <div class="space-y-6">
            <!-- Trame de préparation -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Trame de préparation</h3>
                <p class="text-sm text-gray-500">Checklist opératoire (persistance locale).</p>
              </div>
              <div class="p-6 space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span class="text-sm text-gray-800">Picking</span>
                  </div>
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600"
                    [checked]="workflow().picking"
                    (change)="toggleWorkflow('picking')"
                  />
                </div>
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span class="text-sm text-gray-800">Contrôle qualité</span>
                  </div>
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-amber-600"
                    [checked]="workflow().qc"
                    (change)="toggleWorkflow('qc')"
                  />
                </div>
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span class="text-sm text-gray-800">Emballage</span>
                  </div>
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600"
                    [checked]="workflow().packing"
                    (change)="toggleWorkflow('packing')"
                  />
                </div>
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                    <span class="text-sm text-gray-800">Étiquetage</span>
                  </div>
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-fuchsia-600"
                    [checked]="workflow().labeling"
                    (change)="toggleWorkflow('labeling')"
                  />
                </div>
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span class="text-sm text-gray-800">Remise transporteur</span>
                  </div>
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-emerald-600"
                    [checked]="workflow().handover"
                    (change)="toggleWorkflow('handover')"
                  />
                </div>

                <!-- Progress bar -->
                <div class="mt-4">
                  <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progression</span><span>{{ workflowProgress() }}%</span>
                  </div>
                  <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      class="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
                      [style.width.%]="workflowProgress()"
                    ></div>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-2">
                  <button
                    (click)="completeWorkflow()"
                    class="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    Tout cocher
                  </button>
                  <button
                    (click)="resetWorkflow()"
                    class="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>

            <!-- Client & Paiement -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Client</h3>
              </div>
              <div class="p-6 text-sm">
                <div class="text-gray-900 font-medium">
                  {{ order()!.customer.firstName }} {{ order()!.customer.lastName }}
                </div>
                <div class="text-gray-600 break-all">{{ order()!.customer.email }}</div>
                @if (order()!.customer.phone) {
                <div class="text-gray-600">{{ order()!.customer.phone }}</div>
                }

                <div class="mt-4">
                  <h4 class="text-sm font-medium text-gray-700 mb-1">Adresse de livraison</h4>
                  <div class="text-gray-900">
                    {{ order()!.customer.address.street }}<br />
                    {{ order()!.customer.address.zip }} {{ order()!.customer.address.city }}<br />
                    {{ order()!.customer.address.country }}
                  </div>
                  <a
                    class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                    [href]="mapsLink()"
                    target="_blank"
                    rel="noopener"
                  >
                    Ouvrir dans Maps
                    <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </a>
                </div>

                <div class="mt-4">
                  <h4 class="text-sm font-medium text-gray-700 mb-1">Paiement</h4>
                  <div class="flex items-center gap-2 text-gray-900">
                    <i
                      class="fa-brands text-lg"
                      [ngClass]="paymentBrandIcon(order()!.payment.brand)"
                    ></i>
                    {{ paymentMethodLabel(order()!.payment.method) }}
                    <span *ngIf="order()!.payment.last4" class="text-gray-600"
                      >****{{ order()!.payment.last4 }}</span
                    >
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Total payé :
                    <span class="font-medium text-gray-700">{{ order()!.total | price }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Notes internes</h3>
              </div>
              <div class="p-6">
                <textarea
                  class="w-full border rounded-lg px-3 py-2 text-sm"
                  rows="5"
                  [(ngModel)]="notes"
                  placeholder="Ajoute des consignes de préparation, anomalies, etc."
                  aria-label="Notes internes"
                ></textarea>
                <div class="mt-3 flex items-center gap-2">
                  <button
                    (click)="saveNotes()"
                    class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Enregistrer
                  </button>
                  <span class="text-xs text-gray-500"
                    >Sauvegardé côté API (pas dans le bon d’impression).</span
                  >
                </div>
              </div>
            </div>

            <!-- Footer meta -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100">
              <div class="px-6 py-4">
                <div class="text-sm text-gray-600">
                  <span class="font-medium text-gray-900">Commande #{{ order()!.id }}</span> • Créée
                  le {{ formatDate(order()!.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hidden printable template -->
        <div id="print-slip" class="hidden">
          <div>
            <h2>Bon de préparation — {{ order()!.id }}</h2>
            <p>Date: {{ formatDate(order()!.createdAt) }}</p>
            <hr />
            <h3>Client</h3>
            <p>
              {{ order()!.customer.firstName }} {{ order()!.customer.lastName }}<br />
              {{ order()!.customer.address.street }}<br />
              {{ order()!.customer.address.zip }} {{ order()!.customer.address.city }}<br />
              {{ order()!.customer.address.country }}
            </p>
            <h3>Articles</h3>
            <table style="width:100%; border-collapse: collapse;" border="1" cellpadding="6">
              <thead>
                <tr>
                  <th align="left">Produit</th>
                  <th align="left">Taille</th>
                  <th align="left">Dimensions</th>
                  <th align="right">Qté</th>
                  <th align="right">Préparé</th>
                </tr>
              </thead>
              <tbody>
                @for (row of enrichedItems(); track row.key) {
                <tr>
                  <td>{{ row.item.title }}</td>
                  <td>{{ row.item.variantLabel ?? row.sizeLabel ?? '—' }}</td>
                  <td>{{ row.dimensionsText ?? '—' }}</td>
                  <td align="right">{{ row.item.qty }}</td>
                  <td align="right">{{ pickedQty(row.key) }}</td>
                </tr>
                }
              </tbody>
            </table>
            <p style="margin-top:12px;">
              Préparé: {{ preparedUnits() }} / {{ totalUnits() }} unités — Total:
              {{ order()!.total | price }}
            </p>
          </div>
        </div>
      </div>
      } @else {
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
  private products = inject(ProductService);

  order = signal<Order | null>(null);
  loading = signal<boolean>(true);
  notes = '';

  // --- Picking state (persisté localStorage par commande)
  private picking = signal<PickingState>({ items: {} });

  // --- Trame opératoire (persistée)
  workflow = signal<WorkflowState>({
    picking: false,
    qc: false,
    packing: false,
    labeling: false,
    handover: false,
  });

  // Enrichissement items (image/size/dimensions)
  private enrichment = signal<Record<string, ItemEnrichment>>({});

  // Étapes affichées (timeline)
  readonly steps: { key: StepKey; label: string; icon: string }[] = [
    { key: 'pending', label: 'En attente', icon: 'fa-hourglass-half' },
    { key: 'processing', label: 'En préparation', icon: 'fa-boxes-stacked' },
    { key: 'accepted', label: 'Acceptée', icon: 'fa-check' },
    { key: 'delivered', label: 'Livrée', icon: 'fa-truck' },
    { key: 'refused', label: 'Refusée', icon: 'fa-ban' },
  ];

  // Persist picking + workflow
  private persistEffect = effect(() => {
    const o = this.order();
    if (!o) return;
    try {
      localStorage.setItem(this.pickingKey(o.id), JSON.stringify(this.picking()));
      localStorage.setItem(this.workflowKey(o.id), JSON.stringify(this.workflow()));
    } catch {
      /* noop */
    }
  });

  // --- Computeds
  totalUnits = computed(() => {
    const o = this.order();
    return o ? o.items.reduce((acc, it) => acc + it.qty, 0) : 0;
  });

  preparedUnits = computed(() => {
    const o = this.order();
    if (!o) return 0;
    return o.items.reduce((acc, it) => acc + this.pickedQty(this.itemKey(it)), 0);
  });

  readyItemsCount = computed(() => {
    const o = this.order();
    if (!o) return 0;
    return o.items.filter((it) => this.pickedQty(this.itemKey(it)) >= it.qty).length;
  });

  allPicked = computed(() => {
    const o = this.order();
    if (!o) return false;
    return o.items.every((it) => this.pickedQty(this.itemKey(it)) >= it.qty);
  });

  workflowProgress = computed(() => {
    const w = this.workflow();
    const done = [w.picking, w.qc, w.packing, w.labeling, w.handover].filter(Boolean).length;
    return Math.round((done / 5) * 100);
  });

  enrichedItems = computed(() => {
    const o = this.order();
    if (!o) return [];
    const enr = this.enrichment();
    return o.items.map((item) => {
      const key = this.itemKey(item);
      const e = enr[key];
      return {
        key,
        item,
        imageUrl: item.imageUrl || e?.imageUrl,
        sizeLabel: e?.sizeLabel,
        dimensionsText: e?.dimensionsText,
      };
    });
  });

  // --- Lifecycle
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
    this.restorePicking(id);
    this.restoreWorkflow(id);
    await this.hydrateEnrichment(); // images/dimensions/tailles manquantes
  }

  private async load(id: string) {
    this.loading.set(true);
    try {
      const o = await this.orders.getById(id);
      this.order.set(o);
      this.notes = o.notes ?? '';
    } catch (e) {
      console.error(e);
      this.toast.error('Impossible de charger la commande');
      this.order.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private async hydrateEnrichment(): Promise<void> {
    const o = this.order();
    if (!o) return;

    const map: Record<string, ItemEnrichment> = {};
    await Promise.all(
      o.items.map(async (it) => {
        const key = this.itemKey(it);
        const out: ItemEnrichment = {};

        // Si l'image manque côté OrderItem, on tente depuis le catalogue
        if (!it.imageUrl) {
          const product = await this.products.getProductById(it.productId);
          if (product?.imageUrl) out.imageUrl = product.imageUrl;
        }

        // Taille + dimensions (si variante trouvée)
        if (typeof it.variantId === 'number') {
          const v = await this.products.getVariantById(it.productId, it.variantId);
          if (v?.imageUrl && !out.imageUrl) out.imageUrl = v.imageUrl;
          if (v) {
            out.sizeLabel = v.size;
            if (v.dimensions?.width && v.dimensions?.height) {
              const unit = v.dimensions.unit ?? 'cm';
              out.dimensionsText = `${v.dimensions.width} × ${v.dimensions.height} ${unit}`;
            }
          }
        }

        // Si le produit sans variante a des dimensions
        if (!out.dimensionsText) {
          const product = await this.products.getProductById(it.productId);
          const d = product?.dimensions;
          if (d?.width && d?.height) {
            out.dimensionsText = `${d.width} × ${d.height} ${d.unit ?? 'cm'}`;
          }
        }

        map[key] = out;
      })
    );

    this.enrichment.set(map);
  }

  // --- Picking helpers
  itemKey(it: OrderItem): string {
    return `${it.productId}:${it.variantId ?? '-'}`;
  }

  pickingKey(orderId: string): string {
    return `order_picking_${orderId}`;
  }

  workflowKey(orderId: string): string {
    return `order_workflow_${orderId}`;
  }

  pickedQty(key: string): number {
    return this.picking().items[key] ?? 0;
  }

  setPicked(it: OrderItem, qty: number): void {
    const key = this.itemKey(it);
    const next: PickingState = { items: { ...this.picking().items, [key]: qty } };
    this.picking.set(next);
  }

  inc(it: OrderItem): void {
    const key = this.itemKey(it);
    const current = this.pickedQty(key);
    if (current < it.qty) this.setPicked(it, current + 1);
  }

  dec(it: OrderItem): void {
    const key = this.itemKey(it);
    const current = this.pickedQty(key);
    if (current > 0) this.setPicked(it, current - 1);
  }

  pickAll(): void {
    const o = this.order();
    if (!o) return;
    const items: Record<string, number> = {};
    for (const it of o.items) items[this.itemKey(it)] = it.qty;
    this.picking.set({ items });
  }

  resetPicking(): void {
    this.picking.set({ items: {} });
  }

  clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
  }

  // --- Workflow helpers
  toggleWorkflow<K extends keyof WorkflowState>(k: K): void {
    const w = this.workflow();
    this.workflow.set({ ...w, [k]: !w[k] });
  }
  completeWorkflow(): void {
    this.workflow.set({ picking: true, qc: true, packing: true, labeling: true, handover: true });
  }
  resetWorkflow(): void {
    this.workflow.set({
      picking: false,
      qc: false,
      packing: false,
      labeling: false,
      handover: false,
    });
  }

  // --- Status
  isReached(step: StepKey): boolean {
    const s = this.order()?.status;
    if (!s) return false;
    const order: StepKey[] = ['pending', 'processing', 'accepted', 'delivered'];
    if (s === 'refused') return step === 'refused';
    return order.indexOf(step) <= order.indexOf(s as StepKey);
  }

  async setStatus(s: OrderStatus) {
    const o = this.order();
    if (!o) return;
    try {
      const updated = await this.orders.updateStatus(o.id, s);
      this.order.set(updated);
      this.toast.success(`Statut mis à jour en ${this.label(updated.status)}`);
    } catch {
      this.toast.error('Mise à jour du statut impossible');
    }
  }

  async changeStatus(raw: string) {
    await this.setStatus(raw as OrderStatus);
  }

  // --- Notes
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

  // --- Delete
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

  // --- Printing
  printPickingSlip() {
    const area = document.getElementById('print-slip');
    if (!area) return;

    const styles = `
      <style>
      * { font-family: system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; }
      h2 { margin: 0 0 4px; }
      h3 { margin: 12px 0 6px; }
      table { font-size: 12px; }
      @media print { @page { margin: 16mm; } }
      </style>`;

    const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!w) return;
    w.document.open();
    w.document.write(
      `<html><head><title>Bon de préparation</title>${styles}</head><body>${area.innerHTML}</body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  // --- Utils
  mapsLink(): string {
    const a = this.order()!.customer.address;
    const q = encodeURIComponent(`${a.street}, ${a.zip} ${a.city}, ${a.country}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  label(s: OrderStatus): string {
    switch (s) {
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En préparation';
      case 'accepted':
        return 'Acceptée';
      case 'refused':
        return 'Refusée';
      case 'delivered':
        return 'Livrée';
    }
  }

  paymentMethodLabel(m: Order['payment']['method']): string {
    switch (m) {
      case 'card':
        return 'Carte';
      case 'paypal':
        return 'PayPal';
      case 'bank':
        return 'Virement';
    }
  }

  paymentBrandIcon(brand?: PaymentBrand): string {
    switch (brand) {
      case 'visa':
        return 'fa-cc-visa';
      case 'mastercard':
        return 'fa-cc-mastercard';
      case 'amex':
        return 'fa-cc-amex';
      case 'paypal':
        return 'fa-cc-paypal';
      default:
        return 'fa-credit-card';
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private restorePicking(orderId: string) {
    try {
      const saved = localStorage.getItem(this.pickingKey(orderId));
      if (saved) {
        const parsed = JSON.parse(saved) as PickingState;
        // clamp par sécurité
        const o = this.order();
        if (o) {
          const items: Record<string, number> = {};
          for (const it of o.items) {
            const k = this.itemKey(it);
            const v = Math.min(it.qty, Math.max(0, parsed.items[k] ?? 0));
            items[k] = v;
          }
          this.picking.set({ items });
        } else {
          this.picking.set(parsed);
        }
      }
    } catch {
      /* noop */
    }
  }

  private restoreWorkflow(orderId: string) {
    try {
      const saved = localStorage.getItem(this.workflowKey(orderId));
      if (saved) {
        const parsed = JSON.parse(saved) as WorkflowState;
        this.workflow.set({
          picking: !!parsed.picking,
          qc: !!parsed.qc,
          packing: !!parsed.packing,
          labeling: !!parsed.labeling,
          handover: !!parsed.handover,
        });
      }
    } catch {
      /* noop */
    }
  }
}
