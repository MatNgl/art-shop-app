// FILE: src/app/features/admin/components/users/admin-users.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { User, UserRole } from '../../../auth/models/user.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { HighlightPipe } from '../../../../shared/pipes/highlight.pipe';

interface UserStats {
  total: number;
  admins: number;
  users: number;
  recentRegistrations: number;
}

type SortField = 'createdAt' | 'firstName' | 'lastName' | 'email';
type SortDir = 'asc' | 'desc';

type QuickChip = 'admins' | 'recent' | 'suspended' | 'unverified';

type MaybeExtendedUser = User & {
  isActive?: boolean;
  suspendedAt?: Date | string;
  suspensionReason?: string;
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HighlightPipe],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div class="container-wide py-6">
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

      <div class="container-wide">
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                <p class="text-sm font-medium text-gray-600">Utilisateurs</p>
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

        <!-- Filtres & recherche -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-2"
                >Recherche</label
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
              <label for="roleSelect" class="block text-sm font-medium text-gray-700 mb-2"
                >Rôle</label
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
              <label for="dateFilter" class="block text-sm font-medium text-gray-700 mb-2"
                >Inscription</label
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
          </div>

          <!-- Chips rapides -->
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              (click)="toggleChip('admins')"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm"
              [class.bg-blue-100]="chips().admins"
              [class.text-blue-700]="chips().admins"
              [class.bg-gray-100]="!chips().admins"
              [class.text-gray-700]="!chips().admins"
            >
              <i class="fa-solid fa-shield-halved mr-2"></i> Administrateurs
            </button>

            <button
              type="button"
              (click)="toggleChip('recent')"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm"
              [class.bg-emerald-100]="chips().recent"
              [class.text-emerald-700]="chips().recent"
              [class.bg-gray-100]="!chips().recent"
              [class.text-gray-700]="!chips().recent"
            >
              <i class="fa-solid fa-clock-rotate-left mr-2"></i> Inscrits 30j
            </button>

            <button
              type="button"
              (click)="toggleChip('suspended')"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm"
              [class.bg-rose-100]="chips().suspended"
              [class.text-rose-700]="chips().suspended"
              [class.bg-gray-100]="!chips().suspended"
              [class.text-gray-700]="!chips().suspended"
            >
              <i class="fa-solid fa-ban mr-2"></i> Suspendus
            </button>

            <button
              type="button"
              (click)="toggleChip('unverified')"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm"
              [class.bg-amber-100]="chips().unverified"
              [class.text-amber-800]="chips().unverified"
              [class.bg-gray-100]="!chips().unverified"
              [class.text-gray-700]="!chips().unverified"
            >
              <i class="fa-solid fa-envelope-open-text mr-2"></i> Email non vérifié
            </button>
          </div>
        </div>

        <!-- Actions de masse -->
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-500">{{ selectedIds().size }} sélectionné(s)</div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              (click)="bulkSuspend()"
              class="px-3 py-1.5 rounded-full text-sm bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              <i class="fa-solid fa-pause mr-2"></i> Suspendre
            </button>
            <button
              type="button"
              (click)="bulkReactivate()"
              class="px-3 py-1.5 rounded-full text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <i class="fa-solid fa-play mr-2"></i> Réactiver
            </button>
            <button
              type="button"
              (click)="bulkPromote()"
              class="px-3 py-1.5 rounded-full text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              <i class="fa-solid fa-arrow-up mr-2"></i> Promouvoir
            </button>
            <button
              type="button"
              (click)="bulkDemote()"
              class="px-3 py-1.5 rounded-full text-sm bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              <i class="fa-solid fa-arrow-down mr-2"></i> Rétrograder
            </button>
            <button
              type="button"
              (click)="bulkEmail()"
              class="px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <i class="fa-solid fa-envelope mr-2"></i> Email groupé
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Liste des utilisateurs ({{ filteredUsers().length }})
            </h3>
            <div class="text-sm text-gray-500">
              {{ filteredUsers().length }} / {{ users().length }} utilisateurs
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 table-fixed">
              <!-- ⚠️ colgroup mis à jour pour 6 colonnes -->
              <colgroup>
                <col class="w-12" />
                <col class="w-[26rem]" />
                <col class="w-[24rem]" />
                <col class="w-40" />
                <col class="w-44" />
                <col class="w-40" />
              </colgroup>

              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3">
                    <input
                      type="checkbox"
                      [checked]="allPageSelected()"
                      (change)="toggleSelectAll($any($event.target).checked === true)"
                      aria-label="Tout sélectionner"
                      class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>

                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Utilisateur
                  </th>

                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      type="button"
                      class="group inline-flex items-center gap-1"
                      (click)="onHeaderSort('email')"
                    >
                      Email
                      <i class="fa-solid" [ngClass]="sortIcon('email')" aria-hidden="true"></i>
                    </button>
                  </th>

                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Rôle
                  </th>

                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      type="button"
                      class="group inline-flex items-center gap-1"
                      (click)="onHeaderSort('createdAt')"
                    >
                      Inscrit le
                      <i class="fa-solid" [ngClass]="sortIcon('createdAt')" aria-hidden="true"></i>
                    </button>
                  </th>

                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody class="bg-white divide-y divide-gray-200">
                @for (user of pageUsers(); track user.id) {
                <tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td class="px-4 py-4">
                    <input
                      type="checkbox"
                      [checked]="selectedIds().has(user.id)"
                      (change)="toggleSelection(user.id, $any($event.target).checked === true)"
                      aria-label="Sélectionner l'utilisateur"
                      class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

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
                          <span
                            [innerHTML]="
                              user.firstName + ' ' + user.lastName | highlight : searchTerm()
                            "
                          ></span>
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

                  <td class="px-6 py-4">
                    <div
                      class="text-sm text-gray-900"
                      [innerHTML]="user.email | highlight : searchTerm()"
                    ></div>
                    @if (user.addresses?.length) {
                    <div class="text-xs text-gray-600">
                      {{ user.addresses?.[0]?.city }}, {{ user.addresses?.[0]?.country }}
                    </div>
                    }
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
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

          <!-- Pagination -->
          <div class="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div class="text-sm text-gray-500">
              Page {{ page() }} / {{ totalPages() }} • {{ filteredUsers().length }} résultat(s)
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="prevPage()"
                [disabled]="page() === 1"
                class="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                type="button"
                (click)="nextPage()"
                [disabled]="page() === totalPages()"
                class="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Suivant
              </button>
              <select
                [ngModel]="pageSize()"
                (ngModelChange)="setPageSize($event)"
                class="px-2 py-1.5 border rounded-md text-sm"
                aria-label="Taille de page"
              >
                <option [ngValue]="25">25</option>
                <option [ngValue]="50">50</option>
                <option [ngValue]="100">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  // State
  users = signal<User[]>([]);
  loading = signal(true);

  // Filtres
  searchTerm = signal<string>('');
  selectedRole = signal<UserRole | ''>('');
  selectedDateFilter = signal<string>('');
  selectedStatus = signal<'' | 'active' | 'suspended'>('');

  // Chips rapides
  chips = signal<Record<QuickChip, boolean>>({
    admins: false,
    recent: false,
    suspended: false,
    unverified: false,
  });

  // Tri
  sortField = signal<SortField>('createdAt');
  sortDir = signal<SortDir>('desc');

  // Sélection
  selectedIds = signal<Set<number>>(new Set<number>());

  // Pagination
  page = signal<number>(1);
  pageSize = signal<number>(Number(localStorage.getItem('adminUsers.pageSize') ?? '50'));

  // Stats
  stats = computed<UserStats>(() => {
    const list = this.users();
    const admins = list.filter((u) => u.role === UserRole.ADMIN).length;
    const users = list.filter((u) => u.role === UserRole.USER).length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentRegistrations = list.filter((u) => new Date(u.createdAt) >= weekAgo).length;
    return { total: list.length, admins, users, recentRegistrations };
  });

  // Filtrage + chips
  private filteredBase = computed<User[]>(() => {
    let filtered = [...this.users()];
    const term = this.searchTerm().trim().toLowerCase();
    const role = this.selectedRole();
    const dateFilter = this.selectedDateFilter();
    const status = this.selectedStatus();
    const chip = this.chips();

    if (term) {
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(term) ||
          u.lastName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          String(u.id).includes(term)
      );
    }

    if (role) filtered = filtered.filter((u) => u.role === role);

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

    if (status === 'active')
      filtered = filtered.filter((u) => !this.getSuspensionState(u).suspended);
    else if (status === 'suspended')
      filtered = filtered.filter((u) => this.getSuspensionState(u).suspended);

    if (chip.admins) filtered = filtered.filter((u) => u.role === UserRole.ADMIN);
    if (chip.recent) {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      filtered = filtered.filter((u) => new Date(u.createdAt) >= d);
    }
    if (chip.suspended) filtered = filtered.filter((u) => this.getSuspensionState(u).suspended);
    if (chip.unverified) filtered = filtered.filter((u) => !this.isEmailVerified(u));

    return filtered;
  });

  // Tri
  filteredUsers = computed<User[]>(() => {
    const list = [...this.filteredBase()];
    const field = this.sortField();
    const dir = this.sortDir();

    list.sort((a, b) => {
      let res = 0;
      switch (field) {
        case 'firstName':
          res = a.firstName.localeCompare(b.firstName);
          break;
        case 'lastName':
          res = a.lastName.localeCompare(b.lastName);
          break;
        case 'email':
          res = a.email.localeCompare(b.email);
          break;
        case 'createdAt':
        default:
          res = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return dir === 'asc' ? res : -res;
    });

    return list;
  });

  // Pagination
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize()))
  );
  pageUsers = computed<User[]>(() => {
    const p = Math.min(this.page(), this.totalPages());
    const size = this.pageSize();
    const start = (p - 1) * size;
    return this.filteredUsers().slice(start, start + size);
  });

  // Type guard
  private isExtended(u: User): u is MaybeExtendedUser {
    const c: Partial<MaybeExtendedUser> = u;
    return 'isActive' in c || 'suspendedAt' in c || 'suspensionReason' in c;
  }

  // Suspension
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
    const saved = localStorage.getItem('adminUsers.sort');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { field: SortField; dir: SortDir };
        if (parsed?.field) this.sortField.set(parsed.field);
        if (parsed?.dir) this.sortDir.set(parsed.dir);
      } catch {
        /* ignore */
      }
    }
    await this.loadUsers();
  }

  // Handlers filtres
  onSearchChange(v: string) {
    this.searchTerm.set(v ?? '');
    this.page.set(1);
  }
  onRoleChange(v: string) {
    this.selectedRole.set(v as UserRole | '');
    this.page.set(1);
  }
  onDateChange(v: string) {
    this.selectedDateFilter.set(v ?? '');
    this.page.set(1);
  }
  onStatusChange(v: '' | 'active' | 'suspended') {
    this.selectedStatus.set(v ?? '');
    this.page.set(1);
  }

  toggleChip(chip: QuickChip): void {
    const next = { ...this.chips() };
    next[chip] = !next[chip];
    this.chips.set(next);
    this.page.set(1);
  }

  onHeaderSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set(field === 'createdAt' ? 'desc' : 'asc');
    }
    localStorage.setItem(
      'adminUsers.sort',
      JSON.stringify({ field: this.sortField(), dir: this.sortDir() })
    );
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'fa-sort text-gray-400';
    return this.sortDir() === 'asc'
      ? 'fa-arrow-up-wide-short text-blue-600'
      : 'fa-arrow-down-wide-short text-blue-600';
  }

  // Sélection
  toggleSelection(id: number, checked: boolean): void {
    const s = new Set(this.selectedIds());
    if (checked) s.add(id);
    else s.delete(id);
    this.selectedIds.set(s);
  }
  allPageSelected(): boolean {
    const ids = this.pageUsers().map((u) => u.id);
    return ids.length > 0 && ids.every((id) => this.selectedIds().has(id));
  }
  toggleSelectAll(checked: boolean): void {
    const s = new Set(this.selectedIds());
    const ids = this.pageUsers().map((u) => u.id);
    if (checked) ids.forEach((id) => s.add(id));
    else ids.forEach((id) => s.delete(id));
    this.selectedIds.set(s);
  }

  // Pagination
  prevPage(): void {
    if (this.page() > 1) this.page.update((p) => p - 1);
  }
  nextPage(): void {
    if (this.page() < this.totalPages()) this.page.update((p) => p + 1);
  }
  setPageSize(size: number): void {
    const s = Number(size) || 50;
    this.pageSize.set(s);
    localStorage.setItem('adminUsers.pageSize', String(s));
    this.page.set(1);
  }

  // Data
  async refreshData() {
    await this.loadUsers();
    this.toast.success('Liste des utilisateurs actualisée');
  }

  private async loadUsers() {
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

  // Actions unitaires
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

  async toggleUserRole(user: User): Promise<void> {
    const newRole: UserRole = user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;

    const actionText =
      newRole === UserRole.ADMIN ? 'promouvoir en administrateur' : 'rétrograder en utilisateur';

    const confirmed = await this.confirm.ask({
      title: `${newRole === UserRole.ADMIN ? 'Promouvoir' : 'Rétrograder'} l'utilisateur`,
      message: `Vous êtes sur le point de ${actionText} ${user.firstName} ${user.lastName}. Cette action prendra effet immédiatement.`,
      confirmText: newRole === UserRole.ADMIN ? 'Promouvoir' : 'Rétrograder',
      cancelText: 'Annuler',
      variant: 'primary',
    });
    if (!confirmed) return;

    try {
      await this.authService.updateUserRole(user.id, newRole);
      await this.loadUsers();
      this.toast.success(
        `${user.firstName} ${user.lastName} a été ${
          newRole === UserRole.ADMIN ? 'promu administrateur' : 'rétrogradé en utilisateur'
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
      message: `Cette action supprimera définitivement le compte de ${user.firstName} ${user.lastName}.`,
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

  // Actions bulk
  private selectedUsers(): User[] {
    const ids = this.selectedIds();
    return this.users().filter((u) => ids.has(u.id));
  }

  async bulkSuspend(): Promise<void> {
    const targets = this.selectedUsers().filter((u) => !this.getSuspensionState(u).suspended);
    if (targets.length === 0) {
      this.toast.info('Aucun compte à suspendre.');
      return;
    }

    const ok = await this.confirm.ask({
      title: 'Suspendre des comptes',
      message: `Suspendre ${targets.length} compte(s) sélectionné(s) ?`,
      confirmText: 'Suspendre',
      cancelText: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;

    for (const u of targets) await this.authService.toggleUserSuspension(u.id, 'bulk');
    await this.loadUsers();
    this.toast.success(`${targets.length} compte(s) suspendu(s)`);
  }

  async bulkReactivate(): Promise<void> {
    const targets = this.selectedUsers().filter((u) => this.getSuspensionState(u).suspended);
    if (targets.length === 0) {
      this.toast.info('Aucun compte à réactiver.');
      return;
    }

    const ok = await this.confirm.ask({
      title: 'Réactiver des comptes',
      message: `Réactiver ${targets.length} compte(s) sélectionné(s) ?`,
      confirmText: 'Réactiver',
      cancelText: 'Annuler',
      variant: 'primary',
    });
    if (!ok) return;

    for (const u of targets) await this.authService.toggleUserSuspension(u.id);
    await this.loadUsers();
    this.toast.success(`${targets.length} compte(s) réactivé(s)`);
  }

  async bulkPromote(): Promise<void> {
    const current = this.authService.getCurrentUser();
    const targets = this.selectedUsers().filter((u) => u.role !== UserRole.ADMIN);
    if (targets.length === 0) {
      this.toast.info('Aucun utilisateur à promouvoir.');
      return;
    }

    const ok = await this.confirm.ask({
      title: 'Promouvoir en administrateur',
      message: `Promouvoir ${targets.length} utilisateur(s) en administrateur ?`,
      confirmText: 'Promouvoir',
      cancelText: 'Annuler',
      variant: 'primary',
    });
    if (!ok) return;

    for (const u of targets) {
      if (u.id === current?.id) continue;
      await this.authService.updateUserRole(u.id, UserRole.ADMIN);
    }
    await this.loadUsers();
    this.toast.success(`${targets.length} promotion(s) effectuée(s)`);
  }

  async bulkDemote(): Promise<void> {
    const current = this.authService.getCurrentUser();
    const admins = this.users().filter((u) => u.role === UserRole.ADMIN);
    const targets = this.selectedUsers().filter(
      (u) => u.role === UserRole.ADMIN && u.id !== current?.id
    );
    if (targets.length === 0) {
      this.toast.info('Aucun administrateur à rétrograder.');
      return;
    }
    if (admins.length - targets.length < 1) {
      this.toast.error('Impossible: il doit rester au moins un administrateur.');
      return;
    }

    const ok = await this.confirm.ask({
      title: 'Rétrograder en utilisateur',
      message: `Rétrograder ${targets.length} administrateur(s) en utilisateur ?`,
      confirmText: 'Rétrograder',
      cancelText: 'Annuler',
      variant: 'warning',
    });
    if (!ok) return;

    for (const u of targets) await this.authService.updateUserRole(u.id, UserRole.USER);
    await this.loadUsers();
    this.toast.success(`${targets.length} rétrogradation(s) effectuée(s)`);
  }

  bulkEmail(): void {
    const emails = this.selectedUsers()
      .map((u) => u.email)
      .filter(Boolean);
    if (emails.length === 0) {
      this.toast.info('Aucun destinataire sélectionné.');
      return;
    }
    const href = `mailto:${encodeURIComponent(emails.join(','))}`;
    window.location.href = href;
  }

  // Export CSV
  exportUsers(): void {
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
    const rows = users.map((u) =>
      [
        u.id,
        `"${u.firstName}"`,
        `"${u.lastName}"`,
        `"${u.email}"`,
        u.role === UserRole.ADMIN ? 'Administrateur' : 'Utilisateur',
        `"${u.phone ?? ''}"`,
        `"${u.addresses?.[0]?.city ?? ''}"`,
        `"${u.addresses?.[0]?.country ?? ''}"`,
        `"${this.formatDate(u.createdAt)}"`,
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  // Helpers
  canModifyAdmin(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id !== user.id;
  }
  canDeleteAdmin(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    const adminCount = this.users().filter((u) => u.role === UserRole.ADMIN).length;
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
  getRoleBadgeClass(role: UserRole | string): string {
    return role === UserRole.ADMIN
      ? 'bg-red-100 text-red-800 rounded-full'
      : 'bg-green-100 text-green-800 rounded-full';
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
  private isEmailVerified(u: User): boolean {
    const rec = u as unknown as Record<string, unknown>;
    return typeof rec['emailVerified'] === 'boolean' ? (rec['emailVerified'] as boolean) : true;
  }
}
