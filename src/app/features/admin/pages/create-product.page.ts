// src/app/features/admin/pages/create-product.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductFormComponent } from '../components/products/product-form.component';
import { Product, ProductCategory, Artist, Dimensions } from '../../catalog/models/product.model';
import { ProductService } from '../../catalog/services/product';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-create-product-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductFormComponent],
  template: `
    <div class="max-w-5xl mx-auto p-6">
      <nav class="text-sm text-gray-500 mb-2">
        <a routerLink="/admin/dashboard" class="hover:text-gray-700">Dashboard</a> •
        <a routerLink="/admin/products" class="hover:text-gray-700">Produits</a> •
        <span class="text-gray-900">Nouveau</span>
      </nav>
      <h1 class="text-2xl font-bold mb-6">Nouveau produit</h1>

      <app-product-form
        [categories]="categories"
        submitLabel="Créer le produit"
        (save)="onSave($event)"
        (formCancel)="onCancel()"
      />
    </div>
  `,
})
export class CreateProductPage {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  categories = Object.values(ProductCategory);

  async onSave(partial: Partial<Product>) {
    try {
      // Construire l'objet attendu par createProduct (tout requis)
      const dims: Dimensions = {
        width: partial.dimensions?.width ?? 0,
        height: partial.dimensions?.height ?? 0,
        unit: partial.dimensions?.unit ?? 'cm',
      };
      const artist: Artist = partial.artist ?? { id: 0, name: 'Artiste inconnu' };
      const images = partial.images ?? [];
      const imageUrl = partial.imageUrl ?? images[0] ?? '';

      const toCreate: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        title: partial.title ?? '',
        description: partial.description ?? '',
        price: partial.price ?? 0,
        originalPrice: partial.originalPrice,
        category: (partial.category as ProductCategory) ?? ProductCategory.PAINTING,
        tags: [], // pas de tags dans le form → par défaut vide
        imageUrl,
        images,
        artist,
        technique: '', // tu as retiré ce champ du form, on met vide
        dimensions: dims,
        isAvailable: partial.isAvailable ?? true,
        stock: partial.stock ?? 0,
        isLimitedEdition: partial.isLimitedEdition ?? false,
        editionNumber: partial.isLimitedEdition ? partial.editionNumber ?? 1 : undefined,
        totalEditions: partial.isLimitedEdition
          ? partial.totalEditions ?? partial.editionNumber ?? 1
          : undefined,
      };

      await this.productService.createProduct(toCreate);
      this.toast.success('Produit créé avec succès.');
      this.router.navigate(['/admin/products']);
    } catch (e) {
      console.error(e);
      this.toast.error('La création du produit a échoué.');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/products']);
  }
}
