import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth';
import { OrderStore } from '../../../features/cart/services/order-store';
import { ProductService } from '../../../features/catalog/services/product';
import { FavoritesStore } from '../../../features/favorites/services/favorites-store';
import { CartStore } from '../../../features/cart/services/cart-store';
import { OrderService } from '../../../features/orders/services/order';
import { ArtistService } from '../../../features/catalog/services/artist';
import { CategoryService } from '../../../features/catalog/services/category';
import { Category } from '../../../features/catalog/models/category.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styleUrls: ['./sidebar.component.scss'],
  template: `
    <div class="sidebar-wrapper">
      <div class="sidebar" [class.expanded]="forceExpanded()">
        <!-- Header -->
        <div class="sidebar-header">
          <a routerLink="/" class="logo-container">
            <div class="logo">
              <span style="color: white; font-size: 14px; font-weight: bold;">AS</span>
            </div>
            <span class="logo-text">Art Shop</span>
          </a>
        </div>

        <!-- Navigation -->
        <div class="nav-container">
          <!-- Navigation Admin -->
          <ng-container *ngIf="showAdminNav()">
            <div class="nav-section">
              <div class="section-title">Administration</div>

              <a
                routerLink="/admin/dashboard"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Dashboard"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-chart-line"></i>
                </div>
                <span class="nav-label">Dashboard</span>
              </a>

              <a
                routerLink="/admin/products"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Produits"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-cubes"></i>
                </div>
                <span class="nav-label">Produits</span>
                <span *ngIf="adminProductsCount() > 0" class="nav-badge badge-gray">{{
                  adminProductsCount()
                }}</span>
              </a>

              <a
                routerLink="/admin/artists"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Artistes"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-palette"></i>
                </div>
                <span class="nav-label">Artistes</span>
                <span *ngIf="adminArtistsCount() > 0" class="nav-badge badge-purple">{{
                  adminArtistsCount()
                }}</span>
              </a>

              <a
                routerLink="/admin/orders"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Commandes"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-bag-shopping"></i>
                </div>
                <span class="nav-label">Commandes</span>
                <span *ngIf="adminOrdersCount() > 0" class="nav-badge badge-danger">{{
                  adminOrdersCount()
                }}</span>
              </a>

              <a
                routerLink="/admin/users"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Utilisateurs"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-users"></i>
                </div>
                <span class="nav-label">Utilisateurs</span>
                <span *ngIf="adminUsersCount() > 0" class="nav-badge badge-success">{{
                  adminUsersCount()
                }}</span>
              </a>

              <a
                routerLink="/admin/categories"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Catégories"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-tags"></i>
                </div>
                <span class="nav-label">Catégories</span>
                <span *ngIf="adminCategoriesCount() > 0" class="nav-badge badge-warning">{{
                  adminCategoriesCount()
                }}</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="section-title">Actions</div>

              <a routerLink="/" class="nav-item" data-tooltip="Voir le site">
                <div class="nav-icon">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </div>
                <span class="nav-label">Voir le site</span>
              </a>
            </div>
          </ng-container>

          <!-- Navigation Site -->
          <ng-container *ngIf="!showAdminNav()">
            <div class="nav-section">
              <div class="section-title">Découvrir</div>

              <a
                [routerLink]="['/catalog']"
                [queryParams]="{ sort: 'createdAt_desc', page: 1 }"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Nouveautés"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-wand-magic-sparkles" style="color: #8B5CF6;"></i>
                </div>
                <span class="nav-label">Nouveautés</span>
              </a>

              <a
                [routerLink]="['/catalog']"
                [queryParams]="{ page: 1, sort: 'title' }"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Tout le catalogue"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-book-open" style="color: #64748B;"></i>
                </div>
                <span class="nav-label">Catalogue</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="section-title">Catégories</div>

              <ng-container *ngFor="let cat of categories">
                <a
                  [routerLink]="['/catalog']"
                  [queryParams]="{ category: cat.slug, page: 1 }"
                  routerLinkActive="active"
                  class="nav-item"
                  [attr.data-tooltip]="cat.name"
                >
                  <div class="nav-icon">
                    <i
                      class="fa-solid"
                      [ngClass]="getCategoryFaIcon(cat)"
                      [style.color]="getCategoryColor(cat)"
                    ></i>
                  </div>
                  <span class="nav-label">{{ cat.name }}</span>
                  <span class="nav-badge badge-gray">{{ countFor(cat) }}</span>
                </a>
              </ng-container>
            </div>

            <div class="nav-section">
              <div class="section-title">Mon Compte</div>

              <a
                routerLink="/profile"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Mon compte"
                (click)="guardProfile($event)"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-user" style="color: #64748B;"></i>
                </div>
                <span class="nav-label">Mon compte</span>
              </a>

              <a
                routerLink="/favorites"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Mes favoris"
                (click)="guardFavorites($event)"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-heart" style="color: #EC4899;"></i>
                </div>
                <span class="nav-label">Mes favoris</span>
                <span *ngIf="favoritesCount() > 0" class="nav-badge badge-pink">{{
                  favoritesCount()
                }}</span>
              </a>

              <a
                routerLink="/cart"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Mon panier"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-cart-shopping" style="color: #3B82F6;"></i>
                </div>
                <span class="nav-label">Mon panier</span>
                <span *ngIf="cartCount() > 0" class="nav-badge badge-primary">{{
                  cartCount()
                }}</span>
              </a>

              <a
                *ngIf="isLoggedIn()"
                routerLink="/profile/orders"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Mes commandes"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-bag-shopping" style="color: #64748B;"></i>
                </div>
                <span class="nav-label">Mes commandes</span>
                <span class="nav-badge badge-gray">{{ ordersCount() }}</span>
              </a>

              <a
                *ngIf="!isLoggedIn()"
                routerLink="/auth/login"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Se connecter"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-sign-in-alt" style="color: #10B981;"></i>
                </div>
                <span class="nav-label">Se connecter</span>
              </a>
            </div>
          </ng-container>
        </div>

        <!-- Footer -->
        <div class="sidebar-footer" *ngIf="isLoggedIn()">
          <div class="user-profile" routerLink="/profile">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ displayName() }}</div>
              <div class="user-role">{{ currentUser()?.role || 'utilisateur' }}</div>
            </div>
          </div>

          <button class="logout-btn" type="button" (click)="logout()" data-tooltip="Se déconnecter">
            <div class="nav-icon">
              <i class="fa-solid fa-sign-out-alt"></i>
            </div>
            <span class="nav-label">Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SidebarComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  private orders = inject(OrderStore);
  private products = inject(ProductService);
  private fav = inject(FavoritesStore);
  private cart = inject(CartStore);

  private adminOrders = inject(OrderService);
  private artists = inject(ArtistService);
  private categoryService = inject(CategoryService);

  categories: Category[] = [];
  categoryCounts: Record<number, number> = {};

  forceExpanded = signal(false);
  isAdminRoute = signal(false);
  isAdminRole = signal(false);

  currentUser = this.auth.currentUser$;
  favoritesCount = this.fav.count;
  cartCount = this.cart.count;
  ordersCount = this.orders.count;

  adminOrdersCount = signal(0);
  adminUsersCount = signal(0);
  adminArtistsCount = signal(0);
  adminProductsCount = signal(0);
  adminCategoriesCount = signal(0);

  ngOnInit(): void {
    this.isAdminRole.set(this.auth.isAdmin());
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));

    this.router.events.subscribe(() => {
      this.isAdminRoute.set(this.router.url.startsWith('/admin'));
      if (this.showAdminNav()) this.loadAdminBadges();
    });

    void this.loadCategoriesAndCounts();
    if (this.showAdminNav()) void this.loadAdminBadges();
  }

  // Guards avec gestion propre des toasts
  guardProfile(event: MouseEvent): void {
    if (!this.isLoggedIn()) {
      event.preventDefault();
      event.stopPropagation();
      this.toast.requireAuth('profile', '/profile');
    }
  }

  guardFavorites(event: MouseEvent): void {
    if (!this.isLoggedIn()) {
      event.preventDefault();
      event.stopPropagation();
      this.toast.requireAuth('favorites', '/favorites');
    }
  }

  // Helpers
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

  private async loadCategoriesAndCounts(): Promise<void> {
    try {
      const [cats, counts] = await Promise.all([
        this.categoryService.getAll(),
        this.products.getCategoryCounts(),
      ]);
      this.categories = cats;
      this.categoryCounts = counts;
      const totalProducts = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);
      this.adminProductsCount.set(totalProducts);
    } catch {
      this.categories = [];
      this.categoryCounts = {};
    }
  }

  private async loadAdminBadges(): Promise<void> {
    try {
      const users = await this.auth.getAllUsers();
      this.adminUsersCount.set(users.length);
    } catch {
      this.adminUsersCount.set(0);
    }

    try {
      const all = await this.adminOrders.getAll();
      this.adminOrdersCount.set(all.length);
    } catch {
      this.adminOrdersCount.set(0);
    }

    try {
      const total = await this.artists.getCount();
      this.adminArtistsCount.set(total);
    } catch {
      this.adminArtistsCount.set(0);
    }

    try {
      const n = await this.categoryService.getCount();
      this.adminCategoriesCount.set(n);
    } catch {
      try {
        const list = await this.categoryService.getAll();
        this.adminCategoriesCount.set(list.length);
      } catch {
        this.adminCategoriesCount.set(0);
      }
    }
  }

  getCategoryFaIcon(cat: Category): string {
    if (cat.icon) return cat.icon;
    const map: Record<string, string> = {
      dessin: 'fa-pencil',
      peinture: 'fa-palette',
      'art-numerique': 'fa-laptop-code',
      photographie: 'fa-camera',
      sculpture: 'fa-cubes',
      'mixed-media': 'fa-masks-theater',
    };
    return map[cat.slug] ?? 'fa-tags';
  }

  getCategoryColor(cat: Category): string {
    const map: Record<string, string> = {
      dessin: '#F59E0B',
      peinture: '#3B82F6',
      'art-numerique': '#EC4899',
      photographie: '#10B981',
      sculpture: '#F97316',
      'mixed-media': '#8B5CF6',
    };
    return map[cat.slug] || '#64748B';
  }

  countFor(cat: Category): number {
    return this.categoryCounts[cat.id] ?? cat.productIds?.length ?? 0;
  }

  logout(): void {
    this.auth
      .logout()
      .catch((err) => console.error('Logout error:', err))
      .finally(() => {
        this.cart.clear();
        this.toast.info('Vous avez été déconnecté. Le panier a été vidé.');
        this.router.navigate(['/']);
      });
  }
}
