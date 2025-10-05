import { Injectable, signal, computed } from '@angular/core';
import { SalesData, ProductSalesData } from '../models/dashboard.model';
import { PeriodType } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class SalesStore {
  private readonly salesDataSignal = signal<SalesData[]>([]);
  private readonly productSalesSignal = signal<ProductSalesData[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly salesData = this.salesDataSignal.asReadonly();
  readonly productSales = this.productSalesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly totalRevenue = computed(() => {
    return this.salesDataSignal().reduce((sum, item) => sum + item.revenue, 0);
  });

  readonly totalOrders = computed(() => {
    return this.salesDataSignal().reduce((sum, item) => sum + item.orders, 0);
  });

  readonly averageBasket = computed(() => {
    const total = this.totalRevenue();
    const orders = this.totalOrders();
    return orders > 0 ? total / orders : 0;
  });

  readonly revenueMovingAverage = computed(() => {
    const data = this.salesDataSignal();
    const windowSize = 7;

    return data.map((item, index) => {
      if (index < windowSize - 1) {
        return { date: item.date, value: item.revenue };
      }

      const window = data.slice(index - windowSize + 1, index + 1);
      const avg = window.reduce((sum, w) => sum + w.revenue, 0) / windowSize;

      return { date: item.date, value: avg };
    });
  });

  readonly topProducts = computed(() => {
    return [...this.productSalesSignal()]
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  });

  readonly decliningProducts = computed(() => {
    return this.productSalesSignal()
      .filter((p) => p.variation < -20)
      .sort((a, b) => a.variation - b.variation);
  });

  async loadSalesData(period: PeriodType): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.simulateDelay(1200);
      const mockData = this.generateMockSalesData(period);
      this.salesDataSignal.set(mockData);
    } catch (error) {
      this.errorSignal.set('Erreur lors du chargement des données de ventes');
      console.error(error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadProductSales(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.simulateDelay(1000);
      const mockData = this.generateMockProductSales();
      this.productSalesSignal.set(mockData);
    } catch (error) {
      this.errorSignal.set('Erreur lors du chargement des ventes produits');
      console.error(error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private generateMockSalesData(period: PeriodType): SalesData[] {
    const days = this.getPeriodDays(period);
    const data: SalesData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const baseRevenue = 5000 + Math.random() * 3000;
      const orders = Math.floor(20 + Math.random() * 30);
      const revenue = baseRevenue + (Math.sin(i / 7) * 1000);

      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(revenue),
        orders,
        averageBasket: Math.round(revenue / orders),
      });
    }

    return data;
  }

  private generateMockProductSales(): ProductSalesData[] {
    const products = [
      'Paysage Montagneux A3',
      'Portrait Abstrait A4',
      'Nature Morte A5',
      'Cityscape Paris A3',
      'Fleurs Aquarelle A4',
      'Chat Mignon A6',
      'Coucher de Soleil A2',
      'Géométrie Moderne A4',
      'Océan Bleu A3',
      'Forêt Mystique A5',
      'Art Contemporain A4',
      'Vintage Paris A3',
      'Minimaliste Noir A4',
      'Café Parisien A5',
      'Jardin Japonais A3',
    ];

    return products.map((name, index) => ({
      productId: `prod-${index + 1}`,
      productName: name,
      sales: Math.floor(100 + Math.random() * 400),
      revenue: Math.round((200 + Math.random() * 500) * 100) / 100,
      variation: Math.round((Math.random() * 100 - 30) * 10) / 10,
    }));
  }

  private getPeriodDays(period: PeriodType): number {
    switch (period) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
