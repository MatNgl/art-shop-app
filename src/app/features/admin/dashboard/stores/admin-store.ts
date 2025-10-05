import { Injectable, signal, computed } from '@angular/core';
import { AdminActionData } from '../models/dashboard.model';

interface AdminSessionData {
  adminId: string;
  adminName: string;
  loginTime: Date;
  ipAddress: string;
  duration: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminStore {
  private readonly actionsSignal = signal<AdminActionData[]>([]);
  private readonly sessionsSignal = signal<AdminSessionData[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly actions = this.actionsSignal.asReadonly();
  readonly sessions = this.sessionsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly activeAdmins = computed(() => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    return this.sessionsSignal().filter((session) => {
      const sessionDate = new Date(session.loginTime);
      return sessionDate >= thirtyMinutesAgo;
    }).length;
  });

  readonly actionsByType = computed(() => {
    const typeMap = new Map<string, number>();

    this.actionsSignal().forEach((action) => {
      const current = typeMap.get(action.entityType) || 0;
      typeMap.set(action.entityType, current + 1);
    });

    return Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));
  });

  readonly actionsBySeverity = computed(() => {
    const severityMap = new Map<string, number>();

    this.actionsSignal().forEach((action) => {
      const current = severityMap.get(action.severity) || 0;
      severityMap.set(action.severity, current + 1);
    });

    return {
      normal: severityMap.get('normal') || 0,
      warning: severityMap.get('warning') || 0,
      critical: severityMap.get('critical') || 0,
    };
  });

  readonly recentActions = computed(() => {
    return [...this.actionsSignal()]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);
  });

  readonly criticalActions = computed(() => {
    return this.actionsSignal()
      .filter((action) => action.severity === 'critical')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  readonly averageSessionDuration = computed(() => {
    const sessions = this.sessionsSignal();
    if (sessions.length === 0) return 0;

    const total = sessions.reduce((sum, session) => sum + session.duration, 0);
    return Math.round(total / sessions.length);
  });

  async loadAdminActions(days = 30): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.simulateDelay(500);
      const mockData = this.generateMockAdminActions(days);
      this.actionsSignal.set(mockData);
    } catch (error) {
      this.errorSignal.set(
        'Erreur lors du chargement des actions administrateur'
      );
      console.error(error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadAdminSessions(days = 7): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.simulateDelay(500);
      const mockData = this.generateMockAdminSessions(days);
      this.sessionsSignal.set(mockData);
    } catch (error) {
      this.errorSignal.set(
        'Erreur lors du chargement des sessions administrateur'
      );
      console.error(error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private generateMockAdminActions(days: number): AdminActionData[] {
    const actions: AdminActionData[] = [];
    const admins = ['Alice Martin', 'Bob Dupont', 'Claire Bernard'];
    const actionTypes = [
      'Création',
      'Modification',
      'Suppression',
      'Activation',
      'Désactivation',
    ];
    const entityTypes: AdminActionData['entityType'][] = [
      'product',
      'category',
      'user',
      'stock',
      'order',
    ];
    const severities: AdminActionData['severity'][] = [
      'normal',
      'normal',
      'normal',
      'warning',
      'critical',
    ];

    const now = new Date();
    const actionsPerDay = 15;

    for (let i = 0; i < days * actionsPerDay; i++) {
      const daysAgo = Math.floor(i / actionsPerDay);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60)
      );

      const entityType =
        entityTypes[Math.floor(Math.random() * entityTypes.length)];
      const actionType =
        actionTypes[Math.floor(Math.random() * actionTypes.length)];
      const severity =
        severities[Math.floor(Math.random() * severities.length)];

      actions.push({
        id: `action-${i + 1}`,
        adminName: admins[Math.floor(Math.random() * admins.length)],
        action: `${actionType} ${this.getEntityLabel(entityType)}`,
        entityType,
        entityId: `entity-${Math.floor(Math.random() * 1000)}`,
        timestamp,
        severity,
        ipAddress: this.generateRandomIP(),
      });
    }

    return actions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  private generateMockAdminSessions(days: number): AdminSessionData[] {
    const sessions: AdminSessionData[] = [];
    const admins = [
      { id: 'admin-1', name: 'Alice Martin' },
      { id: 'admin-2', name: 'Bob Dupont' },
      { id: 'admin-3', name: 'Claire Bernard' },
    ];

    const now = new Date();
    const sessionsPerDay = 8;

    for (let i = 0; i < days * sessionsPerDay; i++) {
      const daysAgo = Math.floor(i / sessionsPerDay);
      const loginTime = new Date(now);
      loginTime.setDate(loginTime.getDate() - daysAgo);
      loginTime.setHours(
        8 + Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 60)
      );

      const admin = admins[Math.floor(Math.random() * admins.length)];

      sessions.push({
        adminId: admin.id,
        adminName: admin.name,
        loginTime,
        ipAddress: this.generateRandomIP(),
        duration: Math.floor(30 + Math.random() * 180),
      });
    }

    return sessions.sort(
      (a, b) => b.loginTime.getTime() - a.loginTime.getTime()
    );
  }

  private getEntityLabel(entityType: AdminActionData['entityType']): string {
    const labels: Record<AdminActionData['entityType'], string> = {
      product: 'produit',
      category: 'catégorie',
      user: 'utilisateur',
      stock: 'stock',
      order: 'commande',
    };
    return labels[entityType];
  }

  private generateRandomIP(): string {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
      Math.random() * 255
    )}`;
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
