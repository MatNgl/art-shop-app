import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArtistFormComponent } from '../components/artists/artist-form.component';
import { Artist } from '../../catalog/models/product.model';
import { ArtistService } from '../../catalog/services/artist';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-edit-artist-page',
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
                <span class="text-gray-900">Modifier</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Modifier l'Artiste</h1>
              <p class="text-gray-600 mt-1">Mettez à jour les informations de l'artiste</p>
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
        @if (loading()) {
        <!-- Skeleton loader -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div class="h-4 bg-gray-100 rounded animate-pulse w-2/3"></div>
          </div>
          <div class="p-6 space-y-6">
            <div class="h-20 bg-gray-100 rounded animate-pulse"></div>
            <div class="h-32 bg-gray-100 rounded animate-pulse"></div>
            <div class="h-24 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
        } @else if (initial()) {
        <app-artist-form [initial]="initial()" (save)="onSave($event)" (formCancel)="onCancel()" />
        } @else {
        <!-- État d'erreur -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div
            class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center"
          >
            <i class="fa-solid fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Artiste introuvable</h3>
          <p class="text-gray-600 mb-6">L'artiste demandé n'existe pas ou a été supprimé.</p>
          <a
            routerLink="/admin/artists"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <i class="fa-solid fa-arrow-left"></i>
            Retour aux artistes
          </a>
        </div>
        }
      </div>
    </div>
  `,
})
export class EditArtistPage implements OnInit {
  private readonly artistSvc = inject(ArtistService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  initial = signal<Artist | null>(null);
  loading = signal<boolean>(true);

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(id)) {
      this.toast.error('Identifiant d' + 'artiste invalide.');
      this.router.navigate(['/admin/artists']);
      return;
    }

    try {
      const artist = await this.artistSvc.getById(id);
      if (!artist) {
        this.toast.error('Artiste introuvable.');
        this.initial.set(null);
      } else {
        this.initial.set(artist);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l' + 'artiste:', error);
      this.toast.error('Erreur lors du chargement de l' + 'artiste.');
      this.initial.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async onSave(payload: { name: string; bio?: string; profileImage?: string }) {
    const artist = this.initial();
    if (!artist) {
      this.toast.error('Aucun artiste à modifier.');
      return;
    }

    try {
      await this.artistSvc.update(artist.id, payload);
      this.toast.success('Artiste modifié avec succès !');
      this.router.navigate(['/admin/artists']);
    } catch (error) {
      console.error('Erreur lors de la modification de l' + 'artiste:', error);
      this.toast.error('La modification de l' + 'artiste a échoué.');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/artists']);
  }
}
