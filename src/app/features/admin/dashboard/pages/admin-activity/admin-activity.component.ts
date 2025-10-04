import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartCardComponent } from '../../components/chart-card/chart-card.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { DashboardSkeletonComponent } from '../../components/dashboard-skeleton/dashboard-skeleton.component';
import { AdminStore } from '../../stores/admin-store';
import { ChartCardConfig, AdminActionData, KpiData } from '../../models/dashboard.model';
import { ChartOptions, apexChartBaseOptions, CHART_COLORS } from '../../models/chart.model';

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, ChartCardComponent, EmptyStateComponent, KpiCardComponent, DashboardSkeletonComponent],
  templateUrl: './admin-activity.component.html',
})
export class AdminActivityComponent implements OnInit {
  loading = computed(() => this.adminStore.loading());

  kpis = computed((): KpiData[] => [
    {
      label: 'Administrateurs actifs',
      value: this.adminStore.activeAdmins(),
      unit: 'number',
      icon: 'fa-user-shield',
      iconColor: '#6366f1',
      description: 'Nombre d\'administrateurs ayant effectué une action dans les 30 dernières minutes. Indicateur d\'activité en temps réel.',
    },
    {
      label: 'Total actions',
      value: this.adminStore.actions().length,
      unit: 'number',
      icon: 'fa-list-check',
      iconColor: '#3b82f6',
      description: 'Nombre total d\'actions administratives enregistrées sur la période. Inclut toutes les modifications apportées au système.',
    },
    {
      label: 'Actions critiques',
      value: this.adminStore.criticalActions().length,
      unit: 'number',
      icon: 'fa-triangle-exclamation',
      iconColor: '#ef4444',
      description: 'Nombre d\'actions marquées comme critiques nécessitant une attention particulière (suppressions, modifications sensibles, etc.).',
    },
  ]);

  actionsChartOptions = signal<Partial<ChartOptions>>({});
  severityChartOptions = signal<Partial<ChartOptions>>({});

  actionsConfig: ChartCardConfig = {
    title: 'Répartition des actions',
    subtitle: 'Par type d\'entité',
  };

  severityConfig: ChartCardConfig = {
    title: 'Actions par criticité',
    subtitle: 'Distribution',
  };

  constructor(protected readonly adminStore: AdminStore) {}

  ngOnInit(): void {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    await Promise.all([
      this.adminStore.loadAdminActions(30),
      this.adminStore.loadAdminSessions(7),
    ]);
    this.updateActionsChart();
    this.updateSeverityChart();
  }

  private updateActionsChart(): void {
    const actionsByType = this.adminStore.actionsByType();

    this.actionsChartOptions.set({
      ...apexChartBaseOptions,
      series: actionsByType.map((a) => a.count),
      labels: actionsByType.map((a) => this.getTypeLabel(a.type)),
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'donut',
        height: 300,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
          },
        },
      },
    });
  }

  private updateSeverityChart(): void {
    const severities = this.adminStore.actionsBySeverity();

    this.severityChartOptions.set({
      ...apexChartBaseOptions,
      series: [severities.normal, severities.warning, severities.critical],
      labels: ['Normal', 'Attention', 'Critique'],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'pie',
        height: 300,
      },
      colors: [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger],
    });
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      product: 'Produits',
      category: 'Catégories',
      user: 'Utilisateurs',
      stock: 'Stocks',
      order: 'Commandes',
    };
    return labels[type] || type;
  }

  getSeverityClass(severity: AdminActionData['severity']): string {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getSeverityIcon(severity: AdminActionData['severity']): string {
    switch (severity) {
      case 'critical':
        return 'fa-circle text-red-500';
      case 'warning':
        return 'fa-circle text-orange-500';
      case 'normal':
      default:
        return 'fa-circle text-green-500';
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  }
}
