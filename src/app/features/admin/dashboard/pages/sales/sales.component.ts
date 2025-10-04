import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartCardComponent } from '../../components/chart-card/chart-card.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { DashboardSkeletonComponent } from '../../components/dashboard-skeleton/dashboard-skeleton.component';
import { SalesStore } from '../../stores/sales-store';
import { DashboardFiltersStore } from '../../stores/dashboard-filters.store';
import { ChartCardConfig, KpiData } from '../../models/dashboard.model';
import {
  ChartOptions,
  apexChartBaseOptions,
  CHART_COLORS,
} from '../../models/chart.model';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    ChartCardComponent,
    EmptyStateComponent,
    KpiCardComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './sales.component.html',
})
export class SalesComponent implements OnInit {
  loading = computed(() => this.salesStore.loading());

  kpis = computed((): KpiData[] => [
    {
      label: 'Chiffre d\'affaires total',
      value: this.salesStore.totalRevenue(),
      unit: 'currency',
      icon: 'fa-sack-dollar',
      iconColor: '#3b82f6',
      description: 'Montant total des ventes réalisées sur la période sélectionnée. Cet indicateur reflète la performance commerciale globale.',
    },
    {
      label: 'Nombre de commandes',
      value: this.salesStore.totalOrders(),
      unit: 'number',
      icon: 'fa-cart-shopping',
      iconColor: '#10b981',
      description: 'Nombre total de commandes passées sur la période. Un volume élevé indique une bonne activité commerciale.',
    },
    {
      label: 'Panier moyen',
      value: this.salesStore.averageBasket(),
      unit: 'currency',
      icon: 'fa-basket-shopping',
      iconColor: '#8b5cf6',
      description: 'Montant moyen par commande (CA total / nombre de commandes). Un panier élevé indique une bonne valorisation des ventes.',
    },
  ]);

  revenueAndOrdersChartOptions = signal<Partial<ChartOptions>>({});
  topProductsChartOptions = signal<Partial<ChartOptions>>({});
  decliningProductsChartOptions = signal<Partial<ChartOptions>>({});
  formatDistributionChartOptions = signal<Partial<ChartOptions>>({});
  basketTrendChartOptions = signal<Partial<ChartOptions>>({});

  revenueConfig: ChartCardConfig = {
    title: 'CA et Commandes',
    subtitle: 'Évolution combinée',
  };

  topProductsConfig: ChartCardConfig = {
    title: 'Top produits',
    subtitle: 'Par volume de ventes',
  };

  decliningConfig: ChartCardConfig = {
    title: 'Produits en déclin',
    subtitle: 'Baisse > 20%',
  };

  formatConfig: ChartCardConfig = {
    title: 'Répartition par format',
    subtitle: 'Ventes totales',
  };

  basketConfig: ChartCardConfig = {
    title: 'Panier moyen',
    subtitle: 'Évolution dans le temps',
  };

  constructor(
    protected readonly salesStore: SalesStore,
    protected readonly filtersStore: DashboardFiltersStore
  ) {}

  ngOnInit(): void {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    await Promise.all([
      this.salesStore.loadSalesData(this.filtersStore.period()),
      this.salesStore.loadProductSales(),
    ]);

    this.updateRevenueAndOrdersChart();
    this.updateTopProductsChart();
    this.updateDecliningProductsChart();
    this.updateFormatDistributionChart();
    this.updateBasketTrendChart();
  }

  private updateRevenueAndOrdersChart(): void {
    const salesData = this.salesStore.salesData();

    this.revenueAndOrdersChartOptions.set({
      ...apexChartBaseOptions,
      series: [
        {
          name: 'Chiffre d\'affaires',
          type: 'line',
          data: salesData.map((d) => ({
            x: d.date,
            y: d.revenue,
          })),
        },
        {
          name: 'Commandes',
          type: 'column',
          data: salesData.map((d) => ({
            x: d.date,
            y: d.orders,
          })),
        },
      ],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'line',
        height: 350,
        stacked: false,
      },
      stroke: {
        width: [2, 0],
        curve: 'smooth',
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          format: 'dd/MM',
        },
      },
      yaxis: [
        {
          title: {
            text: 'CA (€)',
          },
          labels: {
            formatter: (value: number): string => {
              return `${Math.round(value)} €`;
            },
          },
        },
        {
          opposite: true,
          title: {
            text: 'Commandes',
          },
          labels: {
            formatter: (value: number): string => {
              return Math.round(value).toString();
            },
          },
        },
      ],
    });
  }

  private updateTopProductsChart(): void {
    const topProducts = this.salesStore.topProducts();

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
        height: 400,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          dataLabels: {
            position: 'top',
          },
        },
      },
      xaxis: {
        categories: topProducts.map((p) => p.productName),
      },
      dataLabels: {
        enabled: true,
        offsetX: 30,
        style: {
          fontSize: '12px',
          colors: ['#304758'],
        },
      },
    });
  }

  private updateDecliningProductsChart(): void {
    const decliningProducts = this.salesStore.decliningProducts().slice(0, 10);

    this.decliningProductsChartOptions.set({
      ...apexChartBaseOptions,
      series: [
        {
          name: 'Variation (%)',
          data: decliningProducts.map((p) => p.variation),
        },
      ],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'bar',
        height: 350,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
        },
      },
      colors: [CHART_COLORS.danger],
      xaxis: {
        categories: decliningProducts.map((p) => p.productName),
        labels: {
          formatter: (value: string): string => {
            return `${value}%`;
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (value: number): string => {
          return `${value.toFixed(1)}%`;
        },
      },
      annotations: {
        xaxis: [
          {
            x: -20,
            borderColor: CHART_COLORS.danger,
            strokeDashArray: 4,
            label: {
              text: 'Seuil -20%',
              style: {
                color: '#fff',
                background: CHART_COLORS.danger,
              },
            },
          },
        ],
      },
    });
  }

  private updateFormatDistributionChart(): void {
    const productSales = this.salesStore.productSales();
    const formatMap = new Map<string, number>();

    productSales.forEach((product) => {
      const format = product.productName.match(/A\d/)?.[0] || 'Autre';
      const current = formatMap.get(format) || 0;
      formatMap.set(format, current + product.sales);
    });

    const formats = Array.from(formatMap.entries()).sort((a, b) => b[1] - a[1]);

    this.formatDistributionChartOptions.set({
      ...apexChartBaseOptions,
      series: formats.map(([, value]) => value),
      labels: formats.map(([format]) => format),
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'donut',
        height: 350,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total ventes',
                formatter: (): string => {
                  const total = formats.reduce((sum, [, value]) => sum + value, 0);
                  return total.toLocaleString('fr-FR');
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number): string => {
          return `${val.toFixed(1)}%`;
        },
      },
      legend: {
        position: 'bottom',
      },
    });
  }

  private updateBasketTrendChart(): void {
    const salesData = this.salesStore.salesData();

    this.basketTrendChartOptions.set({
      ...apexChartBaseOptions,
      series: [
        {
          name: 'Panier moyen',
          data: salesData.map((d) => ({
            x: d.date,
            y: d.averageBasket,
          })),
        },
      ],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'area',
        height: 300,
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
        labels: {
          format: 'dd/MM',
        },
      },
      yaxis: {
        labels: {
          formatter: (value: number): string => {
            return `${Math.round(value)} €`;
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

}
