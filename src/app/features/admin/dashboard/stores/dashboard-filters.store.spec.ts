import { TestBed } from '@angular/core/testing';
import { DashboardFiltersStore } from './dashboard-filters.store';

describe('DashboardFiltersStore', () => {
  let store: DashboardFiltersStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardFiltersStore],
    });
    store = TestBed.inject(DashboardFiltersStore);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have default filters', () => {
    const filters = store.filters();
    expect(filters.period).toBe('30d');
    expect(filters.granularity).toBe('day');
    expect(filters.compareWithPrevious).toBe(false);
  });

  it('should update period', () => {
    store.setPeriod('7d');
    expect(store.period()).toBe('7d');
  });

  it('should update granularity', () => {
    store.setGranularity('month');
    expect(store.granularity()).toBe('month');
  });

  it('should toggle compare with previous', () => {
    const initial = store.compareWithPrevious();
    store.toggleCompare();
    expect(store.compareWithPrevious()).toBe(!initial);
  });

  it('should compute date range correctly for 7d period', () => {
    store.setPeriod('7d');
    const range = store.dateRange();
    const diff = range.end.getTime() - range.start.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(Math.round(days)).toBe(7);
  });

  it('should reset filters to default', () => {
    store.setPeriod('90d');
    store.setGranularity('month');
    store.toggleCompare();

    store.resetFilters();

    expect(store.period()).toBe('30d');
    expect(store.granularity()).toBe('day');
    expect(store.compareWithPrevious()).toBe(false);
  });

  it('should persist filters to localStorage', (done) => {
    store.setPeriod('1y');

    setTimeout(() => {
      const stored = localStorage.getItem('dashboard_filters');
      expect(stored).toBeTruthy();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.period).toBe('1y');
      }
      done();
    }, 100);
  });
});
