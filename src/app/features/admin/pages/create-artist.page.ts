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
    <div class="max-w-4xl mx-auto p-6">
      <nav class="text-sm text-gray-500 mb-2">
        <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a> •
        <a routerLink="/admin/artists" class="hover:text-gray-700">Artistes</a> •
        <span class="text-gray-900">Nouveau</span>
      </nav>
      <h1 class="text-2xl font-bold mb-6">Nouvel artiste</h1>

      <app-artist-form (save)="onSave($event)" (cancel)="onCancel()" />
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
      this.toast.success('Artiste créé.');
      this.router.navigate(['/admin/artists']);
    } catch {
      this.toast.error('La création a échoué.');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/artists']);
  }
}
