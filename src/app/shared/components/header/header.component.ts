import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth';
import { FavoritesStore } from '../../../features/favorites/services/favorites-store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo et nom -->
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

          <!-- Navigation principale -->
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

            <!-- Navigation par catégorie (dropdown au survol) -->
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
                  >
                    ✏️ Dessins
                  </a>
                  <a
                    [routerLink]="['/catalog']"
                    [queryParams]="{ category: 'painting' }"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  >
                    🎨 Peintures
                  </a>
                  <a
                    [routerLink]="['/catalog']"
                    [queryParams]="{ category: 'digital-art' }"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  >
                    💻 Art Numérique
                  </a>
                  <a
                    [routerLink]="['/catalog']"
                    [queryParams]="{ category: 'photography' }"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  >
                    📸 Photographie
                  </a>
                </div>
              </div>
            </div>
          </nav>

          <!-- Actions utilisateur -->
          <div class="flex items-center space-x-4">
            @if (currentUser()) {
            <!-- Utilisateur connecté -->
            <div class="flex items-center space-x-4">
              @if (authService.isAdmin()) {
              <a routerLink="/admin" class="text-gray-700 hover:text-blue-600 text-sm font-medium">
                Administration
              </a>
              }
              <!--  Favori -->
              <a
                routerLink="/profile/favorites"
                class="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
                aria-label="Favoris"
                title="Mes favoris"
              >
                <span class="text-lg">♡</span>
                @if (favCount() > 0) {
                <span
                  class="absolute -top-1 -right-1 text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5"
                >
                  {{ favCount() }}
                </span>
                }
              </a>

              <!-- Profil utilisateur -->
              <div class="relative group">
                <button class="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="text-blue-600 font-medium text-sm">
                      {{ (currentUser()?.firstName?.[0] || '').toUpperCase() }}
                    </span>
                  </div>
                  <span class="hidden md:block text-sm font-medium">
                    {{ currentUser()?.firstName }}
                  </span>
                </button>

                <div
                  class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                >
                  <div class="py-2">
                    <a
                      routerLink="/profile/favorites"
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>❤️ Favoris</span>
                      <span class="text-xs bg-gray-100 text-gray-700 rounded px-1.5">{{
                        favCount()
                      }}</span>
                    </a>
                    <hr class="my-1" />

                    <button
                      (click)="logout()"
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            </div>
            } @else {
            <!-- Utilisateur non connecté -->
            <div class="flex items-center space-x-3">
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

            <!-- Bouton menu mobile -->
            <button
              (click)="toggleMobileMenu()"
              class="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600"
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
            >
              Accueil
            </a>
            <a
              routerLink="/catalog"
              (click)="closeMobileMenu()"
              class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
            >
              Catalogue
            </a>

            @if (!currentUser()) {
            <div class="pt-3 border-t border-gray-200">
              <a
                routerLink="/auth/login"
                (click)="closeMobileMenu()"
                class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
              >
                Connexion
              </a>
              <a
                routerLink="/auth/register"
                (click)="closeMobileMenu()"
                class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
              >
                S'inscrire
              </a>
            </div>
            } @else {
            <div class="pt-3 border-t border-gray-200">
              @if (authService.isAdmin()) {
              <a
                routerLink="/admin"
                (click)="closeMobileMenu()"
                class="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
              >
                Administration
              </a>
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
  router = inject(Router);

  currentUser = this.authService.currentUser$;
  showMobileMenu = false;

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

  fav = inject(FavoritesStore);
  favCount = this.fav.count;
}
