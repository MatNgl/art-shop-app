// src/app/features/admin/components/products/product-form.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  inject,
  ViewChild,
  ElementRef,
  computed,
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
} from '@angular/forms';
import {
  Product,
  ProductCategory,
  Artist,
  Dimensions,
} from '../../../catalog/models/product.model';

type Unit = Dimensions['unit']; // 'cm' | 'inches'

interface ProductFormControls {
  title: FormControl<string>;
  artist: FormControl<string | null>;
  category: FormControl<ProductCategory | ''>;
  price: FormControl<number | null>;
  originalPrice: FormControl<number | null>;
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
  description: FormControl<string | null>;
}
type ProductFormGroup = FormGroup<ProductFormControls>;

/** >= 1 image requise */
const atLeastOneImage: ValidatorFn = (control) => {
  const arr = control as unknown as FormArray<FormControl<string>>;
  const ok = arr.controls.some((c) => !!c.value && c.value.trim().length > 0);
  return ok ? null : { imagesRequired: true };
};

/** originalPrice >= price si originalPrice défini */
function originalPriceGtePrice(
  priceCtrl: () => FormControl<number | null>,
  originalCtrl: () => FormControl<number | null>
): ValidatorFn {
  return () => {
    const p = priceCtrl().value;
    const o = originalCtrl().value;
    const pIsNullish = p === null || p === undefined;
    const oIsNullish = o === null || o === undefined;
    if (oIsNullish || pIsNullish) return null;
    return (o as number) >= (p as number) ? null : { originalLtPrice: true };
  };
}

/** Édition limitée : ne bloque que si les deux valeurs sont présentes mais incohérentes */
function limitedEditionValidator(
  isLimitedCtrl: () => FormControl<boolean>,
  numCtrl: () => FormControl<number | null>,
  totalCtrl: () => FormControl<number | null>
): ValidatorFn {
  return () => {
    if (!isLimitedCtrl().value) return null;
    const n = numCtrl().value;
    const t = totalCtrl().value;

    // Si l'une des deux valeurs manque, on ne bloque pas la soumission
    if (n === null || n === undefined || t === null || t === undefined) return null;

    if ((n as number) < 1 || (t as number) < 1 || (n as number) > (t as number)) {
      return { limitedRange: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6" novalidate>
      <!-- Ligne 1 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-2"
            >Nom du produit</label
          >
          <input
            id="title"
            type="text"
            formControlName="title"
            class="w-full px-3 py-2 border rounded-lg"
            [class.border-red-500]="isInvalid('title')"
          />
          <p *ngIf="isInvalid('title')" class="text-sm text-red-600 mt-1">
            Nom requis (3–120 caractères).
          </p>
        </div>

        <div>
          <label for="artist" class="block text-sm font-medium text-gray-700 mb-2">Artiste</label>
          <input
            id="artist"
            type="text"
            formControlName="artist"
            class="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-2"
            >Catégorie</label
          >
          <select
            id="category"
            formControlName="category"
            class="w-full px-3 py-2 border rounded-lg"
          >
            <option value="" disabled>Choisir...</option>
            <option *ngFor="let cat of categories" [value]="cat">
              {{ getCategoryLabel(cat) }}
            </option>
          </select>
          <p *ngIf="isInvalid('category')" class="text-sm text-red-600 mt-1">Catégorie requise.</p>
        </div>

        <div>
          <label for="price" class="block text-sm font-medium text-gray-700 mb-2">Prix (€)</label>
          <input
            id="price"
            type="number"
            step="0.01"
            formControlName="price"
            class="w-full px-3 py-2 border rounded-lg"
            [class.border-red-500]="isInvalid('price')"
          />
          <p *ngIf="isInvalid('price')" class="text-sm text-red-600 mt-1">Prix ≥ 0 requis.</p>
        </div>

        <div>
          <label for="originalPrice" class="block text-sm font-medium text-gray-700 mb-2"
            >Prix d'origine (€)</label
          >
          <input
            id="originalPrice"
            type="number"
            step="0.01"
            formControlName="originalPrice"
            class="w-full px-3 py-2 border rounded-lg"
            [class.border-red-500]="form.hasError('originalLtPrice')"
          />
          <p *ngIf="form.hasError('originalLtPrice')" class="text-sm text-red-600 mt-1">
            Le prix d'origine doit être ≥ au prix.
          </p>
        </div>

        <div>
          <label for="stock" class="block text-sm font-medium text-gray-700 mb-2">Stock</label>
          <input
            id="stock"
            type="number"
            formControlName="stock"
            class="w-full px-3 py-2 border rounded-lg"
            [class.border-red-500]="isInvalid('stock')"
          />
          <p *ngIf="isInvalid('stock')" class="text-sm text-red-600 mt-1">Stock ≥ 0 requis.</p>
        </div>

        <div class="flex items-center gap-2">
          <input id="isAvailable" type="checkbox" formControlName="isAvailable" class="h-4 w-4" />
          <label for="isAvailable" class="text-sm text-gray-700">Disponible</label>
        </div>

        <div class="flex items-center gap-2">
          <input
            id="isLimitedEdition"
            type="checkbox"
            formControlName="isLimitedEdition"
            class="h-4 w-4"
          />
          <label for="isLimitedEdition" class="text-sm text-gray-700">Édition limitée</label>
        </div>
      </div>

      <!-- Spécifications -->
      <div class="bg-white/50 rounded-lg p-4 border">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">Spécifications</h3>
        <div [formGroup]="form.controls.dimensions" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="width" class="block text-sm font-medium text-gray-700 mb-2">Largeur</label>
            <input
              id="width"
              type="number"
              formControlName="width"
              min="0"
              class="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label for="height" class="block text-sm font-medium text-gray-700 mb-2">Hauteur</label>
            <input
              id="height"
              type="number"
              formControlName="height"
              min="0"
              class="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label for="unit" class="block text-sm font-medium text-gray-700 mb-2">Unité</label>
            <select id="unit" formControlName="unit" class="w-full px-3 py-2 border rounded-lg">
              <option value="cm">cm</option>
              <option value="inches">inches</option>
            </select>
          </div>
        </div>

        <!-- Champs d'édition limitée (affichés, mais pas bloquants s'ils sont vides) -->
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
          *ngIf="form.controls.isLimitedEdition.value"
        >
          <div>
            <label for="editionNumber" class="block text-sm font-medium text-gray-700 mb-2"
              >Numéro d'édition</label
            >
            <input
              id="editionNumber"
              type="number"
              formControlName="editionNumber"
              class="w-full px-3 py-2 border rounded-lg"
              [class.border-red-500]="form.hasError('limitedRange')"
            />
          </div>
          <div>
            <label for="totalEditions" class="block text-sm font-medium text-gray-700 mb-2"
              >Nombre total d'éditions</label
            >
            <input
              id="totalEditions"
              type="number"
              formControlName="totalEditions"
              class="w-full px-3 py-2 border rounded-lg"
              [class.border-red-500]="form.hasError('limitedRange')"
            />
          </div>
          <p *ngIf="form.hasError('limitedRange')" class="text-sm text-red-600 md:col-span-2">
            Valeurs invalides (attendu : 1 ≤ numéro ≤ total).
          </p>
        </div>

        <p class="text-xs text-gray-500 mt-2">
          Aperçu : <strong>{{ formatPreview() }}</strong>
        </p>
      </div>

      <!-- Images -->
      <div>
        <span class="block text-sm font-medium text-gray-700 mb-2">Images</span>

        <!-- Dropzone -->
        <div
          class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition p-6 text-center cursor-pointer"
          (click)="triggerFilePicker()"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event)"
          role="button"
          aria-label="Importer des images"
          tabindex="0"
        >
          <div class="flex flex-col items-center gap-2">
            <i class="fa-regular fa-images text-2xl text-gray-500"></i>
            <div class="text-sm text-gray-600">
              Glissez-déposez des images ici
              <span class="text-gray-400">ou</span>
              <span class="text-blue-600 underline">sélectionnez-les</span>
            </div>
            <div class="text-xs text-gray-400">PNG, JPG — jusqu'à 8 Mo par image</div>
          </div>
          <input
            #fileInput
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            (change)="onFilesSelected($event)"
          />
        </div>

        <!-- Actions rapides -->
        <div class="flex items-center gap-3 mt-3">
          <button
            type="button"
            (click)="triggerFilePicker()"
            class="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Depuis l'ordinateur
          </button>
          <button
            type="button"
            (click)="addImageByUrl()"
            class="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            + URL
          </button>
        </div>

        <!-- Grille des vignettes -->
        <div
          *ngIf="images.length > 0"
          class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4"
        >
          <div *ngFor="let ctrl of images.controls; let i = index" class="relative group">
            <img
              [src]="ctrl.value"
              [alt]="'image ' + (i + 1)"
              class="w-24 h-24 md:w-28 md:h-28 object-cover rounded-lg border shadow-sm"
            />
            <button
              type="button"
              (click)="removeImage(i)"
              class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/95 group-hover:bg-white text-red-600 border border-red-200 shadow flex items-center justify-center"
              title="Supprimer l'image"
              aria-label="Supprimer l'image"
            >
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        <p
          *ngIf="images.invalid && (images.dirty || images.touched)"
          class="text-sm text-red-600 mt-2"
        >
          Au moins une image est requise.
        </p>
      </div>

      <!-- Description -->
      <div class="mt-6">
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2"
          >Description</label
        >
        <textarea
          id="description"
          rows="4"
          formControlName="description"
          class="w-full px-3 py-2 border rounded-lg"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          (click)="formCancel.emit()"
          class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          [disabled]="form.invalid || submitting"
          class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ submitLabel }}
        </button>
      </div>
    </form>
  `,
})
export class ProductFormComponent implements OnChanges {
  private fb = inject(FormBuilder);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  @Input() initial?: Product | null;
  @Input({ required: true }) categories: ProductCategory[] = [];
  @Input() submitLabel = 'Enregistrer';

  @Output() save = new EventEmitter<Partial<Product>>();
  @Output() formCancel = new EventEmitter<void>();

  submitting = false;

  form: ProductFormGroup = this.fb.group<ProductFormControls>(
    {
      title: this.fb.nonNullable.control<string>('', {
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
      }),
      artist: this.fb.control<string | null>(null),
      category: this.fb.nonNullable.control<ProductCategory | ''>('', {
        validators: [Validators.required],
      }),
      price: this.fb.control<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      originalPrice: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
      stock: this.fb.control<number | null>(0, {
        validators: [Validators.required, Validators.min(0)],
      }),
      isAvailable: this.fb.nonNullable.control<boolean>(true),
      isLimitedEdition: this.fb.nonNullable.control<boolean>(false),
      editionNumber: this.fb.control<number | null>(null),
      totalEditions: this.fb.control<number | null>(null),
      dimensions: this.fb.group({
        width: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
        height: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
        unit: this.fb.nonNullable.control<Unit>('cm'),
      }),
      images: this.fb.array<FormControl<string>>([], { validators: [atLeastOneImage] }),
      description: this.fb.control<string | null>(null),
    },
    {
      validators: [
        originalPriceGtePrice(
          () => this.form?.controls.price ?? this.fb.control<number | null>(null),
          () => this.form?.controls.originalPrice ?? this.fb.control<number | null>(null)
        ),
        limitedEditionValidator(
          () => this.form?.controls.isLimitedEdition ?? this.fb.nonNullable.control<boolean>(false),
          () => this.form?.controls.editionNumber ?? this.fb.control<number | null>(null),
          () => this.form?.controls.totalEditions ?? this.fb.control<number | null>(null)
        ),
      ],
    }
  );

  // Aperçu "Format"
  formatPreview = computed(() => {
    const w = this.form.controls.dimensions.controls.width.value;
    const h = this.form.controls.dimensions.controls.height.value;
    const u = this.form.controls.dimensions.controls.unit.value;
    if (!w || !h) return '—';
    return `${w} × ${h} ${u}`;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initial']) {
      const v = this.initial ?? null;
      this.form.reset();
      this.images.clear();

      if (v) {
        this.form.patchValue({
          title: v.title ?? '',
          artist: typeof v.artist === 'string' ? v.artist : v.artist?.name ?? null,
          category: v.category ?? '',
          price: v.price ?? null,
          originalPrice: v.originalPrice ?? null,
          stock: v.stock ?? 0,
          isAvailable: v.isAvailable ?? true,
          isLimitedEdition: v.isLimitedEdition ?? false,
          editionNumber: v.editionNumber ?? null,
          totalEditions: v.totalEditions ?? null,
          description: v.description ?? null,
        });

        const dims: Dimensions | undefined = v.dimensions;
        if (dims) {
          this.form.controls.dimensions.patchValue({
            width: dims.width ?? null,
            height: dims.height ?? null,
            unit: dims.unit ?? 'cm',
          });
        }

        (v.images ?? []).forEach((url) =>
          this.images.push(this.fb.nonNullable.control<string>(url ?? ''))
        );
      }
    }
  }

  // --- Images
  get images(): FormArray<FormControl<string>> {
    return this.form.get('images') as FormArray<FormControl<string>>;
  }

  triggerFilePicker(): void {
    this.fileInputRef?.nativeElement.click();
  }

  addImageByUrl(): void {
    const url = prompt('URL de l’image (https:// ou data:image/...)') ?? '';
    const clean = url.trim();
    if (!clean) return;
    const ok = /^https?:\/\/.+/i.test(clean) || /^data:image\//i.test(clean);
    if (!ok) {
      console.warn('URL invalide');
      return;
    }
    this.images.push(this.fb.nonNullable.control<string>(clean));
    this.images.markAsTouched();
  }

  async onFilesSelected(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    await this.ingestFiles(Array.from(files));
    input.value = '';
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  async onDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;
    await this.ingestFiles(Array.from(dt.files));
  }

  private async ingestFiles(files: File[]): Promise<void> {
    const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_SIZE) {
        console.warn(`Fichier ignoré (trop volumineux) : ${file.name}`);
        continue;
      }
      const dataUrl = await this.readFileAsDataUrl(file);
      this.images.push(this.fb.nonNullable.control<string>(dataUrl));
    }
    this.images.markAsTouched();
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  // --- Util
  isInvalid<K extends keyof ProductFormControls>(ctrl: K): boolean {
    const c = this.form.get(ctrl as string);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
  getCategoryLabel(cat: ProductCategory): string {
    const map: Record<ProductCategory, string> = {
      [ProductCategory.DRAWING]: 'Dessin',
      [ProductCategory.PAINTING]: 'Peinture',
      [ProductCategory.DIGITAL_ART]: 'Art numérique',
      [ProductCategory.PHOTOGRAPHY]: 'Photographie',
      [ProductCategory.SCULPTURE]: 'Sculpture',
      [ProductCategory.MIXED_MEDIA]: 'Mixed media',
    };
    return map[cat];
  }

  removeImage(i: number): void {
    if (i < 0 || i >= this.images.length) return;
    this.images.removeAt(i);
    this.images.markAsTouched();
    this.form.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.images.markAllAsTouched();
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;

    const v = this.form.getRawValue();
    const artistName = v.artist?.trim();
    const artistPayload: Artist | undefined = artistName
      ? ({ id: 0, name: artistName } as Artist)
      : undefined;

    const imgs = (v.images ?? []).filter((u) => !!u && u.trim().length > 0);

    const dims: Dimensions = {
      width: v.dimensions.width ?? 0,
      height: v.dimensions.height ?? 0,
      unit: v.dimensions.unit,
    };

    // Si édition limitée cochée mais sans valeurs → defaults 1/1
    const editionNumber = v.isLimitedEdition ? v.editionNumber ?? 1 : undefined;
    const totalEditions = v.isLimitedEdition ? v.totalEditions ?? editionNumber ?? 1 : undefined;

    const payload: Partial<Product> = {
      title: v.title,
      artist: artistPayload,
      category: v.category || undefined,
      price: v.price ?? undefined,
      originalPrice: v.originalPrice ?? undefined,
      stock: v.stock ?? undefined,
      isAvailable: v.isAvailable,
      isLimitedEdition: v.isLimitedEdition,
      editionNumber,
      totalEditions,
      images: imgs,
      imageUrl: imgs.length ? imgs[0] : undefined,
      dimensions: dims,
      description: v.description ?? undefined,
    };

    this.save.emit(payload);
    this.submitting = false;
  }
}
