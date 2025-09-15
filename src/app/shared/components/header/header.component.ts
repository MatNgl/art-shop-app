import { Component, inject, signal, computed, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationStart } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../features/auth/services/auth';
import { CartStore } from '../../../features/cart/services/cart-store';
import { FavoritesStore } from '../../../features/favorites/services/favorites-store';
import { OrderStore } from '../../../features/cart/services/order-store';
import { PricePipe } from '../../pipes/price.pipe';
import { ProductService } from '../../../features/catalog/services/product';
import type { QuickSuggestion } from '../../../features/catalog/services/product';
import { ToastService } from '../../services/toast.service';

interface RecentLite {
  id: number;
  title: string;
  image?: string;
  artistName?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PricePipe],
  styleUrls: ['./header.component.scss'],
  template: `
    <!-- Header FIXE -->
    <header class="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div class="w-full px-3 sm:px-4">
        <!-- 3 zones: gauche / centre / droite -->
        <div class="flex items-center justify-between h-16">
          <!-- Zone gauche : logo + nom du site (cliquable) -->
          <a
            routerLink="/"
            aria-label="Aller à l'accueil"
            class="flex items-center gap-2 sm:gap-3 shrink-0 hover:opacity-95"
          >
            <div
              class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-sm"
            >
              <span class="text-white font-bold text-sm">AS</span>
            </div>
            <span class="text-base sm:text-lg md:text-xl font-extrabold text-gray-900">
              Art Shop
            </span>
          </a>

          <!-- Zone centre : recherche centrée -->
          <div class="flex-1 flex justify-center px-2 sm:px-4">
            <div class="relative w-full max-w-xl" (keydown.escape)="closeSearch()" tabindex="0">
              <form (submit)="submitSearch($event)" class="relative">
                <input
                  type="search"
                  [(ngModel)]="headerSearch"
                  name="q"
                  (input)="onHeaderSearchChange()"
                  (focus)="openSearch()"
                  [placeholder]="
                    isAdminMode()
                      ? 'Rechercher (produit, artiste, commande…)'
                      : 'Rechercher une œuvre, un artiste, une technique…'
                  "
                  class="w-full pl-11 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autocomplete="off"
                />
                <!-- loupe -->
                <i
                  class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                ></i>
                <!-- clear -->
                <button
                  *ngIf="headerSearch"
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-slate-500 hover:text-slate-700"
                  (click)="clearSearch()"
                  aria-label="Effacer la recherche"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </form>

              <!-- Suggestions -->
              <div
                *ngIf="
                  showSuggestions() &&
                  (suggestions.length || (!isAdminMode() && recentProducts().length))
                "
                class="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50 overflow-hidden"
              >
                <!-- Récents (site uniquement, si pas de terme saisi) -->
                <div
                  *ngIf="!isAdminMode() && recentProducts().length && !headerSearch.trim()"
                  class="p-3 border-b"
                >
                  <div class="text-xs font-semibold text-gray-500 mb-2">Récemment consultés</div>
                  <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <li *ngFor="let r of recentProducts()">
                      <button
                        type="button"
                        class="w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                        (click)="openRecent(r)"
                      >
                        <img
                          *ngIf="r.image"
                          [src]="r.image"
                          alt=""
                          class="w-8 h-8 rounded object-cover"
                        />
                        <div class="min-w-0">
                          <div class="truncate text-sm text-gray-900">{{ r.title }}</div>
                          <div *ngIf="r.artistName" class="truncate text-xs text-gray-500">
                            {{ r.artistName }}
                          </div>
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>

                <!-- Résultats -->
                <ul *ngIf="suggestions.length" class="max-h-96 overflow-auto">
                  <li *ngFor="let s of suggestions" class="suggestion-item">
                    <button
                      type="button"
                      class="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50"
                      (click)="applySuggestion(s)"
                    >
                      <img
                        *ngIf="s.type === 'product' && s.image"
                        [src]="s.image"
                        alt="Produit"
                        class="w-6 h-6 rounded object-cover"
                      />
                      <img
                        *ngIf="s.type === 'artist' && s.image"
                        [src]="s.image"
                        alt="Artiste"
                        class="w-6 h-6 rounded-full object-cover"
                      />
                      <span *ngIf="s.type === 'tag'" class="text-gray-500 font-bold">#</span>
                      <span class="label truncate">{{ s.label }}</span>
                    </button>
                  </li>
                  <li class="see-all">
                    <button
                      type="button"
                      class="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50"
                      (click)="goToCatalogWithSearch(headerSearch)"
                    >
                      Voir tous les résultats pour “{{ headerSearch }}”
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Zone droite : actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Site : Favoris + Panier (si NON admin) -->
            <ng-container *ngIf="!isAdminUser(); else adminActions">
              <a
                routerLink="/profile/favorites"
                class="group relative p-2 rounded-md hover:bg-gray-100"
                aria-label="Mes favoris"
                (click)="guardFavorites($event)"
              >
                <i class="fa-solid fa-heart text-rose-600 group-hover:text-rose-700"></i>
                @if (favoritesCount() > 0) {
                <span
                  class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-pink-600 text-white text-xs flex items-center justify-center"
                  [class.scale-110]="favBadgePulse()"
                >
                  {{ favoritesCount() }}
                </span>
                }
              </a>

              <!-- Panier -->
              <div class="relative">
                <button
                  (click)="toggleCartMenu()"
                  class="group relative p-2 rounded-md hover:bg-gray-100"
                  aria-label="Ouvrir le mini-panier"
                >
                  <i class="fa-solid fa-cart-shopping text-blue-600 group-hover:text-blue-700"></i>
                  @if (cartCount() > 0) {
                  <span
                    class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center"
                    [class.scale-110]="cartBadgePulse()"
                  >
                    {{ cartCount() }}
                  </span>
                  }
                </button>

                @if (showCartMenu()) {
                <div class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">
                  <div class="p-3 border-b flex items-center justify-between">
                    <div class="font-semibold">Mon panier</div>
                    <button
                      class="text-xs text-gray-500 hover:text-gray-700"
                      (click)="closeCartMenu()"
                    >
                      Fermer
                    </button>
                  </div>

                  @if (cart.empty()) {
                  <div class="p-4 text-sm text-gray-600">Votre panier est vide.</div>
                  } @else {
                  <ul class="max-h-80 overflow-auto divide-y">
                    @for (it of cart.items(); track it.productId) {
                    <li class="p-3 flex items-center gap-3">
                      <img
                        [src]="it.imageUrl"
                        [alt]="it.title"
                        class="w-14 h-14 rounded object-cover"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">{{ it.title }}</div>
                        @if (it.artistName) {
                        <div class="text-xs text-gray-500 truncate">{{ it.artistName }}</div>
                        }
                        <div class="text-xs text-gray-600 mt-0.5">
                          x{{ it.qty }} • {{ it.unitPrice | price }}
                        </div>
                      </div>
                      <button
                        class="text-xs text-red-600 hover:text-red-700"
                        (click)="cart.remove(it.productId)"
                      >
                        Retirer
                      </button>
                    </li>
                    }
                  </ul>
                  <div class="p-3 border-t text-sm">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Sous-total</span>
                      <span class="font-semibold text-gray-900">{{ cart.subtotal() | price }}</span>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <a
                        routerLink="/cart"
                        (click)="closeCartMenu()"
                        class="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900"
                        >Voir mon panier</a
                      >
                      <a
                        routerLink="/checkout"
                        (click)="closeCartMenu()"
                        class="inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                        >Commander</a
                      >
                    </div>
                  </div>
                  }
                </div>
                }
              </div>
            </ng-container>

            <!-- Admin : bouton Administration -->
            <ng-template #adminActions>
              <a
                routerLink="/admin/dashboard"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 3a1 1 0 00-1 1v1H6a1 1 0 00-1 1v3h14V6a1 1 0 00-1-1h-4V4a1 1 0 00-1-1h-2zM5 10h14v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8z"
                  />
                </svg>
                Administration
              </a>
            </ng-template>

            <!-- Profil -->
            @if (currentUser()) {
            <div class="relative group">
              <button class="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-600 font-medium text-sm">
                    {{ (currentUser()?.firstName?.[0] || '').toUpperCase() }}
                  </span>
                </div>
                <span class="hidden md:block text-sm font-medium">{{
                  currentUser()?.firstName
                }}</span>
              </button>

              <div
                class="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
              >
                <div class="py-2">
                  <a
                    routerLink="/profile"
                    class="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span>Mon profil</span>
                  </a>

                  <!-- Masqué pour un admin (pas de commandes/favoris/panier) -->
                  <a
                    *ngIf="!isAdminUser()"
                    routerLink="/profile/orders"
                    class="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span>Mes commandes</span>
                    <span
                      class="ml-3 inline-flex items-center px-2 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {{ ordersCount() }}
                    </span>
                  </a>
                  <a
                    *ngIf="!isAdminUser()"
                    routerLink="/profile/favorites"
                    class="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span>Mes favoris</span>
                    <span
                      class="ml-3 inline-flex items-center px-2 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {{ favoritesCount() }}
                    </span>
                  </a>
                  <a
                    *ngIf="!isAdminUser()"
                    routerLink="/cart"
                    class="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span>Mon panier</span>
                    <span
                      class="ml-3 inline-flex items-center px-2 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {{ cartCount() }}
                    </span>
                  </a>

                  <button
                    (click)="logout()"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
            } @else {
            <div class="flex items-center gap-2">
              <a
                routerLink="/auth/login"
                class="text-gray-700 hover:text-blue-600 text-sm font-medium"
              >
                Connexion
              </a>
              <a
                routerLink="/auth/register"
                class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                S'inscrire
              </a>
            </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private fav = inject(FavoritesStore);
  cart = inject(CartStore);
  private ordersStore = inject(OrderStore);
  private router = inject(Router);
  private productService = inject(ProductService);

  private _currentUrl = signal<string>('');
  isAdminMode = computed(() => this._currentUrl().startsWith('/admin'));
  currentUser = this.authService.currentUser$;

  isAdminUser = computed(() => (this.currentUser()?.role ?? '') === 'admin');

  favoritesCount = this.fav.count;
  cartCount = this.cart.count;
  ordersCount = this.ordersStore.count;

  private lastFavCount = 0;
  private lastCartCount = 0;
  favBadgePulse = signal(false);
  cartBadgePulse = signal(false);

  private _showCartMenu = signal(false);
  showCartMenu = computed(() => this._showCartMenu());

  headerSearch = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;
  suggestions: QuickSuggestion[] = [];
  private _showSuggestions = signal(false);
  showSuggestions = this._showSuggestions.asReadonly();

  private _recentProducts = signal<RecentLite[]>([]);
  recentProducts = this._recentProducts.asReadonly();

  constructor() {
    effect(() => {
      const c = this.favoritesCount();
      if (c !== this.lastFavCount) this.pulse(this.favBadgePulse);
      this.lastFavCount = c;
    });
    effect(() => {
      const c = this.cartCount();
      if (c !== this.lastCartCount) this.pulse(this.cartBadgePulse);
      this.lastCartCount = c;
    });
  }

  async ngOnInit() {
    this._currentUrl.set(this.router.url);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this._currentUrl.set(e.url);
        this.closeCartMenu();
        this._showSuggestions.set(false);
      }
    });

    if (!this.isAdminMode()) this.loadRecentFromStorage();
  }

  openSearch() {
    this._showSuggestions.set(true);
  }
  closeSearch() {
    this._showSuggestions.set(false);
  }
  clearSearch() {
    this.headerSearch = '';
    this.suggestions = [];
    this.closeSearch();
  }

  onHeaderSearchChange() {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    const term = this.headerSearch.trim();
    if (!term) {
      this.suggestions = [];
      return;
    }
    this.searchDebounce = setTimeout(async () => {
      this.suggestions = await this.productService.quickSearchSuggestions(term, 8);
      this.openSearch();
    }, 200);
  }

  guardFavorites(event: MouseEvent): void {
    // Bloque si l'utilisateur n'est pas connecté
    if (!this.currentUser()) {
      event.preventDefault();
      this.toast.requireAuth('favorites', '/profile/favorites');
    }
  }

  applySuggestion(s: QuickSuggestion) {
    if (s.type === 'product') {
      const id = Number(s.value);
      if (!Number.isNaN(id)) this.router.navigate(['/product', id]);
    } else if (s.type === 'artist') {
      this.router.navigate(['/catalog'], { queryParams: { artist: s.value, page: 1 } });
    } else {
      this.router.navigate(['/catalog'], { queryParams: { search: s.value, page: 1 } });
    }
    this.clearSearch();
  }

  submitSearch(e: Event) {
    e.preventDefault();
    const t = this.headerSearch.trim();
    if (!t) return;
    this.goToCatalogWithSearch(t);
  }
  goToCatalogWithSearch(term: string) {
    this.router.navigate(['/catalog'], { queryParams: { search: term, page: 1 } });
    this.clearSearch();
  }

  toggleCartMenu() {
    this._showCartMenu.update((v) => !v);
  }
  closeCartMenu() {
    this._showCartMenu.set(false);
  }

  openRecent(r: RecentLite) {
    this.router.navigate(['/product', r.id]);
    this.clearSearch();
  }
  private loadRecentFromStorage() {
    const raw = localStorage.getItem('recent_products');
    if (!raw) return;
    const arr = JSON.parse(raw) as RecentLite[];
    const map = new Map<number, RecentLite>();
    for (const p of arr) map.set(p.id, p);
    this._recentProducts.set(Array.from(map.values()).slice(0, 10));
  }

  private pulse(sig: ReturnType<typeof signal<boolean>>) {
    sig.set(true);
    setTimeout(() => sig.set(false), 220);
  }

  private toast = inject(ToastService);

  async logout() {
    try {
      await this.authService.logout();
      this.cart.clear(); // 👈 vide le panier à la déconnexion
      this.toast.info('Vous avez été déconnecté. Le panier a été vidé.');
      this.router.navigate(['/']);
    } catch (e) {
      console.error(e);
      this.toast.error('Échec de la déconnexion.');
    }
  }
  goProfile() {
    this.router.navigate(['/profile']);
  }

  @HostListener('document:keydown.escape') onEsc() {
    if (this.showCartMenu()) this.closeCartMenu();
    else this.closeSearch();
  }
}
