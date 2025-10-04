import { TestBed } from '@angular/core/testing';
import { SalesStore } from './sales-store';

describe('SalesStore', () => {
  let store: SalesStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SalesStore],
    });
    store = TestBed.inject(SalesStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should load sales data', async () => {
    expect(store.loading()).toBe(false);
    expect(store.salesData().length).toBe(0);

    await store.loadSalesData('30d');

    expect(store.loading()).toBe(false);
    expect(store.salesData().length).toBe(30);
  });

  it('should compute total revenue', async () => {
    await store.loadSalesData('7d');

    const total = store.totalRevenue();
    expect(total).toBeGreaterThan(0);
  });

  it('should compute total orders', async () => {
    await store.loadSalesData('7d');

    const orders = store.totalOrders();
    expect(orders).toBeGreaterThan(0);
  });

  it('should compute average basket', async () => {
    await store.loadSalesData('7d');

    const avg = store.averageBasket();
    const revenue = store.totalRevenue();
    const orders = store.totalOrders();

    expect(avg).toBeCloseTo(revenue / orders, 2);
  });

  it('should compute moving average', async () => {
    await store.loadSalesData('30d');

    const movingAvg = store.revenueMovingAverage();
    expect(movingAvg.length).toBe(30);
    expect(movingAvg[0].value).toBeGreaterThan(0);
  });

  it('should load product sales', async () => {
    await store.loadProductSales();

    expect(store.productSales().length).toBeGreaterThan(0);
  });

  it('should compute top products', async () => {
    await store.loadProductSales();

    const topProducts = store.topProducts();
    expect(topProducts.length).toBeLessThanOrEqual(10);

    if (topProducts.length > 1) {
      expect(topProducts[0].sales).toBeGreaterThanOrEqual(topProducts[1].sales);
    }
  });

  it('should filter declining products', async () => {
    await store.loadProductSales();

    const declining = store.decliningProducts();
    declining.forEach((product) => {
      expect(product.variation).toBeLessThan(-20);
    });
  });

  it('should handle errors gracefully', async () => {
    await store.loadSalesData('30d');
    expect(store.error()).toBeNull();
  });
});
