// src/app/features/admin/pages/user-details.page.ts
import { Component, inject, OnInit, signal, computed, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/services/auth';
import { User, UserRole } from '../../auth/models/user.model';
import {
  UserActivity,
  ActivityType,
  Order as AdminOrder,
  OrderStatus as AdminOrderStatus,
  UserFavorite,
  UserExtended,
  ProductActivityMetadata,
  OrderActivityMetadata,
  LoginActivityMetadata,
} from '../../auth/models/user-activity.model';

import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { PricePipe } from '../../../shared/pipes/price.pipe';
// Services métiers
import { OrderService } from '../../../features/orders/services/order';
import { ProductService } from '../../../features/catalog/services/product';
import type { Product } from '../../../features/catalog/models/product.model';

// === Fidélité ===
import { FidelityStore } from '../../fidelity/services/fidelity-store';
import type {
  FidelityLedgerEntry,
  FidelityReward,
  FidelitySettings,
} from '../../fidelity/models/fidelity.models';

// === Abonnements ===
import { SubscriptionService } from '../../subscriptions/services/subscription.service';
import { SubscriptionStore } from '../../subscriptions/services/subscription-store';
import type {
  UserSubscription,
  SubscriptionPlan,
} from '../../subscriptions/models/subscription.model';

/* ===========================
   ==   Types & Contracts   ==
   =========================== */

// Service catalogue amélioré
export interface ProductServiceLike {
  getByIds?(ids: number[]): Promise<Product[]>;
  getAll?(): Promise<Product[]>;
  getProductById?(id: number): Promise<Product | null>;
}

export const PRODUCT_SERVICE = new InjectionToken<ProductServiceLike>('PRODUCT_SERVICE');
export type UnifiedStatus = 'pending' | 'processing' | 'accepted' | 'refused' | 'delivered';

// Favoris bruts dans localStorage
interface RawFavoriteItem {
  productId: number;
  addedAt: string; // ISO
}

// Favoris enrichis avec infos produit
interface EnrichedUserFavorite extends UserFavorite {
  product?: Product;
}

// Structures renvoyées par OrderService (seed/persistées)
interface StoreAddress {
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  postalCode?: string;
}

interface StoreCustomer {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: StoreAddress;
}

interface StorePayment {
  method?: string;
  last4?: string;
  brand?: string;
}

interface StoreOrderItem {
  id?: string;
  productId: number;
  title?: string;
  productName?: string;
  productImage?: string;
  qty?: number;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
  sku?: string;
}

interface StoreOrder {
  id: string;
  userId: number;
  createdAt: string;
  updatedAt?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  notes?: string;
  items: StoreOrderItem[];
  subtotal?: number;
  taxes?: number;
  shipping?: number;
  total: number;
  status: string;
  customer?: StoreCustomer;
  payment?: StorePayment;
  shippingAddress?: StoreAddress;
  billingAddress?: StoreAddress;
}

/* ===========================
   ==     Composant Page    ==
   =========================== */

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PricePipe],
  providers: [{ provide: PRODUCT_SERVICE, useExisting: ProductService }],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div class="container-wide py-6">
          <div class="flex items-start md:items-center justify-between gap-4">
            <div class="min-w-0">
              <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a>
                <span>•</span>
                <a routerLink="/admin/users" class="hover:text-gray-700">Utilisateurs</a>
                <span>•</span>
                <span class="text-gray-900">{{ user()?.firstName }} {{ user()?.lastName }}</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Détails de l'utilisateur</h1>
              @if (userExtended()?.suspendedAt) {
              <div
                class="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
              >
                <i class="fa-solid fa-ban mr-2"></i>
                Compte suspendu
              </div>
              }
            </div>

            <!-- Ligne boutons contexte (desktop) -->
            <div class="hidden md:flex items-center gap-2">
              <button
                (click)="refreshData()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <i class="fa-solid fa-arrows-rotate text-sm"></i>
                Actualiser
              </button>
              <button
                routerLink="/admin/users"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <i class="fa-solid fa-arrow-left text-sm"></i>
                Retour à la liste
              </button>
            </div>

            <!-- Actions (mobile) : juste refresh / back -->
            <div class="md:hidden flex items-center gap-2">
              <button
                (click)="refreshData()"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <i class="fa-solid fa-arrows-rotate text-sm"></i>
              </button>
              <button
                routerLink="/admin/users"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <i class="fa-solid fa-arrow-left text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
      <div class="container-wide">
        <div class="bg-white rounded-xl shadow-sm p-8">
          <div class="animate-pulse space-y-6">
            <div class="h-32 bg-gray-200 rounded"></div>
            <div class="space-y-4">
              <div class="h-4 bg-gray-200 rounded w-1/2"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
      } @else if (user()) {
      <div class="container-wide space-y-8">
        <!-- Profil utilisateur -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Informations personnelles</h2>
            <div class="flex items-center gap-2">
              @if (user()!.role !== 'admin' || canModifyAdmin()) {
              <button
                (click)="toggleUserRole()"
                class="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors"
              >
                <i
                  class="fa-solid"
                  [ngClass]="user()!.role === 'admin' ? 'fa-arrow-down' : 'fa-arrow-up'"
                ></i>
                {{ user()!.role === 'admin' ? 'Rétrograder' : 'Promouvoir' }}
              </button>
              } @if (user()!.role !== 'admin' || canDeleteAdmin()) {
              <button
                (click)="deleteUser()"
                class="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                <i class="fa-solid fa-trash"></i>
                Supprimer
              </button>
              }
            </div>
          </div>

          <div class="p-6">
            <div class="flex items-center gap-6 mb-6">
              <div
                class="w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-2xl"
                [ngClass]="getAvatarClass()"
              >
                {{ getInitials() }}
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">
                  {{ user()!.firstName }} {{ user()!.lastName }}
                </h3>
                <p class="text-gray-600">{{ user()!.email }}</p>
                <div class="mt-2 flex items-center gap-2">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    [ngClass]="getRoleBadgeClass()"
                  >
                    <i
                      class="fa-solid mr-2"
                      [ngClass]="user()!.role === 'admin' ? 'fa-shield-halved' : 'fa-user'"
                    ></i>
                    {{ user()!.role === 'admin' ? 'Administrateur' : 'Utilisateur' }}
                  </span>
                  @if (userExtended()?.isActive === false) {
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                  >
                    <i class="fa-solid fa-ban mr-2"></i>
                    Suspendu
                  </span>
                  } @else {
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    <i class="fa-solid fa-check mr-2"></i>
                    Actif
                  </span>
                  }
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">ID Utilisateur</span>
                  <p class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {{ user()!.id }}
                  </p>
                </div>

                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">Email</span>
                  <p class="text-sm text-gray-900">{{ user()!.email }}</p>
                </div>

                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">Téléphone</span>
                  <p class="text-sm text-gray-900">{{ user()!.phone || 'Non renseigné' }}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1"
                    >Date d'inscription</span
                  >
                  <p class="text-sm text-gray-900">{{ formatDate(user()!.createdAt) }}</p>
                  <p class="text-xs text-gray-500">{{ getRegistrationLabel() }}</p>
                </div>

                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1"
                    >Dernière mise à jour</span
                  >
                  <p class="text-sm text-gray-900">{{ formatDate(user()!.updatedAt) }}</p>
                </div>

                @if (userExtended()?.suspendedAt) {
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">Suspendu le</span>
                  <p class="text-sm text-red-600">{{ formatDate(userExtended()!.suspendedAt!) }}</p>
                  @if (userExtended()?.suspensionReason) {
                  <p class="text-xs text-gray-500 mt-1">{{ userExtended()!.suspensionReason }}</p>
                  }
                </div>
                }
              </div>
            </div>

            <!-- Actions rapides -->
            <div class="mt-8 pt-6 border-t border-gray-200">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-900">Actions rapides</h3>
                <button
                  class="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  (click)="showQuickActions = !showQuickActions"
                >
                  <i class="fa-solid fa-bolt"></i>
                  Actions
                </button>
              </div>

              <!-- Desktop -->
              <div
                class="hidden md:flex flex-wrap items-center gap-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-3"
              >
                <!-- Réinitialiser MDP -->
                <button
                  (click)="sendResetPasswordEmail()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-60"
                  [class.bg-blue-600]="!loadingActions().resetPassword"
                  [class.hover:bg-blue-700]="!loadingActions().resetPassword"
                  [class.focus:ring-blue-500]="!loadingActions().resetPassword"
                  [disabled]="loadingActions().resetPassword"
                  title="Réinitialiser le mot de passe"
                >
                  <i
                    class="fa-solid"
                    [ngClass]="loadingActions().resetPassword ? 'fa-spinner fa-spin' : 'fa-key'"
                  ></i>
                  <span class="font-medium">Réinit. MDP</span>
                </button>

                <!-- Suspendre / Réactiver -->
                <button
                  (click)="toggleSuspension()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-60"
                  [ngClass]="
                    userExtended()?.isActive === false
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                  "
                  [disabled]="loadingActions().suspension"
                  [title]="userExtended()?.isActive === false ? 'Réactiver' : 'Suspendre'"
                >
                  <i
                    class="fa-solid"
                    [ngClass]="
                      loadingActions().suspension
                        ? 'fa-spinner fa-spin'
                        : userExtended()?.isActive === false
                        ? 'fa-play'
                        : 'fa-pause'
                    "
                  ></i>
                  <span class="font-medium">
                    {{ userExtended()?.isActive === false ? 'Réactiver' : 'Suspendre' }}
                  </span>
                </button>

                <!-- Promouvoir / Rétrograder -->
                <button
                  *ngIf="user()!.role !== 'admin' || canModifyAdmin()"
                  (click)="toggleUserRole()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-sm transition-all focus:outline-none focus:ring-2"
                  [ngClass]="
                    user()!.role === 'admin'
                      ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                  "
                  [title]="user()!.role === 'admin' ? 'Rétrograder' : 'Promouvoir'"
                >
                  <i
                    class="fa-solid"
                    [ngClass]="user()!.role === 'admin' ? 'fa-arrow-down' : 'fa-arrow-up'"
                  ></i>
                  <span class="font-medium">
                    {{ user()!.role === 'admin' ? 'Rétrograder' : 'Promouvoir' }}
                  </span>
                </button>

                <!-- Supprimer -->
                <button
                  *ngIf="user()!.role !== 'admin' || canDeleteAdmin()"
                  (click)="deleteUser()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Supprimer l'utilisateur"
                >
                  <i class="fa-solid fa-trash"></i>
                  <span class="font-medium">Supprimer</span>
                </button>
              </div>

              <!-- Mobile -->
              <div *ngIf="showQuickActions" class="md:hidden mt-2 w-full">
                <div class="grid grid-cols-2 gap-2">
                  <button
                    (click)="sendResetPasswordEmail()"
                    class="px-3 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                  >
                    Réinit. MDP
                  </button>
                  <button
                    (click)="toggleSuspension()"
                    class="px-3 py-2 rounded-lg text-white shadow-sm"
                    [ngClass]="
                      userExtended()?.isActive === false
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    "
                  >
                    {{ userExtended()?.isActive === false ? 'Réactiver' : 'Suspendre' }}
                  </button>
                  <button
                    *ngIf="user()!.role !== 'admin' || canModifyAdmin()"
                    (click)="toggleUserRole()"
                    class="px-3 py-2 rounded-lg text-white shadow-sm"
                    [ngClass]="
                      user()!.role === 'admin'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    "
                  >
                    {{ user()!.role === 'admin' ? 'Rétrograder' : 'Promouvoir' }}
                  </button>
                  <button
                    *ngIf="user()!.role !== 'admin' || canDeleteAdmin()"
                    (click)="deleteUser()"
                    class="px-3 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 shadow-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
            <!-- /Actions rapides -->
          </div>

          <!-- Adresse -->
          @if (user()!.addresses?.length) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Adresse</h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">Adresse</span>
                  <p class="text-sm text-gray-900">{{ user()!.addresses![0]!.street }}</p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">Ville</span>
                  <p class="text-sm text-gray-900">{{ user()!.addresses![0]!.city }}</p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">Code postal</span>
                  <p class="text-sm text-gray-900">{{ user()!.addresses![0].postalCode }}</p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">Pays</span>
                  <p class="text-sm text-gray-900">{{ user()!.addresses![0].country }}</p>
                </div>
              </div>
            </div>
          </div>
          }

          <!-- Statistiques rapides -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-shopping-cart text-blue-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-gray-900">{{ orders().length }}</p>
                  <p class="text-sm text-gray-600">Commandes</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-heart text-pink-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-gray-900">{{ favorites().length }}</p>
                  <p class="text-sm text-gray-600">Favoris</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-euro-sign text-green-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-gray-900">
                    {{
                      getTotalSpent()
                        | price : { currency: 'EUR', locale: 'fr-FR', minFrac: 0, maxFrac: 0 }
                    }}
                  </p>
                  <p class="text-sm text-gray-600">Total dépensé</p>
                </div>
              </div>
            </div>

            <!-- KPI Fidélité -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-star text-purple-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-gray-900">{{ fidelityPoints() }}</p>
                  <p class="text-sm text-gray-600">Points fidélité</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ====== SECTION ABONNEMENT ====== -->
          @if (userSubscription(); as sub) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">Abonnement</h2>
              <span [class]="subscriptionStatusBadge(sub.status)">
                {{ subscriptionStatusLabel(sub.status) }}
              </span>
            </div>

            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-3">
                  <div>
                    <span class="block text-sm font-medium text-gray-700 mb-1">Plan actuel</span>
                    <p class="text-lg font-bold text-purple-600">
                      {{ subscriptionPlan()?.name || 'N/A' }}
                    </p>
                    <p class="text-sm text-gray-600 mt-1">
                      {{ subscriptionPlan()?.description || '' }}
                    </p>
                  </div>

                  <div>
                    <span class="block text-sm font-medium text-gray-700 mb-1">Formule</span>
                    <p class="text-sm text-gray-900">
                      {{ sub.term === 'monthly' ? 'Mensuelle' : 'Annuelle' }}
                    </p>
                  </div>

                  <div>
                    <span class="block text-sm font-medium text-gray-700 mb-1"
                      >Multiplicateur fidélité</span
                    >
                    <p class="text-sm font-bold text-purple-600">×{{ sub.appliedMultiplier }}</p>
                  </div>
                </div>

                <div class="space-y-3">
                  <div>
                    <span class="block text-sm font-medium text-gray-700 mb-1"
                      >Période actuelle</span
                    >
                    <p class="text-sm text-gray-900">
                      {{ formatSubscriptionDate(sub.currentPeriodStart) }} →
                      {{ formatSubscriptionDate(sub.currentPeriodEnd) }}
                    </p>
                  </div>

                  <div>
                    <span class="block text-sm font-medium text-gray-700 mb-1"
                      >Prochain renouvellement</span
                    >
                    <p class="text-sm text-gray-900">
                      {{ formatSubscriptionDate(sub.currentPeriodEnd) }}
                    </p>
                  </div>

                  <div>
                    <span class="block text-sm font-medium text-gray-700 mb-1"
                      >Renouvellement auto</span
                    >
                    <p class="text-sm text-gray-900">
                      <span *ngIf="sub.autoRenew" class="text-green-600">
                        <i class="fa-solid fa-check mr-1"></i>Activé
                      </span>
                      <span *ngIf="!sub.autoRenew" class="text-red-600">
                        <i class="fa-solid fa-times mr-1"></i>Désactivé
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- Actions admin -->
              <div class="flex gap-3 pt-4 border-t border-gray-200">
                @if (sub.status === 'active') {
                <button
                  (click)="openChangePlanModal()"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <i class="fa-solid fa-repeat"></i>
                  Changer de plan
                </button>
                } @if (sub.status !== 'canceled') {
                <button
                  (click)="cancelSubscriptionAsAdmin()"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <i class="fa-solid fa-xmark"></i>
                  Annuler l'abonnement
                </button>
                }
              </div>
            </div>
          </div>
          }

          <!-- ====== SECTION FIDÉLITÉ ====== -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">Fidélité</h2>
              <div class="text-sm text-gray-500">
                Barème: {{ fidelitySettings().ratePerEuro }} pts/€
                <span *ngIf="!fidelitySettings().enabled" class="ml-2 text-red-600 font-medium">
                  (désactivé)
                </span>
              </div>
            </div>

            <div class="p-6 space-y-6">
              <!-- Solde + progression vers prochaine récompense -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="col-span-1">
                  <div class="rounded-xl border border-purple-200 bg-purple-50 p-4">
                    <div class="text-sm text-purple-800">Solde actuel</div>
                    <div class="mt-1 text-3xl font-extrabold text-purple-900">
                      {{ fidelityPoints() }} pts
                    </div>
                    <div class="mt-2 text-xs text-purple-800/80" *ngIf="appliedReward()">
                      Récompense appliquée au panier :
                      <span class="font-medium">{{ appliedReward()!.label }}</span>
                    </div>
                  </div>
                </div>

                <div class="col-span-1 md:col-span-2">
                  <div class="rounded-xl border border-gray-200 p-4">
                    <div class="flex items-center justify-between text-sm text-gray-700">
                      <span>
                        Prochaine récompense :
                        <span *ngIf="nextReward(); else noneReward" class="font-medium">
                          {{ nextReward()!.label }} ({{ nextReward()!.pointsRequired }} pts)
                        </span>
                        <ng-template #noneReward>
                          <span class="font-medium">—</span>
                        </ng-template>
                      </span>
                      <span *ngIf="nextReward()" class="text-gray-600">
                        Manque {{ pointsToNext() }} pts
                      </span>
                    </div>
                    <div class="mt-3 h-2 w-full rounded bg-gray-100 overflow-hidden">
                      <div
                        class="h-2 bg-purple-500"
                        [style.width.%]="progressToNext()"
                        aria-label="Progression vers la prochaine récompense"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Récompenses débloquées -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 mb-3">Récompenses débloquées</h3>
                <div class="flex flex-wrap gap-2" *ngIf="unlockedRewards().length; else noRewards">
                  <span
                    *ngFor="let r of unlockedRewards(); trackBy: trackReward"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                    [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border-emerald-200': r.isActive,
                      'bg-gray-50 text-gray-500 border-gray-200': !r.isActive
                    }"
                    title="{{ r.description }}"
                    >{{ r.label }} • {{ r.pointsRequired }} pts</span
                  >
                </div>
                <ng-template #noRewards>
                  <p class="text-sm text-gray-500">Aucune récompense débloquée pour l’instant.</p>
                </ng-template>
              </div>

              <!-- Historique des points -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 mb-3">Historique des points</h3>
                <div class="overflow-x-auto rounded-lg border border-gray-200">
                  <table class="min-w-full text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                      <tr>
                        <th class="text-left px-4 py-2">Date</th>
                        <th class="text-left px-4 py-2">Type</th>
                        <th class="text-right px-4 py-2">Points</th>
                        <th class="text-left px-4 py-2">Note</th>
                        <th class="text-left px-4 py-2">Commande</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        *ngFor="let e of fidelityLedger(); trackBy: trackLedger"
                        class="odd:bg-white even:bg-gray-50"
                      >
                        <td class="px-4 py-2 whitespace-nowrap">
                          {{ formatDateTime(e.createdAt) }}
                        </td>
                        <td class="px-4 py-2">
                          <span
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            [ngClass]="ledgerTypeBadgeClass(e.type)"
                          >
                            {{ ledgerTypeLabel(e.type) }}
                          </span>
                        </td>
                        <td
                          class="px-4 py-2 text-right font-semibold"
                          [ngClass]="{
                            'text-emerald-700': e.points > 0,
                            'text-rose-700': e.points < 0
                          }"
                        >
                          {{ e.points > 0 ? '+' : '' }}{{ e.points }}
                        </td>
                        <td class="px-4 py-2">{{ e.note || '—' }}</td>
                        <td class="px-4 py-2">
                          <a
                            *ngIf="orderIdFromLedger(e) as oid"
                            [routerLink]="['/admin/orders', oid]"
                            class="text-blue-600 hover:underline"
                            >{{ oid }}</a
                          >
                          <span *ngIf="!orderIdFromLedger(e)" class="text-gray-400">—</span>
                        </td>
                      </tr>
                      <tr *ngIf="!fidelityLedger().length">
                        <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                          Aucun mouvement de points.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <!-- ====== /SECTION FIDÉLITÉ ====== -->

          <!-- Activité récente -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">Activité récente</h2>
              <button (click)="loadActivities()" class="text-blue-600 hover:text-blue-800 text-sm">
                <i class="fa-solid fa-arrows-rotate mr-1"></i>
                Actualiser
              </button>
            </div>
            <div class="p-6">
              @if (loadingActivities()) {
              <div class="space-y-4">
                @for (i of [1,2,3]; track i) {
                <div class="flex items-start gap-4 animate-pulse">
                  <div class="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                }
              </div>
              } @else if (activities().length > 0) {
              <div class="space-y-4">
                @for (activity of activities(); track activity.id) {
                <div
                  class="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
                    [ngClass]="getActivityIconClass(activity.type)"
                  >
                    <i class="fa-solid" [ngClass]="getActivityIcon(activity.type)"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">{{ activity.action }}</p>
                    <p class="text-sm text-gray-600">{{ activity.details }}</p>
                    <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{{ formatDateTime(activity.timestamp) }}</span>
                      @if (activity.ipAddress) {
                      <span>IP: {{ activity.ipAddress }}</span>
                      } @if (activity.metadata && isOrderActivity(activity) &&
                      getOrderFromActivity(activity)) {
                      <span class="text-blue-600"
                        >Commande: {{ getOrderFromActivity(activity)?.id }}</span
                      >
                      } @if (activity.metadata && isProductActivity(activity) &&
                      getProductFromActivity(activity)) {
                      <span class="text-green-600">{{
                        getProductFromActivity(activity)?.title
                      }}</span>
                      }
                    </div>
                  </div>
                  @if (activity.metadata && isProductActivity(activity) &&
                  getProductFromActivity(activity)) {
                  <div class="flex-shrink-0">
                    <img
                      [src]="getProductFromActivity(activity)?.imageUrl"
                      [alt]="getProductFromActivity(activity)?.title"
                      class="w-12 h-12 rounded-lg object-cover"
                      onerror="this.style.display='none'"
                    />
                  </div>
                  }
                </div>
                }
              </div>
              } @else {
              <div class="text-center py-12">
                <i class="fa-solid fa-clock text-3xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">Aucune activité récente</p>
                <p class="text-sm text-gray-400 mt-1">
                  Les activités de l'utilisateur apparaîtront ici
                </p>
              </div>
              }
            </div>
          </div>

          <!-- Commandes -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">Commandes récentes</h2>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500">{{ orders().length }} commandes</span>
                <button (click)="loadOrders()" class="text-blue-600 hover:text-blue-800 text-sm">
                  <i class="fa-solid fa-arrows-rotate mr-1"></i>
                  Actualiser
                </button>
              </div>
            </div>
            <div class="p-6">
              @if (loadingOrders()) {
              <div class="space-y-4">
                @for (i of [1,2,3]; track i) {
                <div class="border rounded-lg p-4 animate-pulse">
                  <div class="flex items-center justify-between mb-3">
                    <div class="h-4 bg-gray-200 rounded w-32"></div>
                    <div class="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                }
              </div>
              } @else if (orders().length > 0) {
              <div class="space-y-4">
                @for (order of orders(); track order.id) {
                <div class="border rounded-lg p-4 hover:border-blue-200 transition-colors">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900">{{ order.id }}</span>
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        [ngClass]="statusBadgeClassUnified(order.status)"
                      >
                        {{ statusLabelUnified(order.status) }}
                      </span>
                    </div>
                    <span class="text-lg font-bold text-gray-900">
                      {{
                        order.total
                          | price : { currency: 'EUR', locale: 'fr-FR', minFrac: 2, maxFrac: 2 }
                      }}
                    </span>
                  </div>

                  <div class="space-y-2 mb-3">
                    @for (item of order.items; track item.id) {
                    <div class="flex items-center gap-3 text-sm">
                      @if (item.productImage) {
                      <img
                        [src]="item.productImage"
                        [alt]="item.productName"
                        class="w-10 h-10 rounded object-cover"
                      />
                      }
                      <span class="flex-1">
                        {{ item.productName }}
                        <span class="text-gray-500">×{{ item.quantity }}</span>
                      </span>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 mr-2"
                        title="Prix unitaire"
                      >
                        {{
                          item.unitPrice
                            | price : { currency: 'EUR', locale: 'fr-FR', minFrac: 2, maxFrac: 2 }
                        }}
                      </span>
                      <span class="font-medium text-gray-900">
                        {{
                          item.totalPrice
                            | price : { currency: 'EUR', locale: 'fr-FR', minFrac: 2, maxFrac: 2 }
                        }}
                      </span>
                    </div>
                    }
                  </div>

                  <!-- Points liés à la commande (earn/use détectés) -->
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <ng-container *ngFor="let l of ledgerForOrder(order); trackBy: trackLedger">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-800': l.points > 0,
                          'bg-rose-100 text-rose-800': l.points < 0
                        }"
                        [title]="l.note || ''"
                      >
                        <i
                          class="fa-solid mr-1"
                          [ngClass]="l.points > 0 ? 'fa-circle-plus' : 'fa-circle-minus'"
                          aria-hidden="true"
                        ></i>
                        {{ l.points > 0 ? '+' : '' }}{{ l.points }} pts
                      </span>
                    </ng-container>
                    <span *ngIf="ledgerForOrder(order).length === 0" class="text-xs text-gray-400"
                      >Aucun mouvement lié</span
                    >
                  </div>

                  <div class="flex items-center justify-between text-sm text-gray-500">
                    <span>{{ formatDate(order.createdAt) }}</span>
                    @if (order.trackingNumber) {
                    <span class="font-mono">{{ order.trackingNumber }}</span>
                    }
                    <a
                      [routerLink]="['/admin/orders', order.id]"
                      class="text-blue-600 hover:underline"
                      >Voir la commande</a
                    >
                  </div>
                </div>
                }
              </div>
              } @else {
              <div class="text-center py-12">
                <i class="fa-solid fa-bag-shopping text-3xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">Aucune commande</p>
                <p class="text-sm text-gray-400 mt-1">
                  L'utilisateur n'a pas encore passé de commande
                </p>
              </div>
              }
            </div>
          </div>
        </div>
      </div>
      } @else {
      <div class="container-wide">
        <div class="bg-white rounded-xl shadow-sm p-8 text-center">
          <i class="fa-solid fa-user-slash text-4xl text-gray-400 mb-4"></i>
          <p class="text-lg font-medium text-gray-900 mb-2">Utilisateur introuvable</p>
          <p class="text-gray-500 mb-6">L'utilisateur demandé n'existe pas ou a été supprimé.</p>
          <button
            routerLink="/admin/users"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <i class="fa-solid fa-arrow-left"></i>
            Retour à la liste
          </button>
        </div>
      </div>
      }

      <!-- Modal de suspension -->
      @if (showSuspensionModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              {{
                userExtended()?.isActive === false ? 'Réactiver le compte' : 'Suspendre le compte'
              }}
            </h3>
          </div>
          <div class="p-6">
            @if (userExtended()?.isActive !== false) {
            <div class="mb-4">
              <label for="suspensionReason" class="block text-sm font-medium text-gray-700 mb-2">
                Raison de la suspension (optionnel)
              </label>
              <textarea
                id="suspensionReason"
                [(ngModel)]="suspensionReason"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Expliquez pourquoi ce compte est suspendu..."
              ></textarea>
            </div>
            }
            <p class="text-sm text-gray-600 mb-6">
              @if (userExtended()?.isActive === false) { Le compte de {{ user()?.firstName }}
              {{ user()?.lastName }} sera réactivé et l'utilisateur pourra se reconnecter. } @else {
              Le compte de {{ user()?.firstName }} {{ user()?.lastName }} sera suspendu.
              L'utilisateur ne pourra plus se connecter jusqu'à la réactivation. }
            </p>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              (click)="showSuspensionModal.set(false)"
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              (click)="confirmSuspension()"
              class="px-4 py-2 text-white rounded-lg transition-colors"
              [ngClass]="
                userExtended()?.isActive === false
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              "
              [disabled]="loadingActions().suspension"
            >
              @if (loadingActions().suspension) {
              <i class="fa-solid fa-spinner fa-spin mr-2"></i>
              }
              {{ userExtended()?.isActive === false ? 'Réactiver' : 'Suspendre' }}
            </button>
          </div>
        </div>
      </div>
      }

      <!-- Modal changement de plan -->
      @if (showChangePlanModal()) {
      <!-- Overlay cliquable + accessible -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        role="button"
        tabindex="0"
        aria-label="Fermer la modale de changement de plan"
        (click)="closeChangePlanModal()"
        (keyup.enter)="closeChangePlanModal()"
        (keyup.space)="closeChangePlanModal()"
      >
        <!-- Conteneur de la modale -->
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="changePlanTitle"
          tabindex="0"
          (click)="$event.stopPropagation()"
          (keyup.enter)="$event.stopPropagation()"
          (keyup.space)="$event.stopPropagation()"
        >
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 id="changePlanTitle" class="text-xl font-bold text-gray-900">
                Changer le plan d'abonnement
              </h2>
              <button
                type="button"
                class="text-gray-400 hover:text-gray-600 transition-colors"
                (click)="closeChangePlanModal()"
                (keyup.enter)="closeChangePlanModal()"
                (keyup.space)="closeChangePlanModal()"
                aria-label="Fermer"
              >
                <i class="fa-solid fa-times text-xl"></i>
              </button>
            </div>
          </div>

          <div class="p-6">
            <div class="mb-4">
              <span class="block text-sm font-medium text-gray-700 mb-2">
                Nouveau plan pour {{ user()?.firstName }} {{ user()?.lastName }}
              </span>
              <select
                [(ngModel)]="selectedNewPlanId"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option [ngValue]="null">Sélectionnez un plan</option>
                @for (plan of subscriptionStore.publicPlans(); track plan.id) {
                <option [ngValue]="plan.id">
                  {{ plan.name }} -
                  {{
                    (userSubscription()?.term === 'monthly' ? plan.monthlyPrice : plan.annualPrice)
                      | price
                  }}
                </option>
                }
              </select>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p class="text-sm text-blue-800">
                <i class="fa-solid fa-info-circle mr-2"></i>
                Le changement de plan prendra effet au prochain renouvellement.
              </p>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              (click)="closeChangePlanModal()"
              class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              (click)="confirmPlanChange()"
              [disabled]="!selectedNewPlanId()"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmer le changement
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class UserDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  private readonly orderService = inject(OrderService);
  private readonly productService = inject(PRODUCT_SERVICE);

  // === Fidélité ===
  private readonly fidelity = inject(FidelityStore);

  // === Abonnements ===
  private readonly subscriptionSvc = inject(SubscriptionService);
  readonly subscriptionStore = inject(SubscriptionStore);

  user = signal<User | null>(null);
  userExtended = computed<UserExtended | null>(() => this.user() as UserExtended | null);
  loading = signal<boolean>(true);
  showQuickActions = false;
  activities = signal<UserActivity[]>([]);
  orders = signal<AdminOrder[]>([]);
  favorites = signal<EnrichedUserFavorite[]>([]);

  loadingActivities = signal<boolean>(false);
  loadingOrders = signal<boolean>(false);
  loadingFavorites = signal<boolean>(false);
  loadingActions = signal<{ resetPassword: boolean; suspension: boolean }>({
    resetPassword: false,
    suspension: false,
  });

  showSuspensionModal = signal<boolean>(false);
  suspensionReason = signal<string>('');

  // Cache des produits pour les activités
  private productsCache = new Map<number, Product>();

  // ==== Signals Abonnement ====
  userSubscription = computed<UserSubscription | null>(() => {
    const u = this.user();
    return u ? this.subscriptionSvc.getActiveForUser(u.id) : null;
  });

  subscriptionPlan = computed<SubscriptionPlan | null>(() => {
    const sub = this.userSubscription();
    if (!sub) return null;
    return this.subscriptionStore.plans().find((p) => p.id === sub.planId) || null;
  });

  showChangePlanModal = signal(false);
  selectedNewPlanId = signal<number | null>(null);

  // ==== Signals Fidélité (dérivés de FidelityStore) ====
  fidelitySettings = computed<FidelitySettings>(() => this.fidelity.settings());
  fidelityPoints = computed<number>(() => {
    const u = this.user();
    return u ? this.fidelity.getPoints(u.id) : 0;
  });
  fidelityLedger = computed<FidelityLedgerEntry[]>(() => {
    const u = this.user();
    return u ? this.fidelity.getLedger(u.id) : [];
  });
  appliedReward = computed<FidelityReward | null>(() => {
    const u = this.user();
    return u ? this.fidelity.getAppliedReward(u.id) : null;
  });
  unlockedRewards = computed<FidelityReward[]>(() => {
    const pts = this.fidelityPoints();
    return this.fidelity
      .rewards()
      .filter((r) => r.isActive && r.pointsRequired <= pts)
      .sort((a, b) => a.pointsRequired - b.pointsRequired);
  });
  nextReward = computed<FidelityReward | null>(() => {
    const pts = this.fidelityPoints();
    const next = this.fidelity
      .rewards()
      .filter((r) => r.isActive && r.pointsRequired > pts)
      .sort((a, b) => a.pointsRequired - b.pointsRequired)[0];
    return next ?? null;
  });
  pointsToNext = computed<number>(() => {
    const n = this.nextReward();
    return n ? Math.max(0, n.pointsRequired - this.fidelityPoints()) : 0;
  });
  progressToNext = computed<number>(() => {
    const n = this.nextReward();
    if (!n) return 100;
    const prev = this.unlockedRewards().length
      ? this.unlockedRewards()[this.unlockedRewards().length - 1].pointsRequired
      : 0;
    const range = Math.max(1, n.pointsRequired - prev);
    return Math.min(100, Math.round(((this.fidelityPoints() - prev) / range) * 100));
  });

  async ngOnInit(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      await this.router.navigate(['/']);
      return;
    }

    const userIdRaw = this.route.snapshot.paramMap.get('id');
    const userId = userIdRaw ? Number(userIdRaw) : NaN;
    if (!userId || Number.isNaN(userId)) {
      await this.router.navigate(['/admin/users']);
      return;
    }

    await this.loadUser(userId);
    await this.loadAllData();
  }

  private async loadUser(userId: number): Promise<void> {
    this.loading.set(true);
    try {
      const user = await this.authService.getUserDetails(userId);
      this.user.set(user);
    } catch (err: unknown) {
      console.error("Erreur lors du chargement de l'utilisateur:", err);
      this.toast.error('Impossible de charger les détails de cet utilisateur');
      this.user.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAllData(): Promise<void> {
    if (!this.user()) return;
    await Promise.all([this.loadActivities(), this.loadOrders(), this.loadFavorites()]);
  }

  async refreshData(): Promise<void> {
    const userId = this.user()?.id;
    if (!userId) return;

    await this.loadUser(userId);
    await this.loadAllData();
    this.toast.success('Données actualisées');
  }

  // === Chargement des favoris depuis localStorage utilisateur ===
  private getUserFavoritesFromStorage(userId: number): RawFavoriteItem[] {
    try {
      const key = `favorites:${userId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return [];

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter((item: unknown): item is RawFavoriteItem => {
        if (typeof item !== 'object' || item === null) return false;
        const r = item as Record<string, unknown>;
        return (
          'productId' in r &&
          'addedAt' in r &&
          typeof r['productId'] === 'number' &&
          typeof r['addedAt'] === 'string'
        );
      });
    } catch (error) {
      console.error('Erreur lors de la lecture des favoris:', error);
      return [];
    }
  }

  async loadFavorites(): Promise<void> {
    const userId = this.user()?.id;
    if (!userId) return;

    this.loadingFavorites.set(true);
    try {
      const rawFavorites = this.getUserFavoritesFromStorage(userId);

      if (rawFavorites.length === 0) {
        this.favorites.set([]);
        return;
      }

      const productIds = rawFavorites.map((f) => f.productId);
      let products: Product[] = [];

      if (this.productService) {
        if (typeof this.productService.getByIds === 'function') {
          products = await this.productService.getByIds(productIds);
        } else if (typeof this.productService.getAll === 'function') {
          const allProducts = await this.productService.getAll();
          products = allProducts.filter((p) => productIds.includes(p.id));
        }
      }

      const enrichedFavorites: EnrichedUserFavorite[] = rawFavorites.map((fav) => {
        const product = products.find((p) => p.id === fav.productId);
        return {
          id: `fav-${userId}-${fav.productId}`,
          userId,
          productId: fav.productId,
          productName: product?.title || `Produit #${fav.productId}`,
          productImage: product?.imageUrl,
          productPrice: product?.originalPrice || 0,
          addedAt: new Date(fav.addedAt),
          isAvailable: product?.isAvailable ?? false,
          product,
        };
      });

      enrichedFavorites.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

      this.favorites.set(enrichedFavorites);
      products.forEach((product) => this.productsCache.set(product.id, product));
    } catch (err) {
      console.error('Erreur lors du chargement des favoris:', err);
      this.toast.error('Impossible de charger les favoris');
    } finally {
      this.loadingFavorites.set(false);
    }
  }

  async loadActivities(): Promise<void> {
    const userId = this.user()?.id;
    if (!userId) return;

    this.loadingActivities.set(true);
    try {
      const baseActivities = await this.authService.getUserActivity(userId);
      const enrichedActivities: UserActivity[] = [];

      for (const activity of baseActivities) {
        let enrichedActivity = { ...activity };

        switch (activity.type) {
          case ActivityType.FAVORITE_ADDED:
          case ActivityType.FAVORITE_REMOVED: {
            const metadata = activity.metadata as { productId?: number } | undefined;
            if (metadata?.productId) {
              let product: Product | null | undefined = this.productsCache.get(metadata.productId);
              if (!product && this.productService?.getProductById) {
                const productResult = await this.productService.getProductById(metadata.productId);
                product = productResult || undefined;
                if (product) this.productsCache.set(product.id, product);
              }
              if (product) {
                const productActivityMetadata: ProductActivityMetadata = {
                  productId: product.id,
                  productName: product.title,
                  productPrice: product.originalPrice,
                  quantity: 1,
                };
                enrichedActivity = {
                  ...activity,
                  details: `${
                    activity.type === ActivityType.FAVORITE_ADDED ? 'Ajout' : 'Suppression'
                  } de "${product.title}" ${
                    activity.type === ActivityType.FAVORITE_ADDED ? 'aux' : 'des'
                  } favoris`,
                  metadata: productActivityMetadata,
                };
              }
            }
            break;
          }
          case ActivityType.ORDER_PLACED:
          case ActivityType.ORDER_CANCELLED: {
            const metadata = activity.metadata as { orderId?: string } | undefined;
            if (metadata?.orderId) {
              const order = this.orders().find((o) => o.id === metadata.orderId);
              if (order) {
                const orderActivityMetadata: OrderActivityMetadata = {
                  orderId: order.id,
                  orderTotal: order.total,
                  newStatus: order.status,
                  previousStatus: AdminOrderStatus.PENDING,
                };
                enrichedActivity = {
                  ...activity,
                  details: `Commande ${order.id} ${
                    activity.type === ActivityType.ORDER_PLACED ? 'passée' : 'annulée'
                  } - ${order.total.toFixed(2)}€`,
                  metadata: orderActivityMetadata,
                };
              }
            }
            break;
          }
        }

        enrichedActivities.push(enrichedActivity);
      }

      await this.generateSyntheticActivities(userId, enrichedActivities);
      enrichedActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      this.activities.set(enrichedActivities);
    } catch (err: unknown) {
      console.error('Erreur lors du chargement des activités:', err);
      this.toast.error("Impossible de charger l'activité utilisateur");
    } finally {
      this.loadingActivities.set(false);
    }
  }

  // Génère des activités synthétiques basées sur les données réelles
  private async generateSyntheticActivities(
    userId: number,
    activities: UserActivity[]
  ): Promise<void> {
    const now = new Date();

    // Favoris → activités fictives si manquantes
    const favorites = this.favorites();
    const existingFavActivities = activities.filter(
      (a) => a.type === ActivityType.FAVORITE_ADDED || a.type === ActivityType.FAVORITE_REMOVED
    );

    for (const favorite of favorites) {
      const hasActivity = existingFavActivities.some((a) => {
        const metadata = a.metadata as { productId?: number } | undefined;
        return metadata?.productId === favorite.productId;
      });

      if (!hasActivity && favorite.product) {
        const productActivityMetadata: ProductActivityMetadata = {
          productId: favorite.productId,
          productName: favorite.product.title,
          productPrice: favorite.product.originalPrice,
          quantity: 1,
        };

        activities.push({
          id: `synthetic-fav-${favorite.productId}-${userId}`,
          userId,
          type: ActivityType.FAVORITE_ADDED,
          action: 'Produit ajouté aux favoris',
          details: `Ajout de "${favorite.product.title}" aux favoris`,
          metadata: productActivityMetadata,
          ipAddress: '127.0.0.1',
          userAgent: 'Web Browser',
          timestamp: favorite.addedAt,
        });
      }
    }

    // Commandes → activités fictives si manquantes
    const orders = this.orders();
    const existingOrderActivities = activities.filter(
      (a) => a.type === ActivityType.ORDER_PLACED || a.type === ActivityType.ORDER_CANCELLED
    );

    for (const order of orders) {
      const hasActivity = existingOrderActivities.some((a) => {
        const metadata = a.metadata as { orderId?: string } | undefined;
        return metadata?.orderId === order.id;
      });

      if (!hasActivity) {
        const orderActivityMetadata: OrderActivityMetadata = {
          orderId: order.id,
          orderTotal: order.total,
          newStatus: order.status,
          previousStatus: AdminOrderStatus.PENDING,
        };

        activities.push({
          id: `synthetic-order-${order.id}-${userId}`,
          userId,
          type: ActivityType.ORDER_PLACED,
          action: 'Commande passée',
          details: `Commande ${order.id} passée - ${order.total.toFixed(2)}€`,
          metadata: orderActivityMetadata,
          ipAddress: '127.0.0.1',
          userAgent: 'Web Browser',
          timestamp: order.createdAt,
        });
      }
    }

    // Connexion récente fictive si rien < 7 jours
    const hasRecentLogin = activities.some(
      (a) =>
        a.type === ActivityType.LOGIN &&
        now.getTime() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (!hasRecentLogin) {
      const loginActivityMetadata: LoginActivityMetadata = { success: true, sessionDuration: 60 };

      activities.push({
        id: `synthetic-login-${userId}`,
        userId,
        type: ActivityType.LOGIN,
        action: 'Connexion',
        details: "Connexion réussie à l'application",
        metadata: loginActivityMetadata,
        ipAddress: '127.0.0.1',
        userAgent: 'Web Browser',
        timestamp: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      });
    }
  }

  // ===== Commandes via OrderService + adaptation typée
  private isStoreOrder(v: unknown): v is StoreOrder {
    if (typeof v !== 'object' || v === null) return false;
    const o = v as Partial<StoreOrder>;
    return (
      typeof o.id === 'string' &&
      typeof o.userId === 'number' &&
      typeof o.createdAt === 'string' &&
      typeof o.status === 'string' &&
      Array.isArray(o.items ?? [])
    );
  }

  async loadOrders(): Promise<void> {
    const userId = this.user()?.id;
    if (!userId) return;

    this.loadingOrders.set(true);
    try {
      const allUnknown: unknown = await this.orderService.getAll();
      const list: StoreOrder[] = Array.isArray(allUnknown)
        ? (allUnknown as unknown[]).filter(this.isStoreOrder.bind(this))
        : [];

      const mine = list.filter((o) => o.userId === userId);
      const mapped: AdminOrder[] = mine.map((o) => this.mapOrderFromStore(o));
      mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.orders.set(mapped);
    } catch (err: unknown) {
      console.error('Erreur lors du chargement des commandes:', err);
      this.toast.error('Impossible de charger les commandes');
    } finally {
      this.loadingOrders.set(false);
    }
  }

  async toggleUserRole(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser) return;

    const newRole: UserRole = currentUser.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
    const actionText =
      newRole === UserRole.ADMIN ? 'promouvoir en administrateur' : 'rétrograder en utilisateur';

    const confirmed = await this.confirm.ask({
      title: `${newRole === UserRole.ADMIN ? 'Promouvoir' : 'Rétrograder'} l'utilisateur`,
      message: `Vous êtes sur le point de ${actionText} ${currentUser.firstName} ${currentUser.lastName}. Cette action prendra effet immédiatement.`,
      confirmText: newRole === UserRole.ADMIN ? 'Promouvoir' : 'Rétrograder',
      cancelText: 'Annuler',
      variant: 'primary',
    });

    if (!confirmed) return;

    try {
      await this.authService.updateUserRole(currentUser.id, newRole);
      await this.loadUser(currentUser.id);
      this.toast.success(
        `${currentUser.firstName} ${currentUser.lastName} a été ${
          newRole === UserRole.ADMIN ? 'promu administrateur' : 'rétrogradé en utilisateur'
        }`
      );
    } catch (err: unknown) {
      console.error('Erreur lors de la modification du rôle:', err);
      this.toast.error('Impossible de modifier le rôle de cet utilisateur');
    }
  }

  async deleteUser(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser) return;

    const confirmed = await this.confirm.ask({
      title: "Supprimer l'utilisateur",
      message: `Cette action supprimera définitivement le compte de ${currentUser.firstName} ${currentUser.lastName}. Toutes ses données seront perdues.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
      requireText: {
        placeholder: 'Tapez "SUPPRIMER" pour confirmer',
        requiredValue: 'SUPPRIMER',
        help: 'Cette action est irréversible',
      },
    });

    if (!confirmed) return;

    try {
      await this.authService.deleteUser(currentUser.id);
      this.toast.success(
        `Le compte de ${currentUser.firstName} ${currentUser.lastName} a été supprimé`
      );
      await this.router.navigate(['/admin/users']);
    } catch (err: unknown) {
      console.error('Erreur lors de la suppression:', err);
      this.toast.error('Impossible de supprimer cet utilisateur');
    }
  }

  async sendResetPasswordEmail(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser) return;

    const confirmed = await this.confirm.ask({
      title: 'Réinitialiser le mot de passe',
      message: `Un email de réinitialisation sera envoyé à ${currentUser.email}. L'utilisateur pourra définir un nouveau mot de passe.`,
      confirmText: "Envoyer l'email",
      cancelText: 'Annuler',
      variant: 'primary',
    });

    if (!confirmed) return;

    this.loadingActions.update((state) => ({ ...state, resetPassword: true }));

    try {
      await this.authService.sendPasswordReset(currentUser.id);
      this.toast.success(`Email de réinitialisation envoyé à ${currentUser.email}`);
      await this.loadActivities();
    } catch (err: unknown) {
      console.error("Erreur lors de l'envoi de l'email:", err);
      this.toast.error("Impossible d'envoyer l'email de réinitialisation");
    } finally {
      this.loadingActions.update((state) => ({ ...state, resetPassword: false }));
    }
  }

  toggleSuspension(): void {
    this.suspensionReason.set('');
    this.showSuspensionModal.set(true);
  }

  async confirmSuspension(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser) return;

    this.loadingActions.update((state) => ({ ...state, suspension: true }));

    try {
      const updatedUser = await this.authService.toggleUserSuspension(
        currentUser.id,
        this.suspensionReason()
      );

      // On accepte la valeur retournée, puis on la recase vers UserExtended pour l'état local
      this.user.set(updatedUser as unknown as UserExtended);
      this.showSuspensionModal.set(false);

      // Éviter 'any' : on détermine l'action via un type structurel précis
      let action: 'réactivé' | 'suspendu' = 'suspendu';
      if (typeof updatedUser === 'object' && updatedUser !== null && 'isActive' in updatedUser) {
        action = (updatedUser as { isActive?: boolean }).isActive ? 'réactivé' : 'suspendu';
      }

      this.toast.success(
        `Le compte de ${currentUser.firstName} ${currentUser.lastName} a été ${action}`
      );

      await this.loadActivities();
    } catch (err: unknown) {
      console.error('Erreur lors de la suspension:', err);
      this.toast.error('Impossible de modifier le statut de ce compte');
    } finally {
      this.loadingActions.update((state) => ({ ...state, suspension: false }));
    }
  }

  // === Helper methods pour les activités enrichies ===

  isProductActivity(activity: UserActivity): boolean {
    return [ActivityType.FAVORITE_ADDED, ActivityType.FAVORITE_REMOVED].includes(activity.type);
  }

  isOrderActivity(activity: UserActivity): boolean {
    return [ActivityType.ORDER_PLACED, ActivityType.ORDER_CANCELLED].includes(activity.type);
  }

  getProductFromActivity(activity: UserActivity): Product | null {
    if (!this.isProductActivity(activity)) return null;
    const metadata = activity.metadata as { productId?: number } | undefined;
    return metadata?.productId ? this.productsCache.get(metadata.productId) || null : null;
  }

  getOrderFromActivity(activity: UserActivity): AdminOrder | null {
    if (!this.isOrderActivity(activity)) return null;
    const metadata = activity.metadata as { orderId?: string } | undefined;
    return metadata?.orderId ? this.orders().find((o) => o.id === metadata.orderId) || null : null;
  }

  viewProduct(product: Product): void {
    window.open(`/catalog/product/${product.id}`, '_blank');
  }

  // === Statistiques ===

  getTotalSpent(): number {
    return this.orders().reduce((sum, order) => sum + order.total, 0);
  }

  // Helpers (UI)
  canModifyAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const targetUser = this.user();
    return currentUser?.id !== targetUser?.id;
  }

  canDeleteAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const targetUser = this.user();
    return currentUser?.id !== targetUser?.id;
  }

  getInitials(): string {
    const currentUser = this.user();
    if (!currentUser) return 'U';
    const f = (currentUser.firstName?.[0] ?? '').toUpperCase();
    const l = (currentUser.lastName?.[0] ?? '').toUpperCase();
    const initials = `${f}${l}`;
    return initials || 'U';
  }

  getAvatarClass(): string {
    const currentUser = this.user();
    if (!currentUser) return 'bg-gray-500';

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-gray-500',
    ] as const;
    return colors[currentUser.id % colors.length];
  }

  getRoleBadgeClass(): string {
    const currentUser = this.user();
    if (!currentUser) return 'bg-gray-100 text-gray-800';
    return currentUser.role === UserRole.ADMIN
      ? 'bg-red-100 text-red-800'
      : 'bg-green-100 text-green-800';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  }

  getRegistrationLabel(): string {
    const currentUser = this.user();
    if (!currentUser) return '';
    const created = new Date(currentUser.createdAt).getTime();
    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.max(0, Math.floor((now - created) / msPerDay));
    return `Inscrit il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }

  getActivityIcon(type: ActivityType): string {
    const iconMap: Record<ActivityType, string> = {
      [ActivityType.LOGIN]: 'fa-sign-in-alt',
      [ActivityType.LOGOUT]: 'fa-sign-out-alt',
      [ActivityType.PROFILE_UPDATE]: 'fa-user-edit',
      [ActivityType.PASSWORD_CHANGE]: 'fa-key',
      [ActivityType.PASSWORD_RESET]: 'fa-key',
      [ActivityType.ORDER_PLACED]: 'fa-shopping-cart',
      [ActivityType.ORDER_CANCELLED]: 'fa-times-circle',
      [ActivityType.FAVORITE_ADDED]: 'fa-heart',
      [ActivityType.FAVORITE_REMOVED]: 'fa-heart-broken',
      [ActivityType.ACCOUNT_CREATED]: 'fa-user-plus',
      [ActivityType.ACCOUNT_SUSPENDED]: 'fa-ban',
      [ActivityType.ACCOUNT_REACTIVATED]: 'fa-check-circle',
      [ActivityType.ACCOUNT_DELETED]: 'fa-user-times',
      [ActivityType.ROLE_CHANGED]: 'fa-user-shield',
      [ActivityType.ROLE_UPDATED]: 'fa-user-shield',
      [ActivityType.EMAIL_SENT]: 'fa-envelope',
      [ActivityType.FAILED_LOGIN]: 'fa-exclamation-triangle',
      [ActivityType.ADMIN_ACTION]: 'fa-tools',
    };
    return iconMap[type];
  }

  getActivityIconClass(type: ActivityType): string {
    const classMap: Record<ActivityType, string> = {
      [ActivityType.LOGIN]: 'bg-green-500',
      [ActivityType.LOGOUT]: 'bg-gray-500',
      [ActivityType.PROFILE_UPDATE]: 'bg-blue-500',
      [ActivityType.PASSWORD_CHANGE]: 'bg-orange-500',
      [ActivityType.PASSWORD_RESET]: 'bg-orange-600',
      [ActivityType.ORDER_PLACED]: 'bg-purple-500',
      [ActivityType.ORDER_CANCELLED]: 'bg-red-500',
      [ActivityType.FAVORITE_ADDED]: 'bg-pink-500',
      [ActivityType.FAVORITE_REMOVED]: 'bg-gray-400',
      [ActivityType.ACCOUNT_CREATED]: 'bg-blue-600',
      [ActivityType.ACCOUNT_SUSPENDED]: 'bg-red-600',
      [ActivityType.ACCOUNT_REACTIVATED]: 'bg-green-600',
      [ActivityType.ACCOUNT_DELETED]: 'bg-red-800',
      [ActivityType.ROLE_CHANGED]: 'bg-indigo-500',
      [ActivityType.ROLE_UPDATED]: 'bg-indigo-600',
      [ActivityType.EMAIL_SENT]: 'bg-blue-400',
      [ActivityType.FAILED_LOGIN]: 'bg-yellow-500',
      [ActivityType.ADMIN_ACTION]: 'bg-gray-600',
    };
    return classMap[type];
  }

  getOrderStatusLabel(status: AdminOrderStatus): string {
    const labelMap: Record<AdminOrderStatus, string> = {
      [AdminOrderStatus.PENDING]: 'En attente',
      [AdminOrderStatus.CONFIRMED]: 'Confirmée',
      [AdminOrderStatus.PROCESSING]: 'En préparation',
      [AdminOrderStatus.SHIPPED]: 'Expédiée',
      [AdminOrderStatus.DELIVERED]: 'Livrée',
      [AdminOrderStatus.CANCELLED]: 'Annulée',
      [AdminOrderStatus.REFUNDED]: 'Remboursée',
    };
    return labelMap[status] ?? String(status);
  }

  getOrderStatusClass(status: AdminOrderStatus): string {
    const classMap: Record<AdminOrderStatus, string> = {
      [AdminOrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [AdminOrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [AdminOrderStatus.PROCESSING]: 'bg-orange-100 text-orange-800',
      [AdminOrderStatus.SHIPPED]: 'bg-purple-100 text-purple-800',
      [AdminOrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
      [AdminOrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [AdminOrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
    };
    return classMap[status] ?? 'bg-gray-100 text-gray-800';
  }

  private mapOrderFromStore(s: StoreOrder): AdminOrder {
    const items: AdminOrder['items'] = (s.items ?? []).map((it, idx) => {
      const qty = (typeof it.qty === 'number' ? it.qty : it.quantity) ?? 1;
      const unitPrice = (typeof it.unitPrice === 'number' ? it.unitPrice : it.price) ?? 0;
      const totalPrice = it.totalPrice ?? unitPrice * qty;

      return {
        id: it.id ?? `item-${s.id}-${idx}`,
        productId: it.productId,
        productName: it.title ?? it.productName ?? `Produit #${it.productId}`,
        productImage: it.productImage ?? (it as { imageUrl?: string }).imageUrl,
        quantity: qty,
        unitPrice,
        totalPrice,
        sku: it.sku,
      };
    });
    const shippingAddress = s.customer?.address
      ? {
          street: s.customer.address.street ?? '',
          city: s.customer.address.city ?? '',
          postalCode: s.customer.address.zip ?? '',
          country: s.customer.address.country ?? '',
        }
      : {
          street: s.shippingAddress?.street ?? '',
          city: s.shippingAddress?.city ?? '',
          postalCode: s.shippingAddress?.postalCode ?? s.shippingAddress?.zip ?? '',
          country: s.shippingAddress?.country ?? '',
        };

    const brandCandidates = ['visa', 'mastercard', 'amex', 'paypal', 'other'] as const;
    type Brand = (typeof brandCandidates)[number];

    const rawBrand = (s.payment?.brand ?? s.payment?.method ?? 'other').toString().toLowerCase();
    const pmBrand: Brand = (brandCandidates as readonly string[]).includes(rawBrand)
      ? (rawBrand as Brand)
      : 'other';

    const paymentMethod: AdminOrder['paymentMethod'] = {
      id: 'pm',
      brand: pmBrand,
      last4: s.payment?.last4 ?? '',
      expMonth: 1,
      expYear: 2099,
      holder:
        s.customer?.firstName || s.customer?.lastName
          ? `${s.customer?.firstName ?? ''} ${s.customer?.lastName ?? ''}`.trim()
          : undefined,
    };

    const billingAddress = s.billingAddress
      ? {
          street: s.billingAddress.street ?? '',
          city: s.billingAddress.city ?? '',
          postalCode: s.billingAddress.postalCode ?? s.billingAddress.zip ?? '',
          country: s.billingAddress.country ?? '',
        }
      : undefined;

    return {
      id: s.id,
      userId: s.userId,
      status: this.mapOrderStatus(s.status),
      total: s.total ?? 0,
      currency: 'EUR',
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt ?? s.createdAt),
      estimatedDelivery: s.estimatedDelivery ? new Date(s.estimatedDelivery) : undefined,
      trackingNumber: s.trackingNumber,
      notes: s.notes,
    };
  }

  private mapOrderStatus(raw: string): AdminOrderStatus {
    const s = (raw ?? '').toLowerCase();
    switch (s) {
      case 'pending':
        return AdminOrderStatus.PENDING;
      case 'accepted':
      case 'confirmed':
        return AdminOrderStatus.CONFIRMED;
      case 'processing':
        return AdminOrderStatus.PROCESSING;
      case 'shipped':
        return AdminOrderStatus.SHIPPED;
      case 'delivered':
        return AdminOrderStatus.DELIVERED;
      case 'cancelled':
      case 'canceled':
        return AdminOrderStatus.CANCELLED;
      case 'refunded':
        return AdminOrderStatus.REFUNDED;
      default:
        return AdminOrderStatus.PENDING;
    }
  }

  private toUnifiedStatus(s: AdminOrderStatus): UnifiedStatus {
    switch (s) {
      case AdminOrderStatus.PENDING:
        return 'pending';
      case AdminOrderStatus.PROCESSING:
        return 'processing';
      case AdminOrderStatus.CONFIRMED:
        return 'accepted';
      case AdminOrderStatus.SHIPPED:
        return 'processing';
      case AdminOrderStatus.DELIVERED:
        return 'delivered';
      case AdminOrderStatus.CANCELLED:
      case AdminOrderStatus.REFUNDED:
        return 'refused';
      default:
        return 'pending';
    }
  }

  statusLabelUnified(s: AdminOrderStatus): string {
    const u = this.toUnifiedStatus(s);
    switch (u) {
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

  statusBadgeClassUnified(s: AdminOrderStatus): Record<string, boolean> {
    const u = this.toUnifiedStatus(s);
    return {
      'bg-yellow-100 text-yellow-800': u === 'pending' || u === 'processing',
      'bg-green-100 text-green-800': u === 'accepted' || u === 'delivered',
      'bg-red-100 text-red-800': u === 'refused',
    };
  }

  statusDotClassUnified(s: AdminOrderStatus): Record<string, boolean> {
    const u = this.toUnifiedStatus(s);
    return {
      'bg-yellow-500': u === 'pending' || u === 'processing',
      'bg-green-500': u === 'accepted' || u === 'delivered',
      'bg-red-500': u === 'refused',
    };
  }

  progressUnified(s: AdminOrderStatus): number {
    const u = this.toUnifiedStatus(s);
    switch (u) {
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

  // ======= Fidélité helpers & mapping vers commandes =======

  /** Tente d'extraire un identifiant numérique d'une commande sous forme "ORD-2025-0001" -> 20250001 */
  private extractNumericOrderId(orderId: string): number | null {
    const digits = orderId.replace(/\D+/g, '');
    return digits.length ? Number(digits) : null;
  }

  /** Rattache les lignes de ledger à une commande :
   *  1) match direct par id numérique
   *  2) fallback +/- 60 minutes entre createdAt order et createdAt ledger
   */
  ledgerForOrder(order: AdminOrder): FidelityLedgerEntry[] {
    const entries = this.fidelityLedger();
    if (!entries.length) return [];
    const byId = this.extractNumericOrderId(order.id);

    const windowMs = 60 * 60 * 1000; // 60 min
    const oc = new Date(order.createdAt).getTime();

    const result = entries.filter((e) => {
      if (typeof e.orderId === 'number' && byId !== null && e.orderId === byId) return true;
      const lc = new Date(e.createdAt).getTime();
      return Math.abs(lc - oc) <= windowMs && (e.type === 'earn' || e.type === 'use');
    });

    // Tri du plus récent au plus ancien pour l'affichage
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /** Donne un libellé court pour le type de ledger */
  ledgerTypeLabel(t: FidelityLedgerEntry['type']): string {
    switch (t) {
      case 'earn':
        return 'Gain';
      case 'use':
        return 'Utilisation';
      case 'adjust':
        return 'Ajustement';
      case 'revoke':
        return 'Révocation';
      default:
        return String(t);
    }
  }

  ledgerTypeBadgeClass(t: FidelityLedgerEntry['type']): string {
    switch (t) {
      case 'earn':
        return 'bg-emerald-100 text-emerald-800';
      case 'use':
        return 'bg-amber-100 text-amber-800';
      case 'adjust':
        return 'bg-indigo-100 text-indigo-800';
      case 'revoke':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /** Retourne l'ID de commande affichable depuis une ligne de ledger si on peut le déduire */
  orderIdFromLedger(e: FidelityLedgerEntry): string | null {
    // Si le ledger a un orderId numérique et qu'on a une commande correspondante, on la renvoie
    if (typeof e.orderId === 'number') {
      const match = this.orders().find((o) => this.extractNumericOrderId(o.id) === e.orderId);
      if (match) return match.id;
    }
    // Sinon, aucun lien certain
    return null;
  }

  // ===== Utils template =====
  trackReward = (_: number, r: FidelityReward) => r.id;
  trackLedger = (_: number, e: FidelityLedgerEntry) => e.id;

  // ======== FIN FIDÉLITÉ ========

  // ======== SUBSCRIPTION METHODS ========

  openChangePlanModal(): void {
    this.showChangePlanModal.set(true);
    this.selectedNewPlanId.set(null);
  }

  closeChangePlanModal(): void {
    this.showChangePlanModal.set(false);
    this.selectedNewPlanId.set(null);
  }

  async confirmPlanChange(): Promise<void> {
    const u = this.user();
    const newPlanId = this.selectedNewPlanId();
    if (!u || !newPlanId) return;

    const result = this.subscriptionSvc.upgradePlan(u.id, newPlanId, false);
    if (result.success) {
      this.toast.success(
        'Plan modifié avec succès. Changement effectif au prochain renouvellement.'
      );
      this.closeChangePlanModal();
      await this.loadUser(u.id);
    } else {
      this.toast.error(result.error ?? 'Erreur lors du changement de plan');
    }
  }

  formatSubscriptionDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR');
  }

  subscriptionStatusBadge(status: string): string {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'active':
        return `${base} bg-green-100 text-green-700`;
      case 'canceled':
        return `${base} bg-red-100 text-red-700`;
      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  }

  subscriptionStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'canceled':
        return 'Annulé';
      default:
        return status;
    }
  }

  async cancelSubscriptionAsAdmin(): Promise<void> {
    const u = this.user();
    if (!u) return;

    const confirmed = await this.confirm.ask({
      title: "Annuler l'abonnement",
      message: `Êtes-vous sûr de vouloir annuler l'abonnement de ${u.firstName} ${u.lastName} ? Il restera actif jusqu'à la fin de la période en cours.`,
      variant: 'danger',
      confirmText: 'Oui, annuler',
      cancelText: 'Non',
    });

    if (!confirmed) return;

    const result = this.subscriptionSvc.cancel(u.id);
    if (result.success) {
      this.toast.info("Abonnement annulé. Valable jusqu'à la fin de la période en cours.");
      // Force refresh of user data
      await this.loadUser(u.id);
    } else {
      this.toast.error(result.error ?? "Erreur lors de l'annulation.");
    }
  }

  // ======== FIN SUBSCRIPTION ========
}
