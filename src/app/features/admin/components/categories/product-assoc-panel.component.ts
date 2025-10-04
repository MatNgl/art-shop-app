import { Component, Input, Output, EventEmitter, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../catalog/models/product.model';
import { ProductService } from '../../../catalog/services/product';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-product-assoc-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      (click)="onBackdropClick($event)"
      [@fadeIn]
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Gérer les produits</h2>
            <p class="text-sm text-gray-600 mt-1">
              Associez des produits à cette sous-catégorie
            </p>
          </div>
          <button
            (click)="close()"
            class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2"
            type="button"
          >
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <!-- Filters & Search -->
        <div class="px-6 py-4 border-b bg-gray-50">
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
                placeholder="Rechercher un produit..."
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">{{ selectedCount() }} sélectionné(s)</span>
            </div>
          </div>

          <div class="flex items-center gap-3 mt-3">
            <button
              (click)="selectAll()"
              type="button"
              class="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Tout sélectionner
            </button>
            <span class="text-gray-300">•</span>
            <button
              (click)="deselectAll()"
              type="button"
              class="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Tout désélectionner
            </button>
          </div>
        </div>

        <!-- Products List -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          @if (loading()) {
          <div class="space-y-3">
            @for (i of [1,2,3,4,5]; track i) {
            <div class="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            }
          </div>
          } @else if (filteredProducts().length === 0) {
          <div class="text-center py-12">
            <i class="fa-solid fa-box-open text-4xl text-gray-400 mb-3"></i>
            <p class="text-gray-600">Aucun produit trouvé</p>
          </div>
          } @else {
          <div class="space-y-2">
            @for (product of filteredProducts(); track product.id) {
            <label
              class="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
              [class.bg-blue-50]="isSelected(product.id)"
              [class.border-blue-300]="isSelected(product.id)"
            >
              <input
                type="checkbox"
                [checked]="isSelected(product.id)"
                (change)="toggleSelection(product.id)"
                class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900 truncate">{{ product.title }}</span>
                  <span class="text-xs text-gray-500">{{ product.id }}</span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-gray-600">{{ product.reducedPrice ?? product.originalPrice }} €</span>
                  @if (product.isAvailable) {
                  <span class="text-xs text-green-600">• Disponible</span>
                  } @else {
                  <span class="text-xs text-red-600">• Indisponible</span>
                  }
                </div>
              </div>

              @if (product.images && product.images.length > 0) {
              <img
                [src]="product.images[0]"
                [alt]="product.title"
                class="w-12 h-12 object-cover rounded"
              />
              }
            </label>
            }
          </div>
          }
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            {{ filteredProducts().length }} produit(s) • {{ selectedCount() }} sélectionné(s)
          </div>

          <div class="flex items-center gap-3">
            <button
              (click)="close()"
              type="button"
              class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Annuler
            </button>

            <button
              (click)="saveSelection()"
              [disabled]="saving()"
              type="button"
              class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              @if (saving()) {
              <i class="fa-solid fa-spinner fa-spin mr-2"></i>
              }
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  animations: [],
})
export class ProductAssocPanelComponent implements OnInit {
  private productService = inject(ProductService);
  private toast = inject(ToastService);

  @Input({ required: true }) categoryId!: number;
  @Input({ required: true }) subCategoryId!: number;
  @Input() initialProductIds: number[] = [];

  @Output() saved = new EventEmitter<number[]>();
  @Output() closed = new EventEmitter<void>();

  allProducts = signal<Product[]>([]);
  loading = signal(true);
  saving = signal(false);

  searchTerm = '';
  selection = signal<Set<number>>(new Set());

  filteredProducts = computed(() => {
    const products = this.allProducts();
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return products;

    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        String(p.id).includes(term) ||
        p.description?.toLowerCase().includes(term)
    );
  });

  selectedCount = computed(() => this.selection().size);

  async ngOnInit(): Promise<void> {
    await this.loadProducts();
    this.selection.set(new Set(this.initialProductIds));
  }

  private async loadProducts(): Promise<void> {
    this.loading.set(true);
    try {
      const products = await this.productService.getAllProducts();
      // Filtrer uniquement les produits de la catégorie parente
      const filtered = products.filter((p) => p.categoryId === this.categoryId);
      this.allProducts.set(filtered);
    } catch (error) {
      console.error(error);
      this.toast.error('Impossible de charger les produits');
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(): void {
    // Le computed filteredProducts se met à jour automatiquement
  }

  isSelected(productId: number): boolean {
    return this.selection().has(productId);
  }

  toggleSelection(productId: number): void {
    const current = new Set(this.selection());
    if (current.has(productId)) {
      current.delete(productId);
    } else {
      current.add(productId);
    }
    this.selection.set(current);
  }

  selectAll(): void {
    const allIds = this.filteredProducts().map((p) => p.id);
    this.selection.set(new Set(allIds));
  }

  deselectAll(): void {
    this.selection.set(new Set());
  }

  async saveSelection(): Promise<void> {
    this.saving.set(true);

    try {
      const selectedIds = Array.from(this.selection());

      // Mettre à jour les subCategoryIds de tous les produits
      await Promise.all(
        this.allProducts().map(async (product) => {
          const isSelected = selectedIds.includes(product.id);
          const currentSubCatIds = product.subCategoryIds ?? [];
          const hasSubCat = currentSubCatIds.includes(this.subCategoryId);

          if (isSelected && !hasSubCat) {
            // Ajouter la sous-catégorie
            await this.productService.updateProduct(product.id, {
              subCategoryIds: [...currentSubCatIds, this.subCategoryId],
            });
          } else if (!isSelected && hasSubCat) {
            // Retirer la sous-catégorie
            await this.productService.updateProduct(product.id, {
              subCategoryIds: currentSubCatIds.filter((id) => id !== this.subCategoryId),
            });
          }
        })
      );

      this.saved.emit(selectedIds);
      this.toast.success('Associations mises à jour avec succès');
      this.close();
    } catch (error) {
      console.error(error);
      this.toast.error('Échec de la mise à jour des associations');
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
