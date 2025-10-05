import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartCardComponent } from '../../components/chart-card/chart-card.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { DashboardSkeletonComponent } from '../../components/dashboard-skeleton/dashboard-skeleton.component';
import { SalesStore } from '../../stores/sales-store';
import { StocksStore } from '../../stores/stocks-store';
import { UsersStore } from '../../stores/users-store';
import { DashboardFiltersStore } from '../../stores/dashboard-filters.store';
import { KpiData, ChartCardConfig } from '../../models/dashboard.model';
import { ChartOptions, apexChartBaseOptions } from '../../models/chart.model';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    ChartCardComponent,
    KpiCardComponent,
    EmptyStateComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  loading = computed(() =>
    this.salesStore.loading() || this.stocksStore.loading() || this.usersStore.loading()
  );

  revenueChartOptions = signal<Partial<ChartOptions>>({});
  topProductsChartOptions = signal<Partial<ChartOptions>>({});

  chartConfig: ChartCardConfig = {
    title: 'Évolution du chiffre d\'affaires',
    subtitle: '30 derniers jours',
    showToggle: true,
    toggleLabel: 'Moyenne mobile',
  };

  topProductsConfig: ChartCardConfig = {
    title: 'Top 5 produits',
    subtitle: 'Par volume de ventes',
  };

  kpis = computed((): KpiData[] => {
    const revenue = this.salesStore.totalRevenue();
    const orders = this.salesStore.totalOrders();
    const basket = this.salesStore.averageBasket();
    const online = this.usersStore.onlineUsers();

    return [
      {
        label: 'Chiffre d\'affaires',
        value: revenue,
        unit: 'currency',
        variation: 12.5,
        trend: 'up',
        icon: 'fa-sack-dollar',
        iconColor: '#10b981',
        description: 'Montant total des ventes réalisées sur la période sélectionnée. Cet indicateur reflète la performance commerciale globale du shop.',
      },
      {
        label: 'Commandes',
        value: orders,
        unit: 'number',
        variation: 8.3,
        trend: 'up',
        icon: 'fa-cart-shopping',
        iconColor: '#3b82f6',
        description: 'Nombre total de commandes validées sur la période. Une augmentation indique une croissance de l\'activité commerciale.',
      },
      {
        label: 'Panier moyen',
        value: basket,
        unit: 'currency',
        variation: 3.2,
        trend: 'up',
        icon: 'fa-basket-shopping',
        iconColor: '#8b5cf6',
        description: 'Montant moyen dépensé par commande (CA total ÷ nombre de commandes). Un panier moyen élevé indique une bonne valorisation des ventes.',
      },
      {
        label: 'Visiteurs en ligne',
        value: online,
        unit: 'number',
        variation: -2.1,
        trend: 'down',
        icon: 'fa-users',
        iconColor: '#f59e0b',
        description: 'Nombre d\'utilisateurs actuellement connectés et actifs sur le site. Cette donnée est mise à jour toutes les 30 secondes.',
      },
    ];
  });

  alerts = computed(() => {
    return this.stocksStore.stockAlerts().slice(0, 5);
  });

  protected readonly salesStore = inject(SalesStore);
  protected readonly stocksStore = inject(StocksStore);
  protected readonly usersStore = inject(UsersStore);
  protected readonly filtersStore = inject(DashboardFiltersStore);

  constructor() {
    effect(() => {
      const period = this.filtersStore.period();
      void this.loadData(period);
    });
  }

  ngOnInit(): void {
    void this.loadData(this.filtersStore.period());
    this.startOnlineUsersPolling();
  }

  async loadData(period: '7d' | '30d' | '90d' | '1y'): Promise<void> {
    await Promise.all([
      this.salesStore.loadSalesData(period),
      this.salesStore.loadProductSales(),
      this.stocksStore.loadStocksData(),
    ]);

    this.updateRevenueChart();
    this.updateTopProductsChart();
  }

  onToggleMovingAverage(show: boolean): void {
    this.updateRevenueChart(show);
  }

  private updateRevenueChart(showMovingAverage = false): void {
    const salesData = this.salesStore.salesData();
    const movingAverage = this.salesStore.revenueMovingAverage();

    const series: ChartOptions['series'] = [
      {
        name: 'Chiffre d\'affaires',
        data: salesData.map((d) => ({
          x: d.date,
          y: d.revenue,
        })),
      },
    ];

    if (showMovingAverage) {
      series.push({
        name: 'Moyenne mobile (7j)',
        data: movingAverage.map((d) => ({
          x: d.date,
          y: Math.round(d.value),
        })),
      });
    }

    this.revenueChartOptions.set({
      ...apexChartBaseOptions,
      series,
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'line',
        height: 350,
      },
      xaxis: {
        type: 'datetime',
        labels: {
          format: 'dd/MM',
        },
      },
      yaxis: {
        labels: {
          formatter: (value: number): string => {
            return new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
      tooltip: {
        ...apexChartBaseOptions.tooltip,
        y: {
          formatter: (value: number): string => {
            return new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            }).format(value);
          },
        },
      },
    });
  }

  private updateTopProductsChart(): void {
    const topProducts = this.salesStore.topProducts().slice(0, 5);

    this.topProductsChartOptions.set({
      ...apexChartBaseOptions,
      series: [
        {
          name: 'Ventes',
          data: topProducts.map((p) => p.sales),
        },
      ],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'bar',
        height: 300,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
        },
      },
      xaxis: {
        categories: topProducts.map((p) => p.productName),
      },
      dataLabels: {
        enabled: true,
      },
    });
  }

  private startOnlineUsersPolling(): void {
    void this.usersStore.updateOnlineUsers();

    setInterval(() => {
      void this.usersStore.updateOnlineUsers();
    }, 30000);
  }

  getSeverityClass(severity: 'low' | 'medium' | 'high'): string {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  }
}
