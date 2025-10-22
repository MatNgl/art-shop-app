import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { SubCategory } from '../../../catalog/models/category.model';
import { CategoryService } from '../../../catalog/services/category';
import { ToastService } from '../../../../shared/services/toast.service';

interface SubCategoryFormControls {
  name: FormControl<string>;
  slug: FormControl<string>;
  description: FormControl<string | null>;
  isActive: FormControl<boolean>;
}

@Component({
  selector: 'app-subcategory-row',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (mode() === 'view') {
    <!-- Mode View -->
    <tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-8 bg-blue-400 rounded-full"></div>
          <div>
            <div class="text-sm font-medium text-gray-900">{{ subCategory.name }}</div>
            <div class="text-xs text-gray-500">{{ subCategory.slug }}</div>
          </div>
        </div>
      </td>

      <td class="px-6 py-4 text-sm text-gray-600">
        {{ subCategory.description || '—' }}
      </td>

      <td class="px-6 py-4">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          [ngClass]="
            subCategory.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          "
        >
          {{ subCategory.isActive ? 'Active' : 'Inactive' }}
        </span>
      </td>

      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-900">{{ productCount }}</span>
          <span class="text-xs text-gray-500">produit(s)</span>
        </div>
      </td>

      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <button
            (click)="enterEditMode()"
            class="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            title="Éditer"
            type="button"
          >
            <i class="fa-solid fa-pen text-sm"></i>
          </button>

          <button
            (click)="toggleActiveStatus()"
            class="hover:bg-orange-50 px-2 py-1 rounded transition-colors"
            [class.text-orange-600]="subCategory.isActive"
            [class.text-green-600]="!subCategory.isActive"
            [title]="subCategory.isActive ? 'Désactiver' : 'Activer'"
            type="button"
          >
            <i
              class="fa-solid text-sm"
              [ngClass]="subCategory.isActive ? 'fa-pause' : 'fa-play'"
            ></i>
          </button>

          <button
            (click)="openProductsPanel()"
            class="text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
            title="Gérer les produits"
            type="button"
          >
            <i class="fa-solid fa-box text-sm"></i>
          </button>

          <button
            (click)="confirmDelete()"
            class="text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            title="Supprimer"
            type="button"
          >
            <i class="fa-solid fa-trash text-sm"></i>
          </button>
        </div>
      </td>
    </tr>
    } @else {
    <!-- Mode Edit -->
    <tr class="bg-blue-50">
      <td colspan="5" class="px-6 py-4">
        <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span class="block text-xs font-medium text-gray-700 mb-1">Nom *</span>
              <input
                type="text"
                formControlName="name"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                [class.border-red-500]="
                  editForm.controls.name.invalid && editForm.controls.name.touched
                "
              />
              @if (editForm.controls.name.invalid && editForm.controls.name.touched) {
              <p class="text-xs text-red-600 mt-1">Nom requis (2-60 caractères)</p>
              }
            </div>

            <div>
              <span class="block text-xs font-medium text-gray-700 mb-1">Slug *</span>
              <input
                type="text"
                formControlName="slug"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                [class.border-red-500]="
                  editForm.controls.slug.invalid && editForm.controls.slug.touched
                "
              />
              @if (editForm.controls.slug.invalid && editForm.controls.slug.touched) {
              <p class="text-xs text-red-600 mt-1">Slug requis (2-80 caractères)</p>
              }
            </div>

            <div>
              <span class="block text-xs font-medium text-gray-700 mb-1">Description</span>
              <input
                type="text"
                formControlName="description"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span class="flex items-center gap-2">
              <input type="checkbox" formControlName="isActive" class="h-4 w-4" />
              <span class="text-sm text-gray-700">Active</span>
            </span>
          </div>

          <div class="flex items-center gap-3 pt-2 border-t">
            <button
              type="submit"
              [disabled]="editForm.invalid || saving()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              @if (saving()) {
              <i class="fa-solid fa-spinner fa-spin"></i>
              } @else {
              <i class="fa-solid fa-check"></i>
              } Enregistrer
            </button>

            <button
              type="button"
              (click)="cancelEdit()"
              [disabled]="saving()"
              class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm"
            >
              Annuler
            </button>
          </div>
        </form>
      </td>
    </tr>
    }
  `,
})
export class SubCategoryRowComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  @Input({ required: true }) categoryId!: number;
  @Input({ required: true }) subCategory!: SubCategory;
  @Input() productCount = 0;

  @Output() updated = new EventEmitter<SubCategory>();
  @Output() removed = new EventEmitter<number>();
  @Output() toggledActive = new EventEmitter<{ id: number; isActive: boolean }>();
  @Output() openProductsAssoc = new EventEmitter<number>();

  mode = signal<'view' | 'edit'>('view');
  saving = signal(false);

  editForm: FormGroup<SubCategoryFormControls> = this.fb.group({
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

  ngOnInit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editForm.patchValue({
      name: this.subCategory.name,
      slug: this.subCategory.slug,
      description: this.subCategory.description ?? null,
      isActive: this.subCategory.isActive,
    });
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
  }

  enterEditMode(): void {
    this.mode.set('edit');
    this.resetForm();
  }

  cancelEdit(): void {
    this.mode.set('view');
    this.resetForm();
  }

  async saveEdit(): Promise<void> {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.toast.warning('Veuillez corriger les erreurs du formulaire.');
      return;
    }

    this.saving.set(true);

    try {
      const formValue = this.editForm.getRawValue();
      const updated = await this.categoryService.updateSubCategory(
        this.categoryId,
        this.subCategory.id,
        {
          name: formValue.name,
          slug: formValue.slug,
          description: formValue.description ?? undefined,
          isActive: formValue.isActive,
        }
      );

      this.updated.emit(updated);
      this.mode.set('view');
      this.toast.success('Sous-catégorie mise à jour avec succès');
    } catch (error) {
      console.error(error);
      this.toast.error('Échec de la mise à jour');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActiveStatus(): Promise<void> {
    const newStatus = !this.subCategory.isActive;

    try {
      await this.categoryService.updateSubCategory(this.categoryId, this.subCategory.id, {
        isActive: newStatus,
      });

      this.toggledActive.emit({ id: this.subCategory.id, isActive: newStatus });
      this.toast.success(newStatus ? 'Sous-catégorie activée' : 'Sous-catégorie désactivée');
    } catch (error) {
      console.error(error);
      this.toast.error('Échec du changement de statut');
    }
  }

  openProductsPanel(): void {
    this.openProductsAssoc.emit(this.subCategory.id);
  }

  confirmDelete(): void {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la sous-catégorie "${this.subCategory.name}" ? Cette action est irréversible.`
      )
    ) {
      this.removed.emit(this.subCategory.id);
    }
  }
}
