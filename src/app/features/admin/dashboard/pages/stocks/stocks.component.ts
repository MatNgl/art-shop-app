import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartCardComponent } from '../../components/chart-card/chart-card.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { DashboardSkeletonComponent } from '../../components/dashboard-skeleton/dashboard-skeleton.component';
import { StocksStore } from '../../stores/stocks-store';
import { ChartCardConfig, KpiData } from '../../models/dashboard.model';
import {
  ChartOptions,
  apexChartBaseOptions,
  CHART_COLORS,
} from '../../models/chart.model';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    ChartCardComponent,
    EmptyStateComponent,
    KpiCardComponent,
    DashboardSkeletonComponent,
  ],
  templateUrl: './stocks.component.html',
})
export class StocksComponent implements OnInit {
  loading = computed(() => this.stocksStore.loading());

  kpis = computed((): KpiData[] => [
    {
      label: 'Taux de disponibilité',
      value: this.stocksStore.availabilityRate(),
      unit: 'percentage',
      icon: 'fa-check-circle',
      iconColor: '#10b981',
      description: 'Pourcentage de produits disponibles en stock par rapport au total du catalogue. Un taux élevé indique une bonne gestion des approvisionnements.',
    },
    {
      label: 'Produits en rupture',
      value: this.stocksStore.outOfStockProducts().length,
      unit: 'number',
      icon: 'fa-triangle-exclamation',
      iconColor: '#ef4444',
      description: 'Nombre de produits actuellement en rupture de stock (quantité = 0). Ces produits nécessitent un réapprovisionnement urgent.',
    },
    {
      label: 'Stocks faibles',
      value: this.stocksStore.lowStockProducts().length,
      unit: 'number',
      icon: 'fa-box-open',
      iconColor: '#f97316',
      description: 'Nombre de produits avec moins de 5 unités en stock. Ces produits risquent une rupture prochaine et doivent être surveillés.',
    },
    {
      label: 'Rotation moyenne',
      value: this.stocksStore.averageRotationRate(),
      unit: 'number',
      icon: 'fa-arrows-rotate',
      iconColor: '#3b82f6',
      description: 'Nombre moyen de jours avant renouvellement complet du stock. Plus ce chiffre est bas, plus la rotation est rapide et efficace.',
    },
  ]);

  lowStockChartOptions = signal<Partial<ChartOptions>>({});
  availabilityChartOptions = signal<Partial<ChartOptions>>({});
  rotationChartOptions = signal<Partial<ChartOptions>>({});
  categoryStockChartOptions = signal<Partial<ChartOptions>>({});

  lowStockConfig: ChartCardConfig = {
    title: 'Produits en stock faible',
    subtitle: 'Stock < 5 unités',
  };

  availabilityConfig: ChartCardConfig = {
    title: 'Taux de disponibilité',
    subtitle: 'Disponible vs rupture',
  };

  rotationConfig: ChartCardConfig = {
    title: 'Rotation des stocks',
    subtitle: 'Par catégorie (jours)',
  };

  categoryConfig: ChartCardConfig = {
    title: 'Stock par catégorie',
    subtitle: 'Distribution totale',
  };

  constructor(protected readonly stocksStore: StocksStore) {}

  ngOnInit(): void {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    await this.stocksStore.loadStocksData();

    this.updateLowStockChart();
    this.updateAvailabilityChart();
    this.updateRotationChart();
    this.updateCategoryStockChart();
  }

  private updateLowStockChart(): void {
    const lowStockProducts = this.stocksStore.lowStockProducts();

    this.lowStockChartOptions.set({
      ...apexChartBaseOptions,
      series: [
        {
          name: 'Stock',
          data: lowStockProducts.map((p) => p.stock),
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
          distributed: true,
        },
      },
      colors: lowStockProducts.map((p) => {
        if (p.stock === 0) return CHART_COLORS.danger;
        if (p.stock < 3) return CHART_COLORS.warning;
        return CHART_COLORS.success;
      }),
      xaxis: {
        categories: lowStockProducts.map((p) => p.productName),
      },
      dataLabels: {
        enabled: true,
      },
      legend: {
        show: false,
      },
    });
  }

  private updateAvailabilityChart(): void {
    const availabilityRate = this.stocksStore.availabilityRate();
    const outOfStockRate = 100 - availabilityRate;

    this.availabilityChartOptions.set({
      ...apexChartBaseOptions,
      series: [availabilityRate, outOfStockRate],
      labels: ['Disponible', 'Rupture'],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'donut',
        height: 300,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Disponibilité',
                formatter: (): string => {
                  return `${availabilityRate.toFixed(1)}%`;
                },
              },
            },
          },
        },
      },
      colors: [CHART_COLORS.success, CHART_COLORS.danger],
      dataLabels: {
        enabled: true,
        formatter: (val: number): string => {
          return `${val.toFixed(1)}%`;
        },
      },
    });
  }

  private updateRotationChart(): void {
    const categoryRotation = new Map<string, { total: number; count: number }>();

    this.stocksStore.stocksData().forEach((stock) => {
      const current = categoryRotation.get(stock.category) || {
        total: 0,
        count: 0,
      };
      categoryRotation.set(stock.category, {
        total: current.total + stock.rotationRate,
        count: current.count + 1,
      });
    });

    const rotationData = Array.from(categoryRotation.entries())
      .map(([category, data]) => ({
        category,
        average: data.total / data.count,
      }))
      .sort((a, b) => b.average - a.average);

    this.rotationChartOptions.set({
      ...apexChartBaseOptions,
      series: [
        {
          name: 'Rotation moyenne (j)',
          data: rotationData.map((r) => r.average),
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
      xaxis: {
        categories: rotationData.map((r) => r.category),
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number): string => {
          return `${val.toFixed(1)} j`;
        },
      },
    });
  }

  private updateCategoryStockChart(): void {
    const categoryStocks = this.stocksStore.stocksByCategory();

    this.categoryStockChartOptions.set({
      ...apexChartBaseOptions,
      series: [
        {
          name: 'Stock total',
          data: categoryStocks.map((c) => c.total),
        },
      ],
      chart: {
        ...apexChartBaseOptions.chart,
        type: 'bar',
        height: 350,
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '60%',
        },
      },
      xaxis: {
        categories: categoryStocks.map((c) => c.category),
        labels: {
          rotate: -45,
          rotateAlways: true,
        },
      },
      dataLabels: {
        enabled: true,
      },
    });
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
