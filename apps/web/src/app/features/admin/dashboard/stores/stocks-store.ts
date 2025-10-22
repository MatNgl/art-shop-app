import { Injectable, signal, computed } from '@angular/core';
import { StockData, AlertData } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class StocksStore {
  private readonly stocksDataSignal = signal<StockData[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly stocksData = this.stocksDataSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly lowStockProducts = computed(() => {
    return this.stocksDataSignal()
      .filter((p) => p.stock < 5)
      .sort((a, b) => a.stock - b.stock);
  });

  readonly outOfStockProducts = computed(() => {
    return this.stocksDataSignal().filter((p) => p.stock === 0);
  });

  readonly availabilityRate = computed(() => {
    const total = this.stocksDataSignal().length;
    if (total === 0) return 100;

    const available = this.stocksDataSignal().filter((p) => p.stock > 0).length;
    return Math.round((available / total) * 100 * 10) / 10;
  });

  readonly averageRotationRate = computed(() => {
    const stocks = this.stocksDataSignal();
    if (stocks.length === 0) return 0;

    const total = stocks.reduce((sum, s) => sum + s.rotationRate, 0);
    return Math.round((total / stocks.length) * 10) / 10;
  });

  readonly averageDaysInStock = computed(() => {
    const stocks = this.stocksDataSignal();
    if (stocks.length === 0) return 0;

    const total = stocks.reduce((sum, s) => sum + s.daysInStock, 0);
    return Math.round(total / stocks.length);
  });

  readonly stocksByCategory = computed(() => {
    const categoryMap = new Map<string, number>();

    this.stocksDataSignal().forEach((stock) => {
      const current = categoryMap.get(stock.category) || 0;
      categoryMap.set(stock.category, current + stock.stock);
    });

    return Array.from(categoryMap.entries()).map(([category, total]) => ({
      category,
      total,
    }));
  });

  readonly stocksByFormat = computed(() => {
    const formatMap = new Map<string, number>();

    this.stocksDataSignal().forEach((stock) => {
      const current = formatMap.get(stock.format) || 0;
      formatMap.set(stock.format, current + stock.stock);
    });

    return Array.from(formatMap.entries()).map(([format, total]) => ({
      format,
      total,
    }));
  });

  readonly stockAlerts = computed((): AlertData[] => {
    const alerts: AlertData[] = [];
    const now = new Date();

    this.outOfStockProducts().forEach((product) => {
      alerts.push({
        id: `alert-${product.productId}`,
        type: 'stock',
        severity: 'high',
        message: `${product.productName} est en rupture de stock`,
        productId: product.productId,
        timestamp: now,
      });
    });

    this.lowStockProducts()
      .filter((p) => p.stock > 0)
      .forEach((product) => {
        alerts.push({
          id: `alert-${product.productId}`,
          type: 'stock',
          severity: 'medium',
          message: `${product.productName} a un stock faible (${product.stock} unités)`,
          productId: product.productId,
          timestamp: now,
        });
      });

    return alerts;
  });

  async loadStocksData(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.simulateDelay(500);
      const mockData = this.generateMockStocksData();
      this.stocksDataSignal.set(mockData);
    } catch (error) {
      this.errorSignal.set('Erreur lors du chargement des données de stock');
      console.error(error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private generateMockStocksData(): StockData[] {
    const products = [
      { name: 'Paysage Montagneux', category: 'Nature', format: 'A3' },
      { name: 'Portrait Abstrait', category: 'Art Abstrait', format: 'A4' },
      { name: 'Nature Morte', category: 'Classique', format: 'A5' },
      { name: 'Cityscape Paris', category: 'Urbain', format: 'A3' },
      { name: 'Fleurs Aquarelle', category: 'Nature', format: 'A4' },
      { name: 'Chat Mignon', category: 'Animaux', format: 'A6' },
      { name: 'Coucher de Soleil', category: 'Nature', format: 'A2' },
      { name: 'Géométrie Moderne', category: 'Art Moderne', format: 'A4' },
      { name: 'Océan Bleu', category: 'Nature', format: 'A3' },
      { name: 'Forêt Mystique', category: 'Nature', format: 'A5' },
      { name: 'Art Contemporain', category: 'Art Moderne', format: 'A4' },
      { name: 'Vintage Paris', category: 'Vintage', format: 'A3' },
      { name: 'Minimaliste Noir', category: 'Minimaliste', format: 'A4' },
      { name: 'Café Parisien', category: 'Urbain', format: 'A5' },
      { name: 'Jardin Japonais', category: 'Asiatique', format: 'A3' },
    ];

    return products.map((product, index) => ({
      productId: `prod-${index + 1}`,
      productName: product.name,
      stock: Math.floor(Math.random() * 25),
      category: product.category,
      format: product.format,
      daysInStock: Math.floor(Math.random() * 180),
      rotationRate: Math.round(Math.random() * 10 * 10) / 10,
    }));
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
