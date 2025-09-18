import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Product, Artist } from '../../catalog/models/product.model';
import { ProductService } from '../../catalog/services/product';
import { ArtistService } from '../../catalog/services/artist';
import { CategoryService, Category } from '../../catalog/services/category';
import { ProductFormComponent } from '../components/products/product-form.component';
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
        [categories]="categories()"
        [artists]="artists()"
        submitLabel="Créer le produit"
        (save)="onSave($event)"
        (formCancel)="onCancel()"
      />
    </div>
  `,
})
export class CreateProductPage implements OnInit {
  private readonly productSvc = inject(ProductService);
  private readonly artistSvc = inject(ArtistService);
  private readonly categorySvc = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  artists = signal<Artist[]>([]);
  categories = signal<Category[]>([]);

  async ngOnInit() {
    const [artists, cats] = await Promise.all([this.artistSvc.getAll(), this.categorySvc.getAll()]);
    this.artists.set(artists);
    this.categories.set(cats);
  }

  async onSave(partial: Partial<Product>) {
    try {
      await this.productSvc.createProduct(
        partial as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
      );
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
