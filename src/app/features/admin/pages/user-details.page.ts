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

// Services métiers
import { OrderService } from '../../../features/orders/services/order';
import { ProductService } from '../../../features/catalog/services/product';
import type { Product } from '../../../features/catalog/models/product.model';

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
  imports: [CommonModule, RouterLink, FormsModule],
  providers: [{ provide: PRODUCT_SERVICE, useExisting: ProductService }],
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
            <div class="flex items-center gap-3">
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
          </div>
        </div>
      </div>

      @if (loading()) {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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
          </div>
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
                  {{ getTotalSpent() | currency : 'EUR' : 'symbol' : '1.0-0' : 'fr' }}
                </p>
                <p class="text-sm text-gray-600">Total dépensé</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-clock text-purple-600 text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-bold text-gray-900">{{ activities().length }}</p>
                <p class="text-sm text-gray-600">Activités</p>
              </div>
            </div>
          </div>
        </div>

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
                    {{ order.total | currency : 'EUR' : 'symbol' : '1.2-2' : 'fr' }}
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
                    <span class="flex-1">{{ item.productName }}</span>
                    <span class="text-gray-500">×{{ item.quantity }}</span>
                  </div>
                  }
                </div>
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <span>{{ formatDate(order.createdAt) }}</span>
                  @if (order.trackingNumber) {
                  <span class="font-mono">{{ order.trackingNumber }}</span>
                  }
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

        <!-- Favoris -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Produits favoris</h2>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">{{ favorites().length }} favoris</span>
              <button (click)="loadFavorites()" class="text-blue-600 hover:text-blue-800 text-sm">
                <i class="fa-solid fa-arrows-rotate mr-1"></i>
                Actualiser
              </button>
            </div>
          </div>
          <div class="p-6">
            @if (loadingFavorites()) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (i of [1,2,3]; track i) {
              <div class="border rounded-lg p-4 animate-pulse">
                <div class="w-full h-32 bg-gray-200 rounded mb-3"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              }
            </div>
            } @else if (favorites().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (favorite of favorites(); track favorite.id) {
              <div
                class="border rounded-lg overflow-hidden hover:border-blue-200 transition-colors group"
              >
                @if (favorite.product?.imageUrl || favorite.productImage) {
                <div class="relative">
                  <img
                    [src]="favorite.product?.imageUrl || favorite.productImage"
                    [alt]="favorite.product?.title || favorite.productName"
                    class="w-full h-48 object-cover"
                  />
                  @if (!favorite.isAvailable) {
                  <div
                    class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                  >
                    <span class="text-white font-medium">Rupture de stock</span>
                  </div>
                  }
                </div>
                } @else {
                <div class="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <i class="fa-solid fa-image text-3xl text-gray-400"></i>
                </div>
                }

                <div class="p-4">
                  <div class="flex items-start justify-between mb-2">
                    <h4 class="font-medium text-gray-900 line-clamp-2">
                      {{ favorite.product?.title || favorite.productName }}
                    </h4>
                    @if (favorite.product?.isLimitedEdition) {
                    <span
                      class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      Édition limitée
                    </span>
                    }
                  </div>

                  @if (favorite.product && favorite.product.description) {
                  <p class="text-sm text-gray-600 mb-3 line-clamp-2">
                    {{ favorite.product.description }}
                  </p>
                  }

                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      @if (favorite.product && favorite.product.originalPrice &&
                      favorite.product.originalPrice > favorite.product.price) {
                      <span class="text-sm text-gray-500 line-through">
                        {{
                          favorite.product.originalPrice
                            | currency : 'EUR' : 'symbol' : '1.2-2' : 'fr'
                        }}
                      </span>
                      }
                      <span class="text-lg font-bold text-blue-600">
                        {{
                          favorite.product?.price || favorite.productPrice
                            | currency : 'EUR' : 'symbol' : '1.2-2' : 'fr'
                        }}
                      </span>
                    </div>

                    <div class="flex items-center gap-1">
                      @if (favorite.product?.isAvailable !== false && favorite.isAvailable !==
                      false) {
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        <i class="fa-solid fa-check mr-1"></i>
                        Disponible
                      </span>
                      } @else {
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        <i class="fa-solid fa-times mr-1"></i>
                        Rupture
                      </span>
                      }
                    </div>
                  </div>

                  @if (favorite.product && favorite.product.stock !== undefined) {
                  <div class="mb-3">
                    <div class="flex items-center justify-between text-xs text-gray-500">
                      <span>Stock: {{ favorite.product.stock }} unités</span>
                      @if (favorite.product.technique) {
                      <span>{{ favorite.product.technique }}</span>
                      }
                    </div>
                  </div>
                  }

                  <div class="flex items-center justify-between">
                    <p class="text-xs text-gray-500">
                      Ajouté le {{ formatDate(favorite.addedAt) }}
                    </p>
                    @if (favorite.product) {
                    <button
                      class="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      (click)="viewProduct(favorite.product!)"
                    >
                      Voir le produit
                    </button>
                    }
                  </div>
                </div>
              </div>
              }
            </div>
            } @else {
            <div class="text-center py-12">
              <i class="fa-solid fa-heart text-3xl text-gray-400 mb-4"></i>
              <p class="text-gray-500">Aucun produit favori</p>
              <p class="text-sm text-gray-400 mt-1">
                L'utilisateur n'a pas encore ajouté de favoris
              </p>
            </div>
            }
          </div>
        </div>

        <!-- Actions administratives (allégées) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Actions administratives</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                (click)="sendResetPasswordEmail()"
                class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                [disabled]="loadingActions().resetPassword"
              >
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  @if (loadingActions().resetPassword) {
                  <i class="fa-solid fa-spinner fa-spin text-blue-600"></i>
                  } @else {
                  <i class="fa-solid fa-key text-blue-600"></i>
                  }
                </div>
                <div class="text-left">
                  <p class="font-medium text-gray-900">Réinitialiser le mot de passe</p>
                  <p class="text-sm text-gray-500">Envoyer un email de réinitialisation</p>
                </div>
              </button>

              <button
                (click)="toggleSuspension()"
                class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                [disabled]="loadingActions().suspension"
              >
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  [ngClass]="userExtended()?.isActive === false ? 'bg-green-100' : 'bg-orange-100'"
                >
                  @if (loadingActions().suspension) {
                  <i
                    class="fa-solid fa-spinner fa-spin"
                    [ngClass]="
                      userExtended()?.isActive === false ? 'text-green-600' : 'text-orange-600'
                    "
                  ></i>
                  } @else {
                  <i
                    class="fa-solid"
                    [ngClass]="
                      userExtended()?.isActive === false
                        ? 'fa-play text-green-600'
                        : 'fa-pause text-orange-600'
                    "
                  ></i>
                  }
                </div>
                <div class="text-left">
                  <p class="font-medium text-gray-900">
                    {{
                      userExtended()?.isActive === false
                        ? 'Réactiver le compte'
                        : 'Suspendre le compte'
                    }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{
                      userExtended()?.isActive === false
                        ? "Rendre l'accès au compte"
                        : 'Désactiver temporairement'
                    }}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      } @else {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

  user = signal<User | null>(null);
  userExtended = computed<UserExtended | null>(() => this.user() as UserExtended | null);
  loading = signal<boolean>(true);

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

  async ngOnInit(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    const userIdRaw = this.route.snapshot.paramMap.get('id');
    const userId = userIdRaw ? Number(userIdRaw) : NaN;
    if (!userId || Number.isNaN(userId)) {
      this.router.navigate(['/admin/users']);
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

        // safe index-signature access
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
      // 1) Récupérer les favoris depuis le localStorage de l'utilisateur
      const rawFavorites = this.getUserFavoritesFromStorage(userId);

      if (rawFavorites.length === 0) {
        this.favorites.set([]);
        return;
      }

      // 2) Enrichir avec les informations produits
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

      // 3) Mapper vers EnrichedUserFavorite
      const enrichedFavorites: EnrichedUserFavorite[] = rawFavorites.map((fav) => {
        const product = products.find((p) => p.id === fav.productId);

        return {
          id: `fav-${userId}-${fav.productId}`,
          userId,
          productId: fav.productId,
          productName: product?.title || `Produit #${fav.productId}`,
          productImage: product?.imageUrl,
          productPrice: product?.price || 0,
          addedAt: new Date(fav.addedAt),
          isAvailable: product?.isAvailable ?? false,
          product: product,
        };
      });

      // 4) Trier par date d'ajout (plus récent en premier)
      enrichedFavorites.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

      this.favorites.set(enrichedFavorites);

      // 5) Mettre à jour le cache des produits
      products.forEach((product) => {
        this.productsCache.set(product.id, product);
      });
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
      // 1) Récupérer les activités de base
      const baseActivities = await this.authService.getUserActivity(userId);

      // 2) Enrichir les activités avec les données réelles
      const enrichedActivities: UserActivity[] = [];

      for (const activity of baseActivities) {
        let enrichedActivity = { ...activity };

        // Enrichir selon le type d'activité
        switch (activity.type) {
          case ActivityType.FAVORITE_ADDED:
          case ActivityType.FAVORITE_REMOVED: {
            const metadata = activity.metadata as { productId?: number } | undefined;
            if (metadata?.productId) {
              let product: Product | null | undefined = this.productsCache.get(metadata.productId);
              if (!product && this.productService?.getProductById) {
                const productResult = await this.productService.getProductById(metadata.productId);
                product = productResult || undefined;
                if (product) {
                  this.productsCache.set(product.id, product);
                }
              }
              if (product && metadata.productId) {
                const productActivityMetadata: ProductActivityMetadata = {
                  productId: metadata.productId,
                  productName: product.title,
                  productPrice: product.price,
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
              if (order && metadata.orderId) {
                const orderActivityMetadata: OrderActivityMetadata = {
                  orderId: metadata.orderId,
                  orderTotal: order.total,
                  newStatus: order.status,
                  previousStatus: AdminOrderStatus.PENDING,
                };
                enrichedActivity = {
                  ...activity,
                  details: `Commande ${metadata.orderId} ${
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

      // 3) Générer des activités synthétiques basées sur les données réelles
      await this.generateSyntheticActivities(userId, enrichedActivities);

      // 4) Trier par timestamp décroissant
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

    // Activités basées sur les favoris
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
          productPrice: favorite.product.price,
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

    // Activités basées sur les commandes
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

    // Activité de connexion synthétique (dernière connexion)
    const hasRecentLogin = activities.some(
      (a) =>
        a.type === ActivityType.LOGIN &&
        now.getTime() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // 7 jours
    );

    if (!hasRecentLogin) {
      const loginActivityMetadata: LoginActivityMetadata = {
        success: true,
        sessionDuration: 60,
      };

      activities.push({
        id: `synthetic-login-${userId}`,
        userId,
        type: ActivityType.LOGIN,
        action: 'Connexion',
        details: "Connexion réussie à l'application",
        metadata: loginActivityMetadata,
        ipAddress: '127.0.0.1',
        userAgent: 'Web Browser',
        timestamp: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000), // 0-3 jours
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
      // getAll() a un type propre à OrderService, on sécurise via unknown + garde
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
      this.router.navigate(['/admin/users']);
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
      await this.loadActivities(); // nouvelle entrée d'activité
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

      this.user.set(updatedUser);
      this.showSuspensionModal.set(false);

      const action = updatedUser.isActive ? 'réactivé' : 'suspendu';
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
    // Rediriger vers la page du produit ou ouvrir dans un nouvel onglet
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
    return f + l || 'U';
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
        return 'processing'; // étape intermédiaire
      case AdminOrderStatus.DELIVERED:
        return 'delivered';
      case AdminOrderStatus.CANCELLED:
        return 'refused';
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
}
