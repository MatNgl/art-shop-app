import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive, NavigationStart } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth';
import { CartStore } from '../../../features/cart/services/cart-store';
import { FavoritesStore } from '../../../features/favorites/services/favorites-store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <a routerLink="/" class="flex items-center space-x-3">
              <div
                class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center"
              >
                <span class="text-white font-bold text-sm">AS</span>
              </div>
              <h1 class="text-xl font-bold text-gray-900">Art Shop</h1>
            </a>
          </div>

          <!-- Nav desktop -->
          <nav class="hidden md:flex items-center space-x-8">
            <a
              routerLink="/"
              routerLinkActive="text-blue-600 border-b-2 border-blue-600"
              [routerLinkActiveOptions]="{ exact: true }"
              class="text-gray-700 hover:text-blue-600 px-1 py-2 text-sm font-medium border-b-2 border-transparent transition-colors"
            >
              Accueil
            </a>
            <a
              routerLink="/catalog"
              routerLinkActive="text-blue-600 border-b-2 border-blue-600"
              class="text-gray-700 hover:text-blue-600 px-1 py-2 text-sm font-medium border-b-2 border-transparent transition-colors"
            >
              Catalogue
            </a>

            <!-- Catégories (existant) -->
            <div class="relative group">
              <button
                class="text-gray-700 hover:text-blue-600 px-1 py-2 text-sm font-medium flex items-center"
              >
                Catégories
                <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                class="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
              >
                <div class="py-2">
                  <a
                    [routerLink]="['/catalog']"
                    [queryParams]="{ category: 'drawing' }"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    >✏️ Dessins</a
                  >
                  <a
                    [routerLink]="['/catalog']"
                    [queryParams]="{ category: 'painting' }"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    >🎨 Peintures</a
                  >
                  <a
                    [routerLink]="['/catalog']"
                    [queryParams]="{ category: 'digital-art' }"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    >💻 Art Numérique</a
                  >
                  <a
                    [routerLink]="['/catalog']"
                    [queryParams]="{ category: 'photography' }"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    >📸 Photographie</a
                  >
                </div>
              </div>
            </div>
          </nav>

          <!-- Actions utilisateur -->
          <div class="flex items-center space-x-4">
            <!-- Icône Favoris -->
            <a
              routerLink="/profile/favorites"
              class="relative p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
              aria-label="Mes favoris"
            >
              <span>❤️</span>
              @if (favoritesCount() > 0) {
              <span
                class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-pink-600 text-white text-xs
                         flex items-center justify-center transform-gpu transition-transform duration-200"
                [class.scale-110]="favBadgePulse()"
              >
                {{ favoritesCount() }}
              </span>
              }
            </a>

            <!-- Icône Panier -->
            <div class="relative">
              <button
                (click)="toggleCartMenu()"
                class="relative p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                aria-label="Ouvrir le mini-panier"
              >
                🛍 @if (cartCount() > 0) {
                <span
                  class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 text-white text-xs
                           flex items-center justify-center transform-gpu transition-transform duration-200"
                  [class.scale-110]="cartBadgePulse()"
                >
                  {{ cartCount() }}
                </span>
                }
              </button>

              <!-- Mini-panier -->
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
                        x{{ it.qty }} • {{ it.unitPrice | number : '1.2-2' }} €
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
                    <span class="font-semibold text-gray-900"
                      >{{ cart.subtotal() | number : '1.2-2' }} €</span
                    >
                  </div>
                  <div class="mt-3 grid grid-cols-2 gap-2">
                    <a
                      routerLink="/cart"
                      (click)="closeCartMenu()"
                      class="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900"
                    >
                      Voir mon panier
                    </a>
                    <a
                      routerLink="/cart"
                      (click)="closeCartMenu()"
                      class="inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Commander
                    </a>
                  </div>
                </div>
                }
              </div>
              }
            </div>

            @if (currentUser()) { @if (authService.isAdmin()) {
            <a
              routerLink="/admin"
              class="hidden md:block text-gray-700 hover:text-blue-600 text-sm font-medium"
              >Administration</a
            >
            }
            <!-- Profil -->
            <div class="relative group">
              <button class="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span
                    class="text-blue-600 font-medium text-sm"
                    >{{ (currentUser()?.firstName?.[0] || '').toUpperCase() }}</span
                  >
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
                    routerLink="/profile/favorites"
                    class="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span>Mes favoris</span>
                    <span
                      class="ml-3 inline-flex items-center px-2 rounded-full text-xs bg-gray-100 text-gray-700"
                      >{{ favoritesCount() }}</span
                    >
                  </a>
                  <a
                    routerLink="/cart"
                    class="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span>Mon panier</span>
                    <span
                      class="ml-3 inline-flex items-center px-2 rounded-full text-xs bg-gray-100 text-gray-700"
                      >{{ cartCount() }}</span
                    >
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
            <!-- Non connecté -->
            <div class="flex items-center space-x-3">
              <a
                routerLink="/auth/login"
                class="text-gray-700 hover:text-blue-600 text-sm font-medium"
                >Connexion</a
              >
              <a
                routerLink="/auth/register"
                class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                S'inscrire
              </a>
            </div>
            }

            <!-- Burger -->
            <button
              (click)="toggleMobileMenu()"
              class="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600"
              aria-label="Ouvrir le menu"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Menu mobile -->
        @if (showMobileMenu) {
        <div class="md:hidden border-t border-gray-200 py-4">
          <div class="flex flex-col space-y-3">
            <a
              routerLink="/"
              (click)="closeMobileMenu()"
              class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
              >Accueil</a
            >
            <a
              routerLink="/catalog"
              (click)="closeMobileMenu()"
              class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
              >Catalogue</a
            >
            <a
              routerLink="/profile/favorites"
              (click)="closeMobileMenu()"
              class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
            >
              Mes favoris ({{ favoritesCount() }})
            </a>
            <a
              routerLink="/cart"
              (click)="closeMobileMenu()"
              class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
            >
              Mon panier ({{ cartCount() }})
            </a>

            @if (!currentUser()) {
            <div class="pt-3 border-t border-gray-200">
              <a
                routerLink="/auth/login"
                (click)="closeMobileMenu()"
                class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
                >Connexion</a
              >
              <a
                routerLink="/auth/register"
                (click)="closeMobileMenu()"
                class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
                >S'inscrire</a
              >
            </div>
            } @else {
            <div class="pt-3 border-t border-gray-200">
              @if (authService.isAdmin()) {
              <a
                routerLink="/admin"
                (click)="closeMobileMenu()"
                class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
                >Administration</a
              >
              }
              <button
                (click)="logout(); closeMobileMenu()"
                class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium w-full text-left"
              >
                Se déconnecter
              </button>
            </div>
            }
          </div>
        </div>
        }
      </div>
    </header>
  `,
})
export class HeaderComponent {
  authService = inject(AuthService);
  private fav = inject(FavoritesStore);
  cart = inject(CartStore);
  router = inject(Router);

  currentUser = this.authService.currentUser$;
  showMobileMenu = false;

  // Compteurs
  favoritesCount = computed(() => this.fav.count());
  cartCount = computed(() => this.cart.count());

  // Badges "bump" animation
  private lastFavCount = 0;
  private lastCartCount = 0;
  favBadgePulse = signal(false);
  cartBadgePulse = signal(false);

  // Mini-panier
  private _showCartMenu = signal(false);
  showCartMenu = computed(() => this._showCartMenu());

  constructor() {
    // Fermer le mini-panier sur navigation
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) this.closeCartMenu();
    });

    // Pulse favoris à chaque changement
    effect(() => {
      const c = this.favoritesCount();
      if (c !== this.lastFavCount) this.pulse(this.favBadgePulse);
      this.lastFavCount = c;
    });

    // Pulse panier à chaque changement
    effect(() => {
      const c = this.cartCount();
      if (c !== this.lastCartCount) this.pulse(this.cartBadgePulse);
      this.lastCartCount = c;
    });
  }

  private pulse(sig: ReturnType<typeof signal<boolean>>) {
    sig.set(true);
    setTimeout(() => sig.set(false), 220);
  }

  toggleCartMenu() {
    this._showCartMenu.update((v) => !v);
  }
  closeCartMenu() {
    this._showCartMenu.set(false);
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }
  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }
  closeMobileMenu() {
    this.showMobileMenu = false;
  }
}
