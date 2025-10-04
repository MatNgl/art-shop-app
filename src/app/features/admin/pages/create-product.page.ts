// src/app/features/admin/pages/create-product-page.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../catalog/models/product.model';
import { ProductService, NewProductInput } from '../../catalog/services/product';
import { CategoryService, Category } from '../../catalog/services/category';
import { ProductFormComponent } from '../components/products/product-form.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-create-product-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductFormComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      <!-- Header avec dégradé violet -->
      <div class="bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl">
        <div class="max-w-5xl mx-auto px-6 py-8">
          <!-- Breadcrumb -->
          <nav class="text-sm text-purple-100 mb-4 flex items-center gap-2">
            <a routerLink="/admin/dashboard" class="hover:text-white transition-colors flex items-center gap-1">
              <i class="fa-solid fa-home text-xs"></i>
              Dashboard
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <a routerLink="/admin/products" class="hover:text-white transition-colors">
              Produits
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <span class="text-white font-medium">Nouveau</span>
          </nav>

          <!-- Titre avec icône -->
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <i class="fa-solid fa-plus text-3xl text-white"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">Nouveau produit</h1>
              <p class="text-purple-100">
                Ajoutez un nouveau produit à votre catalogue
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu -->
      <div class="max-w-5xl mx-auto px-6 py-8">
        <app-product-form
          [categories]="categories()"
          submitLabel="Créer le produit"
          (save)="onSave($event)"
          (formCancel)="onCancel()"
        />
      </div>
    </div>
  `,
})
export class CreateProductPage implements OnInit {
  private readonly productSvc = inject(ProductService);
  private readonly categorySvc = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  categories = signal<Category[]>([]);

  async ngOnInit() {
    const cats = await this.categorySvc.getAll();
    this.categories.set(cats);
  }

  async onSave(partial: Partial<Product>) {
    try {
      // NewProductInput inclut bien price/stock désormais → pas de perte à la création
      const payload = partial as NewProductInput;
      await this.productSvc.createProduct(payload);
      this.toast.success('Produit créé.');
      this.router.navigate(['/admin/products']);
    } catch {
      this.toast.error('La création a échoué.');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/products']);
  }
}
