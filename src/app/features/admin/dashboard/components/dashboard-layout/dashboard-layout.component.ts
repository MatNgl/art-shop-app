import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DashboardFiltersStore } from '../../stores/dashboard-filters.store';
import { PeriodType } from '../../models/dashboard.model';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-layout.component.html',
})
export class DashboardLayoutComponent {
  loading = signal(false);

  navItems: NavItem[] = [
    { label: 'Vue d\'ensemble', path: '/admin/dashboard/overview', icon: 'fa-chart-line' },
    { label: 'Ventes', path: '/admin/dashboard/sales', icon: 'fa-sack-dollar' },
    { label: 'Stocks', path: '/admin/dashboard/stocks', icon: 'fa-boxes-stacked' },
    { label: 'Utilisateurs', path: '/admin/dashboard/users', icon: 'fa-users' },
    { label: 'Administration', path: '/admin/dashboard/admin-activity', icon: 'fa-shield-halved' },
  ];

  periods: Array<{ value: PeriodType; label: string }> = [
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '1y', label: '1 an' },
  ];

  constructor(
    protected readonly router: Router,
    protected readonly filtersStore: DashboardFiltersStore
  ) {
    effect(() => {
      const period = this.filtersStore.period();
      if (period) {
        this.loading.set(true);
        setTimeout(() => this.loading.set(false), 800);
      }
    });
  }

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtersStore.setPeriod(select.value as PeriodType);
  }

  isActiveRoute(path: string): boolean {
    return this.router.url === path;
  }

  handleNavKeydown(event: KeyboardEvent, path: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void this.router.navigate([path]);
    }
  }
}
