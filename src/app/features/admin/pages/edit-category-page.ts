import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Category, CategoryService } from '../../catalog/services/category';
import { CategoryFormComponent } from '../components/categories/category-form.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-edit-category-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CategoryFormComponent],
  template: `
    <div class="max-w-5xl mx-auto p-6">
      <nav class="text-sm text-gray-500 mb-2">
        <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a> •
        <a routerLink="/admin/categories" class="hover:text-gray-700">Catégories</a> •
        <span class="text-gray-900">Modifier</span>
      </nav>
      <h1 class="text-2xl font-bold mb-6">Modifier la catégorie</h1>

      <ng-container *ngIf="initial(); else loadingTpl">
        <app-category-form
          [initial]="initial()"
          submitLabel="Enregistrer"
          (save)="onSave($event)"
          (cancel)="onCancel()"
        />
      </ng-container>
      <ng-template #loadingTpl>
        <div class="text-gray-500">Chargement…</div>
      </ng-template>
    </div>
  `,
})
export class EditCategoryPage implements OnInit {
  private catSvc = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  initial = signal<Category | null>(null);

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) {
      this.toast.error('Identifiant invalide.');
      this.router.navigate(['/admin/categories']);
      return;
    }
    const c = await this.catSvc.getById(id);
    if (!c) {
      this.toast.error('Catégorie introuvable.');
      this.router.navigate(['/admin/categories']);
      return;
    }
    this.initial.set(c);
  }

  async onSave(partial: Partial<Category>) {
    const id = this.initial()?.id;
    if (!id) return;
    try {
      await this.catSvc.update(id, {
        name: partial.name,
        slug: partial.slug,
        description: partial.description,
        color: partial.color,
        icon: partial.icon,
        image: partial.image,
        isActive: partial.isActive,
        productIds: partial.productIds,
      });
      this.toast.success('Modifications enregistrées.');
      this.router.navigate(['/admin/categories']);
    } catch {
      this.toast.error('La mise à jour a échoué.');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/categories']);
  }
}
