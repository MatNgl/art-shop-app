import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserActivityService } from '../../services/user-activity';

interface ActivityStats {
  totalActivities: number;
  loginCount: number;
  orderCount: number;
  favoriteCount: number;
  lastActivity?: Date;
}

@Component({
  selector: 'app-user-activity-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Statistiques d'activité</h3>
        <button
          (click)="refreshStats()"
          class="text-blue-600 hover:text-blue-800 text-sm"
          [disabled]="loading()"
        >
          <i class="fa-solid" [ngClass]="loading() ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'"></i>
          {{ loading() ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>

      @if (loading()) {
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        @for (i of [1,2,3,4]; track i) {
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded mb-2"></div>
          <div class="h-8 bg-gray-200 rounded"></div>
        </div>
        }
      </div>
      } @else if (stats()) {
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600 mb-1">
            {{ stats()!.totalActivities }}
          </div>
          <div class="text-sm text-gray-600">Total activités</div>
        </div>

        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600 mb-1">
            {{ stats()!.loginCount }}
          </div>
          <div class="text-sm text-gray-600">Connexions</div>
        </div>

        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600 mb-1">
            {{ stats()!.orderCount }}
          </div>
          <div class="text-sm text-gray-600">Commandes</div>
        </div>

        <div class="text-center p-4 bg-pink-50 rounded-lg">
          <div class="text-2xl font-bold text-pink-600 mb-1">
            {{ stats()!.favoriteCount }}
          </div>
          <div class="text-sm text-gray-600">Favoris</div>
        </div>
      </div>

      @if (stats()!.lastActivity) {
      <div class="border-t border-gray-200 pt-4">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <i class="fa-solid fa-clock text-gray-400"></i>
          <span>Dernière activité: {{ formatLastActivity(stats()!.lastActivity!) }}</span>
        </div>
      </div>
      } } @else {
      <div class="text-center py-8">
        <i class="fa-solid fa-chart-line text-3xl text-gray-400 mb-2"></i>
        <p class="text-gray-500">Aucune statistique disponible</p>
      </div>
      }
    </div>
  `,
})
export class UserActivityStatsComponent implements OnInit {
  @Input() userId!: number;

  private activityService = inject(UserActivityService);

  loading = signal(false);
  stats = signal<ActivityStats | null>(null);

  async ngOnInit() {
    if (this.userId) {
      await this.loadStats();
    }
  }

  async refreshStats() {
    await this.loadStats();
  }

  private async loadStats() {
    if (!this.userId) return;

    this.loading.set(true);
    try {
      const stats = await this.activityService.getUserActivityStats(this.userId);
      this.stats.set(stats);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      this.stats.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  formatLastActivity(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
