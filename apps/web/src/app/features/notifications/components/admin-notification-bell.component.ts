import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminNotificationService } from '../services/admin-notification.service';
import { AdminNotification } from '../models/admin-notification.model';

@Component({
  selector: 'app-admin-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="relative">
      <!-- Bell Button -->
      <button
        type="button"
        class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        (click)="toggleDropdown()"
        [attr.aria-label]="'Notifications (' + unreadCount() + ')'"
      >
        <i class="fa-solid fa-bell text-xl"></i>

        <!-- Badge count -->
        @if (unreadCount() > 0) {
          <span class="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
            {{ unreadCount() > 99 ? '99+' : unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <!-- Backdrop -->
        <div
          class="fixed inset-0 z-10"
          role="button"
          tabindex="0"
          (click)="closeDropdown()"
          (keydown.escape)="closeDropdown()"
          (keydown.enter)="closeDropdown()"
          aria-label="Fermer les notifications"
        ></div>

        <!-- Dropdown panel -->
        <div class="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 max-h-[600px] flex flex-col">
          <!-- Header -->
          <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-xl">
            <a
              routerLink="/admin/notifications"
              (click)="closeDropdown()"
              class="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Notifications
              @if (unreadCount() > 0) {
                <span class="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  {{ unreadCount() }}
                </span>
              }
            </a>
            <div class="flex items-center gap-2">
              @if (unreadCount() > 0) {
                <button
                  (click)="markAllAsRead(); $event.stopPropagation()"
                  class="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  title="Tout marquer comme lu"
                >
                  <i class="fa-solid fa-check-double mr-1"></i>
                  Tout lire
                </button>
              }
              <button
                (click)="closeDropdown()"
                class="text-gray-400 hover:text-gray-600"
              >
                <i class="fa-solid fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Notifications list -->
          <div class="overflow-y-auto flex-1">
            @if (recentNotifications().length === 0) {
              <div class="px-4 py-12 text-center text-gray-500">
                <i class="fa-solid fa-bell-slash text-4xl mb-3 text-gray-300"></i>
                <p class="text-sm">Aucune notification</p>
              </div>
            } @else {
              @for (notif of recentNotifications(); track notif.id) {
                <a
                  [routerLink]="notif.actionUrl"
                  (click)="onNotificationClick(notif)"
                  class="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  [class.bg-blue-50]="!notif.isRead"
                >
                  <div class="flex items-start gap-3">
                    <!-- Icon -->
                    <div
                      class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                      [ngClass]="{
                        'bg-red-100 text-red-600': notif.color === 'red',
                        'bg-orange-100 text-orange-600': notif.color === 'orange',
                        'bg-blue-100 text-blue-600': notif.color === 'blue',
                        'bg-purple-100 text-purple-600': notif.color === 'purple',
                        'bg-green-100 text-green-600': notif.color === 'green',
                        'bg-yellow-100 text-yellow-600': notif.color === 'yellow'
                      }"
                    >
                      <i [class]="notif.icon"></i>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2">
                        <p class="text-sm font-semibold text-gray-900">
                          {{ notif.title }}
                        </p>
                        @if (!notif.isRead) {
                          <span class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                        }
                      </div>
                      <p class="text-sm text-gray-600 mt-0.5">
                        {{ notif.message }}
                      </p>
                      <p class="text-xs text-gray-400 mt-1">
                        {{ formatDate(notif.createdAt) }}
                      </p>
                    </div>

                    <!-- Dismiss button -->
                    <button
                      (click)="dismissNotification(notif.id, $event)"
                      class="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
                      title="Ignorer"
                    >
                      <i class="fa-solid fa-times text-xs"></i>
                    </button>
                  </div>
                </a>
              }
            }
          </div>

          <!-- Footer -->
          @if (notifications().length > 5) {
            <div class="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <a
                routerLink="/admin/notifications"
                (click)="closeDropdown()"
                class="block text-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Voir toutes les notifications
                <i class="fa-solid fa-arrow-right ml-1 text-xs"></i>
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AdminNotificationBellComponent {
  private readonly notificationSvc = inject(AdminNotificationService);

  isOpen = signal(false);

  notifications = computed(() => this.notificationSvc.getActive());
  unreadCount = this.notificationSvc.unreadCount;

  // Afficher seulement les 5 plus récentes dans le dropdown
  recentNotifications = computed(() =>
    this.notifications().slice(0, 5)
  );

  toggleDropdown(): void {
    this.isOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  onNotificationClick(notif: AdminNotification): void {
    this.notificationSvc.markAsRead(notif.id);
    this.closeDropdown();
  }

  markAllAsRead(): void {
    this.notificationSvc.markAllAsRead();
  }

  dismissNotification(notifId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationSvc.dismiss(notifId);
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }
}
