import { Injectable, signal, computed, effect } from '@angular/core';
import {
  DashboardFilters,
  PeriodType,
  GranularityType,
} from '../models/dashboard.model';

const STORAGE_KEY = 'dashboard_filters';

@Injectable({
  providedIn: 'root',
})
export class DashboardFiltersStore {
  private readonly filtersSignal = signal<DashboardFilters>(
    this.loadFiltersFromStorage()
  );

  readonly filters = this.filtersSignal.asReadonly();

  readonly period = computed(() => this.filtersSignal().period);
  readonly granularity = computed(() => this.filtersSignal().granularity);
  readonly category = computed(() => this.filtersSignal().category);
  readonly compareWithPrevious = computed(
    () => this.filtersSignal().compareWithPrevious
  );

  readonly dateRange = computed(() => {
    const period = this.period();
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  });

  constructor() {
    effect(() => {
      const filters = this.filtersSignal();
      this.saveFiltersToStorage(filters);
    });
  }

  setPeriod(period: PeriodType): void {
    this.filtersSignal.update((current) => ({
      ...current,
      period,
    }));
  }

  setGranularity(granularity: GranularityType): void {
    this.filtersSignal.update((current) => ({
      ...current,
      granularity,
    }));
  }

  setCategory(category: string | undefined): void {
    this.filtersSignal.update((current) => ({
      ...current,
      category,
    }));
  }

  toggleCompare(): void {
    this.filtersSignal.update((current) => ({
      ...current,
      compareWithPrevious: !current.compareWithPrevious,
    }));
  }

  resetFilters(): void {
    this.filtersSignal.set({
      period: '30d',
      granularity: 'day',
      category: undefined,
      compareWithPrevious: false,
    });
  }

  private loadFiltersFromStorage(): DashboardFilters {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as DashboardFilters;
      }
    } catch (error) {
      console.error('Error loading filters from storage:', error);
    }

    return {
      period: '30d',
      granularity: 'day',
      category: undefined,
      compareWithPrevious: false,
    };
  }

  private saveFiltersToStorage(filters: DashboardFilters): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters to storage:', error);
    }
  }
}
