import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Category, CategoryService } from '../../catalog/services/category';
import { CategoryFormComponent } from '../components/categories/category-form.component';
import { ToastService } from '../../../shared/services/toast.service';

type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;

@Component({
  selector: 'app-create-category-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CategoryFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto p-6">
      <nav class="text-sm text-gray-500 mb-2">
        <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a> •
        <a routerLink="/admin/categories" class="hover:text-gray-700">Catégories</a> •
        <span class="text-gray-900">Nouvelle</span>
      </nav>

      <h1 class="text-2xl font-bold mb-6">Nouvelle catégorie</h1>

      <app-category-form
        submitLabel="Créer la catégorie"
        (save)="onSave($event)"
        (cancelEvent)="onCancel()"
      />
    </div>
  `,
})
export class CreateCategoryPage {
  private readonly catSvc = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private slugify(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async onSave(partial: Partial<Category>) {
    try {
      const input: CreateCategoryInput = {
        name: partial.name?.trim() ?? '',
        slug: (partial.slug?.trim() || (partial.name ? this.slugify(partial.name) : '')).slice(0, 80),
        description: partial.description,
        color: partial.color,
        icon: partial.icon,
        image: partial.image,
        isActive: partial.isActive ?? true,
        productIds: partial.productIds ?? [],
      };

      // S’assure qu’on envoie le bon shape
      await this.catSvc.create(input);

      this.toast.success('Catégorie créée.');
      void this.router.navigate(['/admin/categories']);
    } catch {
      this.toast.error('La création a échoué.');
    }
  }

  onCancel() {
    void this.router.navigate(['/admin/categories']);
  }
}
