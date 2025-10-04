import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartCardComponent } from '../../components/chart-card/chart-card.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { DashboardSkeletonComponent } from '../../components/dashboard-skeleton/dashboard-skeleton.component';
import { UsersStore } from '../../stores/users-store';
import { DashboardFiltersStore } from '../../stores/dashboard-filters.store';
import { ChartCardConfig, KpiData } from '../../models/dashboard.model';
import { ChartOptions, apexChartBaseOptions } from '../../models/chart.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, ChartCardComponent, EmptyStateComponent, KpiCardComponent, DashboardSkeletonComponent],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  loading = computed(() => this.usersStore.loading());

  kpis = computed((): KpiData[] => [
    {
      label: 'Total utilisateurs',
      value: this.usersStore.totalUsers(),
      unit: 'number',
      variation: this.usersStore.userGrowthRate(),
      trend: this.usersStore.userGrowthRate() > 0 ? 'up' : 'down',
      icon: 'fa-users',
      iconColor: '#3b82f6',
      description: 'Nombre total d\'utilisateurs inscrits. La croissance indique l\'attractivité de la plateforme sur la période.',
    },
    {
      label: 'Nouveaux utilisateurs',
      value: this.usersStore.totalNewUsers(),
      unit: 'number',
      icon: 'fa-user-plus',
      iconColor: '#10b981',
      description: 'Nombre de nouveaux comptes créés sur la période sélectionnée. Indicateur clé de l\'acquisition.',
    },
    {
      label: 'Utilisateurs récurrents',
      value: this.usersStore.totalReturningUsers(),
      unit: 'number',
      icon: 'fa-user-check',
      iconColor: '#8b5cf6',
      description: 'Nombre d\'utilisateurs qui reviennent après leur première visite. Mesure la rétention et la fidélité.',
    },
    {
      label: 'En ligne maintenant',
      value: this.usersStore.onlineUsers(),
      unit: 'number',
      icon: 'fa-circle-dot',
      iconColor: '#f97316',
      description: 'Nombre d\'utilisateurs actuellement actifs sur la plateforme. Mis à jour toutes les 30 secondes.',
    },
  ]);

  userGrowthChartOptions = signal<Partial<ChartOptions>>({});
  newVsReturningChartOptions = signal<Partial<ChartOptions>>({});
  onlineUsersChartOptions = signal<Partial<ChartOptions>>({});

  growthConfig: ChartCardConfig = {
    title: 'Évolution utilisateurs',
    subtitle: 'Croissance totale',
  };

  newVsReturningConfig: ChartCardConfig = {
    title: 'Nouveaux vs Récurrents',
    subtitle: 'Distribution mensuelle',
  };

  onlineConfig: ChartCardConfig = {
    title: 'Utilisateurs actifs',
    subtitle: 'Temps réel',
  };

  constructor(
    protected readonly usersStore: UsersStore,
    protected readonly filtersStore: DashboardFiltersStore
  ) {}

  ngOnInit(): void {
    void this.loadData();
    this.startOnlineUsersPolling();
  }

  async loadData(): Promise<void> {
    await this.usersStore.loadUserActivity(this.filtersStore.period());
    this.updateUserGrowthChart();
    this.updateNewVsReturningChart();
    this.updateOnlineUsersChart();
  }

  private updateUserGrowthChart(): void {
    const activity = this.usersStore.userActivity();

    this.userGrowthChartOptions.set({
      ...apexChartBaseOptions,
      series: [
        {
          name: 'Total utilisateurs',
          data: activity.map((d) => ({ x: d.date, y: d.totalUsers })),
        },
      ],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'area',
        height: 350,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
        },
      },
      xaxis: {
        type: 'datetime',
        labels: { format: 'dd/MM' },
      },
    });
  }

  private updateNewVsReturningChart(): void {
    const activity = this.usersStore.userActivity();

    this.newVsReturningChartOptions.set({
      ...apexChartBaseOptions,
      series: [
        {
          name: 'Nouveaux',
          data: activity.map((d) => ({ x: d.date, y: d.newUsers })),
        },
        {
          name: 'Récurrents',
          data: activity.map((d) => ({ x: d.date, y: d.returningUsers })),
        },
      ],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'bar',
        height: 350,
        stacked: true,
      },
      plotOptions: {
        bar: {
          columnWidth: '60%',
        },
      },
      xaxis: {
        type: 'datetime',
        labels: { format: 'dd/MM' },
      },
    });
  }

  private updateOnlineUsersChart(): void {
    this.onlineUsersChartOptions.set({
      ...apexChartBaseOptions,
      series: [this.usersStore.onlineUsers()],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'radialBar',
        height: 250,
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '60%',
          },
          dataLabels: {
            name: {
              show: true,
              fontSize: '14px',
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 600,
            },
          },
        },
      },
      labels: ['En ligne'],
    });
  }

  private startOnlineUsersPolling(): void {
    void this.usersStore.updateOnlineUsers();
    setInterval(() => {
      void this.usersStore.updateOnlineUsers();
      this.updateOnlineUsersChart();
    }, 30000);
  }
}
