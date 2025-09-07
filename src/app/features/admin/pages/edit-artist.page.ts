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
    <div class="max-w-4xl mx-auto p-6">
      <nav class="text-sm text-gray-500 mb-2">
        <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a> •
        <a routerLink="/admin/artists" class="hover:text-gray-700">Artistes</a> •
        <span class="text-gray-900">Modifier</span>
      </nav>
      <h1 class="text-2xl font-bold mb-6">Modifier l'artiste</h1>

      <ng-container *ngIf="initial(); else loadingTpl">
        <app-artist-form [initial]="initial()" (save)="onSave($event)" (cancel)="onCancel()" />
      </ng-container>

      <ng-template #loadingTpl>
        <div class="text-gray-500">Chargement…</div>
      </ng-template>
    </div>
  `,
})
export class EditArtistPage implements OnInit {
  private readonly artistSvc = inject(ArtistService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  initial = signal<Artist | null>(null);

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) {
      this.toast.error('Identifiant invalide.');
      this.router.navigate(['/admin/artists']);
      return;
    }
    const a = await this.artistSvc.getById(id);
    if (!a) {
      this.toast.error('Artiste introuvable.');
      this.router.navigate(['/admin/artists']);
      return;
    }
    this.initial.set(a);
  }

  async onSave(payload: { name: string; bio?: string; profileImage?: string }) {
    const id = this.initial()?.id;
    if (!id) return;
    try {
      await this.artistSvc.update(id, payload);
      this.toast.success('Modifications enregistrées.');
      this.router.navigate(['/admin/artists']);
    } catch {
      this.toast.error('La mise à jour a échoué.');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/artists']);
  }
}
