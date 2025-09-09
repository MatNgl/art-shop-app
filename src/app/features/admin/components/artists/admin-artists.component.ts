import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Artist } from '../../../catalog/models/product.model';
import { ArtistService } from '../../../catalog/services/artist';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { ProductService } from '../../../catalog/services/product';

interface ArtistStats {
  total: number;
  withBio: number;
  withoutBio: number;
  avgProducts: number;
}

@Component({
  selector: 'app-admin-artists',
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
                <span class="text-gray-900">Artistes</span>
              </nav>
              <h1 class="text-2xl font-bold text-gray-900">Gestion des Artistes</h1>
              <p class="text-gray-600 mt-1">Gérez les artistes et leurs profils</p>
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
                (click)="create()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <i class="fa-solid fa-plus text-sm"></i>
                Nouvel artiste
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
                <p class="text-sm font-medium text-gray-600">Total Artistes</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().total }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-palette text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Avec Bio</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().withBio }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-file-text text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Sans Bio</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().withoutBio }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-file-circle-exclamation text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Moy. Produits</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">
                  {{ stats().avgProducts.toFixed(1) }}
                </p>
                }
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-chart-bar text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres et recherche -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-2"
                >Recherche</label
              >
              <input
                id="searchInput"
                type="text"
                [(ngModel)]="searchTerm"
                (input)="applyFilters()"
                placeholder="Nom d'artiste..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label for="bioFilter" class="block text-sm font-medium text-gray-700 mb-2"
                >Biographie</label
              >
              <select
                id="bioFilter"
                [(ngModel)]="selectedBioFilter"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les artistes</option>
                <option value="with">Avec biographie</option>
                <option value="without">Sans biographie</option>
              </select>
            </div>

            <div>
              <label for="sortBySelect" class="block text-sm font-medium text-gray-700 mb-2"
                >Tri</label
              >
              <select
                id="sortBySelect"
                [(ngModel)]="sortBy"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Nom A-Z</option>
                <option value="name_desc">Nom Z-A</option>
                <option value="products_desc">Plus de produits</option>
                <option value="products_asc">Moins de produits</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table des artistes -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Liste des artistes ({{ filteredArtists().length }})
            </h3>
            <div class="text-sm text-gray-500">
              {{ filteredArtists().length }} / {{ artists().length }} artistes
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
          } @else if (filteredArtists().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Artiste
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Biographie
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Produits liés
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (artist of filteredArtists(); track artist.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                      <img
                        [src]="artist.profileImage || '/assets/placeholder.jpg'"
                        [alt]="artist.name"
                        class="w-16 h-16 rounded-lg object-cover border"
                      />
                      <div class="min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">
                          {{ artist.name }}
                        </div>
                        <div class="text-xs text-gray-400 truncate">ID: {{ artist.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    @if (artist.bio) {
                    <div class="text-sm text-gray-700 max-w-xs">
                      <span class="line-clamp-2">{{ artist.bio }}</span>
                    </div>
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1"
                    >
                      Avec bio
                    </span>
                    } @else {
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                    >
                      Sans bio
                    </span>
                    }
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span class="font-medium">{{ linkedCount(artist.id) }}</span> produits @if
                    (linkedCount(artist.id) > 0) {
                    <div class="text-xs text-green-600">Actif</div>
                    } @else {
                    <div class="text-xs text-gray-400">Aucun produit</div>
                    }
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button
                        (click)="edit(artist)"
                        class="text-green-600 hover:text-green-900 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                        title="Modifier"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        (click)="remove(artist)"
                        class="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        title="Supprimer"
                        [disabled]="linkedCount(artist.id) > 0"
                        [class.opacity-50]="linkedCount(artist.id) > 0"
                        [class.cursor-not-allowed]="linkedCount(artist.id) > 0"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
          } @else {
          <div class="p-8 text-center">
            <i class="fa-solid fa-palette text-4xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-900 mb-2">Aucun artiste trouvé</p>
            <p class="text-sm text-gray-500 mb-6">
              @if (searchTerm || selectedBioFilter) { Essayez de modifier vos critères de recherche
              } @else { Commencez par ajouter votre premier artiste }
            </p>
            <button
              (click)="create()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <i class="fa-solid fa-plus"></i>
              Ajouter un artiste
            </button>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminArtistsComponent implements OnInit {
  private readonly artistSvc = inject(ArtistService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly productSvc = inject(ProductService);

  // State
  artists = signal<Artist[]>([]);
  counts = signal<Record<number, number>>({});
  loading = signal<boolean>(true);

  // Filters
  searchTerm = '';
  selectedBioFilter = '';
  sortBy = 'name';

  // Computed
  stats = computed(() => {
    const artists = this.artists();
    const withBio = artists.filter((a) => !!a.bio).length;
    const withoutBio = artists.length - withBio;
    const totalProducts = Object.values(this.counts()).reduce((sum, count) => sum + count, 0);
    const avgProducts = artists.length > 0 ? totalProducts / artists.length : 0;

    return {
      total: artists.length,
      withBio,
      withoutBio,
      avgProducts,
    } satisfies ArtistStats;
  });

  filteredArtists = computed(() => {
    let filtered = [...this.artists()];

    // Recherche textuelle
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(term));
    }

    // Filtre par biographie
    if (this.selectedBioFilter) {
      if (this.selectedBioFilter === 'with') {
        filtered = filtered.filter((a) => !!a.bio);
      } else if (this.selectedBioFilter === 'without') {
        filtered = filtered.filter((a) => !a.bio);
      }
    }

    // Tri
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'products_desc':
          return this.linkedCount(b.id) - this.linkedCount(a.id);
        case 'products_asc':
          return this.linkedCount(a.id) - this.linkedCount(b.id);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  });

  async ngOnInit() {
    await this.reload();
  }

  applyFilters() {
    // Les filtres sont appliqués automatiquement via les computed signals
  }

  async refreshData() {
    await this.reload();
  }

  async reload() {
    this.loading.set(true);
    try {
      const list = await this.artistSvc.getAll();
      this.artists.set(list);

      const products = await this.productSvc.getAllProducts();

      const entries = await Promise.all(
        list.map(
          async (a) => [a.id, await this.artistSvc.countLinkedProducts(a.id, products)] as const
        )
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

    const ok = await this.confirm.ask({
      title: 'Supprimer l' + 'artiste',
      message: `Cette action est irréversible. Confirmez la suppression de « ${a.name} ».`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await this.artistSvc.remove(a.id);
      this.toast.success('Artiste supprimé.');
      await this.reload();
    } catch {
      this.toast.error('La suppression a échoué.');
    }
  }
}
