// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, OnInit, computed, inject, signal, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth';
import { OrderStore } from '../../../features/cart/services/order-store';
import { ProductService } from '../../../features/catalog/services/product';
import { ProductCategory } from '../../../features/catalog/models/product.model';
import { FavoritesStore } from '../../../features/favorites/services/favorites-store';
import { CartStore } from '../../../features/cart/services/cart-store';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [
    `
      :host {
        display: block;
        width: 260px;
        background: #fff;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.75rem;
        height: fit-content;
      }
      .wrap {
        height: calc(100vh - 8rem);
        position: sticky;
        top: 4rem;
        display: flex;
        flex-direction: column;
      }
      .section-label {
        @apply text-xs text-gray-500 px-4 mt-4 mb-2;
      }
      .item {
        @apply flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors;
      }
      .item.is-active {
        @apply bg-gray-100 font-semibold;
      }

      /* Pastilles */
      .badge {
        @apply inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs rounded-full;
      }

      /* ==== THEME ADMIN ==== */
      :host(.admin) {
        border-color: rgb(203 213 225);
      }
      :host(.admin) .header {
        @apply px-4 py-4 border-b border-gray-200;
      }
      :host(.admin) .item {
        @apply hover:bg-blue-50;
      }
      :host(.admin) .item.is-active {
        @apply bg-blue-50 text-blue-700;
        border-left: 3px solid rgb(37 99 235);
      }
      :host(.admin) .badge {
        @apply bg-gray-100 text-gray-700;
      }
      :host(.admin) .danger {
        @apply hover:bg-red-50 text-red-600;
      }
    `,
  ],
  template: `
    <aside class="wrap">
      <div class="h-full flex flex-col text-sm">
        <!-- En-tête ADMIN uniquement -->
        <ng-container *ngIf="showAdminNav()">
          <div class="header">
            <div class="text-xs text-gray-500">Administration</div>
            <div class="flex items-center gap-2 mt-2">
              <div
                class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold"
              >
                {{ initials() }}
              </div>
              <div class="text-gray-900 font-semibold truncate">{{ displayName() }}</div>
            </div>
          </div>
        </ng-container>

        <!-- NAV ADMIN -->
        <ng-container *ngIf="showAdminNav(); else siteNav">
          <nav class="py-3 space-y-1">
            <a routerLink="/admin/dashboard" routerLinkActive="is-active" class="item"
              >📊 <span>Dashboard</span></a
            >
            <a routerLink="/admin/products" routerLinkActive="is-active" class="item"
              >🖼 <span>Produits</span></a
            >
            <a routerLink="/admin/artists" routerLinkActive="is-active" class="item"
              >🎨 <span>Artistes</span></a
            >
            <a routerLink="/admin/orders" routerLinkActive="is-active" class="item relative">
              📦 <span>Commandes</span>
              <span
                *ngIf="ordersCount() > 0"
                class="absolute right-4 badge bg-red-600 text-white"
                >{{ ordersCount() }}</span
              >
            </a>
            <a routerLink="/admin/users" routerLinkActive="is-active" class="item"
              >👥 <span>Utilisateurs</span></a
            >
            <a routerLink="/admin/categories" routerLinkActive="is-active" class="item"
              >🏷 <span>Catégories</span></a
            >

            <div class="section-label">PARAMÈTRES</div>
            <a routerLink="/" class="item">↩️ <span>Voir le site</span></a>
            <button type="button" (click)="logout()" class="item danger w-full text-left">
              🚪 <span>Se déconnecter</span>
            </button>
          </nav>
        </ng-container>

        <!-- NAV SITE -->
        <ng-template #siteNav>
          <nav class="py-3 space-y-1">
            <div class="section-label">DÉCOUVRIR</div>
            <a
              [routerLink]="['/catalog']"
              [queryParams]="{ sort: 'createdAt_desc', page: 1 }"
              routerLinkActive="is-active"
              class="item"
              >🆕 <span>Nouveautés</span></a
            >
            <a
              [routerLink]="['/catalog']"
              [queryParams]="{ page: 1, sort: 'title' }"
              routerLinkActive="is-active"
              class="item"
              >📚 <span>Tout le catalogue</span></a
            >

            <div class="section-label">CATÉGORIES</div>
            <ng-container *ngFor="let cat of categories">
              <a
                [routerLink]="['/catalog']"
                [queryParams]="{ category: cat, page: 1 }"
                routerLinkActive="is-active"
                class="item justify-between"
              >
                <span class="inline-flex items-center gap-2">
                  <span class="text-lg">{{ getCategoryIcon(cat) }}</span>
                  <span>{{ getCategoryLabel(cat) }}</span>
                </span>
                <span class="badge bg-gray-100 text-gray-700">{{
                  categoryCounts()[cat] ?? 0
                }}</span>
              </a>
            </ng-container>

            <div class="section-label">RACCOURCIS</div>
            <a routerLink="/profile" routerLinkActive="is-active" class="item"
              >👤 <span>Mon compte</span></a
            >

            <a routerLink="/profile/favorites" routerLinkActive="is-active" class="item relative">
              ❤️ <span>Mes favoris</span>
              <span
                *ngIf="favoritesCount() > 0"
                class="absolute right-4 badge bg-pink-600 text-white"
                >{{ favoritesCount() }}</span
              >
            </a>
            <a routerLink="/cart" routerLinkActive="is-active" class="item relative">
              🛍 <span>Mon panier</span>
              <span *ngIf="cartCount() > 0" class="absolute right-4 badge bg-blue-600 text-white">{{
                cartCount()
              }}</span>
            </a>

            <ng-container *ngIf="isLoggedIn(); else guest">
              <a routerLink="/profile/orders" routerLinkActive="is-active" class="item relative">
                📦 <span>Mes commandes</span>
                <span class="absolute right-4 badge bg-gray-200 text-gray-700">{{
                  ordersCount()
                }}</span>
              </a>
              <button type="button" (click)="logout()" class="item danger w-full text-left">
                🚪 <span>Se déconnecter</span>
              </button>
            </ng-container>

            <ng-template #guest>
              <a routerLink="/auth/login" routerLinkActive="is-active" class="item"
                >🔐 <span>Se connecter</span></a
              >
            </ng-template>
          </nav>
        </ng-template>
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private orders = inject(OrderStore);
  private products = inject(ProductService);
  private fav = inject(FavoritesStore);
  private cart = inject(CartStore);

  categories = Object.values(ProductCategory);
  categoryCounts = signal<Partial<Record<ProductCategory, number>>>({});

  isAdminRoute = signal(false);
  isAdminRole = signal(false);

  favoritesCount = this.fav.count;
  cartCount = this.cart.count;
  ordersCount = this.orders.count;

  @HostBinding('class.admin') get adminClass() {
    return this.showAdminNav();
  }

  ngOnInit(): void {
    this.isAdminRole.set(this.auth.isAdmin());
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));
    this.router.events.subscribe(() => this.isAdminRoute.set(this.router.url.startsWith('/admin')));
    this.loadCategoryCounts();
  }

  private async loadCategoryCounts() {
    const counts = await this.products.getCategoryCounts();
    this.categoryCounts.set(counts);
  }

  showAdminNav = computed(() => this.isAdminRole() && this.isAdminRoute());
  isLoggedIn = () => !!this.auth.getCurrentUser();

  displayName(): string {
    const u = this.auth.getCurrentUser();
    if (!u) return 'Invité';
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
  }
  initials(): string {
    const u = this.auth.getCurrentUser();
    if (!u) return 'AS';
    const a = (u.firstName?.[0] || '').toUpperCase();
    const b = (u.lastName?.[0] || '').toUpperCase();
    return a + b || 'AS';
  }

  logout() {
    this.auth
      .logout()
      .catch((err) => console.error('Logout error:', err))
      .finally(() => this.router.navigate(['/']));
  }

  getCategoryIcon(cat: ProductCategory): string {
    const icons: Record<ProductCategory, string> = {
      [ProductCategory.DRAWING]: '✏️',
      [ProductCategory.PAINTING]: '🎨',
      [ProductCategory.DIGITAL_ART]: '💻',
      [ProductCategory.PHOTOGRAPHY]: '📸',
      [ProductCategory.SCULPTURE]: '🗿',
      [ProductCategory.MIXED_MEDIA]: '🎭',
    };
    return icons[cat];
  }
  getCategoryLabel(cat: ProductCategory): string {
    return this.products.getCategoryLabel(cat);
  }
}
