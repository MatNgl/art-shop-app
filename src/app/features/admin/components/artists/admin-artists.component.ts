import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Artist } from '../../../catalog/models/product.model';
import { ArtistService } from '../../../catalog/services/artist';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-artists',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a>
                <span>•</span>
                <span class="text-gray-900">Artistes</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Gestion des Artistes</h1>
              <p class="text-gray-600 mt-1">Ajoutez, modifiez et supprimez des artistes</p>
            </div>
            <div class="flex items-center gap-3">
              <button (click)="reload()" class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                Actualiser
              </button>
              <button
                (click)="create()"
                class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <i class="fa-solid fa-plus mr-2"></i>Nouveau
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Artistes ({{ artists().length }})</h3>
          </div>

          <div *ngIf="loading(); else tableTpl" class="p-6 text-gray-500">Chargement…</div>

          <ng-template #tableTpl>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Artiste
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bio
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Produits liés
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let a of artists()" class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <img
                        [src]="a.profileImage || '/assets/placeholder.jpg'"
                        [alt]="a.name"
                        class="w-10 h-10 rounded-full object-cover border"
                      />
                      <div class="font-medium text-gray-900">{{ a.name }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    <span class="line-clamp-2">{{ a.bio || '—' }}</span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ linkedCount(a.id) }}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="flex items-center gap-2">
                      <button
                        (click)="edit(a)"
                        class="text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        (click)="remove(a)"
                        class="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="artists().length === 0" class="p-8 text-center text-gray-500">
              Aucun artiste pour le moment.
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export class AdminArtistsComponent implements OnInit {
  private readonly artistSvc = inject(ArtistService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  artists = signal<Artist[]>([]);
  counts = signal<Record<number, number>>({});
  loading = signal<boolean>(true);

  async ngOnInit() {
    await this.reload();
  }

  async reload() {
    this.loading.set(true);
    try {
      const list = await this.artistSvc.getAll();
      this.artists.set(list);
      // comptages
      const entries = await Promise.all(
        list.map(async (a) => [a.id, await this.artistSvc.countLinkedProducts(a.id)] as const)
      );
      this.counts.set(Object.fromEntries(entries));
    } finally {
      this.loading.set(false);
    }
  }

  linkedCount(id: number): number {
    return this.counts()[id] ?? 0;
  }

  create() {
    this.router.navigate(['/admin/artists/new']);
  }
  edit(a: Artist) {
    this.router.navigate(['/admin/artists', a.id, 'edit']);
  }

  async remove(a: Artist) {
    const nb = this.linkedCount(a.id);
    if (nb > 0) {
      this.toast.warning(`Suppression impossible : ${nb} produit(s) lié(s).`);
      return;
    }
    if (!confirm(`Supprimer définitivement « ${a.name} » ?`)) return;

    try {
      await this.artistSvc.remove(a.id);
      this.toast.success('Artiste supprimé.');
      await this.reload();
    } catch {
      this.toast.error('La suppression a échoué.');
    }
  }
}
