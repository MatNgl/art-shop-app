// FILE: src/app/features/profile/pages/profile-layout/profile-layout.component.ts
import { Component, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../auth/services/auth';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { OrderStore } from '../../../cart/services/order-store';
import { CartStore } from '../../../cart/services/cart-store';
import { ToastService } from '../../../../shared/services/toast.service';
import { BadgeThemeService } from '../../../../shared/services/badge-theme.service';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <!-- BG commun à toutes les pages profil -->
    <div class="bg-hero" aria-hidden="true">
      <img src="/assets/hero/checkout-bg.jpg" alt="" />
      <div class="bg-overlay"></div>
    </div>

    <div class="profile-shell">
      <div class="profile-grid">
        <!-- LEFT: sticky user header + nav -->
        <aside class="profile-aside">
          <div class="profile-left-sticky">
            <!-- En-tête utilisateur -->
            <div class="profile-user">
              <div class="avatar" [ngClass]="theme.avatarClass()">
                <span>{{ initials() }}</span>
              </div>
              <div>
                <div class="user-name">{{ user()?.firstName }} {{ user()?.lastName }}</div>
                <div class="user-status">Connecté</div>
              </div>
            </div>

            <!-- Menu -->
            <nav class="nav">
              <div class="nav-section">Général</div>
              <a
                routerLink="/profile"
                [routerLinkActiveOptions]="{ exact: true }"
                routerLinkActive="is-active"
                class="nav-item"
              >
                <i class="fa-regular fa-user mr-2"></i> Compte
              </a>
              <a routerLink="/profile/addresses" routerLinkActive="is-active" class="nav-item">
                <i class="fa-solid fa-location-dot mr-2"></i> Adresses
              </a>
              <a routerLink="/profile/payments" routerLinkActive="is-active" class="nav-item">
                <i class="fa-solid fa-credit-card mr-2"></i> Paiements
              </a>

              <div class="nav-section">Achats</div>
              <a routerLink="/profile/favorites" routerLinkActive="is-active" class="nav-item">
                <i class="fa-solid fa-heart mr-2"></i> Mes favoris
                <span class="badge ml-auto">{{ favoritesCount() }}</span>
              </a>
              <a routerLink="/profile/cart" routerLinkActive="is-active" class="nav-item">
                <i class="fa-solid fa-cart-shopping mr-2"></i> Mon panier
                <span class="badge ml-auto">{{ cartCount() }}</span>
              </a>

              <a routerLink="/profile/orders" routerLinkActive="is-active" class="nav-item">
                <i class="fa-solid fa-bag-shopping mr-2"></i> Mes commandes
                <span class="badge ml-auto">{{ ordersCount() }}</span>
              </a>

              <div class="nav-section">Autres</div>
              <a href="#" (click)="logout(); $event.preventDefault()" class="nav-item">
                <i class="fa-solid fa-sign-out-alt mr-2"></i> Déconnexion
              </a>
            </nav>
          </div>
        </aside>

        <!-- RIGHT: content -->
        <section class="profile-content">
          <router-outlet></router-outlet>
        </section>
      </div>
    </div>
  `,
  styleUrls: ['./profile-layout.component.scss'],
})
export class ProfileLayoutComponent {
  private auth = inject(AuthService);
  private fav = inject(FavoritesStore);
  private orders = inject(OrderStore);
  private cart = inject(CartStore);
  private toast = inject(ToastService);
  private router = inject(Router);
  readonly theme = inject(BadgeThemeService);

  user = computed(() => this.auth.currentUser$());
  favoritesCount = this.fav.count;
  ordersCount = this.orders.count;
  cartCount = this.cart.count;

  constructor() {
    // Assure que le même gradient est appliqué si on arrive directement sur /profile
    effect(() => this.theme.initForUser(this.user()?.id ?? null));
  }

  initials(): string {
    const u = this.user();
    const a = (u?.firstName?.[0] || u?.email?.[0] || '?').toUpperCase();
    const b = (u?.lastName?.[0] || '').toUpperCase();
    return (a + b).trim();
  }

  async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      this.cart.clear();
      this.toast.info('Vous avez été déconnecté. Le panier a été vidé.');
      this.router.navigate(['/']);
    }
  }
}
