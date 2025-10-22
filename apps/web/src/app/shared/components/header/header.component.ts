import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  HostListener,
  Input,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationStart } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthHttpService as AuthService } from '../../../features/auth/services/auth-http.service';
import { CartStore } from '../../../features/cart/services/cart-store';
import { FavoritesStore } from '../../../features/favorites/services/favorites-store';
import { OrderStore } from '../../../features/cart/services/order-store';
import { PricePipe } from '../../pipes/price.pipe';
import { ProductService } from '../../../features/catalog/services/product';
import type { QuickSuggestion } from '../../../features/catalog/services/product';
import { ToastService } from '../../services/toast.service';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { BadgeThemeService } from '../../services/badge-theme.service';
import { SubscriptionStore } from '../../../features/subscriptions/services/subscription-store';
import { AdminNotificationBellComponent } from '../../../features/notifications/components/admin-notification-bell.component';

// ---- Historique unifié (5 max) ----
type RecentItem = RecentProductItem | RecentQueryItem;

interface RecentProductItem {
  type: 'product';
  id: number;
  title: string;
  image?: string | null;
  date: number; // epoch ms (tri décroissant)
}

interface RecentQueryItem {
  type: 'query';
  q: string;
  date: number; // epoch ms
}

type HeaderMode = 'site' | 'admin' | 'auth';
type AuthCta = 'login' | 'register' | null;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PricePipe, AdminNotificationBellComponent],
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
        <div
          class="h-16 grid grid-cols-3 items-center gap-3 md:flex md:items-center md:justify-between"
        >
          <!-- Burger mobile -->
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
            <a
              routerLink="/"
              aria-label="Aller à l'accueil"
              class="flex items-center gap-3 hover:opacity-95"
            >
              <div class="w-8 h-8 rounded-full overflow-hidden shadow-sm">
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
              <span class="site-title text-lg md:text-xl font-extrabold text-gray-900"
                >Suelerte</span
              >
            </a>
          </div>

          <!-- Actions mobile -->
          <div class="md:hidden flex items-center justify-end gap-2">
            <button
              *ngIf="headerMode() !== 'auth'"
              class="mobile-search-trigger"
              (click)="openMobileSearch()"
              aria-label="Rechercher"
            >
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>

            <!-- Notification Bell Mobile (Admin Only) -->
            @if (isAdminUser()) {
              <app-admin-notification-bell />
            }

            <!-- ADMIN mobile -->
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
                <a
                  routerLink="/auth/login"
                  class="text-gray-700 hover:text-blue-600 text-sm font-medium"
                  aria-label="Se connecter"
                >
                  <i class="fa-solid fa-user"></i>
                </a>
              }
            </ng-container>
          </div>

          <!-- Recherche desktop -->
          <div
            class="search-container-desktop hidden md:flex flex-1 justify-center px-4"
            *ngIf="headerMode() !== 'auth'"
          >
            <div
              #searchBox
              class="relative w-full max-w-xl"
              (keydown.escape)="closeSearch()"
              tabindex="0"
            >
              <form (submit)="submitSearch($event)" class="relative">
                <input
                  type="search"
                  [(ngModel)]="headerSearch"
                  name="q"
                  (input)="onHeaderSearchInput()"
                  (focus)="openSearch()"
                  [placeholder]="isAdminMode() ? 'Rechercher (produit, commande…)' : 'Rechercher une œuvre, une technique…'"
                  class="search-input w-full pl-11 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autocomplete="off"
                />
                <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>

                <!-- Seule croix visible -->
                <button
                  *ngIf="headerSearch"
                  type="button"
                  class="clear-icon p-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-700"
                  (click)="clearSearch()"
                  aria-label="Effacer la recherche"
                  title="Effacer"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </form>

              <!-- Panneau suggestions / récents -->
              <div
                *ngIf="showSuggestions() && (suggestions().length || recentUnified().length || randomPicks().length)"
                class="suggestions"
              >
                <!-- 1) Résultats de la requête courante (TOUJOURS AVANT les récents) -->
                <ul *ngIf="suggestions().length" class="max-h-96 overflow-auto">
                  <li *ngFor="let s of suggestions()">
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

                <!-- 2) Récents (requêtes + produits) -->
                <div *ngIf="recentUnified().length" class="p-3 border-t">
                  <div class="text-xs font-semibold text-gray-500 mb-2">
                    Vos dernières recherches
                  </div>
                  <ul class="space-y-1">
                    <li *ngFor="let it of recentUnified()">
                      <button
                        type="button"
                        class="w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                        (click)="openRecentUnified(it)"
                      >
                        <ng-container [ngSwitch]="it.type">
                          <img
                            *ngSwitchCase="'product'"
                            [src]="recentImage(it) || 'assets/placeholder.png'"
                            alt=""
                            class="w-8 h-8 rounded object-cover"
                          />
                          <div
                            *ngSwitchCase="'query'"
                            class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500"
                          >
                            <i class="fa-solid fa-magnifying-glass text-sm"></i>
                          </div>
                        </ng-container>

                        <div class="min-w-0">
                          <div class="truncate text-sm text-gray-900">
                            {{ recentDisplayLabel(it) }}
                          </div>
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>

                <!-- 3) Suggestions aléatoires (si pas de résultats) -->
                <div *ngIf="!suggestions().length && randomPicks().length" class="p-3 border-t">
                  <div class="text-xs font-semibold text-gray-500 mb-2">
                    Suggestions pour vous
                  </div>
                  <ul class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <li *ngFor="let p of randomPicks()">
                      <button
                        type="button"
                        class="w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                        (click)="openProductFromRandom(p.id)"
                      >
                        <img
                          [src]="p.image || 'assets/placeholder.png'"
                          alt=""
                          class="w-8 h-8 rounded object-cover"
                        />
                        <div class="min-w-0">
                          <div class="truncate text-sm text-gray-900">{{ p.title }}</div>
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions desktop -->
          <div class="hidden md:flex items-center gap-2 md:gap-3">
            <ng-container *ngIf="showSiteActions()">
              <button
                (click)="goToFavorites()"
                class="group relative p-2 rounded-md hover:bg-gray-100"
                aria-label="Mes favoris"
              >
                <i class="fa-solid fa-heart text-rose-600 group-hover:text-rose-700"></i>
                @if (favoritesCount() > 0) {
                  <span
                    class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-pink-600 text-white text-xs flex items-center justify-center"
                    [class.scale-110]="favBadgePulse()"
                    >{{ favoritesCount() }}</span
                  >
                }
              </button>
            </ng-container>

            <!-- Notification Bell (Admin Only) -->
            @if (isAdminUser()) {
              <app-admin-notification-bell />
            }

            <ng-container *ngIf="showSiteActions()">
              <!-- Mini-panier -->
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
                      >{{ cartCount() }}</span
                    >
                  }
                </button>

                @if (showCartMenu()) {
                  <div
                    class="cart-dropdown-mobile absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50"
                  >
                    <div class="p-3 border-b flex items-center justify-between">
                      <div class="font-semibold">Mon panier</div>
                      <button class="text-xs text-gray-500 hover:text-gray-700" (click)="closeCartMenu()">
                        Fermer
                      </button>
                    </div>

                    @if (cart.empty()) {
                      <div class="p-4 text-sm text-gray-600">Votre panier est vide.</div>
                    } @else {
                      <ul class="max-h-80 overflow-auto divide-y">
                        @if (cart.subscriptionItem(); as sub) {
                          <li class="p-3">
                            <div class="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                              <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded flex items-center justify-center text-white">
                                <i class="fa-solid fa-star"></i>
                              </div>
                              <div class="flex-1 min-w-0">
                                <div class="font-medium text-sm">{{ sub.snapshot.planName }}</div>
                                <div class="text-xs text-gray-600">×{{ sub.snapshot.loyaltyMultiplier }} fidélité</div>
                              </div>
                              <div class="text-sm font-semibold">{{ sub.snapshot.priceCharged | price }}</div>
                            </div>
                          </li>
                        }
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

            <!-- Subscriptions (desktop) -->
            <ng-container *ngIf="showSiteActions()">
              <a
                routerLink="/subscriptions"
                class="group relative p-2 rounded-md hover:bg-amber-50"
                aria-label="Abonnements"
                title="Abonnements"
              >
                <i class="fa-solid fa-crown text-amber-600 group-hover:text-amber-700"></i>
                @if (hasActiveSubscription()) {
                  <span class="sub-dot" aria-hidden="true"></span>
                }
              </a>
            </ng-container>

            <!-- ADMIN desktop -->
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
                  <a routerLink="/auth/login" class="text-gray-700 hover:text-blue-600 text-sm font-medium"
                    >Connexion</a
                  >
                  <a
                    routerLink="/auth/register"
                    class="hidden sm:inline-flex bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >S'inscrire</a
                  >
                </div>
              }
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Modal recherche mobile -->
      <div
        *ngIf="showMobileSearch()"
        class="mobile-search-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-search-title"
        tabindex="0"
        (keydown.escape)="closeMobileSearch()"
      >
        <div
  class="mobile-search-sheet"
  role="document"
  tabindex="0"
  (click)="$event.stopPropagation()"
  (keydown.enter)="$event.stopPropagation()"
  (keydown.space)="$event.preventDefault(); $event.stopPropagation()"
>

          <div class="flex items-center gap-2 px-3 py-2 border-b">
            <button class="p-2 rounded hover:bg-gray-100" (click)="closeMobileSearch()" aria-label="Fermer">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <form (submit)="submitSearch($event)" class="relative flex-1">
              <input
                type="search"
                [(ngModel)]="headerSearch"
                name="q"
                (input)="onHeaderSearchInput()"
                placeholder="Rechercher une œuvre…"
                class="search-input w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                autocomplete="off"
              />
              <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
              <button
                *ngIf="headerSearch"
                type="button"
                class="clear-icon p-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-700"
                (click)="clearSearch()"
                aria-label="Effacer la recherche"
                title="Effacer"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </form>
          </div>

          <div
  class="p-3 space-y-4 overflow-y-auto max-h-[calc(100dvh-64px)]"
  tabindex="0"
  (click)="$event.stopPropagation()"
  (keydown.enter)="$event.stopPropagation()"
  (keydown.space)="$event.preventDefault(); $event.stopPropagation()"
>

            <!-- 1) Résultats courants d'abord -->
            <div *ngIf="suggestions().length">
              <div class="text-xs font-semibold text-gray-500 mb-2">Résultats</div>
              <ul class="divide-y border rounded-md">
                <li *ngFor="let s of suggestions()">
                  <button
                    type="button"
                    class="w-full text-left flex items-center gap-3 p-3 hover:bg-gray-50"
                    (click)="applySuggestion(s)"
                  >
                    <img
                      *ngIf="s.type === 'product' && s.image"
                      [src]="s.image"
                      class="w-8 h-8 rounded object-cover"
                      alt=""
                    />
                    <span *ngIf="s.type === 'product'" class="badge">produit</span>
                    <span *ngIf="s.type === 'tag'" class="badge badge-tag">tag</span>
                    <span class="truncate">{{ s.label }}</span>
                  </button>
                </li>
              </ul>
              <button
                type="button"
                class="see-all w-full mt-2"
                (click)="goToCatalogWithSearch(headerSearch)"
              >
                Voir tous les résultats pour "{{ headerSearch }}"
              </button>
            </div>

            <!-- 2) Récents ensuite -->
            <div *ngIf="recentUnified().length">
              <div class="text-xs font-semibold text-gray-500 mb-2">Vos dernières recherches</div>
              <ul class="space-y-1">
                <li *ngFor="let it of recentUnified()">
                  <button
                    type="button"
                    class="w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                    (click)="openRecentUnified(it)"
                  >
                    <ng-container [ngSwitch]="it.type">
                      <img
                        *ngSwitchCase="'product'"
                        [src]="recentImage(it) || 'assets/placeholder.png'"
                        alt=""
                        class="w-8 h-8 rounded object-cover"
                      />
                      <div
                        *ngSwitchCase="'query'"
                        class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500"
                      >
                        <i class="fa-solid fa-magnifying-glass text-sm"></i>
                      </div>
                    </ng-container>

                    <div class="min-w-0">
                      <div class="truncate text-sm text-gray-900">
                        {{ recentDisplayLabel(it) }}
                      </div>
                    </div>
                  </button>
                </li>
              </ul>
            </div>

            <!-- 3) Suggestions aléatoires si aucun résultat -->
            <div *ngIf="!suggestions().length && randomPicks().length">
              <div class="text-xs font-semibold text-gray-500 mb-2">Suggestions pour vous</div>
              <ul class="grid grid-cols-1 gap-2">
                <li *ngFor="let p of randomPicks()">
                  <button
                    type="button"
                    class="w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                    (click)="openProductFromRandom(p.id)"
                  >
                    <img
                      [src]="p.image || 'assets/placeholder.png'"
                      class="w-8 h-8 rounded object-cover"
                      alt=""
                    />
                    <span class="truncate">{{ p.title }}</span>
                  </button>
                </li>
              </ul>
            </div>
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
  private subs = inject(SubscriptionStore);

  @ViewChild('searchBox', { static: false }) searchBox?: ElementRef<HTMLElement>;

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

  // Recherche
  headerSearch = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private _suggestions = signal<QuickSuggestion[]>([]);
  suggestions = this._suggestions.asReadonly();

  private _showSuggestions = signal(false);
  showSuggestions = this._showSuggestions.asReadonly();

  // Historique unifié (localStorage key)
  private readonly RECENT_KEY = 'recent_unified_v1';
  private _recentUnified = signal<RecentItem[]>([]);
  recentUnified = this._recentUnified.asReadonly();

  // Picks aléatoires (3)
  private _randomPicks = signal<{ id: number; title: string; image?: string | null }[]>([]);
  randomPicks = this._randomPicks.asReadonly();

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

  hasActiveSubscription = computed(() => {
    const a = this.subs.active();
    return !!a && a.status === 'active';
  });

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

  async ngOnInit(): Promise<void> {
    this._currentUrl.set(this.router.url);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this._currentUrl.set(e.url);
        this.closeCartMenu();
        this._showSuggestions.set(false);

        // Sauvegarde auto de la requête quand on va sur /catalog?search=...
        try {
          const u = new URL(window.location.origin + e.url);
          const q = u.searchParams.get('search');
          if (q && q.trim()) this.pushRecentQuery(q.trim());
        } catch {
          /* ignore */
        }
      }
    });

    if (this.headerMode() === 'auth') this.glass = true;

    this.loadRecentUnifiedFromStorage();
    await this.loadRandomPicks();
  }

  // --- UI helpers
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

  // --- Recherche
  openSearch() {
    this._showSuggestions.set(true);
  }
  closeSearch() {
    this._showSuggestions.set(false);
  }
  clearSearch() {
    this.headerSearch = '';
    this._suggestions.set([]);
    this.closeSearch();
  }

  onHeaderSearchInput() {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    const term = this.headerSearch.trim();

    // Pas de terme => on montre juste récents + picks
    if (!term) {
      this._suggestions.set([]);
      this.openSearch();
      return;
    }

    this.searchDebounce = setTimeout(async () => {
      try {
        const res = await this.productService.quickSearchSuggestions(term, 8);
        this._suggestions.set(res);
        this.openSearch();
      } catch {
        this._suggestions.set([]);
      }
    }, 180);
  }

  submitSearch(e: Event) {
    e.preventDefault();
    const t = this.headerSearch.trim();
    if (!t) return;
    this.pushRecentQuery(t);
    this.goToCatalogWithSearch(t);
  }

  goToCatalogWithSearch(term: string) {
    this.router.navigate(['/catalog'], { queryParams: { search: term, page: 1 } });
    this.clearSearch();
    this._showMobileSearch.set(false);
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
        this.pushRecentProduct({ id: p.id, title: p.title, image: p.images?.[0] ?? null });
        this.router.navigate(['/product', id]);
        this.clearSearch();
        this._showMobileSearch.set(false);
        return;
      }
    } else {
      const term = s.value.trim();
      if (term) this.pushRecentQuery(term);
      this.router.navigate(['/catalog'], { queryParams: { search: s.value, page: 1 } });
      this.clearSearch();
      this._showMobileSearch.set(false);
    }
  }

  // --- Récents unifiés (parse strict)
  private loadRecentUnifiedFromStorage(): void {
    const raw = localStorage.getItem(this.RECENT_KEY);
    if (!raw) {
      this._recentUnified.set([]);
      return;
    }
    try {
      const parsed: unknown = JSON.parse(raw);

      const isObject = (v: unknown): v is Record<string, unknown> =>
        typeof v === 'object' && v !== null;

      const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
      const isString = (v: unknown): v is string => typeof v === 'string';

      const isRecentProductItem = (v: unknown): v is RecentProductItem => {
        if (!isObject(v)) return false;
        return (
          v['type'] === 'product' &&
          isNumber(v['id']) &&
          isString(v['title']) &&
          (v['image'] === null || v['image'] === undefined || isString(v['image'])) &&
          isNumber(v['date'])
        );
      };

      const isRecentQueryItem = (v: unknown): v is RecentQueryItem => {
        if (!isObject(v)) return false;
        return v['type'] === 'query' && isString(v['q']) && isNumber(v['date']);
      };

      const isRecentItem = (v: unknown): v is RecentItem =>
        isRecentProductItem(v) || isRecentQueryItem(v);

      const normalized = (Array.isArray(parsed) ? parsed.filter(isRecentItem) : [])
        .sort((a, b) => b.date - a.date)
        .slice(0, 5);

      this._recentUnified.set(normalized);
    } catch {
      this._recentUnified.set([]);
    }
  }

  private persistRecent(items: RecentItem[]): void {
    localStorage.setItem(this.RECENT_KEY, JSON.stringify(items));
  }

  private pushRecentQuery(q: string): void {
    const now = Date.now();
    const items = [...this._recentUnified()];
    const without = items.filter(
      (i) => !(i.type === 'query' && i.q.toLowerCase() === q.toLowerCase())
    );
    const newItem: RecentQueryItem = { type: 'query', q, date: now };
    without.unshift(newItem);
    const capped = without.sort((a, b) => b.date - a.date).slice(0, 5);
    this._recentUnified.set(capped);
    this.persistRecent(capped);
  }

  private pushRecentProduct(p: { id: number; title: string; image?: string | null }): void {
    const now = Date.now();
    const items = [...this._recentUnified()];
    const without = items.filter((i) => !(i.type === 'product' && i.id === p.id));
    const newItem: RecentProductItem = {
      type: 'product',
      id: p.id,
      title: p.title,
      image: p.image ?? null,
      date: now,
    };
    without.unshift(newItem);
    const capped = without.sort((a, b) => b.date - a.date).slice(0, 5);
    this._recentUnified.set(capped);
    this.persistRecent(capped);
  }

  async openRecentUnified(it: RecentItem) {
    if (it.type === 'product') {
      const p = await this.productService.getPublicProductById(it.id);
      if (!p) {
        this.toast.info('Ce produit n’est plus disponible. Il a été retiré de vos récents.');
        const filtered = this._recentUnified().filter(
          (x) => !(x.type === 'product' && x.id === it.id)
        );
        this._recentUnified.set(filtered);
        this.persistRecent(filtered);
        this.clearSearch();
        this._showMobileSearch.set(false);
        return;
      }
      this.router.navigate(['/product', it.id]);
      this.clearSearch();
      this._showMobileSearch.set(false);
      return;
    }
    const term = it.q.trim();
    if (term) {
      this.router.navigate(['/catalog'], { queryParams: { search: term, page: 1 } });
      this.clearSearch();
      this._showMobileSearch.set(false);
    }
  }

  private async loadRandomPicks(): Promise<void> {
    try {
      const all = await this.productService.getFeaturedProducts(20);
      const shuffled = [...all].sort(() => 0.5 - Math.random());
      const picks = shuffled.slice(0, 3).map((p) => ({
        id: p.id,
        title: p.title,
        image: p.images?.[0] ?? null,
      }));
      this._randomPicks.set(picks);
    } catch {
      this._randomPicks.set([]);
    }
  }

  private isRecentProduct(it: RecentItem): it is RecentProductItem {
    return it.type === 'product';
  }
  private isRecentQuery(it: RecentItem): it is RecentQueryItem {
    return it.type === 'query';
  }

  recentDisplayLabel(it: RecentItem): string {
    if (this.isRecentProduct(it)) return it.title;
    if (this.isRecentQuery(it)) return `Recherche : "${it.q}"`;
    return '';
  }

  recentImage(it: RecentItem): string | null {
    return this.isRecentProduct(it) ? it.image ?? null : null;
  }

  openProductFromRandom(id: number): void {
    this.router.navigate(['/product', id]);
    this.clearSearch();
    this._showMobileSearch.set(false);
  }

  openMobileSearch() {
    this._showMobileSearch.set(true);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.mobile-search-modal input');
      input?.focus();
    }, 50);
  }
  closeMobileSearch() {
    this._showMobileSearch.set(false);
  }

  goToFavorites(): void {
    if (!this.currentUser()) {
      this.toast.requireAuth('favorites', '/favorites');
      return;
    }
    this.router.navigate(['/favorites']);
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

  // Ferme les suggestions quand on clique hors de la zone de recherche (desktop)
  @HostListener('document:click', ['$event'])
  onDocClick(evt: MouseEvent) {
    if (!this.showSuggestions()) return;
    const target = evt.target as Node | null;
    const host = this.searchBox?.nativeElement ?? null;
    if (host && target && !host.contains(target)) {
      this.closeSearch();
    }
  }
}
