import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductFormComponent } from '../components/products/product-form.component';
import { Product } from '../../catalog/models/product.model';
import { ProductService } from '../../catalog/services/product';
import { CategoryService, Category } from '../../catalog/services/category';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-edit-product-page',
  standalone: true,
  imports: [CommonModule, NgIf, RouterLink, ProductFormComponent],
  template: `
    <div class="max-w-5xl mx-auto p-6">
      <nav class="text-sm text-gray-500 mb-2">
        <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a> •
        <a routerLink="/admin/products" class="hover:text-gray-700">Produits</a> •
        <span class="text-gray-900">Modifier</span>
      </nav>
      <h1 class="text-2xl font-bold mb-6">Modifier le produit</h1>

      <ng-container *ngIf="initial(); else loadingTpl">
        <app-product-form
          [initial]="initial()"
          [categories]="categories()"
          submitLabel="Enregistrer"
          (save)="onSave($event)"
          (formCancel)="onCancel()"
        />
      </ng-container>
      <ng-template #loadingTpl><div class="text-gray-500">Chargement…</div></ng-template>
    </div>
  `,
})
export class EditProductPage implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categorySvc = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  initial = signal<Product | null>(null);
  categories = signal<Category[]>([]);

  async ngOnInit() {
    // Charge uniquement les catégories
    const cats = await this.categorySvc.getAll();
    this.categories.set(cats);

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) {
      this.toast.error('Identifiant invalide.');
      this.router.navigate(['/admin/products']);
      return;
    }

    const p = await this.productService.getProductById(id);
    if (!p) {
      this.toast.error('Produit introuvable.');
      this.router.navigate(['/admin/products']);
      return;
    }
    this.initial.set(p);
  }

  async onSave(partial: Partial<Product>) {
    const id = this.initial()?.id;
    if (!id) return;
    try {
      await this.productService.updateProduct(id, partial);
      this.toast.success('Modifications enregistrées.');
      this.router.navigate(['/admin/products']);
    } catch {
      this.toast.error('La mise à jour a échoué.');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/products']);
  }
}
