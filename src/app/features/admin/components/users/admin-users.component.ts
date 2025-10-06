import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { User, UserRole } from '../../../auth/models/user.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

interface UserStats {
  total: number;
  admins: number;
  users: number;
  recentRegistrations: number;
}

type SortBy = 'createdAt_desc' | 'createdAt_asc' | 'firstName' | 'lastName' | 'email';

/** Variante possible de l'utilisateur avec champs d'extension côté admin */
type MaybeExtendedUser = User & {
  isActive?: boolean;
  suspendedAt?: Date | string;
  suspensionReason?: string;
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
            <div class="flex items-center gap-3">
              <button
                (click)="refreshData()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <i class="fa-solid fa-arrows-rotate text-sm"></i>
                Actualiser
              </button>
              <button
                (click)="exportUsers()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <i class="fa-solid fa-download text-sm"></i>
                Exporter CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Stats rapides -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().total }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-users text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Administrateurs</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().admins }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-shield-halved text-red-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Utilisateurs Standard</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().users }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-user text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Nouveaux (7j)</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">
                  {{ stats().recentRegistrations }}
                </p>
                }
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-user-plus text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres et recherche -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span for="searchInput" class="block text-sm font-medium text-gray-700 mb-2"
                >Recherche</span
              >
              <input
                id="searchInput"
                type="text"
                [ngModel]="searchTerm()"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Nom, email, ID..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <span for="roleSelect" class="block text-sm font-medium text-gray-700 mb-2"
                >Rôle</span
              >
              <select
                id="roleSelect"
                [ngModel]="selectedRole()"
                (ngModelChange)="onRoleChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les rôles</option>
                <option value="admin">Administrateurs</option>
                <option value="user">Utilisateurs</option>
              </select>
            </div>

            <div>
              <span for="dateFilter" class="block text-sm font-medium text-gray-700 mb-2"
                >Inscription</span
              >
              <select
                id="dateFilter"
                [ngModel]="selectedDateFilter()"
                (ngModelChange)="onDateChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Statut</span>
              <select
                [ngModel]="selectedStatus()"
                (ngModelChange)="onStatusChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="active">Actifs</option>
                <option value="suspended">Suspendus</option>
              </select>
            </div>

            <div>
              <span for="sortBy" class="block text-sm font-medium text-gray-700 mb-2">Tri</span>
              <select
                id="sortBy"
                [ngModel]="sortBy()"
                (ngModelChange)="onSortChange($event)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt_desc">Plus récent</option>
                <option value="createdAt_asc">Plus ancien</option>
                <option value="firstName">Prénom A-Z</option>
                <option value="lastName">Nom A-Z</option>
                <option value="email">Email A-Z</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table des utilisateurs -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Liste des utilisateurs ({{ filteredUsers().length }})
            </h3>
            <div class="text-sm text-gray-500">
              {{ filteredUsers().length }} / {{ users().length }} utilisateurs
            </div>
          </div>

          @if (loading()) {
          <div class="p-6">
            <div class="space-y-4">
              @for (i of [1,2,3,4,5,6]; track i) {
              <div class="h-20 bg-gray-100 rounded animate-pulse"></div>
              }
            </div>
          </div>
          } @else if (filteredUsers().length > 0) {
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
                    Téléphone
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Inscrit le
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (user of filteredUsers(); track user.id) {
                <tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                      <div class="flex-shrink-0">
                        <div
                          class="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white text-sm"
                          [ngClass]="getAvatarClass(user)"
                        >
                          {{ getInitials(user) }}
                        </div>
                      </div>
                      <div class="min-w-0">
                        <div class="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <span>{{ user.firstName }} {{ user.lastName }}</span>
                          <!-- Badge suspendu -->
                          @if (getSuspensionState(user).suspended) {
                          <span
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                          >
                            <i class="fa-solid fa-ban mr-1"></i> Suspendu
                          </span>
                          }
                        </div>
                        <div class="text-xs text-gray-400">ID: {{ user.id }}</div>
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ user.email }}</div>
                    @if (user.addresses?.length) {
                    <div class="text-xs text-gray-600">
                      {{ user.addresses?.[0]?.city }}, {{ user.addresses?.[0]?.country }}
                    </div>
                    }
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="getRoleBadgeClass(user.role)"
                      >
                        <i
                          class="fa-solid mr-1"
                          [ngClass]="user.role === 'admin' ? 'fa-shield-halved' : 'fa-user'"
                        ></i>
                        {{ user.role === 'admin' ? 'Administrateur' : 'Utilisateur' }}
                      </span>

                      <!-- Date de suspension si dispo -->
                      @if (getSuspensionState(user).suspended &&
                      getSuspensionState(user).suspendedAt) {
                      <span class="text-[11px] text-red-600">
                        depuis {{ formatDate(getSuspensionState(user).suspendedAt!) }}
                      </span>
                      }
                    </div>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ user.phone || '—' }}
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{{ formatDate(user.createdAt) }}</div>
                    <div class="text-xs">{{ getRegistrationLabel(user.createdAt) }}</div>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button
                        [routerLink]="['/admin/users', user.id]"
                        class="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        title="Voir les détails"
                      >
                        <i class="fa-solid fa-eye"></i>
                      </button>

                      <!-- Suspendre / Réactiver -->
                      <button
                        (click)="toggleSuspension(user)"
                        class="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                        [title]="
                          getSuspensionState(user).suspended
                            ? 'Réactiver le compte'
                            : 'Suspendre le compte'
                        "
                      >
                        <i
                          class="fa-solid"
                          [ngClass]="getSuspensionState(user).suspended ? 'fa-play' : 'fa-pause'"
                        ></i>
                      </button>

                      @if (user.role !== 'admin' || canModifyAdmin(user)) {
                      <button
                        (click)="toggleUserRole(user)"
                        class="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                        [title]="
                          user.role === 'admin'
                            ? 'Rétrograder en utilisateur'
                            : 'Promouvoir en admin'
                        "
                      >
                        <i
                          class="fa-solid"
                          [ngClass]="user.role === 'admin' ? 'fa-arrow-down' : 'fa-arrow-up'"
                        ></i>
                      </button>
                      } @if (user.role !== 'admin' || canDeleteAdmin(user)) {
                      <button
                        (click)="deleteUser(user)"
                        class="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                      } @else {
                      <span class="text-gray-400 px-2 py-1" title="Admin protégé">
                        <i class="fa-solid fa-shield"></i>
                      </span>
                      }
                    </div>
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
          } @else {
          <div class="p-8 text-center">
            <i class="fa-solid fa-users text-4xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</p>
            <p class="text-sm text-gray-500 mb-6">
              @if (searchTerm() || selectedRole() || selectedDateFilter()) { Essayez de modifier vos
              critères de recherche } @else { Il n'y a aucun utilisateur enregistré pour le moment }
            </p>
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
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  // State
  users = signal<User[]>([]);
  loading = signal(true);

  // Filtres (signals)
  searchTerm = signal<string>('');
  selectedRole = signal<UserRole | ''>('');
  selectedDateFilter = signal<string>('');
  selectedStatus = signal<'' | 'active' | 'suspended'>('');
  sortBy = signal<SortBy>('createdAt_desc');

  // Stats
  stats = computed<UserStats>(() => {
    const list = this.users();
    const admins = list.filter((u) => u.role === 'admin').length;
    const users = list.filter((u) => u.role === 'user').length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentRegistrations = list.filter((u) => new Date(u.createdAt) >= weekAgo).length;
    return { total: list.length, admins, users, recentRegistrations };
  });

  // Liste filtrée
  filteredUsers = computed(() => {
    let filtered = [...this.users()];
    const term = this.searchTerm().trim().toLowerCase();
    const role = this.selectedRole();
    const dateFilter = this.selectedDateFilter();
    const status = this.selectedStatus();
    const sort = this.sortBy();

    if (term) {
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(term) ||
          u.lastName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          String(u.id).includes(term)
      );
    }

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (dateFilter) {
      const now = new Date();
      filtered = filtered.filter((u) => {
        const createdAt = new Date(u.createdAt);
        switch (dateFilter) {
          case 'today':
            return createdAt.toDateString() === now.toDateString();
          case 'week': {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return createdAt >= weekAgo;
          }
          case 'month':
            return (
              createdAt.getMonth() === now.getMonth() &&
              createdAt.getFullYear() === now.getFullYear()
            );
          case 'year':
            return createdAt.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Filtre Statut (actifs / suspendus)
    if (status === 'active') {
      filtered = filtered.filter((u) => !this.getSuspensionState(u).suspended);
    } else if (status === 'suspended') {
      filtered = filtered.filter((u) => this.getSuspensionState(u).suspended);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sort) {
        case 'firstName':
          return a.firstName.localeCompare(b.firstName);
        case 'lastName':
          return a.lastName.localeCompare(b.lastName);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'createdAt_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'createdAt_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  });

  /** Type guard pour savoir si un User possède les champs étendus */
  private isExtended(u: User): u is MaybeExtendedUser {
    const candidate: Partial<MaybeExtendedUser> = u;
    return 'isActive' in candidate || 'suspendedAt' in candidate || 'suspensionReason' in candidate;
  }

  /** Retourne l'état de suspension exploitable par le template */
  getSuspensionState(u: User): { suspended: boolean; suspendedAt?: Date } {
    if (this.isExtended(u)) {
      const suspended =
        u.isActive === false || (!!u.suspendedAt && String(u.suspendedAt).length > 0);

      const suspendedAtVal = u.suspendedAt ? new Date(u.suspendedAt) : undefined;

      return { suspended, suspendedAt: suspendedAtVal };
    }
    return { suspended: false };
  }

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }
    await this.loadUsers();
  }

  // Handlers filtres
  onSearchChange(v: string) {
    this.searchTerm.set(v ?? '');
  }
  onRoleChange(v: string) {
    this.selectedRole.set(v as UserRole | '');
  }
  onDateChange(v: string) {
    this.selectedDateFilter.set(v ?? '');
  }
  onStatusChange(v: '' | 'active' | 'suspended') {
    this.selectedStatus.set(v ?? '');
  }
  onSortChange(v: SortBy) {
    this.sortBy.set(v ?? 'createdAt_desc');
  }

  async refreshData() {
    await this.loadUsers();
    this.toast.success('Liste des utilisateurs actualisée');
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const list = await this.authService.getAllUsers();
      this.users.set(list);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      this.toast.error('Impossible de charger la liste des utilisateurs');
    } finally {
      this.loading.set(false);
    }
  }

  /** Suspend ou réactive un compte en appelant le service */
  async toggleSuspension(user: User) {
    const { suspended } = this.getSuspensionState(user);
    const willSuspend = !suspended;

    const confirmed = await this.confirm.ask({
      title: willSuspend ? 'Suspendre le compte' : 'Réactiver le compte',
      message: willSuspend
        ? `Le compte de ${user.firstName} ${user.lastName} sera suspendu.`
        : `Le compte de ${user.firstName} ${user.lastName} sera réactivé.`,
      confirmText: willSuspend ? 'Suspendre' : 'Réactiver',
      cancelText: 'Annuler',
      variant: willSuspend ? 'danger' : 'primary',
    });

    if (!confirmed) return;

    try {
      await this.authService.toggleUserSuspension(
        user.id,
        willSuspend ? 'Action admin (liste)' : undefined
      );
      await this.loadUsers();
      this.toast.success(
        `Compte ${willSuspend ? 'suspendu' : 'réactivé'} pour ${user.firstName} ${user.lastName}`
      );
    } catch (err) {
      console.error('Erreur lors du changement de suspension:', err);
      this.toast.error("Impossible de modifier l'état de ce compte");
    }
  }

  async toggleUserRole(user: User) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const actionText =
      newRole === 'admin' ? 'promouvoir en administrateur' : 'rétrograder en utilisateur';

    const confirmed = await this.confirm.ask({
      title: `${newRole === 'admin' ? 'Promouvoir' : 'Rétrograder'} l'utilisateur`,
      message: `Vous êtes sur le point de ${actionText} ${user.firstName} ${user.lastName}. Cette action prendra effet immédiatement.`,
      confirmText: newRole === 'admin' ? 'Promouvoir' : 'Rétrograder',
      cancelText: 'Annuler',
      variant: 'primary',
    });

    if (!confirmed) return;

    try {
      await this.authService.updateUserRole(user.id, newRole as UserRole);
      await this.loadUsers();
      this.toast.success(
        `${user.firstName} ${user.lastName} a été ${
          newRole === 'admin' ? 'promu administrateur' : 'rétrogradé en utilisateur'
        }`
      );
    } catch (err) {
      console.error('Erreur lors de la modification du rôle:', err);
      this.toast.error('Impossible de modifier le rôle de cet utilisateur');
    }
  }

  async deleteUser(user: User) {
    const confirmed = await this.confirm.ask({
      title: "Supprimer l'utilisateur",
      message: `Cette action supprimera définitivement le compte de ${user.firstName} ${user.lastName}. Toutes ses données seront perdues.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
      requireText: {
        placeholder: 'Tapez "SUPPRIMER" pour confirmer',
        requiredValue: 'SUPPRIMER',
        help: 'Cette action est irréversible',
      },
    });

    if (!confirmed) return;

    try {
      await this.authService.deleteUser(user.id);
      await this.loadUsers();
      this.toast.success(`Le compte de ${user.firstName} ${user.lastName} a été supprimé`);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      this.toast.error('Impossible de supprimer cet utilisateur');
    }
  }

  viewUserDetails() {
    this.toast.info('Fonctionnalité de détails à implémenter');
  }

  exportUsers() {
    try {
      const csvContent = this.generateCsvContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      this.toast.success('Export CSV généré avec succès');
    } catch (err) {
      console.error("Erreur lors de l'export:", err);
      this.toast.error("Impossible de générer l'export CSV");
    }
  }

  private generateCsvContent(): string {
    const headers = [
      'ID',
      'Prénom',
      'Nom',
      'Email',
      'Rôle',
      'Téléphone',
      'Ville',
      'Pays',
      "Date d'inscription",
    ];
    const users = this.filteredUsers();

    const csvRows = [
      headers.join(','),
      ...users.map((user) =>
        [
          user.id,
          `"${user.firstName}"`,
          `"${user.lastName}"`,
          `"${user.email}"`,
          user.role === 'admin' ? 'Administrateur' : 'Utilisateur',
          `"${user.phone || ''}"`,
          `"${user.addresses?.[0]?.city || ''}"`,
          `"${user.addresses?.[0]?.country || ''}"`,
          `"${this.formatDate(user.createdAt)}"`,
        ].join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  // Helpers
  canModifyAdmin(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id !== user.id;
  }

  canDeleteAdmin(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    const adminCount = this.users().filter((u) => u.role === 'admin').length;
    return currentUser?.id !== user.id && adminCount > 1;
  }

  getInitials(user: User): string {
    return (
      (user.firstName?.[0] || '').toUpperCase() + (user.lastName?.[0] || '').toUpperCase() || 'U'
    );
  }

  getAvatarClass(user: User): string {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-gray-500',
    ];
    return colors[user.id % colors.length];
  }

  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getRegistrationLabel(date: Date | string): string {
    const diffTime = Date.now() - new Date(date).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.ceil(diffDays / 30)} mois`;
    return `Il y a ${Math.ceil(diffDays / 365)} ans`;
  }
}
