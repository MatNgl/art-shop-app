import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  HostListener,
  Input,
} from '@angular/core';
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
}
interface StoredRecent {
  id: number;
  title: string;
  image?: string;
}

type HeaderMode = 'site' | 'admin' | 'auth';
type AuthCta = 'login' | 'register' | null;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PricePipe],
  styleUrls: ['./header.component.scss'],
  template: `
    <header class="fixed top-0 left-0 right-0 z-50 border-b" [class.bg-white]="!glass"
    [class.border-gray-200]="!glass" [class.shadow-sm]="!glass" [class.bg-white/80]="glass"
    [class.backdrop-blur-md]="glass" [class.border-white/20]="glass" >
    <div class="w-full px-4 sm:px-6 header-no-pl" [class.pl-20]="showWithSidebar()">
      <div class="flex items-center justify-between h-16 gap-3">
        <!-- Zone gauche - Logo (titre masqué en mobile) -->
        <div class="flex items-center gap-3 shrink-0 logo-zone">
          <a
            routerLink="/"
            aria-label="Aller à l'accueil"
            class="flex items-center gap-3 hover:opacity-95"
          >
            <div
              class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-sm overflow-hidden"
            >
              <img
                src="assets/brand/pp_image.jpg"
                alt="Logo Art Shop"
                class="w-full h-full object-cover rounded-full"
                width="32"
                height="32"
                loading="eager"
                decoding="async"
              />
            </div>
            <span class="site-title text-lg md:text-xl font-extrabold text-gray-900">
              Art Shop
            </span>
          </a>
        </div>

        <!-- Zone centre : Recherche DESKTOP (masquée en mobile et en mode auth) -->
        <div
          class="search-container-desktop flex-1 flex justify-center px-4"
          *ngIf="headerMode() !== 'auth'"
        >
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
                    ? 'Rechercher (produit, commande…)'
                    : 'Rechercher une œuvre, une technique…'
                "
                class="w-full pl-11 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autocomplete="off"
              />
              <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>

              <button
                *ngIf="headerSearch"
                type="button"
                class="clear-icon p-1 rounded hover:bg-gray-100 text-slate-500 hover:text-slate-700"
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
              class="suggestions"
            >
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
                      </div>
                    </button>
                  </li>
                </ul>
              </div>

              <ul *ngIf="suggestions.length" class="max-h-96 overflow-auto">
                <li *ngFor="let s of suggestions">
                  <button
                    type="button"
                    class="suggestion-item w-full text-left"
                    (click)="applySuggestion(s)"
                    aria-label="Ouvrir la suggestion {{ s.label }}"
                  >
                    <img
                      *ngIf="s.type === 'product' && s.image"
                      [src]="s.image"
                      alt="Produit"
                      class="w-6 h-6 rounded object-cover"
                    />
                    <span *ngIf="s.type === 'product'" class="badge">produit</span>
                    <span *ngIf="s.type === 'tag'" class="badge badge-tag">tag</span>
                    <span class="label truncate">{{ s.label }}</span>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    class="see-all w-full text-left"
                    (click)="goToCatalogWithSearch(headerSearch)"
                    aria-label="Voir tous les résultats pour {{ headerSearch }}"
                  >
                    Voir tous les résultats pour "{{ headerSearch }}"
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Zone droite -->
        <div class="flex items-center gap-2 md:gap-3">
          <!-- Bouton recherche MOBILE (seulement en mode site, pas en auth) -->
          <button
            *ngIf="headerMode() !== 'auth'"
            class="mobile-search-trigger md:hidden"
            (click)="openMobileSearch()"
            aria-label="Rechercher"
          >
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>

          <!-- SITE : Favoris (masqué en mobile) + Panier -->
          <ng-container *ngIf="showSiteActions()">
            <button
              (click)="goToFavorites()"
              class="favorites-btn-mobile group relative p-2 rounded-md hover:bg-gray-100"
              aria-label="Mes favoris"
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
            </button>

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
              <div
                class="cart-dropdown-mobile absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50"
              >
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
                  @for (it of cart.items(); track it.productId + '_' + (it.variantId ?? '')) {
                  <li class="p-3 flex items-center gap-3">
                    <img
                      [src]="it.imageUrl"
                      [alt]="it.title"
                      class="w-14 h-14 rounded object-cover"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900 truncate">
                        {{ it.title }}
                        <span *ngIf="it.variantLabel" class="text-xs text-gray-500">
                          ({{ it.variantLabel }})
                        </span>
                      </div>
                      <div class="text-xs text-gray-600 mt-0.5">
                        x{{ it.qty }} • {{ it.unitPrice | price }}
                      </div>
                    </div>
                    <button
                      class="text-xs text-red-600 hover:text-red-700"
                      (click)="$event.stopPropagation(); cart.remove(it.productId, it.variantId)"
                      aria-label="Retirer {{ it.title }} du panier"
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
                      class="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm"
                      >Voir panier</a
                    >
                    <a
                      routerLink="/checkout"
                      (click)="closeCartMenu()"
                      class="inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >Commander</a
                    >
                  </div>
                </div>
                }
              </div>
              }
            </div>
          </ng-container>

          <!-- ADMIN : bouton Administration (texte masqué en mobile) -->
          <a
            *ngIf="showAdminButton()"
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
            <span class="admin-button-text">Administration</span>
          </a>

          <!-- AUTH : CTA contextuel -->
          <ng-container *ngIf="showAuthCtas()">
            <a
              *ngIf="authCta === 'register'"
              routerLink="/auth/register"
              class="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Créer un compte
            </a>
            <a
              *ngIf="authCta === 'login'"
              routerLink="/auth/login"
              class="hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Se connecter
            </a>
          </ng-container>

          <!-- Profil / Connexion (nom masqué en mobile) -->
          <ng-container *ngIf="headerMode() !== 'auth'">
            @if (currentUser()) {
            <div class="relative group">
              <button class="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                <div
                  class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="assets/brand/pp_image.jpg"
                    alt=""
                    class="w-full h-full object-cover rounded-full"
                    width="32"
                    height="32"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span class="user-name-mobile hidden md:block text-sm font-medium">
                  {{ currentUser()?.firstName }}
                </span>
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
                  <button
                    *ngIf="!isAdminUser()"
                    (click)="goToFavorites()"
                    class="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <span>Mes favoris</span>
                    <span
                      class="ml-3 inline-flex items-center px-2 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {{ favoritesCount() }}
                    </span>
                  </button>
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
                class="hidden sm:inline-flex bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                S'inscrire
              </a>
            </div>
            }
          </ng-container>
        </div>
      </div>
    </div>

    <!-- Modal de recherche MOBILE -->
    <div
      *ngIf="showMobileSearch()"
      class="mobile-search-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-search-title"
      tabindex="0"
      (keydown.escape)="closeMobileSearch()"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 id="mobile-search-title" class="text-lg font-semibold text-gray-900">Rechercher</h2>
        <button
          (click)="closeMobileSearch()"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Fermer la recherche"
        >
          <i class="fa-solid fa-xmark text-xl text-gray-600"></i>
        </button>
      </div>

      <form (submit)="submitSearch($event)" class="relative mb-4">
        <input
          type="search"
          [(ngModel)]="headerSearch"
          name="q"
          (input)="onHeaderSearchChange()"
          (focus)="openSearch()"
          [placeholder]="
            isAdminMode()
              ? 'Rechercher (produit, commande…)'
              : 'Rechercher une œuvre, une technique…'
          "
          class="w-full pl-11 pr-10 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-blue-500 text-base"
          autocomplete="off"
        />
        <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
        <button
          *ngIf="headerSearch"
          type="button"
          class="clear-icon p-2 rounded hover:bg-gray-100 text-slate-500 hover:text-slate-700"
          (click)="clearSearch()"
          aria-label="Effacer la recherche"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </form>

      <!-- Suggestions mobile -->
      <div class="flex-1 overflow-auto">
        <!-- Récents -->
        <div *ngIf="!isAdminMode() && recentProducts().length && !headerSearch.trim()" class="mb-6">
          <div class="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            Récemment consultés
          </div>
          <ul class="space-y-2">
            <li *ngFor="let r of recentProducts()">
              <button
                type="button"
                class="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                (click)="openRecent(r); closeMobileSearch()"
              >
                <img
                  *ngIf="r.image"
                  [src]="r.image"
                  alt=""
                  class="w-12 h-12 rounded-lg object-cover"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900">{{ r.title }}</div>
                </div>
                <i class="fa-solid fa-chevron-right text-gray-400 text-sm"></i>
              </button>
            </li>
          </ul>
        </div>

        <!-- Résultats de recherche -->
        <div *ngIf="suggestions.length" class="mb-6">
          <div class="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            Résultats
          </div>
          <ul class="space-y-2">
            <li *ngFor="let s of suggestions">
              <button
                type="button"
                class="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                (click)="applySuggestion(s); closeMobileSearch()"
                aria-label="Ouvrir la suggestion {{ s.label }}"
              >
                <img
                  *ngIf="s.type === 'product' && s.image"
                  [src]="s.image"
                  alt=""
                  class="w-12 h-12 rounded-lg object-cover"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span *ngIf="s.type === 'product'" class="badge">produit</span>
                    <span *ngIf="s.type === 'tag'" class="badge badge-tag">tag</span>
                  </div>
                  <div class="font-medium text-gray-900">{{ s.label }}</div>
                </div>
                <i class="fa-solid fa-chevron-right text-gray-400 text-sm"></i>
              </button>
            </li>
          </ul>

          <button
            type="button"
            class="w-full mt-4 p-3 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors"
            (click)="goToCatalogWithSearch(headerSearch); closeMobileSearch()"
          >
            Voir tous les résultats pour "{{ headerSearch }}"
          </button>
        </div>

        <!-- Message si pas de résultats -->
        <div
          *ngIf="headerSearch.trim() && !suggestions.length && showSuggestions()"
          class="text-center py-8 text-gray-500"
        >
          <i class="fa-solid fa-magnifying-glass text-4xl mb-3 opacity-30"></i>
          <p>Aucun résultat pour "{{ headerSearch }}"</p>
        </div>
      </div>
    </div>
  `,
})
export class HeaderComponent implements OnInit {
  @Input() mode?: HeaderMode;
  @Input() authCta: AuthCta = null;
  @Input() glass = false;

  private authService = inject(AuthService);
  private fav = inject(FavoritesStore);
  cart = inject(CartStore);
  private ordersStore = inject(OrderStore);
  private router = inject(Router);
  private productService = inject(ProductService);
  private toast = inject(ToastService);

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

  // Modal mobile
  private _showMobileSearch = signal(false);
  showMobileSearch = this._showMobileSearch.asReadonly();

  headerMode = computed<HeaderMode>(() => {
    if (this.mode) return this.mode;
    if (this.isAdminMode()) return 'admin';
    if (this._currentUrl().startsWith('/auth')) return 'auth';
    return 'site';
  });

  showWithSidebar = computed(() => this.headerMode() !== 'auth');
  showSiteActions = computed(() => this.headerMode() === 'site');
  showAdminButton = computed(() => this.isAdminUser() && this.headerMode() !== 'auth');
  showAuthCtas = computed(() => this.headerMode() === 'auth');

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

    if (this.headerMode() === 'auth') this.glass = true;
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

  openMobileSearch() {
    this._showMobileSearch.set(true);
    setTimeout(() => {
      const input = document.querySelector('.mobile-search-modal input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  closeMobileSearch() {
    this._showMobileSearch.set(false);
    this.clearSearch();
  }

  goToFavorites(): void {
    if (!this.currentUser()) {
      this.toast.requireAuth('favorites', '/favorites');
      return;
    }
    this.router.navigate(['/favorites']);
  }

  async applySuggestion(s: QuickSuggestion) {
    if (s.type === 'product') {
      const id = Number(s.value);
      if (!Number.isNaN(id)) {
        const p = await this.productService.getPublicProductById(id);
        if (!p) {
          this.toast.info('Ce produit n’est plus disponible.');
          this.clearSearch();
          return;
        }
        this.router.navigate(['/product', id]);
        this.clearSearch();
        return;
      }
    } else {
      this.router.navigate(['/catalog'], { queryParams: { search: s.value, page: 1 } });
      this.clearSearch();
    }
  }

  async openRecent(r: StoredRecent) {
    const p = await this.productService.getPublicProductById(r.id);
    if (!p) {
      this.toast.info('Ce produit n’est plus disponible. Il a été retiré de vos récents.');
      const raw = localStorage.getItem('recent_products');
      if (raw) {
        let arr: StoredRecent[] = [];
        try {
          arr = JSON.parse(raw) as StoredRecent[];
        } catch {
          arr = [];
        }
        arr = arr.filter((x) => x.id !== r.id);
        localStorage.setItem('recent_products', JSON.stringify(arr));
        this.loadRecentFromStorage();
      }
      this.clearSearch();
      return;
    }
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

  toggleCartMenu() {
    this._showCartMenu.update((v) => !v);
  }

  closeCartMenu() {
    this._showCartMenu.set(false);
  }

  private pulse(sig: ReturnType<typeof signal<boolean>>) {
    sig.set(true);
    setTimeout(() => sig.set(false), 220);
  }

  async logout() {
    try {
      await this.authService.logout();
      this.cart.clear();
      this.toast.info('Vous avez été déconnecté. Le panier a été vidé.');
      this.router.navigate(['/']);
    } catch (e) {
      console.error(e);
      this.toast.error('Échec de la déconnexion.');
    }
  }

  @HostListener('document:keydown.escape') onEsc() {
    if (this.showCartMenu()) this.closeCartMenu();
    else this.closeSearch();
  }
}
