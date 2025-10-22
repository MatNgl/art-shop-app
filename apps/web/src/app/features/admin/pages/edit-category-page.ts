// src/app/features/admin/pages/categories/edit-category.page.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CategoryService } from '../../catalog/services/category';
import type { Category } from '../../catalog/models/category.model';
import {
  CategoryFormComponent,
  CategorySavePayload,
} from '../components/categories/category-form.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-edit-category-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CategoryFormComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <!-- Header avec dégradé -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl">
        <div class="max-w-5xl mx-auto px-6 py-8">
          <!-- Breadcrumb -->
          <nav class="text-sm text-blue-100 mb-4 flex items-center gap-2">
            <a routerLink="/admin/dashboard" class="hover:text-white transition-colors flex items-center gap-1">
              <i class="fa-solid fa-home text-xs"></i>
              Dashboard
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <a routerLink="/admin/categories" class="hover:text-white transition-colors">
              Catégories
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <span class="text-white font-medium">Modifier</span>
          </nav>

          <!-- Titre avec icône -->
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <i class="fa-solid fa-pen-to-square text-3xl text-white"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">Modifier la catégorie</h1>
              <p class="text-blue-100">
                @if (initial()) {
                  {{ initial()!.name }}
                } @else {
                  Chargement...
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu -->
      <div class="max-w-5xl mx-auto px-6 py-8">
        <ng-container *ngIf="initial(); else loadingTpl">
          <app-category-form
            [initial]="initial()"
            submitLabel="Enregistrer les modifications"
            (save)="onSave($event)"
            (cancelEvent)="onCancel()"
          />
        </ng-container>

        <ng-template #loadingTpl>
          <div class="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <i class="fa-solid fa-spinner fa-spin text-2xl text-blue-600"></i>
            </div>
            <p class="text-lg font-medium text-gray-900 mb-2">Chargement de la catégorie</p>
            <p class="text-sm text-gray-600">Veuillez patienter...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
})
export class EditCategoryPage implements OnInit {
  private readonly catSvc = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  initial = signal<Category | null>(null);

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) {
      this.toast.error('Identifiant invalide.');
      await this.router.navigate(['/admin/categories']);
      return;
    }
    const c = await this.catSvc.getById(id);
    if (!c) {
      this.toast.error('Catégorie introuvable.');
      await this.router.navigate(['/admin/categories']);
      return;
    }
    this.initial.set(c);
  }

  async onSave(payload: CategorySavePayload): Promise<void> {
    const current = this.initial();
    if (!current) return;

    try {
      // 1) Update catégorie
      await this.catSvc.update(current.id, {
        name: payload.category.name ?? current.name,
        slug: payload.category.slug ?? current.slug,
        description: payload.category.description,
        color: payload.category.color,
        icon: payload.category.icon,
        image: payload.category.image,
        isActive:
          typeof payload.category.isActive === 'boolean'
            ? payload.category.isActive
            : current.isActive,
        productIds: payload.category.productIds ?? current.productIds,
      });

      // 2) Apply sub-categories diff (delete → update → create)
      for (const delId of payload.subCategories.toDeleteIds) {
        await this.catSvc.removeSubCategory(current.id, delId);
      }

      for (const s of payload.subCategories.toUpdate) {
        await this.catSvc.updateSubCategory(current.id, s.id, {
          name: s.name,
          slug: s.slug,
          description: s.description,
          isActive: s.isActive,
          productIds: s.productIds ?? [],
        });
      }

      for (const s of payload.subCategories.toCreate) {
        await this.catSvc.createSubCategory(current.id, {
          name: s.name,
          slug: s.slug,
          description: s.description,
          isActive: s.isActive,
          productIds: s.productIds ?? [],
        });
      }

      this.toast.success('Modifications enregistrées.');
      await this.router.navigate(['/admin/categories']);
    } catch {
      this.toast.error('La mise à jour a échoué.');
    }
  }

  onCancel(): void {
    void this.router.navigate(['/admin/categories']);
  }
}
