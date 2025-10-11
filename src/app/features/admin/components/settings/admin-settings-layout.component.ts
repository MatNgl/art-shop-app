import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header avec gradient + menu intégré -->
      <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div class="container-wide py-6">
          <!-- Titre et bouton -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
              <div
                class="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-indigo-500"
              >
                <i class="fa-solid fa-sliders text-white text-2xl"></i>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">Réglages</h1>
                <p class="text-gray-600 mt-1 text-sm">Configurez les paramètres de votre site</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              @if (isBadgesRoute()) {
              <button
                type="button"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
                (click)="onCreateBadge()"
              >
                <i class="fa-solid fa-plus"></i>
                Créer un badge
              </button>
              }
            </div>
          </div>

          <!-- Menu de navigation -->
          <nav class="flex gap-2 overflow-x-auto pb-2 border-t pt-4">
            <a
              routerLink="/admin/settings/badges"
              routerLinkActive="active"
              #rla1="routerLinkActive"
              class="settings-tab"
              [class.active]="rla1.isActive"
            >
              <i class="fa-solid fa-palette"></i>
              <span>Badges utilisateurs</span>
            </a>

            <a
              routerLink="/admin/settings/general"
              routerLinkActive="active"
              #rla2="routerLinkActive"
              class="settings-tab"
              [class.active]="rla2.isActive"
            >
              <i class="fa-solid fa-gear"></i>
              <span>Général</span>
            </a>

            <a
              routerLink="/admin/settings/appearance"
              routerLinkActive="active"
              #rla3="routerLinkActive"
              class="settings-tab"
              [class.active]="rla3.isActive"
            >
              <i class="fa-solid fa-paint-roller"></i>
              <span>Apparence</span>
            </a>

            <a
              routerLink="/admin/settings/notifications"
              routerLinkActive="active"
              #rla4="routerLinkActive"
              class="settings-tab"
              [class.active]="rla4.isActive"
            >
              <i class="fa-solid fa-bell"></i>
              <span>Notifications</span>
            </a>
          </nav>
        </div>
      </div>

      <!-- Contenu avec même largeur -->
      <div class="container-wide">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [
    `
      .settings-tab {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        background: transparent;
        border: 1px solid transparent;
        white-space: nowrap;
        transition: all 0.2s;
        cursor: pointer;
      }

      .settings-tab:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .settings-tab.active {
        background: #eef2ff;
        color: #4f46e5;
        border-color: #c7d2fe;
        font-weight: 600;
      }
    `,
  ],
})
export class AdminSettingsLayoutComponent {
  private router = inject(Router);

  isBadgesRoute(): boolean {
    return this.router.url.includes('/admin/settings/badges');
  }

  onCreateBadge(): void {
    // Dispatch un événement custom que le composant badges pourra écouter
    window.dispatchEvent(new CustomEvent('createBadge'));
  }
}
