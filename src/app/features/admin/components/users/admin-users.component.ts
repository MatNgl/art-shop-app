// src/app/features/admin/components/users/admin-users.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { User } from '../../../auth/models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a>
                <span>•</span>
                <span class="text-gray-900">Utilisateurs</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
              <p class="text-gray-600 mt-1">Gérez les comptes utilisateurs de la plateforme</p>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Stats rapides -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ users().length }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Administrateurs</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ adminCount() }}</p>
              </div>
              <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Utilisateurs Standard</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ userCount() }}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Table des utilisateurs -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Liste des utilisateurs</h3>
          </div>

          @if (loading()) {
          <div class="p-6">
            <div class="space-y-4">
              @for (i of [1,2,3,4,5]; track i) {
              <div class="h-16 bg-gray-100 rounded animate-pulse"></div>
              }
            </div>
          </div>
          } @else if (users().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Utilisateur
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Rôle
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Créé le
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (user of users(); track user.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div
                          class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
                        >
                          <span class="text-sm font-medium text-white">
                            {{ user.firstName.charAt(0).toUpperCase()
                            }}{{ user.lastName.charAt(0).toUpperCase() }}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {{ user.firstName }} {{ user.lastName }}
                        </div>
                        <div class="text-sm text-gray-500">ID: {{ user.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ user.email }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      [class.bg-red-100]="user.role === 'admin'"
                      [class.text-red-800]="user.role === 'admin'"
                      [class.bg-green-100]="user.role === 'user'"
                      [class.text-green-800]="user.role === 'user'"
                      class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    >
                      {{ user.role === 'admin' ? 'Administrateur' : 'Utilisateur' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(user.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    @if (user.role !== 'admin') {
                    <button
                      (click)="deleteUser(user.id)"
                      class="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                    >
                      Supprimer
                    </button>
                    } @else {
                    <span class="text-gray-400 px-3 py-1">Admin protégé</span>
                    }
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
          } @else {
          <div class="p-8 text-center">
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
            <p class="mt-2 text-sm text-gray-500">Aucun utilisateur trouvé</p>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  users = signal<User[]>([]);
  loading = signal(true);

  // Computed properties
  adminCount = signal(0);
  userCount = signal(0);

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    await this.loadUsers();
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const list: User[] = await this.authService.getAllUsers();
      this.users.set(list);

      // Calculer les stats
      const admins = list.filter((u) => u.role === 'admin').length;
      const users = list.filter((u) => u.role === 'user').length;
      this.adminCount.set(admins);
      this.userCount.set(users);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteUser(userId: number) {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.'
      )
    ) {
      return;
    }

    try {
      await this.authService.deleteUser(userId);
      await this.loadUsers(); // Recharger la liste

      // TODO: Ajouter un toast de succès
      console.warn('Utilisateur supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      // TODO: Ajouter un toast d'erreur
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
