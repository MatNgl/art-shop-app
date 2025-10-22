// src/app/features/admin/pages/categories/create-category.page.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { CategoryService } from '../../catalog/services/category';
import type { Category } from '../../catalog/models/category.model';
import {
  CategoryFormComponent,
  CategorySavePayload,
} from '../components/categories/category-form.component';
import { ToastService } from '../../../shared/services/toast.service';

type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;

@Component({
  selector: 'app-create-category-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CategoryFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50">
      <!-- Header avec dégradé vert -->
      <div class="bg-gradient-to-r from-green-600 to-emerald-600 shadow-xl">
        <div class="max-w-5xl mx-auto px-6 py-8">
          <!-- Breadcrumb -->
          <nav class="text-sm text-green-100 mb-4 flex items-center gap-2">
            <a routerLink="/admin/dashboard" class="hover:text-white transition-colors flex items-center gap-1">
              <i class="fa-solid fa-home text-xs"></i>
              Dashboard
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <a routerLink="/admin/categories" class="hover:text-white transition-colors">
              Catégories
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <span class="text-white font-medium">Nouvelle</span>
          </nav>

          <!-- Titre avec icône -->
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <i class="fa-solid fa-plus text-3xl text-white"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">Nouvelle catégorie</h1>
              <p class="text-green-100">
                Créez une nouvelle catégorie pour organiser vos produits
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu -->
      <div class="max-w-5xl mx-auto px-6 py-8">
        <app-category-form
          submitLabel="Créer la catégorie"
          (save)="onSave($event)"
          (cancelEvent)="onCancel()"
        />
      </div>
    </div>
  `,
})
export class CreateCategoryPage {
  private readonly catSvc = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  async onSave(payload: CategorySavePayload): Promise<void> {
    try {
      // 1) Créer la catégorie
      const input: CreateCategoryInput = {
        name: payload.category.name?.trim() ?? '',
        slug: payload.category.slug?.trim() ?? '',
        description: payload.category.description,
        color: payload.category.color,
        icon: payload.category.icon,
        image: payload.category.image,
        isActive: payload.category.isActive ?? true,
        productIds: payload.category.productIds ?? [],
        subCategories: [], // on crée ensuite pour gérer les datestamps côté service
      };

      const created = await this.catSvc.create(input);

      // 2) Créer les sous-catégories associées
      for (const s of payload.subCategories.toCreate) {
        await this.catSvc.createSubCategory(created.id, {
          name: s.name,
          slug: s.slug,
          description: s.description,
          isActive: s.isActive,
          productIds: s.productIds ?? [],
        });
      }

      this.toast.success('Catégorie créée.');
      await this.router.navigate(['/admin/categories']);
    } catch {
      this.toast.error('La création a échoué.');
    }
  }

  onCancel(): void {
    void this.router.navigate(['/admin/categories']);
  }
}
