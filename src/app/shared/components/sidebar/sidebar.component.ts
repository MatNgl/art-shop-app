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
  styleUrls: ['./sidebar.component.scss'],

  template: `
    <aside class="wrap">
      <div class="h-full flex flex-col text-sm">
        <!-- En-tête ADMIN uniquement -->
        <ng-container *ngIf="showAdminNav()">
          <div class="header">
            <div class="title">Administration</div>
            <div class="flex items-center gap-2 mt-2">
              <div class="id">{{ initials() }}</div>
              <div class="text-slate-900 font-semibold truncate">{{ displayName() }}</div>
            </div>
          </div>
        </ng-container>

        <!-- NAV ADMIN (look pro - Font Awesome) -->
        <ng-container *ngIf="showAdminNav(); else siteNav">
          <nav class="py-3 space-y-1">
            <a routerLink="/admin/dashboard" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-chart-line icon"></i>
              <span class="label">Dashboard</span>
            </a>

            <a routerLink="/admin/products" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-cubes icon"></i>
              <span class="label">Produits</span>
            </a>

            <a routerLink="/admin/artists" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-palette icon"></i>
              <span class="label">Artistes</span>
            </a>

            <a routerLink="/admin/orders" routerLinkActive="is-active" class="nav-item relative">
              <i class="fa-solid fa-bag-shopping icon"></i>
              <span class="label">Commandes</span>
              <span *ngIf="ordersCount() > 0" class="absolute right-4 badge bg-red-600 text-white">
                {{ ordersCount() }}
              </span>
            </a>

            <a routerLink="/admin/users" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-users icon"></i>
              <span class="label">Utilisateurs</span>
            </a>

            <a routerLink="/admin/categories" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-tags icon"></i>
              <span class="label">Catégories</span>
            </a>

            <div class="section-label">Paramètres</div>

            <a routerLink="/" class="nav-item">
              <i class="fa-solid fa-arrow-up-right-from-square icon"></i>
              <span class="label">Voir le site</span>
            </a>

            <button type="button" (click)="logout()" class="nav-item danger w-full text-left">
              <i class="fa-solid fa-right-from-bracket icon"></i>
              <span class="label">Se déconnecter</span>
            </button>
          </nav>
        </ng-container>

        <!-- NAV SITE (inchangé, style plus convivial avec émojis) -->
        <ng-template #siteNav>
          <nav class="py-3 space-y-1">
            <div class="section-label">Découvrir</div>
            <a
              [routerLink]="['/catalog']"
              [queryParams]="{ sort: 'createdAt_desc', page: 1 }"
              routerLinkActive="is-active"
              class="item"
              >🆕 <span class="label">Nouveautés</span></a
            >
            <a
              [routerLink]="['/catalog']"
              [queryParams]="{ page: 1, sort: 'title' }"
              routerLinkActive="is-active"
              class="item"
              >📚 <span class="label">Tout le catalogue</span></a
            >

            <div class="section-label">Catégories</div>
            <ng-container *ngFor="let cat of categories">
              <a
                [routerLink]="['/catalog']"
                [queryParams]="{ category: cat, page: 1 }"
                routerLinkActive="is-active"
                class="item justify-between"
              >
                <span class="inline-flex items-center gap-2">
                  <span class="text-lg">{{ getCategoryIcon(cat) }}</span>
                  <span class="label">{{ getCategoryLabel(cat) }}</span>
                </span>
                <span class="badge bg-gray-100 text-gray-700">{{
                  categoryCounts()[cat] ?? 0
                }}</span>
              </a>
            </ng-container>

            <div class="section-label">Raccourcis</div>
            <a routerLink="/profile" routerLinkActive="is-active" class="item"
              >👤 <span class="label">Mon compte</span></a
            >

            <a routerLink="/profile/favorites" routerLinkActive="is-active" class="item relative">
              ❤️ <span class="label">Mes favoris</span>
              <span
                *ngIf="favoritesCount() > 0"
                class="absolute right-4 badge bg-pink-600 text-white"
                >{{ favoritesCount() }}</span
              >
            </a>
            <a routerLink="/cart" routerLinkActive="is-active" class="item relative">
              🛍 <span class="label">Mon panier</span>
              <span *ngIf="cartCount() > 0" class="absolute right-4 badge bg-blue-600 text-white">{{
                cartCount()
              }}</span>
            </a>

            <ng-container *ngIf="isLoggedIn(); else guest">
              <a routerLink="/profile/orders" routerLinkActive="is-active" class="item relative">
                📦 <span class="label">Mes commandes</span>
                <span class="absolute right-4 badge bg-gray-200 text-gray-700">{{
                  ordersCount()
                }}</span>
              </a>
              <button type="button" (click)="logout()" class="item danger w-full text-left">
                🚪 <span class="label">Se déconnecter</span>
              </button>
            </ng-container>

            <ng-template #guest>
              <a routerLink="/auth/login" routerLinkActive="is-active" class="item">
                🔐 <span class="label">Se connecter</span>
              </a>
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

  // Icônes "site"
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
