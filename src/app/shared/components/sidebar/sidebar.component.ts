import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  DestroyRef,
  effect,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CdkTrapFocus } from '@angular/cdk/a11y';

import { AuthService } from '../../../features/auth/services/auth';
import { OrderStore } from '../../../features/cart/services/order-store';
import { ProductService } from '../../../features/catalog/services/product';
import { FavoritesStore } from '../../../features/favorites/services/favorites-store';
import { CartStore } from '../../../features/cart/services/cart-store';
import { OrderService } from '../../../features/orders/services/order';
import { CategoryService } from '../../../features/catalog/services/category';
import { Category } from '../../../features/catalog/models/category.model';
import { ToastService } from '../../services/toast.service';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { CategoryTreeComponent } from '../category-tree/category-tree.component';
import { FormatService } from '../../../features/catalog/services/format.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, CdkTrapFocus, CategoryTreeComponent],
  styleUrls: ['./sidebar.component.scss'],
  template: `
    <!-- Bouton hamburger mobile -->
    <button
      class="mobile-toggle"
      type="button"
      (click)="toggleMobile()"
      [class.active]="sidebarState.isOpen()"
      aria-label="Menu"
      aria-controls="app-sidebar"
      [attr.aria-expanded]="sidebarState.isOpen()"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- Overlay mobile -->
    <div
      class="mobile-overlay"
      [class.visible]="sidebarState.isOpen()"
      (click)="closeMobile()"
      (keydown.escape)="closeMobile()"
      (keyup.enter)="closeMobile()"
      (keyup.space)="closeMobile()"
      tabindex="0"
      role="button"
      aria-label="Fermer le menu"
      [attr.aria-hidden]="!sidebarState.isOpen()"
    ></div>

    <div class="sidebar-wrapper">
      <div
        id="app-sidebar"
        class="sidebar"
        [class.expanded]="forceExpanded()"
        [class.mobile-open]="sidebarState.isOpen()"
        (mouseenter)="onSidebarHover(true)"
        (mouseleave)="onSidebarHover(false)"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="sidebarState.isOpen()"
      >
        <!-- Header -->
        <div class="sidebar-header">
          <a routerLink="/" class="logo-container" (click)="closeMobileOnNav()">
            <div class="logo">
              <span style="color: white; font-size: 14px; font-weight: bold;">AS</span>
            </div>
            <span class="logo-text">Art Shop</span>
          </a>

          <!-- Bouton fermer mobile -->
          <button class="mobile-close" type="button" (click)="closeMobile()" aria-label="Fermer">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
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
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-chart-line" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Dashboard</span>
              </a>

              <a
                routerLink="/admin/products"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Produits"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-cubes" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Produits</span>
                <span *ngIf="adminProductsCount() > 0" class="nav-badge badge-gray">
                  {{ adminProductsCount() }}
                </span>
              </a>

              <a
                routerLink="/admin/orders"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Commandes"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Commandes</span>
                <span *ngIf="adminOrdersCount() > 0" class="nav-badge badge-danger">
                  {{ adminOrdersCount() }}
                </span>
              </a>

              <a
                routerLink="/admin/users"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Utilisateurs"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-users" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Utilisateurs</span>
                <span *ngIf="adminUsersCount() > 0" class="nav-badge badge-success">
                  {{ adminUsersCount() }}
                </span>
              </a>

              <a
                routerLink="/admin/categories"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Catégories"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-tags" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Catégories</span>
                <span *ngIf="adminCategoriesCount() > 0" class="nav-badge badge-warning">
                  {{ adminCategoriesCount() }}
                </span>
              </a>

              <a
                routerLink="/admin/promotions"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Promotions"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-percent" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Promotions</span>
              </a>

              <a
                routerLink="/admin/formats"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Formats"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-ruler-combined" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Formats</span>
                <span *ngIf="adminFormatsCount() > 0" class="nav-badge badge-gray">
                  {{ adminFormatsCount() }}
                </span>
              </a>
            </div>

            <div class="nav-section">
              <div class="section-title">Actions</div>

              <a
                routerLink="/"
                class="nav-item"
                data-tooltip="Voir le site"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
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
                [queryParams]="{ page: 1, sort: 'title' }"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Tous nos produits"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-book-open" style="color:#64748B" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Tous nos produits</span>
              </a>
              <a
                [routerLink]="['/catalog']"
                [queryParams]="{ sort: 'createdAt_desc', page: 1 }"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Nouveautés"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i
                    class="fa-solid fa-wand-magic-sparkles"
                    style="color:#8B5CF6"
                    aria-hidden="true"
                  ></i>
                </div>
                <span class="nav-label">Nouveautés</span>
              </a>

              <a
                [routerLink]="['/catalog']"
                [queryParams]="{ promo: 'true', page: 1 }"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Promotions"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-percent" style="color:#EF4444" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Promotions</span>
              </a>
            </div>

            <div class="nav-section">
              <div class="section-title">Navigation</div>

              <app-category-tree
                [categories]="categories"
                [closeMobileOnNav]="getCloseMobileOnNavFn()"
              ></app-category-tree>
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
                  <i class="fa-solid fa-user" style="color:#64748B" aria-hidden="true"></i>
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
                  <i class="fa-solid fa-heart" style="color:#EC4899" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Mes favoris</span>
                <span *ngIf="favoritesCount() > 0" class="nav-badge badge-pink">
                  {{ favoritesCount() }}
                </span>
              </a>

              <a
                routerLink="/cart"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Mon panier"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-cart-shopping" style="color:#3B82F6" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Mon panier</span>
                <span *ngIf="cartCount() > 0" class="nav-badge badge-primary">
                  {{ cartCount() }}
                </span>
              </a>

              <a
                *ngIf="isLoggedIn()"
                routerLink="/profile/orders"
                routerLinkActive="active"
                class="nav-item"
                data-tooltip="Mes commandes"
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-bag-shopping" style="color:#64748B" aria-hidden="true"></i>
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
                (click)="closeMobileOnNav()"
              >
                <div class="nav-icon">
                  <i class="fa-solid fa-sign-in-alt" style="color:#10B981" aria-hidden="true"></i>
                </div>
                <span class="nav-label">Se connecter</span>
              </a>
            </div>
          </ng-container>
        </div>

        <!-- Footer -->
        <div class="sidebar-footer" *ngIf="isLoggedIn()">
          <a
            class="user-profile"
            routerLink="/profile"
            (click)="closeMobileOnNav()"
            tabindex="0"
            role="link"
            [attr.aria-label]="'Accéder au profil de ' + displayName()"
          >
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ displayName() }}</div>
              <div class="user-role">{{ currentUser()?.role || 'utilisateur' }}</div>
            </div>
          </a>

          <button
            class="logout-btn"
            type="button"
            (click)="logout()"
            data-tooltip="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <div class="nav-icon">
              <i class="fa-solid fa-sign-out-alt" aria-hidden="true"></i>
            </div>
            <span class="nav-label">Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SidebarComponent implements OnInit {
  @ViewChild(CategoryTreeComponent) categoryTree?: CategoryTreeComponent;

  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  sidebarState = inject(SidebarStateService);

  private orders = inject(OrderStore);
  private products = inject(ProductService);
  private fav = inject(FavoritesStore);
  private cart = inject(CartStore);

  private adminOrders = inject(OrderService);
  private categoryService = inject(CategoryService);

  private formatService = inject(FormatService);
  adminFormatsCount = signal(0);

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
  adminProductsCount = signal(0);
  adminCategoriesCount = signal(0);

  constructor() {
    // Body scroll lock réactif
    const stop = effect(() => {
      document.body.style.overflow = this.sidebarState.isOpen() ? 'hidden' : '';
    });
    this.destroyRef.onDestroy(() => stop.destroy());
  }

  ngOnInit(): void {
    this.isAdminRole.set(this.auth.isAdmin());
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));

    let previousUrl = this.router.url;

    const sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const currentUrl = this.router.url;
      this.isAdminRoute.set(currentUrl.startsWith('/admin'));
      if (this.showAdminNav()) this.loadAdminBadges();
      this.closeMobileOnNav(); // referme en mobile après navigation

      // Rafraîchir les catégories dans ces cas :
      // 1. Navigation depuis /admin/categories (création/modification)
      // 2. Navigation depuis une page d'édition/création de catégorie
      // 3. Navigation depuis l'admin vers le site utilisateur
      const wasOnAdminCategories =
        previousUrl.includes('/admin/categories') ||
        previousUrl.includes('/admin/create-category') ||
        previousUrl.includes('/admin/edit-category');
      const nowOnUserSite = !currentUrl.startsWith('/admin');

      if (wasOnAdminCategories || (wasOnAdminCategories && nowOnUserSite)) {
        void this.loadCategoriesAndCounts();
      }

      previousUrl = currentUrl;
    });

    this.destroyRef.onDestroy(() => sub.unsubscribe());

    void this.loadCategoriesAndCounts();
    if (this.showAdminNav()) void this.loadAdminBadges();
  }

  // Gestion mobile
  toggleMobile(): void {
    this.sidebarState.toggle();
  }

  closeMobile(): void {
    this.sidebarState.close();
  }

  closeMobileOnNav(): void {
    if (window.innerWidth <= 768) {
      this.closeMobile();
    }
  }

  // Guards
  guardProfile(event: MouseEvent): void {
    if (!this.isLoggedIn()) {
      event.preventDefault();
      event.stopPropagation();
      this.toast.requireAuth('profile', '/profile');
    } else {
      this.closeMobileOnNav();
    }
  }

  guardFavorites(event: MouseEvent): void {
    if (!this.isLoggedIn()) {
      event.preventDefault();
      event.stopPropagation();
      this.toast.requireAuth('favorites', '/favorites');
    } else {
      this.closeMobileOnNav();
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
      // Filtrer uniquement les catégories actives pour l'affichage public
      this.categories = cats.filter((c) => c.isActive);
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
    try {
      const n = await this.formatService.getCount();
      this.adminFormatsCount.set(n);
    } catch {
      this.adminFormatsCount.set(0);
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

  getCloseMobileOnNavFn(): () => void {
    return () => this.closeMobileOnNav();
  }

  onSidebarHover(hovered: boolean): void {
    this.categoryTree?.onSidebarHoverChange(hovered);
  }

  logout(): void {
    this.auth
      .logout()
      .catch((err) => console.error('Logout error:', err))
      .finally(() => {
        this.cart.clear();
        this.toast.info('Vous avez été déconnecté. Le panier a été vidé.');
        this.closeMobile();
        this.router.navigate(['/']);
      });
  }
}
