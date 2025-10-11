// src/app/features/admin/components/formats/admin-formats.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { FormatService } from '../../../catalog/services/format.service';
import type { PrintFormat, Unit } from '../../../catalog/models/print-format.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { AdminHeaderComponent } from '../../../../shared/components/admin-header/admin-header.component';

type SortBy = 'createdAt_desc' | 'name' | 'size_desc' | 'size_asc';

@Component({
  selector: 'app-admin-formats',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <app-admin-header
        title="Formats d'impression"
        description="Gérez les formats disponibles (ISO + personnalisés)"
        icon="fa-ruler-combined"
        gradientClass="bg-gradient-to-br from-pink-500 to-rose-500"
      >
        <div actions class="flex items-center gap-3">
          <button
            (click)="refresh()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <i class="fa-solid fa-arrows-rotate text-sm"></i>
            Actualiser
          </button>
          <button
            (click)="create()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <i class="fa-solid fa-plus text-sm"></i>
            Nouveau format
          </button>
        </div>
      </app-admin-header>

      <div class="container-wide">
        <!-- Stats (3 cartes) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Formats</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ formats().length }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-ruler-combined text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Actifs</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ activeCount() }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-check text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Inactifs</p>
                @if (loading()) {
                <div class="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                } @else {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ inactiveCount() }}</p>
                }
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-pause text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Recherche</span>
              <input
                type="text"
                [ngModel]="q()"
                (ngModelChange)="q.set($event)"
                placeholder="Nom, slug…"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Statut</span>
              <select
                [ngModel]="status()"
                (ngModelChange)="status.set($event)"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-2">Tri</span>
              <select
                [ngModel]="sortBy()"
                (ngModelChange)="sortBy.set($event)"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt_desc">Plus récent</option>
                <option value="name">Nom A-Z</option>
                <option value="size_desc">Surface décroissante</option>
                <option value="size_asc">Surface croissante</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Liste des formats ({{ filtered().length }})
            </h3>
            <div class="text-sm text-gray-500">
              {{ filtered().length }} / {{ formats().length }} formats
            </div>
          </div>

          @if (loading()) {
          <div class="p-6">
            <div class="space-y-4">
              @for (i of [1,2,3,4,5]; track i) {
              <div class="h-16 bg-gray-100 rounded animate-pulse"></div>
              }
            </div>
          </div>
          } @else if (filtered().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nom
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Slug
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dimensions
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Surface
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (f of filtered(); track f.id) {
                <tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">{{ f.name }}</div>
                    <div class="text-xs text-gray-400">ID: {{ f.id }}</div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ f.slug }}</td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ f.width }} × {{ f.height }} {{ f.unit }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ area(f) }} <span class="text-gray-400">cm²</span>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="
                        f.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      "
                    >
                      {{ f.isActive ? 'Actif' : 'Inactif' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium">
                    <div class="flex items-center gap-2 justify-end">
                      <button
                        (click)="edit(f.id)"
                        class="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                        title="Modifier"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        (click)="toggle(f)"
                        class="text-orange-600 hover:bg-orange-50 px-2 py-1 rounded"
                        [title]="f.isActive ? 'Désactiver' : 'Activer'"
                      >
                        <i class="fa-solid" [ngClass]="f.isActive ? 'fa-pause' : 'fa-play'"></i>
                      </button>
                      <button
                        (click)="del(f)"
                        class="text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                        title="Supprimer"
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
            <i class="fa-solid fa-ruler-combined text-4xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-900 mb-2">Aucun format trouvé</p>
            <p class="text-sm text-gray-500 mb-6">
              @if (q() || status()) { Modifiez vos critères } @else { Commencez par créer un format
              }
            </p>
            <button
              (click)="create()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <i class="fa-solid fa-plus"></i> Ajouter un format
            </button>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminFormatsComponent implements OnInit {
  private svc = inject(FormatService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private router = inject(Router);

  loading = signal(true);
  formats = signal<PrintFormat[]>([]);
  q = signal<string>('');
  status = signal<string>(''); // '', 'active', 'inactive'
  sortBy = signal<SortBy>('createdAt_desc');

  activeCount = computed(() => this.formats().filter((f) => f.isActive).length);
  inactiveCount = computed(() => this.formats().length - this.activeCount());

  filtered = computed(() => {
    let arr = [...this.formats()];

    const term = this.q().trim().toLowerCase();
    if (term) {
      arr = arr.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.slug.toLowerCase().includes(term) ||
          String(f.id).includes(term)
      );
    }

    const st = this.status();
    if (st) {
      const active = st === 'active';
      arr = arr.filter((f) => f.isActive === active);
    }

    const sort = this.sortBy();
    arr.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size_asc':
          return this.area(a) - this.area(b);
        case 'size_desc':
          return this.area(b) - this.area(a);
        case 'createdAt_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return arr;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.formats.set(await this.svc.getAll());
    } catch {
      this.toast.error('Impossible de charger les formats.');
    } finally {
      this.loading.set(false);
    }
  }

  area(f: PrintFormat): number {
    // Normalisation en cm (affichage en cm² pour cohérence UI)
    const factor: Record<Unit, number> = { cm: 1, mm: 0.1, in: 2.54 };
    const w = f.width * factor[f.unit];
    const h = f.height * factor[f.unit];
    return Math.round(w * h);
    // Si tu veux la surface exacte en mm²/in², on peut adapter l’unité + libellé.
  }

  async refresh(): Promise<void> {
    await this.load();
    this.toast.success('Formats actualisés');
  }

  create(): void {
    this.router.navigate(['/admin/formats/new']);
  }

  edit(id: number): void {
    this.router.navigate(['/admin/formats', id, 'edit']);
  }

  async toggle(f: PrintFormat): Promise<void> {
    const to = !f.isActive;
    const ok = await this.confirm.ask({
      title: to ? 'Activer le format ?' : 'Désactiver le format ?',
      message: `Vous êtes sur le point de ${to ? 'rendre actif' : 'désactiver'} « ${f.name} ».`,
      confirmText: to ? 'Activer' : 'Désactiver',
      cancelText: 'Annuler',
      variant: 'primary',
    });
    if (!ok) return;

    try {
      await this.svc.update(f.id, { isActive: to });
      await this.load();
      this.toast.success(to ? 'Format activé' : 'Format désactivé');
    } catch {
      this.toast.error('La mise à jour a échoué.');
    }
  }

  async del(f: PrintFormat): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Supprimer le format',
      message: `Cette action est irréversible. Confirmez la suppression de « ${f.name} ».`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await this.svc.remove(f.id);
      await this.load();
      this.toast.success('Format supprimé.');
    } catch {
      this.toast.error('La suppression a échoué.');
    }
  }
}
