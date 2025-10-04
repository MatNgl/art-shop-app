// src/app/features/admin/components/subcategory-form-modal/subcategory-form-modal.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { SubCategory } from '../../../catalog/models/category.model';
import { Product } from '../../../catalog/models/product.model';
import { CategoryService } from '../../../catalog/services/category';
import { ProductService } from '../../../catalog/services/product';
import { ToastService } from '../../../../shared/services/toast.service';

interface SubCategoryFormControls {
  name: FormControl<string>;
  slug: FormControl<string>;
  description: FormControl<string | null>;
  isActive: FormControl<boolean>;
}

@Component({
  selector: 'app-subcategory-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'subcategory-modal-title'"
      (click)="onBackdropClick($event)"
      (keydown.escape)="close()"
      tabindex="0"
    >
      <!-- Modal -->
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden outline-none"
        role="document"
        (click)="$event.stopPropagation()"
        (keyup.enter)="$event.stopPropagation()"
        (keyup.space)="$event.stopPropagation()"
        tabindex="0"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div class="flex items-center justify-between">
            <div>
              <h2 id="subcategory-modal-title" class="text-2xl font-bold text-gray-900">
                {{ isEditMode ? 'Éditer la sous-catégorie' : 'Nouvelle sous-catégorie' }}
              </h2>
              <p class="text-sm text-gray-600 mt-1">
                {{ categoryName }}
              </p>
            </div>
            <button
              type="button"
              (click)="close()"
              class="text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Fermer la fenêtre"
            >
              <i class="fa-solid fa-xmark text-2xl"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          <form [formGroup]="form" class="p-6 space-y-6">
            <!-- Informations de base -->
            <div class="bg-white rounded-xl border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-info-circle text-blue-600"></i>
                Informations de base
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Name -->
                <div>
                  <label
                    for="subcategory-name"
                    class="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nom <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="subcategory-name"
                    type="text"
                    formControlName="name"
                    (input)="onNameChange()"
                    placeholder="Ex: Peinture à l'huile"
                    class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    [class.border-red-500]="
                      form.controls.name.invalid && form.controls.name.touched
                    "
                    [attr.aria-invalid]="
                      form.controls.name.invalid && form.controls.name.touched ? 'true' : null
                    "
                    aria-describedby="subcategory-name-error"
                  />
                  @if (form.controls.name.invalid && form.controls.name.touched) {
                  <p id="subcategory-name-error" class="text-sm text-red-600 mt-1">
                    <i class="fa-solid fa-exclamation-circle mr-1"></i>
                    Nom requis (2-60 caractères)
                  </p>
                  }
                </div>

                <!-- Slug -->
                <div>
                  <label
                    for="subcategory-slug"
                    class="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Slug <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="subcategory-slug"
                    type="text"
                    formControlName="slug"
                    placeholder="peinture-huile"
                    class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    [class.border-red-500]="
                      form.controls.slug.invalid && form.controls.slug.touched
                    "
                    [attr.aria-invalid]="
                      form.controls.slug.invalid && form.controls.slug.touched ? 'true' : null
                    "
                    aria-describedby="subcategory-slug-help subcategory-slug-error"
                  />
                  <p id="subcategory-slug-help" class="text-xs text-gray-500 mt-1">
                    <i class="fa-solid fa-magic-wand-sparkles mr-1"></i>
                    Généré automatiquement depuis le nom
                  </p>
                  @if (form.controls.slug.invalid && form.controls.slug.touched) {
                  <p id="subcategory-slug-error" class="text-sm text-red-600 mt-1">
                    <i class="fa-solid fa-exclamation-circle mr-1"></i>
                    Slug requis (2-80 caractères)
                  </p>
                  }
                </div>

                <!-- Description -->
                <div class="md:col-span-2">
                  <label
                    for="subcategory-description"
                    class="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="subcategory-description"
                    formControlName="description"
                    rows="3"
                    placeholder="Décrivez cette sous-catégorie…"
                    class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
                  ></textarea>
                </div>

                <!-- Active -->
                <div class="md:col-span-2">
                  <label
                    for="isActiveCheckbox"
                    class="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <input
                      id="isActiveCheckbox"
                      type="checkbox"
                      formControlName="isActive"
                      class="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div class="flex-1">
                      <span class="text-sm font-medium text-gray-900">Sous-catégorie active</span>
                      <p class="text-xs text-gray-600">
                        Les sous-catégories inactives ne seront pas visibles sur le site
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Gestion des produits -->
            <div class="bg-white rounded-xl border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i class="fa-solid fa-boxes-stacked text-purple-600"></i>
                  Produits associés
                </h3>
                <div class="flex items-center gap-4">
                  <label for="product-search" class="sr-only">Rechercher un produit</label>
                  <input
                    id="product-search"
                    type="text"
                    [ngModel]="productSearchTerm()"
                    (ngModelChange)="productSearchTerm.set($event)"
                    [ngModelOptions]="{ standalone: true }"
                    placeholder="Rechercher un produit…"
                    class="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                  <span class="text-sm font-medium text-gray-600">
                    {{ selectedProductCount() }} sélectionné(s)
                  </span>
                </div>
              </div>

              <!-- Actions rapides -->
              <div class="flex items-center gap-3 mb-4 pb-4 border-b">
                <button
                  type="button"
                  (click)="selectAllProducts()"
                  class="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                >
                  <i class="fa-solid fa-check-double mr-1"></i>
                  Tout sélectionner
                </button>
                <button
                  type="button"
                  (click)="deselectAllProducts()"
                  class="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                >
                  <i class="fa-solid fa-xmark mr-1"></i>
                  Tout désélectionner
                </button>
                <div class="flex-1"></div>
                <label for="product-sort" class="sr-only">Trier</label>
                <select
                  id="product-sort"
                  [ngModel]="productSortBy()"
                  (ngModelChange)="productSortBy.set($event)"
                  [ngModelOptions]="{ standalone: true }"
                  class="text-xs px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Nom A–Z</option>
                  <option value="newest">Plus récents</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                </select>
              </div>

              <!-- Liste des produits -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                @if (loadingProducts()) {
                <div class="col-span-2 space-y-3">
                  @for (i of [1,2,3,4]; track i) {
                  <div class="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
                  }
                </div>
                } @else if (filteredProducts().length === 0) {
                <div class="col-span-2 text-center py-12">
                  <i class="fa-solid fa-box-open text-4xl text-gray-400 mb-3"></i>
                  <p class="text-gray-600">Aucun produit trouvé</p>
                </div>
                } @else { @for (product of filteredProducts(); track product.id) {
                <div
                  class="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  [class.border-blue-500]="isProductSelected(product.id)"
                  [class.bg-blue-50]="isProductSelected(product.id)"
                  [class.border-gray-200]="!isProductSelected(product.id)"
                  (click)="toggleProduct(product.id)"
                  (keyup.enter)="toggleProduct(product.id)"
                  (keyup.space)="toggleProduct(product.id); $event.preventDefault()"
                  tabindex="0"
                  role="button"
                  [attr.aria-pressed]="isProductSelected(product.id)"
                  [attr.aria-label]="'Sélectionner le produit ' + product.title"
                >
                  <input
                    type="checkbox"
                    [checked]="isProductSelected(product.id)"
                    (click)="$event.stopPropagation()"
                    (change)="toggleProduct(product.id)"
                    class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500 pointer-events-none"
                    aria-hidden="true"
                  />

                  <!-- Image -->
                  @if (product.images && product.images.length > 0) {
                  <img
                    [src]="product.images[0]"
                    [alt]="product.title"
                    class="w-20 h-20 object-cover rounded-lg shadow-sm"
                  />
                  } @else {
                  <div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <i class="fa-solid fa-image text-gray-400 text-2xl" aria-hidden="true"></i>
                    <span class="sr-only">Aperçu indisponible</span>
                  </div>
                  }

                  <!-- Infos -->
                  <div class="flex-1 min-w-0">
                    <h4
                      class="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700"
                    >
                      {{ product.title }}
                    </h4>
                    <p class="text-xs text-gray-600 truncate mt-0.5">
                      ID: {{ product.id }} • {{ product.technique }}
                    </p>
                    <div class="flex items-center gap-2 mt-2">
                      <span class="text-sm font-bold text-gray-900">
                        {{ product.reducedPrice ?? product.originalPrice }} €
                      </span>
                      @if (product.reducedPrice && product.reducedPrice < product.originalPrice) {
                      <span class="text-xs text-gray-500 line-through">
                        {{ product.originalPrice }} €
                      </span>
                      <span
                        class="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium"
                      >
                        -{{ getDiscountPercent(product) }}%
                      </span>
                      }
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      @if (product.isAvailable) {
                      <span class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        <i class="fa-solid fa-check mr-1"></i>Disponible
                      </span>
                      } @else {
                      <span class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                        <i class="fa-solid fa-xmark mr-1"></i>Indisponible
                      </span>
                      } @if (product.stock !== undefined) {
                      <span class="text-xs text-gray-600">Stock: {{ product.stock }}</span>
                      }
                    </div>
                  </div>
                </div>
                } }
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            <i class="fa-solid fa-info-circle mr-1"></i>
            {{ selectedProductCount() }} produit(s) sélectionné(s)
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="close()"
              [disabled]="saving()"
              class="px-6 py-2.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Annuler
            </button>

            <button
              type="button"
              (click)="save()"
              [disabled]="form.invalid || saving()"
              class="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            >
              @if (saving()) {
              <i class="fa-solid fa-spinner fa-spin"></i>
              } @else {
              <i class="fa-solid fa-check"></i>
              }
              {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SubCategoryFormModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private toast = inject(ToastService);

  @Input({ required: true }) categoryId!: number;
  @Input({ required: true }) categoryName!: string;
  @Input() subCategory: SubCategory | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  form: FormGroup<SubCategoryFormControls> = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(60),
    ]),
    slug: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(80),
    ]),
    description: this.fb.control<string | null>(null),
    isActive: this.fb.nonNullable.control(true),
  });

  allProducts = signal<Product[]>([]);
  loadingProducts = signal<boolean>(true);
  saving = signal<boolean>(false);

  selectedProductIds = signal<Set<number>>(new Set());
  productSearchTerm = signal<string>('');
  productSortBy = signal<'name' | 'newest' | 'price-asc' | 'price-desc'>('name');

  get isEditMode(): boolean {
    return this.subCategory !== null;
  }

  filteredProducts = computed<Product[]>(() => {
    let products = this.allProducts();
    const term = this.productSearchTerm().trim().toLowerCase();
    if (term) {
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          String(p.id).includes(term) ||
          (p.technique ?? '').toLowerCase().includes(term) ||
          (p.description ?? '').toLowerCase().includes(term)
      );
    }
    const sorted = [...products];
    switch (this.productSortBy()) {
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.originalPrice - b.originalPrice);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.originalPrice - a.originalPrice);
        break;
    }
    return sorted;
  });

  selectedProductCount = computed<number>(() => this.selectedProductIds().size);

  async ngOnInit(): Promise<void> {
    await this.loadProducts();
    if (this.subCategory) {
      this.form.patchValue({
        name: this.subCategory.name,
        slug: this.subCategory.slug,
        description: this.subCategory.description ?? null,
        isActive: this.subCategory.isActive,
      });
      const associated = this.allProducts()
        .filter((p) => (p.subCategoryIds ?? []).includes(this.subCategory!.id))
        .map((p) => p.id);
      this.selectedProductIds.set(new Set(associated));
    }
  }

  private async loadProducts(): Promise<void> {
    this.loadingProducts.set(true);
    try {
      const products = await this.productService.getAllProducts();
      this.allProducts.set(products);
    } catch (e) {
      console.error(e);
      this.toast.error('Impossible de charger les produits');
    } finally {
      this.loadingProducts.set(false);
    }
  }

  onNameChange(): void {
    const name = this.form.controls.name.value;
    if (!this.isEditMode) {
      const slug = this.categoryService.slugify(name);
      this.form.controls.slug.setValue(slug);
    }
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProductIds().has(productId);
  }

  toggleProduct(productId: number): void {
    const current = new Set(this.selectedProductIds());
    if (current.has(productId)) {
      current.delete(productId);
    } else {
      current.add(productId);
    }
    this.selectedProductIds.set(current);
  }

  selectAllProducts(): void {
    const allIds = this.filteredProducts().map((p) => p.id);
    this.selectedProductIds.set(new Set(allIds));
  }

  deselectAllProducts(): void {
    this.selectedProductIds.set(new Set());
  }

  getDiscountPercent(product: Product): number {
    if (!product.reducedPrice || product.reducedPrice >= product.originalPrice) return 0;
    return Math.round(
      ((product.originalPrice - product.reducedPrice) / product.originalPrice) * 100
    );
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    const errors: string[] = [];
    if (this.form.controls.name.invalid) errors.push('❌ Nom requis (2–60 caractères)');
    if (this.form.controls.slug.invalid) errors.push('❌ Slug requis (2–80 caractères)');
    if (errors.length) {
      this.toast.error(['⚠️ Erreurs dans le formulaire :', ...errors].join('\n'));
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
      return;
    }

    this.saving.set(true);
    try {
      const { name, slug, description, isActive } = this.form.getRawValue();
      const productIds = Array.from(this.selectedProductIds());
      let subCategoryId: number;

      if (this.isEditMode) {
        const updated = await this.categoryService.updateSubCategory(
          this.categoryId,
          this.subCategory!.id,
          { name, slug, description: description ?? undefined, isActive, productIds }
        );
        subCategoryId = updated.id;
      } else {
        const created = await this.categoryService.createSubCategory(this.categoryId, {
          name,
          slug,
          description: description ?? undefined,
          isActive,
          productIds,
        });
        subCategoryId = created.id;
      }

      await this.updateProductAssociations(subCategoryId);
      this.toast.success(
        this.isEditMode ? 'Sous-catégorie mise à jour' : 'Sous-catégorie créée avec succès'
      );
      this.saved.emit();
      this.close();
    } catch (e) {
      console.error(e);
      this.toast.error("Une erreur est survenue lors de l'enregistrement");
    } finally {
      this.saving.set(false);
    }
  }

  private async updateProductAssociations(subCategoryId: number): Promise<void> {
    const selectedIds = Array.from(this.selectedProductIds());
    await Promise.all(
      this.allProducts().map(async (product) => {
        const isSelected = selectedIds.includes(product.id);
        const currentSubCatIds = product.subCategoryIds ?? [];
        const hasSubCat = currentSubCatIds.includes(subCategoryId);

        if (isSelected && !hasSubCat) {
          await this.productService.updateProduct(product.id, {
            subCategoryIds: [...currentSubCatIds, subCategoryId],
          });
        } else if (!isSelected && hasSubCat) {
          await this.productService.updateProduct(product.id, {
            subCategoryIds: currentSubCatIds.filter((id) => id !== subCategoryId),
          });
        }
      })
    );
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
