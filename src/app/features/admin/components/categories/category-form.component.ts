import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  inject,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Category, CategoryService } from '../../../catalog/services/category';
import { Product } from '../../../catalog/models/product.model';
import { ProductService } from '../../../catalog/services/product';
import { ToastService } from '../../../../shared/services/toast.service';


interface CategoryFormControls {
  name: FormControl<string>;
  slug: FormControl<string>;
  description: FormControl<string | null>;
  color: FormControl<string | null>;
  icon: FormControl<string | null>;
  image: FormControl<string | null>;
  isActive: FormControl<boolean>;
  productIds: FormArray<FormControl<number>>;
}
type CategoryFormGroup = FormGroup<CategoryFormControls>;

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6" novalidate>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span class="block text-sm font-medium mb-1">Nom</span>
          <input
            type="text"
            class="w-full px-3 py-2 border rounded-lg"
            formControlName="name"
            (input)="onNameChange()"
          />
          <p *ngIf="isInvalid('name')" class="text-sm text-red-600 mt-1">Nom requis (2–60).</p>
        </div>

        <div>
          <span class="block text-sm font-medium mb-1">Slug</span>
          <input type="text" class="w-full px-3 py-2 border rounded-lg" formControlName="slug" />
          <p class="text-xs text-gray-500 mt-1">Identifiant URL (auto-généré, modifiable).</p>
        </div>

        <div class="md:col-span-2">
          <span class="block text-sm font-medium mb-1">Description</span>
          <textarea
            rows="3"
            class="w-full px-3 py-2 border rounded-lg"
            formControlName="description"
          ></textarea>
        </div>

        <div>
          <span class="block text-sm font-medium mb-1">Couleur (hex)</span>
          <input
            type="text"
            placeholder="#3b82f6"
            class="w-full px-3 py-2 border rounded-lg"
            formControlName="color"
          />
        </div>

        <div>
          <span class="block text-sm font-medium mb-1">Icône (FontAwesome)</span>
          <input
            type="text"
            placeholder="fa-tags"
            class="w-full px-3 py-2 border rounded-lg"
            formControlName="icon"
          />
        </div>

        <div class="md:col-span-2">
          <span class="block text-sm font-medium mb-1">Image (URL)</span>
          <input type="url" class="w-full px-3 py-2 border rounded-lg" formControlName="image" />
        </div>

        <div class="flex items-center gap-2 md:col-span-2">
          <input id="isActive" type="checkbox" formControlName="isActive" class="h-4 w-4" />
          <span for="isActive" class="text-sm">Active</span>
        </div>
      </div>

      <!-- Produits -->
      <div class="bg-white/50 rounded-lg p-4 border">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-800">Produits dans cette catégorie</h3>
          <input
            type="text"
            [(ngModel)]="productFilter"
            placeholder="Rechercher un produit..."
            class="px-3 py-1.5 border rounded-md text-sm"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-auto pr-1">
          <span
            *ngFor="let p of filteredProducts()"
            class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50"
          >
            <input type="checkbox" [checked]="hasProduct(p.id)" (change)="toggleProduct(p.id)" />
            <span class="text-sm text-gray-700 truncate">{{ p.title }}</span>
            <span class="ml-auto text-xs text-gray-500">#{{ p.id }}</span>
          </span>
        </div>

        <p class="text-xs text-gray-500 mt-2">
          Sélectionnés : <strong>{{ form.controls.productIds.length }}</strong>
        </p>
      </div>

      <!-- Aperçu -->
      <div class="text-xs text-gray-600">
        Slug final :
        <code class="px-1 py-0.5 rounded bg-gray-100">{{ form.controls.slug.value || '—' }}</code>
        <span *ngIf="form.controls.color.value" class="inline-flex items-center gap-2 ml-3">
          Couleur :
          <span
            class="inline-block w-4 h-4 rounded"
            [style.background]="form.controls.color.value"
          ></span>
        </span>
        <span *ngIf="form.controls.icon.value" class="inline-flex items-center gap-2 ml-3">
          Icône : <i class="fa-solid" [ngClass]="form.controls.icon.value"></i>
        </span>
      </div>

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
export class CategoryFormComponent implements OnChanges, OnInit {
  private fb = inject(FormBuilder);
  private catSvc = inject(CategoryService);
  private productSvc = inject(ProductService);
  private readonly toast = inject(ToastService);

  @Input() initial?: Category | null;
  @Input() submitLabel = 'Enregistrer';

  @Output() save = new EventEmitter<Partial<Category>>();
  @Output() formCancel = new EventEmitter<void>(); // ✅ renommé

  submitting = false;
  allProducts: Product[] = [];
  productFilter = '';

  form: CategoryFormGroup = this.fb.group<CategoryFormControls>({
    name: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
    }),
    slug: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    }),
    description: this.fb.control<string | null>(null),
    color: this.fb.control<string | null>(null),
    icon: this.fb.control<string | null>(null),
    image: this.fb.control<string | null>(null),
    isActive: this.fb.nonNullable.control(true),
    productIds: this.fb.array<FormControl<number>>([]),
  });

  async ngOnInit() {
    this.allProducts = await this.productSvc.getAllProducts();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['initial']) {
      this.form.reset();
      this.productIds.clear();

      const v = this.initial ?? null;
      if (v) {
        this.form.patchValue({
          name: v.name ?? '',
          slug: v.slug ?? '',
          description: v.description ?? null,
          color: v.color ?? null,
          icon: v.icon ?? null,
          image: v.image ?? null,
          isActive: v.isActive ?? true,
        });
        (v.productIds ?? []).forEach((pid) =>
          this.productIds.push(this.fb.nonNullable.control(pid))
        );
      } else {
        this.form.controls.slug.setValue('');
      }
    }
  }

  get productIds(): FormArray<FormControl<number>> {
    return this.form.get('productIds') as FormArray<FormControl<number>>;
  }

  isInvalid(name: keyof CategoryFormControls): boolean {
    const c = this.form.get(name as string);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onNameChange() {
    const name = this.form.controls.name.value ?? '';
    if (!this.initial) {
      const slug = this.catSvc.slugify(name);
      this.form.controls.slug.setValue(slug);
    }
  }

  hasProduct(id: number): boolean {
    return this.productIds.controls.some((c) => c.value === id);
  }
  toggleProduct(id: number) {
    const idx = this.productIds.controls.findIndex((c) => c.value === id);
    if (idx >= 0) this.productIds.removeAt(idx);
    else this.productIds.push(this.fb.nonNullable.control(id));
  }

  filteredProducts = computed(() => {
    const q = this.productFilter.trim().toLowerCase();
    if (!q) return this.allProducts;
    return this.allProducts.filter(
      (p) => p.title.toLowerCase().includes(q) || String(p.id).includes(q)
    );
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.info('Veuillez corriger les erreurs du formulaire.');
      return;
    }
    this.submitting = true;

    const v = this.form.getRawValue();
    const payload: Partial<Category> = {
      name: v.name,
      slug: v.slug,
      description: v.description ?? undefined,
      color: v.color ?? undefined,
      icon: v.icon ?? undefined,
      image: v.image ?? undefined,
      isActive: v.isActive,
      productIds: v.productIds.map((c) => c as unknown as number),
    };

    this.save.emit(payload);
    this.toast.success('Catégorie enregistrée avec succès.');
    this.submitting = false;
  }
}
