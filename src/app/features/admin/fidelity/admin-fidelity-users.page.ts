import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth';
import { FidelityStore } from '../../fidelity/services/fidelity-store';

interface UserWithFidelity {
  userId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  points: number;
  ledgerCount: number;
  lastActivity?: string;
}

@Component({
  selector: 'app-admin-fidelity-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-12">
      <div class="max-w-7xl mx-auto px-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl mb-8">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <i class="fa-solid fa-users text-3xl text-white"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">Comptes fidélité des utilisateurs</h1>
              <p class="text-purple-100">Vue d'ensemble des points et activités</p>
            </div>
          </div>
        </div>

        <!-- Statistiques rapides -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-lg border-2 border-purple-200 p-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i class="fa-solid fa-users text-purple-600 text-xl"></i>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-800">{{ usersWithFidelity().length }}</div>
                <div class="text-xs text-gray-500">Utilisateurs actifs</div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i class="fa-solid fa-star text-green-600 text-xl"></i>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-800">{{ totalPoints() }}</div>
                <div class="text-xs text-gray-500">Points au total</div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <i class="fa-solid fa-chart-line text-blue-600 text-xl"></i>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-800">{{ avgPoints() }}</div>
                <div class="text-xs text-gray-500">Points moyens</div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <i class="fa-solid fa-clock text-orange-600 text-xl"></i>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-800">{{ totalTransactions() }}</div>
                <div class="text-xs text-gray-500">Transactions</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau des utilisateurs -->
        <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-table"></i>
              Liste des utilisateurs
            </h2>
          </div>

          <div class="overflow-x-auto">
            @if (usersWithFidelity().length === 0) {
              <div class="text-center py-12 text-gray-500">
                <i class="fa-solid fa-users text-6xl text-gray-300 mb-4"></i>
                <p class="text-lg font-medium">Aucun compte fidélité trouvé</p>
                <p class="text-sm mt-2">Les comptes seront créés automatiquement lors du premier achat.</p>
              </div>
            } @else {
              <table class="w-full">
                <thead class="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Points
                    </th>
                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Dernière activité
                    </th>
                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  @for (user of sortedUsers(); track user.userId) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {{ getInitials(user) }}
                          </div>
                          <div>
                            <div class="font-semibold text-gray-800">
                              {{ user.firstName }} {{ user.lastName }}
                            </div>
                            <div class="text-xs text-gray-500">{{ user.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <div class="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-bold">
                          <i class="fa-solid fa-star text-xs"></i>
                          {{ user.points }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="text-gray-700 font-medium">{{ user.ledgerCount }}</span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="text-xs text-gray-600">
                          {{ user.lastActivity ? formatDate(user.lastActivity) : 'Aucune' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button
                          type="button"
                          (click)="viewUserDetail(user.userId)"
                          class="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-all"
                        >
                          <i class="fa-solid fa-eye mr-1"></i>
                          Voir le détail
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminFidelityUsersPage {
  private readonly authService = inject(AuthService);
  private readonly fidelityStore = inject(FidelityStore);
  private readonly router = inject(Router);

  private allUsers = signal<Awaited<ReturnType<typeof this.authService.getAllUsers>>>([]);

  readonly usersWithFidelity = computed(() => {
    const accounts = this.fidelityStore.getAllAccounts();
    const allUsers = this.allUsers();

    return accounts.map((account) => {
      const user = allUsers.find((u) => u.id === account.userId);
      const lastEntry = account.ledger[0]; // Le ledger est trié par date (newest first)

      return {
        userId: account.userId,
        firstName: user?.firstName ?? 'Inconnu',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        points: account.points,
        ledgerCount: account.ledger.length,
        lastActivity: lastEntry?.createdAt,
      };
    });
  });

  readonly sortedUsers = computed(() =>
    [...this.usersWithFidelity()].sort((a, b) => b.points - a.points)
  );

  readonly totalPoints = computed(() =>
    this.usersWithFidelity().reduce((sum, u) => sum + u.points, 0)
  );

  readonly avgPoints = computed(() => {
    const users = this.usersWithFidelity();
    if (users.length === 0) return 0;
    return Math.round(this.totalPoints() / users.length);
  });

  readonly totalTransactions = computed(() =>
    this.usersWithFidelity().reduce((sum, u) => sum + u.ledgerCount, 0)
  );

  constructor() {
    void this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    try {
      const users = await this.authService.getAllUsers();
      this.allUsers.set(users);
    } catch {
      this.allUsers.set([]);
    }
  }

  getInitials(user: UserWithFidelity): string {
    const first = user.firstName?.charAt(0).toUpperCase() ?? '';
    const last = user.lastName?.charAt(0).toUpperCase() ?? '';
    return first + last || '?';
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  viewUserDetail(userId: number): void {
    void this.router.navigate(['/admin/fidelity/users', userId]);
  }
}
