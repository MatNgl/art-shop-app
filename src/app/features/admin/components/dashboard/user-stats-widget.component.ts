import { ToastService } from '../../../../shared/services/toast.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';

interface UserStatsData {
  total: number;
  admins: number;
  users: number;
  recentRegistrations: number;
  registrationsThisMonth: number;
  growthPercentage: number;
}

@Component({
  selector: 'app-user-stats-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Utilisateurs</h3>
        <a
          routerLink="/admin/users"
          class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Voir tout
          <i class="fa-solid fa-arrow-right text-xs"></i>
        </a>
      </div>

      @if (loading()) {
      <div class="space-y-4">
        <div class="h-16 bg-gray-100 rounded animate-pulse"></div>
        <div class="grid grid-cols-2 gap-4">
          <div class="h-12 bg-gray-100 rounded animate-pulse"></div>
          <div class="h-12 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
      } @else {
      <!-- Métriques principales -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-700">{{ stats().total }}</div>
          <div class="text-sm text-blue-600">Total utilisateurs</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-700">{{ stats().recentRegistrations }}</div>
          <div class="text-sm text-green-600">Nouveaux (7j)</div>
        </div>
      </div>

      <!-- Répartition par rôle -->
      <div class="space-y-3 mb-6">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">Administrateurs</span>
          <span class="text-sm font-medium text-gray-900">{{ stats().admins }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-red-500 h-2 rounded-full" [style.width.%]="getAdminPercentage()"></div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">Utilisateurs standard</span>
          <span class="text-sm font-medium text-gray-900">{{ stats().users }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-green-500 h-2 rounded-full" [style.width.%]="getUserPercentage()"></div>
        </div>
      </div>

      <!-- Croissance -->
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span class="text-sm text-gray-600">Croissance ce mois</span>
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium" [class]="getGrowthClass()">
            {{ stats().registrationsThisMonth }}
          </span>
          <i
            class="fa-solid text-xs"
            [class]="getGrowthIconClass()"
            [ngClass]="getGrowthClass()"
          ></i>
        </div>
      </div>
      }

      <!-- Actions rapides -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <div class="grid grid-cols-2 gap-3">
          <button
            routerLink="/admin/users"
            class="flex items-center justify-center gap-2 py-2 px-3 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <i class="fa-solid fa-users text-xs"></i>
            Gérer
          </button>
          <button
            (click)="exportUsers()"
            class="flex items-center justify-center gap-2 py-2 px-3 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <i class="fa-solid fa-download text-xs"></i>
            Exporter
          </button>
        </div>
      </div>
    </div>
  `,
})
export class UserStatsWidgetComponent implements OnInit {
  private authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  stats = signal<UserStatsData>({
    total: 0,
    admins: 0,
    users: 0,
    recentRegistrations: 0,
    registrationsThisMonth: 0,
    growthPercentage: 0,
  });

  loading = signal(true);

  async ngOnInit() {
    await this.loadStats();
  }

  private async loadStats() {
    this.loading.set(true);
    try {
      const stats = await this.authService.getUserStats();

      // Calculer le pourcentage de croissance (simulé)
      const growthPercentage =
        stats.registrationsThisMonth > 0
          ? Math.round(
            (stats.registrationsThisMonth /
              Math.max(stats.total - stats.registrationsThisMonth, 1)) *
            100
          )
          : 0;

      this.stats.set({
        ...stats,
        growthPercentage,
      });
    } catch (err) {
      console.error('Erreur lors du chargement des stats utilisateurs:', err);
    } finally {
      this.loading.set(false);
    }
  }

  getAdminPercentage(): number {
    const s = this.stats();
    return s.total > 0 ? Math.round((s.admins / s.total) * 100) : 0;
  }

  getUserPercentage(): number {
    const s = this.stats();
    return s.total > 0 ? Math.round((s.users / s.total) * 100) : 0;
  }

  getGrowthClass(): string {
    const growth = this.stats().registrationsThisMonth;
    if (growth > 5) return 'text-green-600';
    if (growth > 0) return 'text-blue-600';
    return 'text-gray-600';
  }

  getGrowthIconClass(): string {
    const growth = this.stats().registrationsThisMonth;
    if (growth > 5) return 'fa-arrow-up';
    if (growth > 0) return 'fa-arrow-right';
    return 'fa-minus';
  }

  exportUsers() {
    // TODO: Implémenter l'export direct depuis le widget
    this.toast.info('Export des utilisateurs lancé');
    console.warn('Export des utilisateurs depuis le widget');
  }
}
