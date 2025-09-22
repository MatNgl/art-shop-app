import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../auth/services/auth';
import { FavoritesStore } from '../../../favorites/services/favorites-store';
import { OrderStore } from '../../../cart/services/order-store';

@Component({
    selector: 'app-profile-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
    template: `
    <div class="profile-shell">
      <!-- En-tête utilisateur -->
      <div class="profile-user">
        <div class="avatar">
          <span>{{ (user()?.firstName?.[0] || user()?.email?.[0] || '?') | uppercase }}</span>
        </div>
        <div>
          <div class="user-name">{{ user()?.firstName }} {{ user()?.lastName }}</div>
          <div class="user-status">Connecté</div>
        </div>
      </div>

      <div class="profile-grid">
        <!-- Sidebar -->
        <aside class="profile-aside">
          <nav class="nav">
            <div class="nav-section">Général</div>
            <a routerLink="/profile" [routerLinkActiveOptions]="{ exact:true }" routerLinkActive="is-active" class="nav-item">
              <i class="fa-regular fa-user mr-2"></i> Compte
            </a>
            <a routerLink="/profile/addresses" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-location-dot mr-2"></i> Adresses
            </a>
            <a routerLink="/profile/payments" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-credit-card mr-2"></i> Paiements
            </a>

            <div class="nav-section">Achats</div>
            <a routerLink="/profile/orders" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-bag-shopping mr-2"></i> Mes commandes
              <span class="badge ml-auto">{{ ordersCount() }}</span>
            </a>
            <a routerLink="/profile/favorites" routerLinkActive="is-active" class="nav-item">
              <i class="fa-solid fa-heart mr-2"></i> Mes favoris
              <span class="badge ml-auto">{{ favoritesCount() }}</span>
            </a>
          </nav>
        </aside>

        <!-- Contenu -->
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

    user = computed(() => this.auth.currentUser$());
    favoritesCount = this.fav.count;
    ordersCount = this.orders.count;
}
