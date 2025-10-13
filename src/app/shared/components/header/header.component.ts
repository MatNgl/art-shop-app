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
import { SidebarStateService } from '../../services/sidebar-state.service';
import { BadgeThemeService } from '../../services/badge-theme.service';

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
    <header
      class="fixed top-0 left-0 right-0 z-50 border-b"
      [class.bg-white]="!glass"
      [class.border-gray-200]="!glass"
      [class.shadow-sm]="!glass"
      [class.bg-white/80]="glass"
      [class.backdrop-blur-md]="glass"
      [class.border-white/20]="glass"
    >
      <div class="w-full px-4 sm:px-6 header-no-pl" [class.pl-20]="showWithSidebar()">
        <div class="h-16 grid grid-cols-3 items-center gap-3 md:flex md:items-center md:justify-between">
          <!-- Bouton burger (mobile, gauche) -->
          <div class="md:hidden flex items-center">
            <button
              *ngIf="!isAuthLoginOrRegister()"
              type="button"
              (click)="toggleSidebarFromHeader()"
              class="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Ouvrir le menu"
            >
              <i class="fa-solid fa-bars text-gray-700"></i>
            </button>
          </div>

          <!-- Logo -->
          <div class="flex items-center justify-center md:justify-start gap-3 shrink-0 logo-zone">
            <a routerLink="/" aria-label="Aller à l'accueil" class="flex items-center gap-3 hover:opacity-95">
              <div class="w-8 h-8 rounded-full overflow-hidden shadow-sm">
                <img
                  src="assets/brand/pp_image.jpg"
                  alt="Logo Art Shop"
                  class="w-full h-full object-cover rounded-full"
                  width="32" height="32" loading="eager" decoding="async"
                />
              </div>
              <span class="site-title text-lg md:text-xl font-extrabold text-gray-900">Art Shop</span>
            </a>
          </div>

          <!-- Actions mobile : recherche + admin + avatar -->
          <div class="md:hidden flex items-center justify-end gap-2">
            <button *ngIf="headerMode() !== 'auth'" class="mobile-search-trigger" (click)="openMobileSearch()" aria-label="Rechercher">
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>

            <!-- ADMIN mobile (icône bleue) -->
            <a
              *ngIf="showAdminButton()"
              routerLink="/admin"
              class="inline-flex items-center justify-center w-10 h-10 rounded-lg text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Administration"
            >
              <i class="fa-solid fa-gauge-high"></i>
            </a>

            <ng-container *ngIf="headerMode() !== 'auth'">
              @if (currentUser()) {
                <a
                  routerLink="/profile"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs select-none avatar"
                  [ngClass]="theme.avatarClass()"
                  aria-label="Accéder au profil"
                >
                  {{ initials() }}
                </a>
              } @else {
                <a routerLink="/auth/login" class="text-gray-700 hover:text-blue-600 text-sm font-medium" aria-label="Se connecter">
                  <i class="fa-solid fa-user"></i>
                </a>
              }
            </ng-container>
          </div>

          <!-- Recherche desktop -->
          <div class="search-container-desktop hidden md:flex flex-1 justify-center px-4" *ngIf="headerMode() !== 'auth'">
            <div class="relative w-full max-w-xl" (keydown.escape)="closeSearch()" tabindex="0">
              <form (submit)="submitSearch($event)" class="relative">
                <input
                  type="search"
                  [(ngModel)]="headerSearch"
                  name="q"
                  (input)="onHeaderSearchChange()"
                  (focus)="openSearch()"
                  [placeholder]="isAdminMode() ? 'Rechercher (produit, commande…)' : 'Rechercher une œuvre, une technique…'"
                  class="w-full pl-11 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autocomplete="off"
                />
                <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>

                <button *ngIf="headerSearch" type="button"
                        class="clear-icon p-1 rounded hover:bg-gray-100 text-slate-500 hover:text-slate-700"
                        (click)="clearSearch()" aria-label="Effacer la recherche">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </form>

              <!-- Suggestions -->
              <div *ngIf="showSuggestions() && (suggestions.length || (!isAdminMode() && recentProducts().length))" class="suggestions">
                <div *ngIf="!isAdminMode() && recentProducts().length && !headerSearch.trim()" class="p-3 border-b">
                  <div class="text-xs font-semibold text-gray-500 mb-2">Récemment consultés</div>
                  <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <li *ngFor="let r of recentProducts()">
                      <button type="button" class="w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-50" (click)="openRecent(r)">
                        <img *ngIf="r.image" [src]="r.image" alt="" class="w-8 h-8 rounded object-cover" />
                        <div class="min-w-0">
                          <div class="truncate text-sm text-gray-900">{{ r.title }}</div>
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>

                <ul *ngIf="suggestions.length" class="max-h-96 overflow-auto">
                  <li *ngFor="let s of suggestions">
                    <button type="button" class="suggestion-item w-full text-left" (click)="applySuggestion(s)" aria-label="Ouvrir la suggestion {{ s.label }}">
                      <img *ngIf="s.type === 'product' && s.image" [src]="s.image" alt="Produit" class="w-6 h-6 rounded object-cover" />
                      <span *ngIf="s.type === 'product'" class="badge">produit</span>
                      <span *ngIf="s.type === 'tag'" class="badge badge-tag">tag</span>
                      <span class="label truncate">{{ s.label }}</span>
                    </button>
                  </li>

                  <li>
                    <button type="button" class="see-all w-full text-left" (click)="goToCatalogWithSearch(headerSearch)" aria-label="Voir tous les résultats pour {{ headerSearch }}">
                      Voir tous les résultats pour "{{ headerSearch }}"
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Actions desktop -->
          <div class="hidden md:flex items-center gap-2 md:gap-3">
            <ng-container *ngIf="showSiteActions()">
              <button (click)="goToFavorites()" class="group relative p-2 rounded-md hover:bg-gray-100" aria-label="Mes favoris">
                <i class="fa-solid fa-heart text-rose-600 group-hover:text-rose-700"></i>
                @if (favoritesCount() > 0) {
                  <span class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-pink-600 text-white text-xs flex items-center justify-center"
                        [class.scale-110]="favBadgePulse()">{{ favoritesCount() }}</span>
                }
              </button>

              <!-- Mini-panier -->
              <div class="relative">
                <button (click)="toggleCartMenu()" class="group relative p-2 rounded-md hover:bg-gray-100" aria-label="Ouvrir le mini-panier">
                  <i class="fa-solid fa-cart-shopping text-blue-600 group-hover:text-blue-700"></i>
                  @if (cartCount() > 0) {
                    <span class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center"
                          [class.scale-110]="cartBadgePulse()">{{ cartCount() }}</span>
                  }
                </button>

                @if (showCartMenu()) {
                  <div class="cart-dropdown-mobile absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">
                    <div class="p-3 border-b flex items-center justify-between">
                      <div class="font-semibold">Mon panier</div>
                      <button class="text-xs text-gray-500 hover:text-gray-700" (click)="closeCartMenu()">Fermer</button>
                    </div>

                    @if (cart.empty()) {
                      <div class="p-4 text-sm text-gray-600">Votre panier est vide.</div>
                    } @else {
                      <ul class="max-h-80 overflow-auto divide-y">
                        @for (it of cart.items(); track it.productId + '_' + (it.variantId ?? '')) {
                          <li class="p-3 flex items-center gap-3">
                            <img [src]="it.imageUrl" [alt]="it.title" class="w-14 h-14 rounded object-cover" />
                            <div class="flex-1 min-w-0">
                              <div class="text-sm font-medium text-gray-900 truncate">
                                {{ it.title }}
                                <span *ngIf="it.variantLabel" class="text-xs text-gray-500">( {{ it.variantLabel }} )</span>
                              </div>
                              <div class="text-xs text-gray-600 mt-0.5">x{{ it.qty }} • {{ it.unitPrice | price }}</div>
                            </div>
                            <button class="text-xs text-red-600 hover:text-red-700"
                                    (click)="$event.stopPropagation(); cart.remove(it.productId, it.variantId)"
                                    aria-label="Retirer {{ it.title }} du panier">
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
                          <a routerLink="/cart" (click)="closeCartMenu()" class="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm">Voir panier</a>
                          <a routerLink="/checkout" (click)="closeCartMenu()" class="inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm">Commander</a>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </ng-container>

            <!-- ADMIN desktop (bleu) -->
            <a
              *ngIf="showAdminButton()"
              routerLink="/admin"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              aria-label="Administration"
            >
              <i class="fa-solid fa-gauge-high"></i>
              <span class="hidden md:inline admin-button-text">Administration</span>
            </a>

            <!-- Profil -->
            <ng-container *ngIf="headerMode() !== 'auth'">
              @if (currentUser()) {
                <a
                  routerLink="/profile"
                  class="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                  aria-label="Accéder à mon profil"
                >
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs overflow-hidden avatar"
                    [ngClass]="theme.avatarClass()"
                  >
                    {{ initials() }}
                  </div>
                  <span class="user-name-mobile hidden md:block text-sm font-medium">
                    {{ currentUser()?.firstName }}
                  </span>
                </a>
              } @else {
                <div class="flex items-center gap-2">
                  <a routerLink="/auth/login" class="text-gray-700 hover:text-blue-600 text-sm font-medium">Connexion</a>
                  <a routerLink="/auth/register" class="hidden sm:inline-flex bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">S'inscrire</a>
                </div>
              }
            </ng-container>

          </div>
        </div>
      </div>

      <!-- Modal recherche mobile -->
      <div
        *ngIf="showMobileSearch()"
        class="fixed inset-0 z-[60] flex flex-col bg-white md:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-search-title"
        (keydown.escape)="closeMobileSearch()"
      >
        <!-- Barre supérieure avec input -->
        <div class="sticky top-0 bg-white border-b border-gray-200 p-3">
          <form (submit)="submitSearch($event)" class="flex items-center gap-2">
            <i class="fa-solid fa-magnifying-glass text-gray-500"></i>
            <input
              #mobileSearchInput
              type="search"
              inputmode="search"
              autocomplete="off"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              [(ngModel)]="headerSearch"
              name="q_mobile"
              (input)="onHeaderSearchChange()"
              placeholder="Rechercher une œuvre, une technique…"
              class="flex-1 min-w-0 bg-white border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              *ngIf="headerSearch"
              type="button"
              class="px-2 py-2 rounded-md text-gray-500 hover:bg-gray-100"
              (click)="headerSearch=''; suggestions=[]"
              aria-label="Effacer la recherche"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
            <button
              type="button"
              class="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              (click)="closeMobileSearch()"
              aria-label="Annuler la recherche"
            >Annuler</button>
          </form>
        </div>

        <!-- Contenu suggestions / récents -->
        <div class="flex-1 overflow-y-auto">
          <!-- Récemment consultés (sans terme saisi) -->
          <div *ngIf="!isAdminMode() && recentProducts().length && !headerSearch.trim()" class="p-4 border-b">
            <h2 id="mobile-search-title" class="text-xs font-semibold text-gray-500 mb-2">Récemment consultés</h2>
            <ul class="space-y-1">
              <li *ngFor="let r of recentProducts()">
                <button
                  type="button"
                  class="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-50"
                  (click)="openRecent(r)"
                >
                  <img *ngIf="r.image" [src]="r.image" alt="" class="w-10 h-10 rounded object-cover" />
                  <div class="min-w-0">
                    <div class="truncate text-sm text-gray-900">{{ r.title }}</div>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          <!-- Suggestions -->
          <div *ngIf="suggestions.length" class="p-2">
            <ul class="divide-y">
              <li *ngFor="let s of suggestions">
                <button
                  type="button"
                  class="w-full text-left flex items-center gap-3 p-3"
                  (click)="applySuggestion(s)"
                  aria-label="Ouvrir la suggestion {{ s.label }}"
                >
                  <img *ngIf="s.type === 'product' && s.image" [src]="s.image" alt="Produit" class="w-8 h-8 rounded object-cover" />
                  <span *ngIf="s.type === 'product'" class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">produit</span>
                  <span *ngIf="s.type === 'tag'" class="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">tag</span>
                  <span class="truncate text-sm text-gray-900">{{ s.label }}</span>
                </button>
              </li>
            </ul>
            <div class="p-2">
              <button
                type="button"
                class="w-full text-left px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                (click)="goToCatalogWithSearch(headerSearch)"
                aria-label="Voir tous les résultats"
              >
                Voir tous les résultats pour “{{ headerSearch }}”
              </button>
            </div>
          </div>

          <!-- État vide -->
          <div *ngIf="!suggestions.length && headerSearch.trim()" class="p-6 text-center text-sm text-gray-500">
            Aucun résultat pour “{{ headerSearch }}”.
          </div>
        </div>
      </div>
    </header>
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
  private sidebar = inject(SidebarStateService);
  readonly theme = inject(BadgeThemeService);

  private _currentUrl = signal<string>('');
  readonly currentUrl = this._currentUrl.asReadonly();

  readonly isAuthLoginOrRegister = computed(() => {
    const url = this._currentUrl();
    return url.startsWith('/auth/login') || url.startsWith('/auth/register');
  });

  readonly isLoginPage = computed(() => this._currentUrl().startsWith('/auth/login'));

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

  private _showMobileSearch = signal(false);
  showMobileSearch = this._showMobileSearch.asReadonly();

  headerMode = computed<HeaderMode>(() => {
    if (this.mode) return this.mode;
    if (this.isAdminMode()) return 'admin';
    if (this._currentUrl().startsWith('/auth')) return 'auth';
    return 'site';
  });

  showWithSidebar = computed(() => {
    const url = this._currentUrl();
    return !(url.startsWith('/auth/login') || url.startsWith('/auth/register'));
  });

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
    effect(() => {
      const id = this.currentUser()?.id ?? null;
      this.theme.initForUser(id);
    });
  }

  ngOnInit(): void {
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

  initials(): string {
    const u = this.currentUser();
    if (!u) return 'AS';
    const a = (u.firstName?.[0] || u.email?.[0] || '?').toUpperCase();
    const b = (u.lastName?.[0] || '').toUpperCase();
    return (a + b).trim();
  }

  toggleSidebarFromHeader(): void {
    this.sidebar.toggle();
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
    this.closeMobileSearch(); // si on vient du mobile
  }

  openMobileSearch() {
    this._showMobileSearch.set(true);
    // lock scroll pour éviter l'écran blanc iOS/safari et focus visible
    document.documentElement.classList.add('overflow-hidden');
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[name="q_mobile"]');
      input?.focus();
    }, 50);
  }
  closeMobileSearch() {
    this._showMobileSearch.set(false);
    document.documentElement.classList.remove('overflow-hidden');
    // on ne vide pas systématiquement headerSearch ici pour permettre retour rapide
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
          this.closeMobileSearch();
          return;
        }
        this.router.navigate(['/product', id]);
        this.clearSearch();
        this.closeMobileSearch();
        return;
      }
    } else {
      this.router.navigate(['/catalog'], { queryParams: { search: s.value, page: 1 } });
      this.clearSearch();
      this.closeMobileSearch();
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
      this.closeMobileSearch();
      return;
    }
    this.router.navigate(['/product', r.id]);
    this.clearSearch();
    this.closeMobileSearch();
  }

  private loadRecentFromStorage() {
    const raw = localStorage.getItem('recent_products');
    if (!raw) return;
    let arr: RecentLite[] = [];
    try {
      arr = JSON.parse(raw) as RecentLite[];
    } catch {
      arr = [];
    }
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
    else if (this.showMobileSearch()) this.closeMobileSearch();
    else this.closeSearch();
  }
}
