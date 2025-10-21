import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminNotificationService } from '../services/admin-notification.service';
import { AdminNotification } from '../models/admin-notification.model';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Notifications</h1>
          <p class="mt-2 text-sm text-gray-600">
            Gérez vos notifications administrateur
          </p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm font-medium text-gray-600">Total</div>
            <div class="text-2xl font-bold text-gray-900">{{ stats().total }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm font-medium text-gray-600">Non lues</div>
            <div class="text-2xl font-bold text-blue-600">{{ stats().unread }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm font-medium text-gray-600">Critiques</div>
            <div class="text-2xl font-bold text-red-600">{{ stats().bySeverity.critical }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm font-medium text-gray-600">Avertissements</div>
            <div class="text-2xl font-bold text-orange-600">{{ stats().bySeverity.warning }}</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="filterStatus.set('all')"
              [class.bg-blue-600]="filterStatus() === 'all'"
              [class.text-white]="filterStatus() === 'all'"
              [class.bg-white]="filterStatus() !== 'all'"
              [class.text-gray-700]="filterStatus() !== 'all'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700"
            >
              Toutes ({{ notifications().length }})
            </button>
            <button
              type="button"
              (click)="filterStatus.set('unread')"
              [class.bg-blue-600]="filterStatus() === 'unread'"
              [class.text-white]="filterStatus() === 'unread'"
              [class.bg-white]="filterStatus() !== 'unread'"
              [class.text-gray-700]="filterStatus() !== 'unread'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700"
            >
              Non lues ({{ stats().unread }})
            </button>
            <button
              type="button"
              (click)="filterStatus.set('read')"
              [class.bg-blue-600]="filterStatus() === 'read'"
              [class.text-white]="filterStatus() === 'read'"
              [class.bg-white]="filterStatus() !== 'read'"
              [class.text-gray-700]="filterStatus() !== 'read'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700"
            >
              Lues
            </button>
          </div>

          <div class="flex items-center gap-2">
            @if (stats().unread > 0) {
              <button
                type="button"
                (click)="markAllAsRead()"
                class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <i class="fa-solid fa-check mr-2"></i>
                Tout marquer comme lu
              </button>
            }
            <button
              type="button"
              (click)="clearDismissed()"
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i class="fa-solid fa-trash mr-2"></i>
              Nettoyer
            </button>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="space-y-3">
          @if (filteredNotifications().length === 0) {
            <div class="bg-white rounded-lg shadow p-8 text-center">
              <i class="fa-solid fa-bell-slash text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-600">Aucune notification à afficher</p>
            </div>
          } @else {
            @for (notif of filteredNotifications(); track notif.id) {
              <div
                class="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                [class.border-l-4]="!notif.isRead"
                [class.border-blue-500]="!notif.isRead"
              >
                <div class="p-4">
                  <div class="flex items-start gap-4">
                    <!-- Icon -->
                    <div
                      class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                      [ngClass]="{
                        'bg-red-100 text-red-600': notif.color === 'red',
                        'bg-orange-100 text-orange-600': notif.color === 'orange',
                        'bg-blue-100 text-blue-600': notif.color === 'blue',
                        'bg-purple-100 text-purple-600': notif.color === 'purple',
                        'bg-green-100 text-green-600': notif.color === 'green',
                        'bg-yellow-100 text-yellow-600': notif.color === 'yellow'
                      }"
                    >
                      <i [class]="notif.icon + ' text-xl'"></i>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-sm font-bold text-gray-900">{{ notif.title }}</h3>
                            @if (!notif.isRead) {
                              <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                            }
                            <span
                              class="px-2 py-0.5 text-xs font-medium rounded-full"
                              [ngClass]="{
                                'bg-red-100 text-red-700': notif.severity === 'critical',
                                'bg-orange-100 text-orange-700': notif.severity === 'warning',
                                'bg-blue-100 text-blue-700': notif.severity === 'info'
                              }"
                            >
                              {{ getSeverityLabel(notif.severity) }}
                            </span>
                          </div>
                          <p class="text-sm text-gray-600 mb-2">{{ notif.message }}</p>

                          <!-- Metadata -->
                          @if (notif.metadata) {
                            <div class="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                              @if (notif.metadata.productName) {
                                <span><i class="fa-solid fa-box mr-1"></i>{{ notif.metadata.productName }}</span>
                              }
                              @if (notif.metadata.stockQuantity !== undefined) {
                                <span><i class="fa-solid fa-layer-group mr-1"></i>Stock: {{ notif.metadata.stockQuantity }}</span>
                              }
                              @if (notif.metadata.orderTotal !== undefined) {
                                <span><i class="fa-solid fa-euro-sign mr-1"></i>{{ notif.metadata.orderTotal }}€</span>
                              }
                              @if (notif.metadata.orderItemCount !== undefined) {
                                <span><i class="fa-solid fa-shopping-bag mr-1"></i>{{ notif.metadata.orderItemCount }} article(s)</span>
                              }
                              @if (notif.metadata.userName) {
                                <span><i class="fa-solid fa-user mr-1"></i>{{ notif.metadata.userName }}</span>
                              }
                              @if (notif.metadata.boxMonth) {
                                <span><i class="fa-solid fa-calendar mr-1"></i>{{ notif.metadata.boxMonth }}</span>
                              }
                              @if (notif.metadata.boxCount !== undefined) {
                                <span><i class="fa-solid fa-box mr-1"></i>{{ notif.metadata.boxCount }} box(es)</span>
                              }
                            </div>
                          }

                          <div class="text-xs text-gray-500">
                            <i class="fa-solid fa-clock mr-1"></i>
                            {{ formatDate(notif.createdAt) }}
                          </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center gap-2">
                          @if (notif.actionUrl) {
                            <a
                              [routerLink]="notif.actionUrl"
                              (click)="markAsRead(notif)"
                              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              Voir
                            </a>
                          }
                          @if (!notif.isRead) {
                            <button
                              type="button"
                              (click)="markAsRead(notif)"
                              class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                            >
                              <i class="fa-solid fa-check"></i>
                            </button>
                          }
                          <button
                            type="button"
                            (click)="dismiss(notif.id)"
                            class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            <i class="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class NotificationsPageComponent {
  private readonly notificationSvc = inject(AdminNotificationService);

  readonly notifications = this.notificationSvc.notifications;
  readonly stats = this.notificationSvc.stats;

  readonly filterStatus = signal<'all' | 'unread' | 'read'>('all');

  readonly filteredNotifications = computed(() => {
    const notifs = this.notifications();
    const filter = this.filterStatus();

    switch (filter) {
      case 'unread':
        return notifs.filter(n => !n.isRead);
      case 'read':
        return notifs.filter(n => n.isRead);
      default:
        return notifs;
    }
  });

  markAsRead(notif: AdminNotification): void {
    if (!notif.isRead) {
      this.notificationSvc.markAsRead(notif.id);
    }
  }

  markAllAsRead(): void {
    this.notificationSvc.markAllAsRead();
  }

  dismiss(notifId: string): void {
    this.notificationSvc.dismiss(notifId);
  }

  clearDismissed(): void {
    this.notificationSvc.clearDismissed();
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
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  getSeverityLabel(severity: 'info' | 'warning' | 'critical'): string {
    switch (severity) {
      case 'critical':
        return 'Critique';
      case 'warning':
        return 'Avertissement';
      case 'info':
        return 'Info';
    }
  }
}
