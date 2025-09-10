// src/app/features/admin/pages/user-details.page.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth';
import { User, UserRole } from '../../auth/models/user.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';

@Component({
  selector: 'app-user-details',
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
                <a routerLink="/admin/users" class="hover:text-gray-700">Utilisateurs</a>
                <span>•</span>
                <span class="text-gray-900">{{ user()?.firstName }} {{ user()?.lastName }}</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Détails de l'utilisateur</h1>
            </div>
            <div class="flex items-center gap-3">
              <button
                routerLink="/admin/users"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <i class="fa-solid fa-arrow-left text-sm"></i>
                Retour à la liste
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-xl shadow-sm p-8">
          <div class="animate-pulse space-y-6">
            <div class="h-32 bg-gray-200 rounded"></div>
            <div class="space-y-4">
              <div class="h-4 bg-gray-200 rounded w-1/2"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
      } @else if (user()) {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <!-- Profil utilisateur -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Informations personnelles</h2>
            <div class="flex items-center gap-2">
              @if (user()!.role !== 'admin' || canModifyAdmin()) {
              <button
                (click)="toggleUserRole()"
                class="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors"
              >
                <i
                  class="fa-solid"
                  [ngClass]="user()!.role === 'admin' ? 'fa-arrow-down' : 'fa-arrow-up'"
                ></i>
                {{ user()!.role === 'admin' ? 'Rétrograder' : 'Promouvoir' }}
              </button>
              } @if (user()!.role !== 'admin' || canDeleteAdmin()) {
              <button
                (click)="deleteUser()"
                class="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                <i class="fa-solid fa-trash"></i>
                Supprimer
              </button>
              }
            </div>
          </div>

          <div class="p-6">
            <div class="flex items-center gap-6 mb-6">
              <div
                class="w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-2xl"
                [ngClass]="getAvatarClass()"
              >
                {{ getInitials() }}
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">
                  {{ user()!.firstName }} {{ user()!.lastName }}
                </h3>
                <p class="text-gray-600">{{ user()!.email }}</p>
                <div class="mt-2">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    [ngClass]="getRoleBadgeClass()"
                  >
                    <i
                      class="fa-solid mr-2"
                      [ngClass]="user()!.role === 'admin' ? 'fa-shield-halved' : 'fa-user'"
                    ></i>
                    {{ user()!.role === 'admin' ? 'Administrateur' : 'Utilisateur' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">ID Utilisateur</span>
                  <p class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {{ user()!.id }}
                  </p>
                </div>

                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">Email</span>
                  <p class="text-sm text-gray-900">{{ user()!.email }}</p>
                </div>

                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1">Téléphone</span>
                  <p class="text-sm text-gray-900">{{ user()!.phone || 'Non renseigné' }}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1"
                    >Date d'inscription</span
                  >
                  <p class="text-sm text-gray-900">{{ formatDate(user()!.createdAt) }}</p>
                  <p class="text-xs text-gray-500">{{ getRegistrationspan() }}</p>
                </div>

                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-1"
                    >Dernière mise à jour</span
                  >
                  <p class="text-sm text-gray-900">{{ formatDate(user()!.updatedAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Adresse -->
        @if (user()!.address) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Adresse</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="block text-sm font-medium text-gray-700 mb-1">Adresse</span>
                <p class="text-sm text-gray-900">{{ user()!.address!.street }}</p>
              </div>
              <div>
                <span class="block text-sm font-medium text-gray-700 mb-1">Ville</span>
                <p class="text-sm text-gray-900">{{ user()!.address!.city }}</p>
              </div>
              <div>
                <span class="block text-sm font-medium text-gray-700 mb-1">Code postal</span>
                <p class="text-sm text-gray-900">{{ user()!.address!.postalCode }}</p>
              </div>
              <div>
                <span class="block text-sm font-medium text-gray-700 mb-1">Pays</span>
                <p class="text-sm text-gray-900">{{ user()!.address!.country }}</p>
              </div>
            </div>
          </div>
        </div>
        }

        <!-- Activité récente -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Activité récente</h2>
          </div>
          <div class="p-6">
            <div class="text-center py-12">
              <i class="fa-solid fa-clock text-3xl text-gray-400 mb-4"></i>
              <p class="text-gray-500">Aucune activité récente à afficher</p>
              <p class="text-sm text-gray-400 mt-1">
                Cette section affichera l'historique des commandes et actions de l'utilisateur
              </p>
            </div>
          </div>
        </div>

        <!-- Actions administratives -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Actions administratives</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                (click)="sendResetPasswordEmail()"
                class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-key text-blue-600"></i>
                </div>
                <div class="text-left">
                  <p class="font-medium text-gray-900">Réinitialiser le mot de passe</p>
                  <p class="text-sm text-gray-500">Envoyer un email de réinitialisation</p>
                </div>
              </button>

              <button
                (click)="suspendAccount()"
                class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-pause text-orange-600"></i>
                </div>
                <div class="text-left">
                  <p class="font-medium text-gray-900">Suspendre le compte</p>
                  <p class="text-sm text-gray-500">Désactiver temporairement</p>
                </div>
              </button>

              <button
                (click)="viewOrders()"
                class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-bag-shopping text-green-600"></i>
                </div>
                <div class="text-left">
                  <p class="font-medium text-gray-900">Voir les commandes</p>
                  <p class="text-sm text-gray-500">Historique des achats</p>
                </div>
              </button>

              <button
                (click)="viewFavorites()"
                class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div class="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-heart text-pink-600"></i>
                </div>
                <div class="text-left">
                  <p class="font-medium text-gray-900">Voir les favoris</p>
                  <p class="text-sm text-gray-500">Produits sauvegardés</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      } @else {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-xl shadow-sm p-8 text-center">
          <i class="fa-solid fa-user-slash text-4xl text-gray-400 mb-4"></i>
          <p class="text-lg font-medium text-gray-900 mb-2">Utilisateur introuvable</p>
          <p class="text-gray-500 mb-6">L'utilisateur demandé n'existe pas ou a été supprimé.</p>
          <button
            routerLink="/admin/users"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <i class="fa-solid fa-arrow-left"></i>
            Retour à la liste
          </button>
        </div>
      </div>
      }
    </div>
  `,
})
export class UserDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  user = signal<User | null>(null);
  loading = signal(true);

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    const userId = Number(this.route.snapshot.paramMap.get('id'));
    if (!userId) {
      this.router.navigate(['/admin/users']);
      return;
    }

    await this.loadUser(userId);
  }

  private async loadUser(userId: number) {
    this.loading.set(true);
    try {
      const user = await this.authService.getUserDetails(userId);
      this.user.set(user);
    } catch (err) {
      console.error("Erreur lors du chargement de l'utilisateur:", err);
      this.toast.error('Impossible de charger les détails de cet utilisateur');
      this.user.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleUserRole() {
    const currentUser = this.user();
    if (!currentUser) return;

    const newRole = currentUser.role === 'admin' ? 'user' : 'admin';
    const actionText =
      newRole === 'admin' ? 'promouvoir en administrateur' : 'rétrograder en utilisateur';

    const confirmed = await this.confirm.ask({
      title: `${newRole === 'admin' ? 'Promouvoir' : 'Rétrograder'} l'utilisateur`,
      message: `Vous êtes sur le point de ${actionText} ${currentUser.firstName} ${currentUser.lastName}. Cette action prendra effet immédiatement.`,
      confirmText: newRole === 'admin' ? 'Promouvoir' : 'Rétrograder',
      cancelText: 'Annuler',
      variant: 'primary',
    });

    if (!confirmed) return;

    try {
      await this.authService.updateUserRole(currentUser.id, newRole as UserRole);
      await this.loadUser(currentUser.id);
      this.toast.success(
        `${currentUser.firstName} ${currentUser.lastName} a été ${
          newRole === 'admin' ? 'promu administrateur' : 'rétrogradé en utilisateur'
        }`
      );
    } catch (err) {
      console.error('Erreur lors de la modification du rôle:', err);
      this.toast.error('Impossible de modifier le rôle de cet utilisateur');
    }
  }

  async deleteUser() {
    const currentUser = this.user();
    if (!currentUser) return;

    const confirmed = await this.confirm.ask({
      title: "Supprimer l'utilisateur",
      message: `Cette action supprimera définitivement le compte de ${currentUser.firstName} ${currentUser.lastName}. Toutes ses données seront perdues.`,
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
      await this.authService.deleteUser(currentUser.id);
      this.toast.success(
        `Le compte de ${currentUser.firstName} ${currentUser.lastName} a été supprimé`
      );
      this.router.navigate(['/admin/users']);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      this.toast.error('Impossible de supprimer cet utilisateur');
    }
  }

  async sendResetPasswordEmail() {
    const currentUser = this.user();
    if (!currentUser) return;

    const confirmed = await this.confirm.ask({
      title: 'Réinitialiser le mot de passe',
      message: `Un email de réinitialisation sera envoyé à ${currentUser.email}. L'utilisateur pourra définir un nouveau mot de passe.`,
      confirmText: "Envoyer l'email",
      cancelText: 'Annuler',
      variant: 'primary',
    });

    if (!confirmed) return;

    try {
      // TODO: Implémenter l'envoi d'email de réinitialisation
      this.toast.success(`Email de réinitialisation envoyé à ${currentUser.email}`);
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email:", err);
      this.toast.error("Impossible d'envoyer l'email de réinitialisation");
    }
  }

  async suspendAccount() {
    const currentUser = this.user();
    if (!currentUser) return;

    const confirmed = await this.confirm.ask({
      title: 'Suspendre le compte',
      message: `Le compte de ${currentUser.firstName} ${currentUser.lastName} sera temporairement désactivé. L'utilisateur ne pourra plus se connecter.`,
      confirmText: 'Suspendre',
      cancelText: 'Annuler',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      // TODO: Implémenter la suspension de compte
      this.toast.success(
        `Le compte de ${currentUser.firstName} ${currentUser.lastName} a été suspendu`
      );
    } catch (err) {
      console.error('Erreur lors de la suspension:', err);
      this.toast.error('Impossible de suspendre ce compte');
    }
  }

  viewOrders() {
    const currentUser = this.user();
    if (!currentUser) return;

    // TODO: Naviguer vers la page des commandes de l'utilisateur
    this.toast.info("Redirection vers l'historique des commandes - Fonctionnalité à implémenter");
  }

  viewFavorites() {
    const currentUser = this.user();
    if (!currentUser) return;

    // TODO: Naviguer vers la page des favoris de l'utilisateur
    this.toast.info('Redirection vers les favoris - Fonctionnalité à implémenter');
  }

  // Helpers
  canModifyAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const targetUser = this.user();
    return currentUser?.id !== targetUser?.id; // Ne peut pas se modifier soi-même
  }

  canDeleteAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const targetUser = this.user();
    // TODO: Vérifier qu'il reste au moins un autre admin
    return currentUser?.id !== targetUser?.id;
  }

  getInitials(): string {
    const currentUser = this.user();
    if (!currentUser) return 'U';
    return (
      (currentUser.firstName?.[0] || '').toUpperCase() +
        (currentUser.lastName?.[0] || '').toUpperCase() || 'U'
    );
  }

  getAvatarClass(): string {
    const currentUser = this.user();
    if (!currentUser) return 'bg-gray-500';

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
    return colors[currentUser.id % colors.length];
  }

  getRoleBadgeClass(): string {
    const currentUser = this.user();
    if (!currentUser) return 'bg-gray-100 text-gray-800';

    return currentUser.role === UserRole.ADMIN
      ? 'bg-red-100 text-red-800'
      : 'bg-green-100 text-green-800';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getRegistrationspan(): string {
    const currentUser = this.user();
    if (!currentUser) return '';

    const diffTime = Date.now() - new Date(currentUser.createdAt).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Inscrit hier';
    if (diffDays < 7) return `Inscrit il y a ${diffDays} jours`;
    if (diffDays < 30) return `Inscrit il y a ${Math.ceil(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Inscrit il y a ${Math.ceil(diffDays / 30)} mois`;
    return `Inscrit il y a ${Math.ceil(diffDays / 365)} ans`;
  }
}
