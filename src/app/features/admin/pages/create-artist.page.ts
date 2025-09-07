import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ArtistFormComponent } from '../components/artists/artist-form.component';
import { ArtistService } from '../../catalog/services/artist';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-create-artist-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ArtistFormComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a>
                <span>•</span>
                <a routerLink="/admin/artists" class="hover:text-gray-700">Artistes</a>
                <span>•</span>
                <span class="text-gray-900">Nouveau</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Nouvel Artiste</h1>
              <p class="text-gray-600 mt-1">Ajoutez un nouvel artiste à votre catalogue</p>
            </div>
            <div class="flex items-center gap-3">
              <a
                routerLink="/admin/artists"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <i class="fa-solid fa-arrow-left text-sm"></i>
                Retour
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <app-artist-form [initial]="null" (save)="onSave($event)" (formCancel)="onCancel()" />
      </div>
    </div>
  `,
})
export class CreateArtistPage {
  private readonly artistSvc = inject(ArtistService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  async onSave(payload: { name: string; bio?: string; profileImage?: string }) {
    try {
      await this.artistSvc.create(payload);
      this.toast.success('Artiste créé avec succès !');
      this.router.navigate(['/admin/artists']);
    } catch (error) {
      console.error('Erreur lors de la création de l' + 'artiste:', error);
      this.toast.error('La création de l' + 'artiste a échoué.');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/artists']);
  }
}
