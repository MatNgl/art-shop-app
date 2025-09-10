import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Category, CategoryService } from '../../catalog/services/category';
import { CategoryFormComponent } from '../components/categories/category-form.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-create-category-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CategoryFormComponent],
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
        (cancel)="onCancel()"
      />
    </div>
  `,
})
export class CreateCategoryPage {
  private catSvc = inject(CategoryService);
  private router = inject(Router);
  private toast = inject(ToastService);

  async onSave(partial: Partial<Category>) {
    try {
      await this.catSvc.create({
        name: partial.name || '',
        slug: partial.slug || '',
        description: partial.description,
        color: partial.color,
        icon: partial.icon,
        image: partial.image,
        isActive: partial.isActive ?? true,
        productIds: partial.productIds ?? [],
      });
      this.toast.success('Catégorie créée.');
      this.router.navigate(['/admin/categories']);
    } catch {
      this.toast.error('La création a échoué.');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/categories']);
  }
}
