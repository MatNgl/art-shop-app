// src/app/features/admin/components/products/product-form.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormArray,
  FormGroup,
  FormControl,
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import {
  Product,
  ProductVariant,
  PrintSize,
  Dimensions,
} from '../../../catalog/models/product.model';
import { Category } from '../../../catalog/models/category.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { SizePipe } from '../../../../shared/pipes/size.pipe';

type Unit = Dimensions['unit'];

// Dimensions ISO par taille
const SIZE_DIMENSIONS: Record<PrintSize, Dimensions> = {
  A3: { width: 42, height: 29.7, unit: 'cm' },
  A4: { width: 29.7, height: 21, unit: 'cm' },
  A5: { width: 21, height: 14.8, unit: 'cm' },
  A6: { width: 14.8, height: 10.5, unit: 'cm' },
};

interface VariantFormControls {
  id: FormControl<number | null>;
  size: FormControl<PrintSize>;
  price: FormControl<number>;
  originalPrice: FormControl<number | null>; // Prix réduit (si présent) doit être < price
  stock: FormControl<number>;
  isAvailable: FormControl<boolean>;
}

interface ProductFormControls {
  title: FormControl<string>;
  categoryId: FormControl<number | null>;
  technique: FormControl<string>;
  description: FormControl<string | null>;
  tags: FormControl<string>;

  hasVariants: FormControl<boolean>;
  singleSize: FormControl<PrintSize | 'custom'>;

  price: FormControl<number | null>;
  originalPrice: FormControl<number | null>; // Prix réduit (si présent)
  stock: FormControl<number | null>;

  isAvailable: FormControl<boolean>;
  isLimitedEdition: FormControl<boolean>;
  editionNumber: FormControl<number | null>;
  totalEditions: FormControl<number | null>;

  dimensions: FormGroup<{
    width: FormControl<number | null>;
    height: FormControl<number | null>;
    unit: FormControl<Unit>;
  }>;

  images: FormArray<FormControl<string>>;
  variants: FormArray<FormGroup<VariantFormControls>>;
}

type ProductFormGroup = FormGroup<ProductFormControls>;

const atLeastOneImage: ValidatorFn = (control) => {
  const arr = control as FormArray<FormControl<string>>;
  return arr.controls.some((c) => !!c.value?.trim()) ? null : { imagesRequired: true };
};

const uniqueSizes: ValidatorFn = (control) => {
  const arr = control as FormArray<FormGroup<VariantFormControls>>;
  const sizes = arr.controls.map((g) => g.controls.size.value);
  const hasDuplicates = sizes.some((s, i) => sizes.indexOf(s) !== i);
  return hasDuplicates ? { duplicateSizes: true } : null;
};

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SizePipe],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6" novalidate>
      <!-- Informations générales -->
      <div class="bg-white rounded-lg p-6 shadow-sm border">
        <h2 class="text-lg font-semibold mb-4">Informations générales</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <span class="block text-sm font-medium mb-2">Titre *</span>
            <input
              type="text"
              formControlName="title"
              class="w-full px-3 py-2 border rounded-lg"
              [class.border-red-500]="isInvalid('title')"
            />
            @if (isInvalid('title')) {
            <p class="text-sm text-red-600 mt-1">Titre requis (3-120 caractères)</p>
            }
          </div>

          <div>
            <span class="block text-sm font-medium mb-2">Catégorie *</span>
            <select
              formControlName="categoryId"
              class="w-full px-3 py-2 border rounded-lg"
              [class.border-red-500]="isInvalid('categoryId')"
            >
              <option [ngValue]="null">Choisir...</option>
              @for (cat of categories; track cat.id) {
              <option [ngValue]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>

          <div>
            <span class="block text-sm font-medium mb-2">Technique</span>
            <input
              type="text"
              formControlName="technique"
              class="w-full px-3 py-2 border rounded-lg"
              placeholder="Ex: Huile sur toile"
            />
          </div>

          <div class="md:col-span-2">
            <span class="block text-sm font-medium mb-2">Description</span>
            <textarea
              formControlName="description"
              rows="3"
              class="w-full px-3 py-2 border rounded-lg"
            ></textarea>
          </div>

          <div class="md:col-span-2">
            <span class="block text-sm font-medium mb-2">Tags (séparés par des virgules)</span>
            <input
              type="text"
              formControlName="tags"
              class="w-full px-3 py-2 border rounded-lg"
              placeholder="Ex: paysage, moderne, urbain"
            />
          </div>
        </div>
      </div>

      <!-- Toggle variantes -->
      <div class="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <span class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            formControlName="hasVariants"
            class="w-5 h-5 rounded"
            (change)="updateValidators()"
          />
          <div>
            <div class="font-semibold text-gray-900">
              Produit avec variantes de tailles (A3/A4/A5/A6)
            </div>
            <div class="text-sm text-gray-600">
              Cochez pour proposer plusieurs formats d'impression
            </div>
          </div>
        </span>
      </div>

      @if (!form.controls.hasVariants.value) {
      <!-- Format unique -->
      <div class="bg-white rounded-lg p-6 shadow-sm border">
        <h2 class="text-lg font-semibold mb-4">Format du produit</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="block text-sm font-medium mb-2">Taille</span>
            <select
              formControlName="singleSize"
              class="w-full px-3 py-2 border rounded-lg"
              (change)="onSingleSizeChange(); updateValidators()"
            >
              <option value="custom">Format personnalisé</option>
              <option value="A3">A3 ({{ 'A3' | size }})</option>
              <option value="A4">A4 ({{ 'A4' | size }})</option>
              <option value="A5">A5 ({{ 'A5' | size }})</option>
              <option value="A6">A6 ({{ 'A6' | size }})</option>
            </select>
          </div>
        </div>

        @if (form.controls.singleSize.value === 'custom') {
        <div [formGroup]="form.controls.dimensions" class="grid grid-cols-3 gap-4 mt-4">
          <div>
            <span class="block text-sm font-medium mb-2">Largeur</span>
            <input
              type="number"
              formControlName="width"
              class="w-full px-3 py-2 border rounded-lg"
              [class.border-red-500]="
                form.controls.dimensions.controls.width.invalid &&
                (form.controls.dimensions.controls.width.dirty ||
                  form.controls.dimensions.controls.width.touched)
              "
            />
            @if (form.controls.dimensions.controls.width.errors?.['required']) {
            <p class="text-xs text-red-600 mt-1">Largeur requise</p>
            }
          </div>
          <div>
            <span class="block text-sm font-medium mb-2">Hauteur</span>
            <input
              type="number"
              formControlName="height"
              class="w-full px-3 py-2 border rounded-lg"
              [class.border-red-500]="
                form.controls.dimensions.controls.height.invalid &&
                (form.controls.dimensions.controls.height.dirty ||
                  form.controls.dimensions.controls.height.touched)
              "
            />
            @if (form.controls.dimensions.controls.height.errors?.['required']) {
            <p class="text-xs text-red-600 mt-1">Hauteur requise</p>
            }
          </div>
          <div>
            <span class="block text-sm font-medium mb-2">Unité</span>
            <select formControlName="unit" class="w-full px-3 py-2 border rounded-lg">
              <option value="cm">cm</option>
              <option value="mm">mm</option>
              <option value="in">inches</option>
            </select>
          </div>
        </div>
        } @else {
        <p class="mt-3 text-sm text-gray-600">
          Dimensions : <strong>{{ form.controls.singleSize.value | size }}</strong>
        </p>
        }
      </div>

      <!-- Prix & stock -->
      <div class="bg-white rounded-lg p-6 shadow-sm border">
        <h2 class="text-lg font-semibold mb-4">Prix et stock</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span class="block text-sm font-medium mb-2">Prix actuel (€) *</span>
            <input
              type="number"
              step="0.01"
              formControlName="price"
              class="w-full px-3 py-2 border rounded-lg"
              [class.border-red-500]="isInvalid('price')"
            />
          </div>
          <div>
            <span class="block text-sm font-medium mb-2">Prix réduit (€)</span>
            <input
              type="number"
              step="0.01"
              formControlName="originalPrice"
              class="w-full px-3 py-2 border rounded-lg"
              [class.border-red-500]="form.hasError('originalNotGreater')"
            />
            @if (form.hasError('originalNotGreater')) {
            <p class="text-sm text-red-600 mt-1">
              Le prix réduit doit être strictement inférieur au prix actuel
            </p>
            }
          </div>
          <div>
            <span class="block text-sm font-medium mb-2">Stock *</span>
            <input
              type="number"
              formControlName="stock"
              class="w-full px-3 py-2 border rounded-lg"
              [class.border-red-500]="isInvalid('stock')"
            />
          </div>
        </div>

        <div class="mt-4 flex items-center gap-4">
          <span class="flex items-center gap-2">
            <input type="checkbox" formControlName="isAvailable" class="w-4 h-4" />
            <span class="text-sm">Disponible à la vente</span>
          </span>
        </div>
      </div>
      } @if (form.controls.hasVariants.value) {
      <!-- Variantes (dimensions par variante implicites via la taille) -->
      <div class="bg-white rounded-lg p-6 shadow-sm border">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Variantes de tailles</h2>
          <button
            type="button"
            (click)="openAddVariantModal()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            [disabled]="availableSizes().length === 0"
            [attr.aria-disabled]="availableSizes().length === 0"
          >
            <i class="fa-solid fa-plus mr-2"></i>Ajouter une taille
          </button>
        </div>

        @if (variants.length === 0) {
        <div class="text-center py-8 text-gray-500">
          <i class="fa-solid fa-ruler-combined text-3xl mb-2"></i>
          <p>Aucune variante. Cliquez sur "Ajouter une taille" pour commencer.</p>
        </div>
        } @else {
        <div class="space-y-3">
          @for (variantGroup of variants.controls; track $index; let i = $index) {
          <div
            class="border rounded-lg p-4"
            [class.border-gray-300]="variantGroup.controls.isAvailable.value"
            [class.border-red-300]="!variantGroup.controls.isAvailable.value"
            [class.bg-gray-50]="!variantGroup.controls.isAvailable.value"
            [formGroup]="variantGroup"
          >
            <div class="grid grid-cols-12 gap-4 items-center">
              <div class="col-span-3">
                <div class="font-semibold text-lg">{{ variantGroup.controls.size.value }}</div>
                <div class="text-xs text-gray-500">
                  {{ variantGroup.controls.size.value | size }}
                </div>
              </div>
              <div class="col-span-2">
                <span class="block text-xs font-medium mb-1">Prix actuel (€)</span>
                <input
                  type="number"
                  step="0.01"
                  formControlName="price"
                  class="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div class="col-span-2">
                <span class="block text-xs font-medium mb-1">Prix réduit (€)</span>
                <input
                  type="number"
                  step="0.01"
                  formControlName="originalPrice"
                  class="w-full px-2 py-1 border rounded text-sm"
                  [class.border-red-500]="hasVariantPriceError(i)"
                />
              </div>
              <div class="col-span-2">
                <span class="block text-xs font-medium mb-1">Stock</span>
                <input
                  type="number"
                  formControlName="stock"
                  class="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div class="col-span-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  (click)="toggleVariantAvailability(i)"
                  class="px-3 py-1 text-xs rounded"
                  [class.bg-green-100]="variantGroup.controls.isAvailable.value"
                  [class.text-green-700]="variantGroup.controls.isAvailable.value"
                  [class.bg-gray-200]="!variantGroup.controls.isAvailable.value"
                  [class.text-gray-600]="!variantGroup.controls.isAvailable.value"
                  [title]="variantGroup.controls.isAvailable.value ? 'Désactiver' : 'Activer'"
                >
                  <i
                    class="fa-solid"
                    [class.fa-eye]="variantGroup.controls.isAvailable.value"
                    [class.fa-eye-slash]="!variantGroup.controls.isAvailable.value"
                  ></i>
                </button>
                <button
                  type="button"
                  (click)="removeVariant(i)"
                  class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="Supprimer"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
            @if (hasVariantPriceError(i)) {
            <p class="text-xs text-red-600 mt-1">
              Le prix réduit doit être strictement inférieur au prix actuel
            </p>
            }
          </div>
          }
        </div>
        }
      </div>
      }

      <!-- Édition limitée -->
      <div class="bg-white rounded-lg p-6 shadow-sm border">
        <span class="flex items-center gap-2 mb-4">
          <input type="checkbox" formControlName="isLimitedEdition" class="w-4 h-4" />
          <span class="font-semibold">Édition limitée</span>
        </span>
        @if (form.controls.isLimitedEdition.value) {
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="block text-sm font-medium mb-2">Numéro d'édition</span>
            <input
              type="number"
              formControlName="editionNumber"
              class="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <span class="block text-sm font-medium mb-2">Total éditions</span>
            <input
              type="number"
              formControlName="totalEditions"
              class="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        }
      </div>

      <!-- Images -->
      <div class="bg-white rounded-lg p-6 shadow-sm border">
        <h2 class="text-lg font-semibold mb-4">Images</h2>
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition"
          [class.border-blue-500]="isDragging()"
          [class.bg-blue-50]="isDragging()"
          [class.border-gray-300]="!isDragging()"
          role="button"
          tabindex="0"
          (click)="triggerFileInput()"
          (keydown.enter)="triggerFileInput()"
          (keydown.space)="triggerFileInput(); $event.preventDefault()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          <i class="fa-solid fa-cloud-arrow-up text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-600">
            Glissez-déposez vos images ou
            <span class="text-blue-600 font-medium">cliquez pour parcourir</span>
          </p>
          <p class="text-sm text-gray-500 mt-1">PNG, JPG, WEBP - Max 5 Mo par image</p>
        </div>
        <input
          #fileInput
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          (change)="onFileSelect($event)"
        />
        <div class="flex gap-3 mt-4">
          <button
            type="button"
            (click)="addImageByUrl()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
          >
            <i class="fa-solid fa-link mr-2"></i>Ajouter une URL
          </button>
        </div>
        @if (images.length > 0) {
        <div class="grid grid-cols-4 gap-3 mt-4">
          @for (ctrl of images.controls; track $index; let i = $index) {
          <div class="relative group">
            <img
              [src]="ctrl.value"
              class="w-full h-32 object-cover rounded-lg border"
              [alt]="'Image ' + (i + 1)"
            />
            <button
              type="button"
              (click)="removeImage(i)"
              class="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
            >
              <i class="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
          }
        </div>
        } @if (images.invalid && images.touched) {
        <p class="text-sm text-red-600 mt-2">Au moins une image est requise</p>
        }
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          (click)="onCancel()"
          class="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          [disabled]="form.invalid || submitting()"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ submitLabel }}
        </button>
      </div>
    </form>

    <!-- MODALE D'AJOUT DE VARIANTE -->
    @if (showAddVariantModal()) {
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-variant-title"
      tabindex="0"
      (click)="closeAddVariantModal()"
      (keydown.escape)="closeAddVariantModal()"
      (keyup.enter)="closeAddVariantModal()"
      (keyup.space)="closeAddVariantModal(); $event.preventDefault()"
    >
      <div
        class="bg-white rounded-lg p-6 max-w-md w-full mx-4 outline-none"
        role="document"
        tabindex="0"
        (click)="$event.stopPropagation()"
        (keydown.enter)="$event.stopPropagation()"
        (keydown.space)="$event.preventDefault(); $event.stopPropagation()"
      >
        <h3 id="add-variant-title" class="text-lg font-semibold mb-4">Ajouter une taille</h3>

        @if (availableSizes().length > 0) {
        <div class="space-y-3">
          @for (size of availableSizes(); track size) {
          <button
            type="button"
            (click)="addVariant(size)"
            class="w-full text-left px-4 py-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold">{{ size }}</div>
                <div class="text-sm text-gray-500">{{ size | size }}</div>
              </div>
              <i class="fa-solid fa-plus text-blue-600"></i>
            </div>
          </button>
          }
        </div>
        } @else {
        <p class="text-center text-gray-500 py-4">Toutes les tailles ont été ajoutées</p>
        }

        <button
          type="button"
          (click)="closeAddVariantModal()"
          class="w-full mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>
    </div>
    }
  `,
})
export class ProductFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  @Input() initial?: Product | null;
  @Input({ required: true }) categories: Category[] = [];
  @Input() submitLabel = 'Enregistrer';

  @Output() save = new EventEmitter<Partial<Product>>();
  @Output() formCancel = new EventEmitter<void>();

  submitting = signal(false);
  showAddVariantModal = signal(false);
  isDragging = signal(false);

  form: ProductFormGroup = this.fb.group(
    {
      title: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
      ]),
      categoryId: this.fb.control<number | null>(null, [Validators.required]),
      technique: this.fb.nonNullable.control(''),
      description: this.fb.control<string | null>(null),
      tags: this.fb.nonNullable.control(''),
      hasVariants: this.fb.nonNullable.control(false),
      singleSize: this.fb.nonNullable.control<PrintSize | 'custom'>('custom'),
      price: this.fb.control<number | null>(null, [Validators.min(0)]),
      originalPrice: this.fb.control<number | null>(null, [Validators.min(0)]),
      stock: this.fb.control<number | null>(0, [Validators.min(0)]),
      isAvailable: this.fb.nonNullable.control(true),
      isLimitedEdition: this.fb.nonNullable.control(false),
      editionNumber: this.fb.control<number | null>(null),
      totalEditions: this.fb.control<number | null>(null),
      dimensions: this.fb.group({
        width: this.fb.control<number | null>(null, [Validators.min(0)]),
        height: this.fb.control<number | null>(null, [Validators.min(0)]),
        unit: this.fb.nonNullable.control<Unit>('cm'),
      }),
      images: this.fb.array<FormControl<string>>([], [atLeastOneImage]),
      variants: this.fb.array<FormGroup<VariantFormControls>>([], [uniqueSizes]),
    },
    { validators: [this.priceBarreValidator()] }
  );

  get images() {
    return this.form.controls.images;
  }
  get variants() {
    return this.form.controls.variants;
  }

  /** Calcul "live" pour suivre les mutations du FormArray */
  availableSizes(): PrintSize[] {
    const used = this.variants.controls.map((g) => g.controls.size.value);
    return (['A3', 'A4', 'A5', 'A6'] as PrintSize[]).filter((s) => !used.includes(s));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initial']) this.loadProduct(this.initial);
  }

  private loadProduct(p: Product | null | undefined): void {
    this.form.reset();
    this.images.clear();
    this.variants.clear();
    if (!p) return;

    const hasVariants = !!p.variants && p.variants.length > 0;
    this.form.patchValue({
      title: p.title,
      categoryId: p.categoryId,
      technique: p.technique || '',
      description: p.description,
      tags: p.tags?.join(', ') || '',
      hasVariants,
      singleSize: 'custom',
      price: hasVariants ? null : p.price,
      originalPrice: hasVariants ? null : p.originalPrice,
      stock: hasVariants ? null : p.stock,
      isAvailable: p.isAvailable,
      isLimitedEdition: p.isLimitedEdition,
      editionNumber: p.editionNumber,
      totalEditions: p.totalEditions,
    });

    if (p.dimensions && !hasVariants) {
      this.form.controls.dimensions.patchValue({
        width: p.dimensions.width,
        height: p.dimensions.height,
        unit: p.dimensions.unit,
      });
    }

    (p.images || []).forEach((url) => this.images.push(this.fb.nonNullable.control(url)));
    if (p.variants) p.variants.forEach((v) => this.variants.push(this.createVariantGroup(v)));
    this.updateValidators();
  }

  private createVariantGroup(v?: ProductVariant): FormGroup<VariantFormControls> {
    return this.fb.group({
      id: this.fb.control<number | null>(v?.id ?? null),
      size: this.fb.nonNullable.control<PrintSize>(v?.size ?? 'A4'),
      price: this.fb.nonNullable.control(v?.price ?? 0, [Validators.required, Validators.min(0)]),
      originalPrice: this.fb.control<number | null>(v?.originalPrice ?? null, [Validators.min(0)]),
      stock: this.fb.nonNullable.control(v?.stock ?? 0, [Validators.required, Validators.min(0)]),
      isAvailable: this.fb.nonNullable.control(v?.isAvailable ?? true),
    });
  }

  onSingleSizeChange(): void {
    const size = this.form.controls.singleSize.value;
    if (size !== 'custom') {
      const dims = SIZE_DIMENSIONS[size];
      this.form.controls.dimensions.patchValue({
        width: dims.width,
        height: dims.height,
        unit: dims.unit,
      });
    }
  }

  updateValidators(): void {
    const hasVariants = this.form.controls.hasVariants.value;
    const isCustom = this.form.controls.singleSize.value === 'custom';

    // Prix/Stock requis uniquement si pas de variantes
    if (hasVariants) {
      this.form.controls.price.clearValidators();
      this.form.controls.stock.clearValidators();
    } else {
      this.form.controls.price.setValidators([Validators.required, Validators.min(0)]);
      this.form.controls.stock.setValidators([Validators.required, Validators.min(0)]);
    }
    this.form.controls.price.updateValueAndValidity();
    this.form.controls.stock.updateValueAndValidity();

    // Dimensions requises uniquement si format personnalisé sans variantes
    const widthCtrl = this.form.controls.dimensions.controls.width;
    const heightCtrl = this.form.controls.dimensions.controls.height;
    if (!hasVariants && isCustom) {
      widthCtrl.setValidators([Validators.required, Validators.min(0)]);
      heightCtrl.setValidators([Validators.required, Validators.min(0)]);
    } else {
      widthCtrl.setValidators([Validators.min(0)]);
      heightCtrl.setValidators([Validators.min(0)]);
    }
    widthCtrl.updateValueAndValidity();
    heightCtrl.updateValueAndValidity();
  }

  private priceBarreValidator(): ValidatorFn {
    return (form: AbstractControl) => {
      const fg = form as ProductFormGroup;
      const hasVariants = fg.controls.hasVariants.value;
      if (!hasVariants) {
        const current = fg.controls.price.value ?? null;
        const reduced = fg.controls.originalPrice.value ?? null;
        if (reduced !== null && current !== null && reduced >= current) {
          return { originalNotGreater: true };
        }
      }
      return null;
    };
  }

  hasVariantPriceError(index: number): boolean {
    const variant = this.variants.at(index);
    const current = variant.controls.price.value ?? null;
    const reduced = variant.controls.originalPrice.value ?? null;
    return !!(current !== null && reduced !== null && reduced >= current);
  }

  openAddVariantModal(): void {
    this.showAddVariantModal.set(true);
  }
  closeAddVariantModal(): void {
    this.showAddVariantModal.set(false);
  }

  addVariant(size: PrintSize): void {
    // Garde anti-duplication (sécurité supplémentaire)
    const already = this.variants.controls.some((g) => g.controls.size.value === size);
    if (already) {
      this.toast.info(`La taille ${size} est déjà ajoutée`);
      this.closeAddVariantModal();
      return;
    }

    this.variants.push(
      this.createVariantGroup({
        id: Date.now(),
        size,
        price: 0,
        stock: 0,
        isAvailable: true,
        dimensions: SIZE_DIMENSIONS[size],
      } as ProductVariant)
    );
    this.closeAddVariantModal();
    this.toast.success(`Taille ${size} ajoutée`);
  }

  removeVariant(index: number): void {
    const size = this.variants.at(index).controls.size.value;
    this.variants.removeAt(index);
    this.toast.info(`Taille ${size} supprimée`);
  }

  toggleVariantAvailability(index: number): void {
    const ctrl = this.variants.at(index).controls.isAvailable;
    ctrl.setValue(!ctrl.value);
  }

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }
  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files || []);
    await this.processFiles(files);
  }

  async onFileSelect(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    await this.processFiles(files);
    input.value = '';
  }

  private async processFiles(files: File[]): Promise<void> {
    const MAX_SIZE = 5 * 1024 * 1024;
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.toast.warning(`${file.name} ignoré (pas une image)`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        this.toast.warning(`${file.name} ignoré (> 5 Mo)`);
        continue;
      }
      try {
        const dataUrl = await this.readFileAsDataUrl(file);
        this.images.push(this.fb.nonNullable.control(dataUrl));
        this.images.markAsTouched();
      } catch {
        this.toast.error(`Erreur ${file.name}`);
      }
    }
    if (files.length > 0) this.toast.success(`${files.length} image(s) ajoutée(s)`);
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  addImageByUrl(): void {
    const url = prompt("URL de l'image (https://...)");
    if (!url?.trim()) return;
    if (!/^https?:\/\/.+/i.test(url.trim())) {
      this.toast.error('URL invalide');
      return;
    }
    this.images.push(this.fb.nonNullable.control(url.trim()));
    this.images.markAsTouched();
  }

  removeImage(index: number): void {
    this.images.removeAt(index);
    this.images.markAsTouched();
  }

  isInvalid(field: keyof ProductFormControls): boolean {
    const ctrl = this.form.get(field as string);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Veuillez corriger les erreurs');
      return;
    }

    this.submitting.set(true);
    try {
      const v = this.form.getRawValue();
      const hasVariants = v.hasVariants;

      const payload: Partial<Product> = {
        title: v.title,
        categoryId: v.categoryId ?? undefined,
        technique: v.technique,
        description: v.description ?? undefined,
        tags: v.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        // IMPORTANT : on n'envoie des dimensions que si on n'a PAS de variantes
        dimensions: !hasVariants
          ? {
              width: v.dimensions.width ?? 0,
              height: v.dimensions.height ?? 0,
              unit: v.dimensions.unit,
            }
          : undefined,
        images: v.images.filter((u) => !!u.trim()),
        imageUrl: v.images.find((u) => !!u.trim()) || '',
        isLimitedEdition: v.isLimitedEdition,
        editionNumber: v.isLimitedEdition ? v.editionNumber ?? undefined : undefined,
        totalEditions: v.isLimitedEdition ? v.totalEditions ?? undefined : undefined,
      };

      if (hasVariants) {
        payload.variants = v.variants.map((vt) => ({
          id: vt.id ?? Date.now() + Math.random(),
          size: vt.size,
          price: vt.price,
          originalPrice: vt.originalPrice ?? undefined, // prix réduit éventuel
          stock: vt.stock,
          isAvailable: vt.isAvailable,
          dimensions: SIZE_DIMENSIONS[vt.size],
        }));
        // Le service recalculera price/stock (min/somme) depuis les variantes.
        payload.price = 0;
        payload.stock = 0;
        payload.isAvailable = true;
        payload.originalPrice = undefined;
      } else {
        payload.price = v.price ?? 0; // prix actuel
        payload.originalPrice = v.originalPrice ?? undefined; // prix réduit (optionnel)
        payload.stock = v.stock ?? 0;
        payload.isAvailable = v.isAvailable;
      }

      this.save.emit(payload);
    } catch (error) {
      this.toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }
}
