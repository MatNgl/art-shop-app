// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, OnInit, computed, inject, signal, HostBinding } from '@angular/core';
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

        <!-- NAV ADMIN -->
        <ng-container *ngIf="showAdminNav(); else siteNav">
          <nav class="py-3 space-y-1 nav-scroll">
            <a routerLink="/admin/dashboard" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-chart-line icon"></i>
              <span class="label">Dashboard</span>
            </a>

            <a routerLink="/admin/products" routerLinkActive="is-active" class="nav-item relative">
              <i class="fa-solid fa-cubes icon"></i>
              <span class="label">Produits</span>
              <span
                *ngIf="adminProductsCount() > 0"
                class="absolute right-4 badge bg-gray-200 text-gray-700"
              >
                {{ adminProductsCount() }}
              </span>
            </a>

            <a routerLink="/admin/artists" routerLinkActive="is-active" class="nav-item relative">
              <i class="fa-solid fa-palette icon"></i>
              <span class="label">Artistes</span>
              <span
                *ngIf="adminArtistsCount() > 0"
                class="absolute right-4 badge bg-indigo-600 text-white"
              >
                {{ adminArtistsCount() }}
              </span>
            </a>

            <a routerLink="/admin/orders" routerLinkActive="is-active" class="nav-item relative">
              <i class="fa-solid fa-bag-shopping icon"></i>
              <span class="label">Commandes</span>
              <span
                *ngIf="adminOrdersCount() > 0"
                class="absolute right-4 badge bg-red-600 text-white"
              >
                {{ adminOrdersCount() }}
              </span>
            </a>

            <a routerLink="/admin/users" routerLinkActive="is-active" class="nav-item relative">
              <i class="fa-solid fa-users icon"></i>
              <span class="label">Utilisateurs</span>
              <span
                *ngIf="adminUsersCount() > 0"
                class="absolute right-4 badge bg-emerald-600 text-white"
              >
                {{ adminUsersCount() }}
              </span>
            </a>

            <a
              routerLink="/admin/categories"
              routerLinkActive="is-active"
              class="nav-item relative"
            >
              <i class="fa-solid fa-tags icon"></i>
              <span class="label">Catégories</span>
              <span
                *ngIf="adminCategoriesCount() > 0"
                class="absolute right-4 badge bg-amber-600 text-white"
              >
                {{ adminCategoriesCount() }}
              </span>
            </a>

            <div class="section-label">Paramètres</div>

            <a routerLink="/" class="nav-item">
              <i class="fa-solid fa-arrow-up-right-from-square icon"></i>
              <span class="label">Voir le site</span>
            </a>

            <button type="button" (click)="logout()" class="nav-item danger w-full text-left">
              <i class="fa-solid fa-right-from-bracket text-red-600 w-5 text-center"></i>
              <span class="label text-red-600">Se déconnecter</span>
            </button>
          </nav>
        </ng-container>

        <!-- NAV SITE -->
        <ng-template #siteNav>
          <nav class="py-3 space-y-1 nav-scroll">
            <div class="section-label">Découvrir</div>

            <a
              [routerLink]="['/catalog']"
              [queryParams]="{ sort: 'createdAt_desc', page: 1 }"
              routerLinkActive="is-active"
              class="item"
            >
              <i class="fa-solid fa-wand-magic-sparkles w-5 text-center text-violet-600"></i>
              <span class="label">Nouveautés</span>
            </a>

            <a
              [routerLink]="['/catalog']"
              [queryParams]="{ page: 1, sort: 'title' }"
              routerLinkActive="is-active"
              class="item"
            >
              <i class="fa-solid fa-book-open w-5 text-center text-slate-600"></i>
              <span class="label">Tout le catalogue</span>
            </a>

            <hr class="section-sep" />

            <div class="section-label">Catégories</div>
            <ng-container *ngFor="let cat of categories">
              <a
                [routerLink]="['/catalog']"
                [queryParams]="{ category: cat.slug, page: 1 }"
                routerLinkActive="is-active"
                class="item justify-between"
              >
                <span class="inline-flex items-center gap-2">
                  <i
                    class="fa-solid w-5 text-center"
                    [ngClass]="[getCategoryFaIcon(cat), getCategoryColorClass(cat)]"
                  ></i>
                  <span class="label">{{ cat.name }}</span>
                </span>
                <span class="badge bg-gray-100 text-gray-700">
                  {{ countFor(cat) }}
                </span>
              </a>
            </ng-container>

            <hr class="section-sep" />

            <div class="section-label">Raccourcis</div>

            <a routerLink="/profile" routerLinkActive="is-active" class="item">
              <i class="fa-solid fa-user w-5 text-center text-slate-600"></i>
              <span class="label">Mon compte</span>
            </a>

            <a routerLink="/profile/favorites" routerLinkActive="is-active" class="item relative">
              <i class="fa-solid fa-heart w-5 text-center text-rose-600"></i>
              <span class="label">Mes favoris</span>
              <span
                *ngIf="favoritesCount() > 0"
                class="absolute right-4 badge bg-pink-600 text-white"
              >
                {{ favoritesCount() }}
              </span>
            </a>

            <a routerLink="/cart" routerLinkActive="is-active" class="item relative">
              <i class="fa-solid fa-cart-shopping w-5 text-center text-blue-600"></i>
              <span class="label">Mon panier</span>
              <span *ngIf="cartCount() > 0" class="absolute right-4 badge bg-blue-600 text-white">
                {{ cartCount() }}
              </span>
            </a>

            <ng-container *ngIf="isLoggedIn(); else guest">
              <a routerLink="/profile/orders" routerLinkActive="is-active" class="item relative">
                <i class="fa-solid fa-box w-5 text-center text-slate-600"></i>
                <span class="label">Mes commandes</span>
                <span class="absolute right-4 badge bg-gray-200 text-gray-700">
                  {{ ordersCount() }}
                </span>
              </a>
              <button type="button" (click)="logout()" class="item danger w-full text-left">
                <i class="fa-solid fa-right-from-bracket w-5 text-center text-red-600"></i>
                <span class="label text-red-600">Se déconnecter</span>
              </button>
            </ng-container>

            <ng-template #guest>
              <a routerLink="/auth/login" routerLinkActive="is-active" class="item">
                <i class="fa-solid fa-lock w-5 text-center text-slate-600"></i>
                <span class="label">Se connecter</span>
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

  // Côté site
  private orders = inject(OrderStore);
  private products = inject(ProductService);
  private fav = inject(FavoritesStore);
  private cart = inject(CartStore);

  // Côté admin
  private adminOrders = inject(OrderService);
  private artists = inject(ArtistService);
  private categoryService = inject(CategoryService);

  // Catégories réelles
  categories: Category[] = [];
  // Compteurs par categoryId
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

  @HostBinding('class.admin') get adminClass() {
    return this.showAdminNav();
  }

  ngOnInit(): void {
    this.isAdminRole.set(this.auth.isAdmin());
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));
    this.router.events.subscribe(() => {
      this.isAdminRoute.set(this.router.url.startsWith('/admin'));
      if (this.showAdminNav()) this.loadAdminBadges();
    });

    void this.loadCategoriesAndCounts(); // pour le site
    if (this.showAdminNav()) void this.loadAdminBadges(); // au démarrage si déjà en /admin
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
    // Utilisateurs
    try {
      const users = await this.auth.getAllUsers();
      this.adminUsersCount.set(users.length);
    } catch {
      this.adminUsersCount.set(0);
    }

    // Commandes
    try {
      const all = await this.adminOrders.getAll();
      this.adminOrdersCount.set(all.length);
    } catch {
      this.adminOrdersCount.set(0);
    }

    // Artistes
    try {
      const total = await this.artists.getCount();
      this.adminArtistsCount.set(total);
    } catch {
      this.adminArtistsCount.set(0);
    }

    // Catégories
    try {
      const n = await this.categoryService.getCount();
      this.adminCategoriesCount.set(n);
    } catch {
      // fallback si getCount indisponible
      try {
        const list = await this.categoryService.getAll();
        this.adminCategoriesCount.set(list.length);
      } catch {
        this.adminCategoriesCount.set(0);
      }
    }
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

  logout(): void {
    this.auth
      .logout()
      .catch((err) => console.error('Logout error:', err))
      .finally(() => this.router.navigate(['/']));
  }

  // --- Catégories (helpers d'affichage)
  getCategoryFaIcon(cat: Category): string {
    // priorité à l'icône stockée, sinon par slug
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

  getCategoryColorClass(cat: Category): string {
    const map: Record<string, string> = {
      dessin: 'text-amber-600',
      peinture: 'text-blue-600',
      'art-numerique': 'text-fuchsia-600',
      photographie: 'text-emerald-600',
      sculpture: 'text-orange-600',
      'mixed-media': 'text-violet-600',
    };
    return map[cat.slug] || 'text-slate-600';
  }

  countFor(cat: Category): number {
    return this.categoryCounts[cat.id] ?? cat.productIds?.length ?? 0;
  }
}
