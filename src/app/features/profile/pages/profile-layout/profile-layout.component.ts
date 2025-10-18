import { Component, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../auth/services/auth';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { OrderStore } from '../../../cart/services/order-store';
import { CartStore } from '../../../cart/services/cart-store';
import { ToastService } from '../../../../shared/services/toast.service';
import { BadgeThemeService } from '../../../../shared/services/badge-theme.service';
import { FidelityStore } from '../../../fidelity/services/fidelity-store';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <!-- Décor global flouté/pastel AVEC image -->
    <div class="bg-hero" aria-hidden="true">
      <img src="/assets/hero/checkout-bg.jpg" alt="" />
      <div class="bg-overlay"></div>
    </div>

    <div class="profile-shell">
      <div class="profile-grid">
        <!-- LEFT: sticky user header + nav -->
        <aside class="profile-aside" aria-label="Menu du profil">
          <div class="profile-left-sticky">
            <!-- En-tête utilisateur en verre -->
            <header class="profile-user">
              <div class="user-glass" aria-label="Informations utilisateur">
                <ng-container *ngIf="avatarUrl() as avatar; else initialsAvatar">
                  <img
                    [src]="avatar"
                    alt="Avatar de {{ user()?.firstName || user()?.email }}"
                    class="avatar avatar-img"
                    width="44"
                    height="44"
                    decoding="async"
                    loading="lazy"
                  />
                </ng-container>
                <ng-template #initialsAvatar>
                  <div class="avatar" [ngClass]="theme.avatarClass()">
                    <span>{{ initials() }}</span>
                  </div>
                </ng-template>

                <div class="user-text">
                  <div class="user-chip">
                    <div class="user-name">{{ user()?.firstName }} {{ user()?.lastName }}</div>
                    <div class="user-status">Connecté</div>
                  </div>
                </div>
              </div>
            </header>

            <!-- Menu -->
            <nav class="nav" role="navigation">
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

              <a
                *ngIf="isFidelityEnabled()"
                routerLink="/profile/fidelity"
                routerLinkActive="is-active"
                class="nav-item"
              >
                <i class="fa-solid fa-star mr-2" style="color:#F59E0B"></i> Programme fidélité
              </a>

              <a
                routerLink="/profile/subscription"
                routerLinkActive="is-active"
                class="nav-item"
              >
                <i class="fa-solid fa-crown mr-2" style="color:#8B5CF6"></i> Mon abonnement
              </a>

              <div class="nav-section">Autres</div>
              <button type="button" class="nav-item nav-logout" (click)="logout()">
                <i class="fa-solid fa-sign-out-alt mr-2"></i> Déconnexion
              </button>
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
  private readonly auth = inject(AuthService);
  private readonly fav = inject(FavoritesStore);
  private readonly orders = inject(OrderStore);
  private readonly cart = inject(CartStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fidelityStore = inject(FidelityStore);
  readonly theme = inject(BadgeThemeService);

  readonly user = computed(() => this.auth.currentUser$());
  readonly favoritesCount = this.fav.count;
  readonly ordersCount = this.orders.count;
  readonly cartCount = this.cart.count;
  readonly isFidelityEnabled = computed(() => this.fidelityStore.isEnabled());

  constructor() {
    effect(() => this.theme.initForUser(this.user()?.id ?? null));
  }

  /** Récupère une clé string optionnelle sans `any` */
  private getOptionalString(obj: unknown, key: string): string | null {
    if (obj && typeof obj === 'object') {
      const rec = obj as Record<string, unknown>;
      const v = rec[key];
      if (typeof v === 'string' && v.trim().length > 0) return v;
    }
    return null;
  }

  /** URL d’avatar si exposée par le backend (ex: avatarUrl), sinon null */
  avatarUrl(): string | null {
    const u = this.user();
    // adapte la clé si ton modèle utilise un autre nom (ex: 'photoURL', 'picture', etc.)
    return this.getOptionalString(u, 'avatarUrl');
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
