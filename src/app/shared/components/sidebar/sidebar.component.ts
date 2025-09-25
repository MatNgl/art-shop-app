import { Component, OnInit, computed, inject, signal, HostBinding, HostListener } from '@angular/core';
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
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styleUrls: ['./sidebar.component.scss'],
  template: `

<!-- Backdrop -->
<div
  class="backdrop"
  *ngIf="isOpen()"
  role="button"
  tabindex="0"
  aria-label="Fermer le menu"
  (click)="close()"
  (keydown.enter)="close()"
  (keydown.space)="close()">
</div>

<!-- Drawer -->
<aside
  id="aside-drawer"
  class="wrap"
  [attr.role]="isOpen() ? 'dialog' : null"
  [attr.aria-modal]="isOpen() ? 'true' : null"
  [attr.aria-hidden]="!isOpen()"
  tabindex="-1">

  <button
  id="aside-close"
  class="close-btn"
  type="button"
  aria-label="Fermer le menu"
  (click)="close()"
  (keydown.enter)="close()"
  (keydown.space)="close()">
  <i class="fa-solid fa-bars" aria-hidden="true"></i>
</button>


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

        <!-- NAV ADMIN -->
        <ng-container *ngIf="showAdminNav(); else siteNav">
          <nav class="py-3 space-y-1 nav-scroll">
            <a routerLink="/admin/dashboard" routerLinkActive="is-active" class="nav-item" (click)="close()">
              <i class="fa-solid fa-chart-line icon"></i><span class="label">Dashboard</span>
            </a>
            <a routerLink="/admin/products" routerLinkActive="is-active" class="nav-item relative" (click)="close()">
              <i class="fa-solid fa-cubes icon"></i><span class="label">Produits</span>
              <span *ngIf="adminProductsCount() > 0" class="absolute right-4 badge bg-gray-200 text-gray-700">{{ adminProductsCount() }}</span>
            </a>
            <a routerLink="/admin/artists" routerLinkActive="is-active" class="nav-item relative" (click)="close()">
              <i class="fa-solid fa-palette icon"></i><span class="label">Artistes</span>
              <span *ngIf="adminArtistsCount() > 0" class="absolute right-4 badge bg-indigo-600 text-white">{{ adminArtistsCount() }}</span>
            </a>
            <a routerLink="/admin/orders" routerLinkActive="is-active" class="nav-item relative" (click)="close()">
              <i class="fa-solid fa-bag-shopping icon"></i><span class="label">Commandes</span>
              <span *ngIf="adminOrdersCount() > 0" class="absolute right-4 badge bg-red-600 text-white">{{ adminOrdersCount() }}</span>
            </a>
            <a routerLink="/admin/users" routerLinkActive="is-active" class="nav-item relative" (click)="close()">
              <i class="fa-solid fa-users icon"></i><span class="label">Utilisateurs</span>
              <span *ngIf="adminUsersCount() > 0" class="absolute right-4 badge bg-emerald-600 text-white">{{ adminUsersCount() }}</span>
            </a>
            <a routerLink="/admin/categories" routerLinkActive="is-active" class="nav-item relative" (click)="close()">
              <i class="fa-solid fa-tags icon"></i><span class="label">Catégories</span>
              <span *ngIf="adminCategoriesCount() > 0" class="absolute right-4 badge bg-amber-600 text-white">{{ adminCategoriesCount() }}</span>
            </a>

            <div class="section-label">Paramètres</div>
            <a routerLink="/" class="nav-item" (click)="close()">
              <i class="fa-solid fa-arrow-up-right-from-square icon"></i><span class="label">Voir le site</span>
            </a>

            <button
              type="button"
              (click)="logout()"
              (keydown.enter)="logout()"
              (keydown.space)="logout()"
              class="nav-item danger w-full text-left">
              <i class="fa-solid fa-right-from-bracket text-red-600 w-5 text-center"></i>
              <span class="label text-red-600">Se déconnecter</span>
            </button>
          </nav>
        </ng-container>

        <!-- NAV SITE -->
        <ng-template #siteNav>
          <nav class="py-3 space-y-1 nav-scroll">
            <div class="section-label">Découvrir</div>

            <a [routerLink]="['/catalog']" [queryParams]="{ sort: 'createdAt_desc', page: 1 }" routerLinkActive="is-active" class="item" (click)="close()">
              <i class="fa-solid fa-wand-magic-sparkles w-5 text-center text-violet-600"></i><span class="label">Nouveautés</span>
            </a>

            <a [routerLink]="['/catalog']" [queryParams]="{ page: 1, sort: 'title' }" routerLinkActive="is-active" class="item" (click)="close()">
              <i class="fa-solid fa-book-open w-5 text-center text-slate-600"></i><span class="label">Tout le catalogue</span>
            </a>

            <hr class="section-sep" />

            <div class="section-label">Catégories</div>
            <ng-container *ngFor="let cat of categories">
              <a [routerLink]="['/catalog']" [queryParams]="{ category: cat.slug, page: 1 }" routerLinkActive="is-active" class="item justify-between" (click)="close()">
                <span class="inline-flex items-center gap-2">
                  <i class="fa-solid w-5 text-center" [ngClass]="[getCategoryFaIcon(cat), getCategoryColorClass(cat)]"></i>
                  <span class="label">{{ cat.name }}</span>
                </span>
                <span class="badge bg-gray-100 text-gray-700">{{ countFor(cat) }}</span>
              </a>
            </ng-container>

            <hr class="section-sep" />

            <div class="section-label">Raccourcis</div>

            <a routerLink="/profile" routerLinkActive="is-active" class="item" (click)="guardProfile($event); close()">
              <i class="fa-solid fa-user w-5 text-center text-slate-600"></i><span class="label">Mon compte</span>
            </a>

            <a routerLink="/favorites" routerLinkActive="is-active" class="item relative" (click)="guardFavorites($event); close()">
              <i class="fa-solid fa-heart w-5 text-center text-rose-600"></i><span class="label">Mes favoris</span>
              <span *ngIf="favoritesCount() > 0" class="absolute right-4 badge bg-pink-600 text-white">{{ favoritesCount() }}</span>
            </a>

            <a routerLink="/cart" routerLinkActive="is-active" class="item relative" (click)="close()">
              <i class="fa-solid fa-cart-shopping w-5 text-center text-blue-600"></i><span class="label">Mon panier</span>
              <span *ngIf="cartCount() > 0" class="absolute right-4 badge bg-blue-600 text-white">{{ cartCount() }}</span>
            </a>

            <ng-container *ngIf="isLoggedIn(); else guest">
              <a routerLink="/profile/orders" routerLinkActive="is-active" class="item relative" (click)="close()">
                <i class="fa-solid fa-bag-shopping w-5 text-center text-slate-600"></i><span class="label">Mes commandes</span>
                <span class="absolute right-4 badge bg-gray-200 text-gray-700">{{ ordersCount() }}</span>
              </a>
              <button
                type="button"
                (click)="logout()"
                (keydown.enter)="logout()"
                (keydown.space)="logout()"
                class="item danger w-full text-left">
                <i class="fa-solid fa-right-from-bracket w-5 text-center text-red-600"></i>
                <span class="label text-red-600">Se déconnecter</span>
              </button>
            </ng-container>

            <ng-template #guest>
              <a routerLink="/auth/login" routerLinkActive="is-active" class="item" (click)="close()">
                <i class="fa-solid fa-lock w-5 text-center text-slate-600"></i><span class="label">Se connecter</span>
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

  isAdminRoute = signal(false);
  isAdminRole = signal(false);

  favoritesCount = this.fav.count;
  cartCount = this.cart.count;
  ordersCount = this.orders.count;

  adminOrdersCount = signal(0);
  adminUsersCount = signal(0);
  adminArtistsCount = signal(0);
  adminProductsCount = signal(0);
  adminCategoriesCount = signal(0);

  private sidebarState = inject(SidebarStateService);
  isOpen = this.sidebarState.isOpen;

  @HostBinding('class.open') get openClass() { return this.isOpen(); }


  ngOnInit(): void {
    this.isAdminRole.set(this.auth.isAdmin());
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));

    this.router.events.subscribe(() => {
      this.isAdminRoute.set(this.router.url.startsWith('/admin'));
      if (this.showAdminNav()) this.loadAdminBadges();
      this.sidebarState.close(); // auto-ferme à chaque navigation
    });


    void this.loadCategoriesAndCounts();
    if (this.showAdminNav()) void this.loadAdminBadges();
  }

  @HostListener('document:keydown.escape') onEsc() {
    if (this.isOpen()) this.close();
  }

  toggle() { this.sidebarState.toggle(); }
  open() {
    this.sidebarState.open();
    // focus sur le bouton fermer quand le panneau est visible
    setTimeout(() => document.getElementById('aside-close')?.focus(), 0);
  }

  close() {
    this.sidebarState.close();
    // essaie de rendre le focus au burger du header si présent
    setTimeout(() => document.getElementById('header-burger')?.focus(), 0);
  }



  // Guards
  guardProfile(event: MouseEvent): void {
    if (!this.isLoggedIn()) { event.preventDefault(); this.toast.requireAuth('profile', '/profile'); }
  }


  guardFavorites(event: MouseEvent): void {
    if (!this.isLoggedIn()) { event.preventDefault(); this.toast.requireAuth('favorites', '/profile/favorites'); }
  }

  // Helpers
  showAdminNav = computed(() => this.isAdminRole() && this.isAdminRoute());
  isLoggedIn = () => !!this.auth.getCurrentUser();

  displayName(): string {
    const u = this.auth.getCurrentUser(); if (!u) return 'Invité';
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
  }
  initials(): string {
    const u = this.auth.getCurrentUser(); if (!u) return 'AS';
    const a = (u.firstName?.[0] || '').toUpperCase(); const b = (u.lastName?.[0] || '').toUpperCase();
    return a + b || 'AS';
  }

  private async loadCategoriesAndCounts(): Promise<void> {
    try {
      const [cats, counts] = await Promise.all([this.categoryService.getAll(), this.products.getCategoryCounts()]);
      this.categories = cats; this.categoryCounts = counts;
      const totalProducts = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);
      this.adminProductsCount.set(totalProducts);
    } catch { this.categories = []; this.categoryCounts = {}; }
  }

  private async loadAdminBadges(): Promise<void> {
    try { const users = await this.auth.getAllUsers(); this.adminUsersCount.set(users.length); } catch { this.adminUsersCount.set(0); }
    try { const all = await this.adminOrders.getAll(); this.adminOrdersCount.set(all.length); } catch { this.adminOrdersCount.set(0); }
    try { const total = await this.artists.getCount(); this.adminArtistsCount.set(total); } catch { this.adminArtistsCount.set(0); }
    try { const n = await this.categoryService.getCount(); this.adminCategoriesCount.set(n); }
    catch { try { const list = await this.categoryService.getAll(); this.adminCategoriesCount.set(list.length); } catch { this.adminCategoriesCount.set(0); } }
  }

  getCategoryFaIcon(cat: Category): string {
    if (cat.icon) return cat.icon;
    const map: Record<string, string> = {
      dessin: 'fa-pencil', peinture: 'fa-palette', 'art-numerique': 'fa-laptop-code',
      photographie: 'fa-camera', sculpture: 'fa-cubes', 'mixed-media': 'fa-masks-theater',
    };
    return map[cat.slug] ?? 'fa-tags';
  }
  getCategoryColorClass(cat: Category): string {
    const map: Record<string, string> = {
      dessin: 'text-amber-600', peinture: 'text-blue-600', 'art-numerique': 'text-fuchsia-600',
      photographie: 'text-emerald-600', sculpture: 'text-orange-600', 'mixed-media': 'text-violet-600',
    };
    return map[cat.slug] || 'text-slate-600';
  }
  countFor(cat: Category): number {
    return this.categoryCounts[cat.id] ?? cat.productIds?.length ?? 0;
  }
  logout(): void {
    this.auth
      .logout()
      .catch(err => console.error('Logout error:', err))
      .finally(() => this.router.navigate(['/']));
  }

}
