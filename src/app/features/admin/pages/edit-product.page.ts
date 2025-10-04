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
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      <!-- Header avec dégradé indigo -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl">
        <div class="max-w-5xl mx-auto px-6 py-8">
          <!-- Breadcrumb -->
          <nav class="text-sm text-indigo-100 mb-4 flex items-center gap-2">
            <a routerLink="/admin/dashboard" class="hover:text-white transition-colors flex items-center gap-1">
              <i class="fa-solid fa-home text-xs"></i>
              Dashboard
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <a routerLink="/admin/products" class="hover:text-white transition-colors">
              Produits
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
              <h1 class="text-3xl font-bold text-white mb-1">Modifier le produit</h1>
              <p class="text-indigo-100" *ngIf="initial()">
                {{ initial()!.title }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu -->
      <div class="max-w-5xl mx-auto px-6 py-8">
        <ng-container *ngIf="initial(); else loadingTpl">
          <app-product-form
            [initial]="initial()"
            [categories]="categories()"
            submitLabel="Enregistrer"
            (save)="onSave($event)"
            (formCancel)="onCancel()"
          />
        </ng-container>
        <ng-template #loadingTpl>
          <div class="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <i class="fa-solid fa-spinner fa-spin text-2xl text-indigo-600"></i>
            </div>
            <p class="text-lg font-medium text-gray-900 mb-2">Chargement du produit</p>
            <p class="text-sm text-gray-600">Veuillez patienter...</p>
          </div>
        </ng-template>
      </div>
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
