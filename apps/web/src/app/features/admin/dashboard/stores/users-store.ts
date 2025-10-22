import { Injectable, signal, computed } from '@angular/core';
import { UserActivityData } from '../models/dashboard.model';
import { PeriodType } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class UsersStore {
  private readonly userActivitySignal = signal<UserActivityData[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly onlineUsersSignal = signal<number>(0);

  readonly userActivity = this.userActivitySignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly onlineUsers = this.onlineUsersSignal.asReadonly();

  readonly totalUsers = computed(() => {
    const data = this.userActivitySignal();
    if (data.length === 0) return 0;
    return data[data.length - 1].totalUsers;
  });

  readonly totalNewUsers = computed(() => {
    return this.userActivitySignal().reduce((sum, item) => sum + item.newUsers, 0);
  });

  readonly totalReturningUsers = computed(() => {
    return this.userActivitySignal().reduce(
      (sum, item) => sum + item.returningUsers,
      0
    );
  });

  readonly averageActiveUsers = computed(() => {
    const data = this.userActivitySignal();
    if (data.length === 0) return 0;

    const total = data.reduce((sum, item) => sum + item.activeUsers, 0);
    return Math.round(total / data.length);
  });

  readonly newVsReturning = computed(() => {
    const newUsers = this.totalNewUsers();
    const returning = this.totalReturningUsers();
    const total = newUsers + returning;

    return {
      newUsers,
      newUsersPercent: total > 0 ? Math.round((newUsers / total) * 100) : 0,
      returning,
      returningPercent: total > 0 ? Math.round((returning / total) * 100) : 0,
    };
  });

  readonly userGrowthRate = computed(() => {
    const data = this.userActivitySignal();
    if (data.length < 2) return 0;

    const latest = data[data.length - 1].totalUsers;
    const previous = data[0].totalUsers;

    if (previous === 0) return 0;

    return Math.round(((latest - previous) / previous) * 100 * 10) / 10;
  });

  async loadUserActivity(period: PeriodType): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.simulateDelay(500);
      const mockData = this.generateMockUserActivity(period);
      this.userActivitySignal.set(mockData);
    } catch (error) {
      this.errorSignal.set('Erreur lors du chargement des données utilisateurs');
      console.error(error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateOnlineUsers(): Promise<void> {
    try {
      await this.simulateDelay(100);
      const online = Math.floor(10 + Math.random() * 50);
      this.onlineUsersSignal.set(online);
    } catch (error) {
      console.error('Error updating online users:', error);
    }
  }

  private generateMockUserActivity(period: PeriodType): UserActivityData[] {
    const days = this.getPeriodDays(period);
    const data: UserActivityData[] = [];
    const now = new Date();
    let cumulativeUsers = 1000;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const newUsers = Math.floor(5 + Math.random() * 20);
      const returningUsers = Math.floor(30 + Math.random() * 40);
      const activeUsers = Math.floor(50 + Math.random() * 100);

      cumulativeUsers += newUsers;

      data.push({
        date: date.toISOString().split('T')[0],
        totalUsers: cumulativeUsers,
        newUsers,
        returningUsers,
        activeUsers,
      });
    }

    return data;
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
