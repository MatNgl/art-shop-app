// src/app/features/admin/components/products/product-form.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  ProductCategoryAssociation,
} from '../../../catalog/models/product.model';
import { Category } from '../../../catalog/models/category.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { FormatService } from '../../../catalog/services/format.service';
import { PrintFormat } from '../../../catalog/models/print-format.model';
import { SizeService } from '../../../../shared/services/size.service';
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
  originalPrice: FormControl<number | null>;
  reducedPrice: FormControl<number | null>;
  stock: FormControl<number | null>;
  isAvailable: FormControl<boolean>;
}

interface ProductFormControls {
  title: FormControl<string>;
  /** legacy / compat */
  categoryId: FormControl<number | null>;
  /** legacy / compat */
  subCategoryIds: FormControl<number[]>;
  technique: FormControl<string>;
  description: FormControl<string | null>;
  tags: FormControl<string>;

  hasVariants: FormControl<boolean>;
  singleSize: FormControl<PrintSize | 'custom'>;

  originalPrice: FormControl<number | null>;
  reducedPrice: FormControl<number | null>;
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SizePipe],
  styleUrls: ['./product-form.component.scss'],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
      class="pf-form space-y-6 mx-auto max-w-7xl px-4"
      novalidate
    >
      <!-- === BARRE DE PROGRESSION STICKY === -->
      <div
        class="pf-progress-sticky bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 shadow-sm rounded-2xl"
        role="region"
        aria-label="Préparation du produit"
      >
        <div class="px-4 py-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">
              <i class="fa-solid fa-gauge-high text-blue-600 mr-1"></i>
              Préparation du produit
            </span>
            <div class="flex items-center gap-3">
              <span
                class="text-sm font-semibold"
                [class.text-green-600]="readyToPost()"
                [class.text-blue-600]="!readyToPost()"
              >
                {{ progress() }}%
              </span>

              <!-- Toggle détails -->
              <button
                type="button"
                (click)="detailsOpen.set(!detailsOpen())"
                class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                [attr.aria-expanded]="detailsOpen()"
                aria-controls="pf-progress-details"
              >
                <i
                  class="fa-solid"
                  [class.fa-chevron-down]="!detailsOpen()"
                  [class.fa-chevron-up]="detailsOpen()"
                ></i>
                Détails
              </button>
            </div>
          </div>

          <div
            class="h-3 bg-gray-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-valuenow]="progress()"
          >
            <div
              class="h-full transition-all"
              [class.bg-green-500]="readyToPost()"
              [class.bg-blue-500]="!readyToPost()"
              [style.width.%]="progress()"
            ></div>
          </div>

          <div class="mt-2 flex items-start justify-between">
            <p
              class="text-xs"
              [class.text-green-700]="readyToPost()"
              [class.text-gray-500]="!readyToPost()"
            >
              @if (readyToPost()) { Prêt à être posté 🎉 } @else { Complétez les champs requis pour
              atteindre 100%. }
            </p>

            <!-- Compteur global -->
            <span class="text-xs text-gray-600 font-medium">
              {{ checklistDoneCount() }}/{{ checklistTotalCount() }}
            </span>
          </div>

          <!-- Détails repliables -->
          @if (detailsOpen()) {
          <div id="pf-progress-details" class="mt-3 border-t pt-3">
            <ul class="grid grid-cols-2 md:grid-cols-4 gap-2">
              @for (item of checklist(); track item.key) {
              <li
                class="flex items-center gap-2 rounded-lg px-2.5 py-2 border"
                [class.border-green-200]="item.done"
                [class.bg-green-50]="item.done"
                [class.border-gray-200]="!item.done"
                [class.bg-gray-50]="!item.done"
              >
                <i
                  class="fa-solid text-xs"
                  [class.fa-check]="item.done"
                  [class.fa-xmark]="!item.done"
                  [class.text-green-600]="item.done"
                  [class.text-gray-500]="!item.done"
                ></i>
                <span class="text-xs text-gray-800">
                  {{ item.label }}
                  @if (item.optional) {
                  <span class="text-[10px] text-gray-500">(optionnel)</span>
                  }
                </span>
              </li>
              }
            </ul>
          </div>
          }
        </div>
      </div>

      <!-- Informations générales -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-info-circle text-xl text-white"></i>
            </div>
            <h2 class="text-lg font-bold text-white">Informations générales</h2>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-heading text-purple-500"></i>
                Titre du produit *
              </span>
              <input
                type="text"
                formControlName="title"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                [class.border-red-500]="isInvalid('title')"
                placeholder="Ex: Abstraction Colorée"
              />
              @if (isInvalid('title')) {
              <p class="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i>
                Titre requis (3-120 caractères)
              </p>
              }
            </div>

            <!-- Multi-catégorie / sous-catégories -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <i class="fa-solid fa-layer-group text-purple-500"></i>
                  Catégories & Sous-catégories *
                </span>
                <button
                  type="button"
                  (click)="openCategoryModal()"
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <i class="fa-solid fa-plus"></i>
                  Ajouter
                </button>
              </div>

              @if (categoryAssociations().length === 0) {
              <div
                class="p-4 bg-gray-50 rounded-xl border-2 border-dashed transition-all"
                [class.border-gray-300]="!associationsTouched()"
                [class.border-red-500]="associationsTouched()"
              >
                <i class="fa-solid fa-info-circle mr-2"></i>
                <span
                  [class.text-gray-500]="!associationsTouched()"
                  [class.text-red-600]="associationsTouched()"
                >
                  Aucune catégorie sélectionnée. Cliquez sur "Ajouter" pour commencer.
                </span>
              </div>
              @if (associationsTouched()) {
              <p class="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i>
                Au moins une catégorie avec sous-catégorie si la catégorie en possède.
              </p>
              } } @else {
              <div class="space-y-2">
                @for (assoc of categoryAssociations(); track assoc.categoryId) {
                <div
                  class="p-3 rounded-xl border-2"
                  [class.bg-green-50]="isAssociationValid(assoc)"
                  [class.border-green-200]="isAssociationValid(assoc)"
                  [class.bg-red-50]="!isAssociationValid(assoc)"
                  [class.border-red-200]="!isAssociationValid(assoc)"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-folder text-purple-600"></i>
                        <span class="font-semibold text-gray-800">{{
                          getCategoryName(assoc.categoryId)
                        }}</span>
                        @if (!isAssociationValid(assoc)) {
                        <span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Sous-catégorie requise
                        </span>
                        }
                      </div>
                      @if (assoc.subCategoryIds && assoc.subCategoryIds.length > 0) {
                      <div class="flex flex-wrap gap-1.5 ml-6">
                        @for (subId of assoc.subCategoryIds; track subId) {
                        <span
                          class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs font-medium text-purple-700 border border-purple-200"
                        >
                          <i class="fa-solid fa-tag text-xs"></i>
                          {{ getSubCategoryName(subId) }}
                        </span>
                        }
                      </div>
                      }
                    </div>
                    <button
                      type="button"
                      (click)="removeCategoryAssociation(assoc.categoryId)"
                      class="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Retirer"
                    >
                      <i class="fa-solid fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>
                }
              </div>
              }
            </div>

            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-paintbrush text-purple-500"></i>
                Technique
              </span>
              <input
                type="text"
                formControlName="technique"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder="Ex: Huile sur toile, Acrylique..."
              />
            </div>

            <div class="md:col-span-2">
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-align-left text-purple-500"></i>
                Description
              </span>
              <textarea
                formControlName="description"
                rows="3"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder="(Optionnel)"
              ></textarea>
            </div>

            <div class="md:col-span-2">
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-tags text-purple-500"></i>
                Tags (séparés par des virgules)
              </span>
              <input
                type="text"
                formControlName="tags"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder="Ex: paysage, moderne, urbain"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Toggle variantes -->
      <button
        type="button"
        class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 cursor-pointer group w-full text-left"
        (click)="toggleHasVariants()"
      >
        <div class="flex items-center gap-4">
          <div class="relative pointer-events-none">
            <input
              type="checkbox"
              formControlName="hasVariants"
              class="peer h-6 w-6 appearance-none rounded-lg border-2 border-blue-300 checked:bg-blue-500 checked:border-blue-500 transition-all"
            />
            <i
              class="fa-solid fa-check absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100"
            ></i>
          </div>
          <div class="flex-1">
            <div
              class="font-bold text-gray-900 group-hover:text-blue-700 transition-colors flex items-center gap-2"
            >
              <i class="fa-solid fa-layer-group text-blue-500"></i>
              Produit avec variantes de tailles (A3/A4/A5/A6)
            </div>
            <div class="text-sm text-gray-600 mt-1">
              <i class="fa-solid fa-info-circle mr-1"></i>
              Cochez pour proposer plusieurs formats d'impression avec prix et stocks différents
            </div>
          </div>
        </div>
      </button>

      @if (!form.controls.hasVariants.value) {
      <!-- Format unique -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-ruler-combined text-xl text-white"></i>
            </div>
            <h2 class="text-lg font-bold text-white">Format du produit</h2>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <!-- >>> NOUVEAU : sélection d'un format personnalisé depuis la bibliothèque -->
          <div class="mb-4">
            <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i class="fa-solid fa-ruler text-purple-500"></i>
              Format personnalisé (bibliothèque)
            </span>

            <div class="flex gap-3">
              <select
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                [ngModel]="selectedCustomFormatId()"
                (ngModelChange)="onSelectCustomFormat($event)"
              >
                <option [ngValue]="null">Aucun / choisir un format…</option>
                @for (f of customFormats; track f.id) {
                <option [ngValue]="f.id">
                  {{ f.name }} — {{ f.width }} × {{ f.height }} {{ f.unit }}
                </option>
                }
              </select>

              <a
                routerLink="/admin/formats/new"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50"
                title="Créer un nouveau format"
              >
                <i class="fa-solid fa-plus"></i>
                Nouveau
              </a>
            </div>

            <p class="text-xs text-gray-500 mt-1">
              Astuce : choisissez un format dans votre bibliothèque pour remplir automatiquement les
              dimensions.
            </p>
          </div>
          <!-- <<< FIN NOUVEAU -->

          <div>
            <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i class="fa-solid fa-expand text-teal-500"></i>
              Taille du produit
            </span>
            <select
              formControlName="singleSize"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              (change)="onSingleSizeChange(); updateValidators()"
            >
              <option value="custom">Format personnalisé</option>
              @for (size of allSizes(); track size.value) {
              <option [value]="size.value">{{ size.label }}</option>
              }
            </select>
          </div>

          @if (form.controls.singleSize.value === 'custom') {
          <div
            [formGroup]="form.controls.dimensions"
            class="grid grid-cols-3 gap-4 p-4 bg-teal-50 rounded-xl border-2 border-teal-200"
          >
            <div>
              <span class="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-arrows-left-right text-teal-500"></i>
                Largeur
              </span>
              <input
                type="number"
                formControlName="width"
                class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                [class.border-red-500]="
                  form.controls.dimensions.controls.width.invalid &&
                  (form.controls.dimensions.controls.width.dirty ||
                    form.controls.dimensions.controls.width.touched)
                "
                placeholder="42"
              />
              @if (form.controls.dimensions.controls.width.errors?.['required']) {
              <p class="text-xs text-red-600 mt-1 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i>
                Requise
              </p>
              }
            </div>
            <div>
              <span class="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-arrows-up-down text-teal-500"></i>
                Hauteur
              </span>
              <input
                type="number"
                formControlName="height"
                class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                [class.border-red-500]="
                  form.controls.dimensions.controls.height.invalid &&
                  (form.controls.dimensions.controls.height.dirty ||
                    form.controls.dimensions.controls.height.touched)
                "
                placeholder="29.7"
              />
              @if (form.controls.dimensions.controls.height.errors?.['required']) {
              <p class="text-xs text-red-600 mt-1 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i>
                Requise
              </p>
              }
            </div>
            <div>
              <span class="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-ruler text-teal-500"></i>
                Unité
              </span>
              <select
                formControlName="unit"
                class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              >
                <option value="cm">cm</option>
                <option value="mm">mm</option>
                <option value="in">inches</option>
              </select>
            </div>
          </div>
          } @else {
          <div
            class="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200"
          >
            <p class="text-sm text-gray-700 flex items-center gap-2">
              <i class="fa-solid fa-ruler-combined text-teal-500"></i>
              Dimensions :
              <strong class="text-teal-700">{{
                getDimensions(form.controls.singleSize.value || 'A4')
              }}</strong>
            </p>
          </div>
          }
        </div>
      </div>
      }

      <!-- >>> PRIX & STOCK (réintroduit pour le cas sans variantes) -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-euro-sign text-xl text-white"></i>
            </div>
            <h2 class="text-lg font-bold text-white">Prix et stock</h2>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-tag text-emerald-500"></i>
                Prix de base (€) *
              </span>
              <input
                type="number"
                step="0.01"
                formControlName="originalPrice"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                [class.border-red-500]="isInvalid('originalPrice')"
                placeholder="100.00"
              />
              @if (isInvalid('originalPrice')) {
              <p class="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i>
                Prix requis (minimum 0€)
              </p>
              }
            </div>

            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-percent text-red-500"></i>
                Prix réduit (€)
              </span>
              <input
                type="number"
                step="0.01"
                formControlName="reducedPrice"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                [class.border-red-500]="form.hasError('reducedPriceTooHigh')"
                placeholder="75.00"
              />
              @if (form.hasError('reducedPriceTooHigh')) {
              <p class="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i>
                Le prix réduit doit être inférieur au prix de base
              </p>
              }
              <p class="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-lightbulb"></i>
                Laissez vide si pas de promotion
              </p>
            </div>

            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-boxes-stacked text-emerald-500"></i>
                Stock disponible *
              </span>
              <input
                type="number"
                formControlName="stock"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                [class.border-red-500]="isInvalid('stock')"
                placeholder="10"
              />
              @if (isInvalid('stock')) {
              <p class="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i>
                Stock requis (minimum 0)
              </p>
              }
            </div>
          </div>

          <div
            class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
          >
            <span class="flex items-center gap-3 cursor-pointer group">
              <div class="relative">
                <input
                  type="checkbox"
                  formControlName="isAvailable"
                  class="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-green-300 checked:bg-green-500 checked:border-green-500 transition-all"
                />
                <i
                  class="fa-solid fa-check absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none"
                ></i>
              </div>
              <div class="flex-1">
                <span
                  class="font-semibold text-gray-800 group-hover:text-green-700 transition-colors"
                >
                  Produit disponible à la vente
                </span>
                <p class="text-xs text-gray-600 mt-0.5">
                  Les produits non disponibles ne seront pas visibles sur le site
                </p>
              </div>
            </span>
          </div>
        </div>
      </div>
      <!-- <<< FIN PRIX & STOCK -->
      @if (form.controls.hasVariants.value) {
      <!-- Variantes de tailles -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
              >
                <i class="fa-solid fa-layer-group text-xl text-white"></i>
              </div>
              <h2 class="text-lg font-bold text-white">Variantes de tailles</h2>
            </div>
            <button
              type="button"
              (click)="openAddVariantModal()"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              [disabled]="availableSizes().length === 0"
              [attr.aria-disabled]="availableSizes().length === 0"
            >
              <i class="fa-solid fa-plus"></i>
              Ajouter une taille
            </button>
          </div>
        </div>

        <div class="p-6">
          @if (variants.length === 0) {
          <div class="text-center py-12">
            <div
              class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-4"
            >
              <i class="fa-solid fa-ruler-combined text-4xl text-blue-400"></i>
            </div>
            <p class="text-lg font-semibold text-gray-800 mb-2">Aucune variante</p>
            <p class="text-sm text-gray-600">Cliquez sur "Ajouter une taille" pour commencer</p>
          </div>
          } @else {
          <div class="space-y-4">
            @for (variantGroup of variants.controls; track $index; let i = $index) {
            <div
              class="border-2 rounded-xl p-5 transition-all"
              [class.border-blue-200]="variantGroup.controls.isAvailable.value"
              [class.bg-blue-50]="variantGroup.controls.isAvailable.value"
              [class.border-red-200]="!variantGroup.controls.isAvailable.value"
              [class.bg-red-50]="!variantGroup.controls.isAvailable.value"
              [formGroup]="variantGroup"
            >
              <div class="grid grid-cols-12 gap-4 items-center">
                <div class="col-span-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm"
                    >
                      <i class="fa-solid fa-ruler-combined text-blue-500"></i>
                    </div>
                    <div>
                      <div class="font-bold text-lg text-gray-900">
                        {{ variantGroup.controls.size.value }}
                      </div>
                     <div class="text-xs text-gray-500">
                        {{ variantGroup.controls.size.value | size }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-span-2">
                  <span class="block text-xs font-semibold text-gray-700 mb-1.5">
                    <i class="fa-solid fa-tag text-blue-500 mr-1"></i>
                    Prix de base (€)
                  </span>
                  <input
                    type="number"
                    formControlName="originalPrice"
                    class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="100.00"
                  />
                </div>
                <div class="col-span-2">
                  <span class="block text-xs font-semibold text-gray-700 mb-1.5">
                    <i class="fa-solid fa-percent text-red-500 mr-1"></i>
                    Prix réduit (€)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    formControlName="reducedPrice"
                    class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                    [class.border-red-500]="hasVariantPriceError(i)"
                    placeholder="75.00"
                  />
                </div>
                <div class="col-span-2">
                  <span class="block text-xs font-semibold text-gray-700 mb-1.5">
                    <i class="fa-solid fa-boxes-stacked text-blue-500 mr-1"></i>
                    Stock
                  </span>
                  <input
                    type="number"
                    formControlName="stock"
                    class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="0"
                  />
                </div>
                <div class="col-span-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    (click)="toggleVariantAvailability(i)"
                    class="px-3 py-2 text-xs font-semibold rounded-lg transition-all"
                    [class.bg-green-100]="variantGroup.controls.isAvailable.value"
                    [class.text-green-700]="variantGroup.controls.isAvailable.value"
                    [class.hover:bg-green-200]="variantGroup.controls.isAvailable.value"
                    [class.bg-gray-200]="!variantGroup.controls.isAvailable.value"
                    [class.text-gray-600]="!variantGroup.controls.isAvailable.value"
                    [class.hover:bg-gray-300]="!variantGroup.controls.isAvailable.value"
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
                    class="px-3 py-2 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                    title="Supprimer"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
              @if (hasVariantPriceError(i)) {
              <p class="text-xs text-red-600 mt-1">
                Le prix réduit doit être strictement inférieur au prix de base
              </p>
              }
            </div>
            }
          </div>
          }
        </div>
      </div>
      }

      <!-- Édition limitée -->
      <div
        class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200"
      >
        <span class="flex items-center gap-4 cursor-pointer group mb-4">
          <div class="relative">
            <input
              type="checkbox"
              formControlName="isLimitedEdition"
              class="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-amber-300 checked:bg-amber-500 checked:border-amber-500 transition-all"
            />
            <i
              class="fa-solid fa-check absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none"
            ></i>
          </div>
          <div class="flex-1">
            <div
              class="font-bold text-gray-900 group-hover:text-amber-700 transition-colors flex items-center gap-2"
            >
              <i class="fa-solid fa-star text-amber-500"></i>
              Édition limitée
            </div>
            <div class="text-sm text-gray-600 mt-1">
              <i class="fa-solid fa-info-circle mr-1"></i>
              Indiquez que ce produit fait partie d'une série limitée numérotée
            </div>
          </div>
        </span>

        @if (form.controls.isLimitedEdition.value) {
        <div class="grid grid-cols-2 gap-4 p-4 bg-white rounded-xl border-2 border-amber-200">
          <div>
            <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i class="fa-solid fa-hashtag text-amber-500"></i>
              Numéro d'édition
            </span>
            <input
              type="number"
              formControlName="editionNumber"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
              placeholder="1"
            />
          </div>
          <div>
            <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i class="fa-solid fa-list-ol text-amber-500"></i>
              Total éditions
            </span>
            <input
              type="number"
              formControlName="totalEditions"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
              placeholder="100"
            />
          </div>
        </div>
        }
      </div>

      <!-- Images -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-images text-xl text-white"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">Images du produit</h2>
              <p class="text-sm text-rose-100">
                @if (images.length > 0) {
                <i class="fa-solid fa-check-circle mr-1"></i>
                {{ images.length }} image(s) ajoutée(s) } @else {
                <i class="fa-solid fa-info-circle mr-1"></i>
                Au moins une image requise }
              </p>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Zone de drop -->
          <div
            class="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
            [class.border-rose-500]="isDragging()"
            [class.bg-rose-50]="isDragging()"
            [class.scale-105]="isDragging()"
            [class.border-gray-300]="!isDragging()"
            [class.hover:border-rose-400]="!isDragging()"
            [class.hover:bg-rose-50]="!isDragging()"
            role="button"
            tabindex="0"
            (click)="triggerFileInput()"
            (keydown.enter)="triggerFileInput()"
            (keydown.space)="triggerFileInput(); $event.preventDefault()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <div
              class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl mb-4"
            >
              <i class="fa-solid fa-cloud-arrow-up text-3xl text-rose-500"></i>
            </div>
            <p class="text-gray-700 font-medium mb-2">
              Glissez-déposez vos images ou
              <span class="text-rose-600 font-bold">cliquez pour parcourir</span>
            </p>
            <p class="text-sm text-gray-500">
              <i class="fa-solid fa-circle-info mr-1"></i>
              PNG, JPG, WEBP - Max 5 Mo par image
            </p>
          </div>
          <input
            #fileInput
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            (change)="onFileSelect($event)"
          />

          <!-- Bouton URL -->
          <button
            type="button"
            (click)="addImageByUrl()"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl text-gray-700 font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <i class="fa-solid fa-link"></i>
            Ajouter une image par URL
          </button>
          @if (images.length > 0) {
          <div class="grid grid-cols-4 gap-4 mt-6">
            @for (ctrl of images.controls; track $index; let i = $index) {
            <div class="relative group">
              <div
                class="relative overflow-hidden rounded-xl border-2 border-gray-200 group-hover:border-rose-400 transition-all shadow-sm group-hover:shadow-lg"
              >
                <img
                  [src]="ctrl.value"
                  class="w-full h-36 object-cover"
                  [alt]="'Image ' + (i + 1)"
                />
                <div
                  class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2"
                >
                  <p class="text-xs font-semibold text-white">
                    <i class="fa-solid fa-image mr-1"></i>
                    Image {{ i + 1 }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                (click)="removeImage(i)"
                class="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 flex items-center justify-center"
                title="Supprimer"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            }
          </div>
          } @if (images.invalid && images.touched) {
          <p class="text-sm text-red-600 mt-2 flex items-center gap-2">
            <i class="fa-solid fa-exclamation-circle"></i>
            Au moins une image est requise
          </p>
          }
        </div>
      </div>

      <!-- Actions -->
      <div
        class="sticky bottom-0 bg-white/95 backdrop-blur border-t-2 border-gray-200 px-6 py-4 -mx-4 rounded-b-2xl shadow-2xl"
      >
        <div class="flex justify-between items-center gap-4">
          <div class="text-sm text-gray-600">
            <i class="fa-solid fa-info-circle text-gray-400 mr-1"></i>
            Les modifications seront enregistrées dans la base de données
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              (click)="onCancel()"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all border-2 border-gray-200"
            >
              <i class="fa-solid fa-times"></i>
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || submitting() || !associationsValid()"
              class="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              [class.bg-gradient-to-r]="!form.invalid && !submitting() && associationsValid()"
              [class.from-green-500]="!form.invalid && !submitting() && associationsValid()"
              [class.to-emerald-600]="!form.invalid && !submitting() && associationsValid()"
              [class.hover:from-green-600]="!form.invalid && !submitting() && associationsValid()"
              [class.hover:to-emerald-700]="!form.invalid && !submitting() && associationsValid()"
              [class.bg-gray-300]="form.invalid || submitting() || !associationsValid()"
            >
              <i
                class="fa-solid"
                [class.fa-save]="!submitting()"
                [class.fa-spinner]="submitting()"
                [class.fa-spin]="submitting()"
              ></i>
              {{ submitting() ? 'Enregistrement...' : submitLabel }}
            </button>
          </div>
        </div>
      </div>
    </form>

    <!-- MODALE D'AJOUT DE CATÉGORIE -->
    @if (showCategoryModal()) {
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'add-category-title'"
      tabindex="0"
      (click)="closeCategoryModal()"
      (keydown.escape)="closeCategoryModal()"
      (keyup.enter)="closeCategoryModal()"
      (keyup.space)="closeCategoryModal(); $event.preventDefault()"
    >
      <div
        class="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto outline-none"
        role="document"
        tabindex="0"
        (click)="$event.stopPropagation()"
        (keyup.enter)="$event.stopPropagation()"
        (keyup.space)="$event.stopPropagation()"
      >
        <h3 id="add-category-title" class="text-xl font-bold mb-4 flex items-center gap-2">
          <i class="fa-solid fa-folder-plus text-purple-600"></i>
          Ajouter une catégorie
        </h3>

        <div class="space-y-4">
          <!-- Category Selection -->
          <div>
            <label
              for="modal-category-select"
              class="block text-sm font-semibold text-gray-700 mb-2"
            >
              Choisir une catégorie
            </label>
            <select
              id="modal-category-select"
              [ngModel]="selectedCategoryForModal()"
              (ngModelChange)="onModalCategorySelectChange($event)"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              <option [ngValue]="null">Sélectionner une catégorie...</option>
              @for (cat of getAvailableCategories(); track cat.id) {
              <option [ngValue]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Subcategory Selection -->
          @if (selectedCategoryForModal() && getModalSubcategories().length > 0) {
          <div>
            <p class="block text-sm font-semibold text-gray-700 mb-2">
              Sous-catégories (obligatoire pour cette catégorie)
            </p>
            <div
              class="space-y-2 p-3 bg-gray-50 rounded-xl border-2 border-gray-200 max-h-60 overflow-y-auto"
              role="group"
              [attr.aria-label]="'Sous-catégories'"
            >
              @for (subCat of getModalSubcategories(); track subCat.id) {
              <label
                class="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  [value]="subCat.id"
                  [checked]="selectedSubCategoriesForModal().includes(subCat.id)"
                  (change)="toggleModalSubcategory(subCat.id)"
                  class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span class="text-sm text-gray-700">{{ subCat.name }}</span>
              </label>
              }
            </div>
            @if (selectedCategoryForModal() && selectedRequiresSubcategories() &&
            selectedSubCategoriesForModal().length === 0) {
            <p class="text-sm text-red-600 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation"></i>
              Veuillez choisir au moins une sous-catégorie.
            </p>
            }
          </div>
          }
        </div>

        <div class="flex gap-3 mt-6">
          <button
            type="button"
            (click)="closeCategoryModal()"
            class="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            (click)="addCategoryAssociation()"
            [disabled]="!canConfirmAddAssociation()"
            class="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            [attr.aria-disabled]="!canConfirmAddAssociation() ? 'true' : null"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
    }

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
export class ProductFormComponent implements OnChanges, OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly formatsService = inject(FormatService);
  private readonly sizeService = inject(SizeService);
  customFormats: PrintFormat[] = [];
  selectedCustomFormatId = signal<number | null>(null);

  // Expose all sizes from service
  allSizes = this.sizeService.sizes;

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  @Input() initial?: Product | null;
  @Input({ required: true }) categories: Category[] = [];
  @Input() submitLabel = 'Enregistrer';

  @Output() save = new EventEmitter<Partial<Product>>();
  @Output() formCancel = new EventEmitter<void>();

  submitting = signal(false);
  showAddVariantModal = signal(false);
  isDragging = signal(false);
  showCategoryModal = signal(false);
  detailsOpen = signal(false); // <- panneau déroulant

  // Multi-catégorie
  categoryAssociations = signal<ProductCategoryAssociation[]>([]);
  selectedCategoryForModal = signal<number | null>(null);
  selectedSubCategoriesForModal = signal<number[]>([]);
  associationsTouched = signal(false);

  form: ProductFormGroup = this.fb.group(
    {
      title: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
      ]),
      categoryId: this.fb.control<number | null>(null),
      subCategoryIds: this.fb.nonNullable.control<number[]>([]),
      technique: this.fb.nonNullable.control(''),
      description: this.fb.control<string | null>(null),
      tags: this.fb.nonNullable.control(''),
      hasVariants: this.fb.nonNullable.control(false),
      singleSize: this.fb.nonNullable.control<PrintSize | 'custom'>('custom'),
      originalPrice: this.fb.control<number | null>(null, [Validators.min(0)]),
      reducedPrice: this.fb.control<number | null>(null, [Validators.min(0)]),
      stock: this.fb.control<number | null>(null, [Validators.min(0)]),
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

  ngOnInit(): void {
    this.updateValidators();
    void this.loadCustomFormats();
  }

  get images() {
    return this.form.controls.images;
  }
  get variants() {
    return this.form.controls.variants;
  }

  // Helpers catégories
  private getCategoryById(id: number | null): Category | undefined {
    if (id === null) return undefined;
    return this.categories.find((c) => c.id === id);
  }
  private categoryHasSubcategories(id: number): boolean {
    const c = this.getCategoryById(id);
    return !!c?.subCategories && c.subCategories.length > 0;
  }

  selectedRequiresSubcategories(): boolean {
    const id = this.selectedCategoryForModal();
    return typeof id === 'number' && this.categoryHasSubcategories(id);
  }

  canConfirmAddAssociation(): boolean {
    const catId = this.selectedCategoryForModal();
    if (!catId) return false;
    if (this.categoryHasSubcategories(catId)) {
      return this.selectedSubCategoriesForModal().length > 0;
    }
    return true;
  }

  isAssociationValid(a: ProductCategoryAssociation): boolean {
    const cat = this.getCategoryById(a.categoryId);
    if (!cat) return false;
    const hasSubs = (cat.subCategories?.length ?? 0) > 0;
    if (!hasSubs) return true;
    return Array.isArray(a.subCategoryIds) && a.subCategoryIds.length > 0;
  }

  associationsValid(): boolean {
    if (this.categoryAssociations().length === 0) return false;
    return this.categoryAssociations().every((a) => this.isAssociationValid(a));
  }

  availableSizes(): PrintSize[] {
    const used = this.variants.controls.map((g) => g.controls.size.value);
    const allSizeValues = this.sizeService.getSizeValues() as PrintSize[];
    return allSizeValues.filter((s) => !used.includes(s));
  }

  getDimensions(size: PrintSize): string {
    // Use service if available, otherwise fallback to SIZE_DIMENSIONS
    const sizeLabel = this.sizeService.getSizeLabel(size);
    if (sizeLabel && sizeLabel !== size) {
      // Extract dimensions from label (format: "A3 (29.7 × 42 cm)")
      const match = sizeLabel.match(/\(([^)]+)\)/);
      return match ? match[1] : sizeLabel;
    }
    const dim = SIZE_DIMENSIONS[size];
    return dim ? `${dim.width} × ${dim.height} ${dim.unit}` : size;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initial']) this.loadProduct(this.initial ?? null);
  }

  private loadProduct(p: Product | null): void {
    this.form.reset();
    this.images.clear();
    this.variants.clear();
    this.categoryAssociations.set([]);
    this.associationsTouched.set(false);

    if (!p) return;

    if (p.categoryAssociations && p.categoryAssociations.length > 0) {
      this.categoryAssociations.set(p.categoryAssociations);
    } else {
      const legacyAssoc: ProductCategoryAssociation = {
        categoryId: p.categoryId,
        subCategoryIds: p.subCategoryIds,
      };
      this.categoryAssociations.set([legacyAssoc]);
    }

    const hasVariants = !!p.variants && p.variants.length > 0;
    this.form.patchValue({
      title: p.title,
      categoryId: p.categoryId,
      subCategoryIds: p.subCategoryIds || [],
      technique: p.technique || '',
      description: p.description,
      tags: p.tags?.join(', ') || '',
      hasVariants,
      singleSize: 'custom',
      originalPrice: hasVariants ? null : p.originalPrice,
      reducedPrice: hasVariants ? null : p.reducedPrice ?? null,
      stock: hasVariants ? null : p.stock,
      isAvailable: p.isAvailable,
      isLimitedEdition: p.isLimitedEdition,
      editionNumber: p.editionNumber ?? null,
      totalEditions: p.totalEditions ?? null,
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
      originalPrice: this.fb.control<number | null>(v?.originalPrice ?? 0, [
        Validators.required,
        Validators.min(0),
      ]),
      reducedPrice: this.fb.control<number | null>(v?.reducedPrice ?? null, [Validators.min(0)]),
      stock: this.fb.control<number | null>(v?.stock ?? 0, [
        Validators.required,
        Validators.min(0),
      ]),
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

    if (hasVariants) {
      this.form.controls.originalPrice.clearValidators();
      this.form.controls.stock.clearValidators();
    } else {
      this.form.controls.originalPrice.setValidators([Validators.required, Validators.min(0)]);
      this.form.controls.stock.setValidators([Validators.required, Validators.min(0)]);
    }
    this.form.controls.originalPrice.updateValueAndValidity({ emitEvent: false });
    this.form.controls.stock.updateValueAndValidity({ emitEvent: false });

    const widthCtrl = this.form.controls.dimensions.controls.width;
    const heightCtrl = this.form.controls.dimensions.controls.height;
    if (!hasVariants && isCustom) {
      widthCtrl.setValidators([Validators.required, Validators.min(0)]);
      heightCtrl.setValidators([Validators.required, Validators.min(0)]);
    } else {
      widthCtrl.setValidators([Validators.min(0)]);
      heightCtrl.setValidators([Validators.min(0)]);
    }
    widthCtrl.updateValueAndValidity({ emitEvent: false });
    heightCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private priceBarreValidator(): ValidatorFn {
    return (form: AbstractControl) => {
      const fg = form as ProductFormGroup;
      const hasVariants = fg.controls.hasVariants.value;
      if (!hasVariants) {
        const basePrice = fg.controls.originalPrice.value ?? null;
        const reducedPrice = fg.controls.reducedPrice.value ?? null;
        if (reducedPrice !== null && basePrice !== null && reducedPrice >= basePrice) {
          return { reducedPriceTooHigh: true };
        }
      }
      return null;
    };
  }

  /** Construction de la checklist pour l'UI déroulante + compteur */
  checklist(): { key: string; label: string; done: boolean; optional?: boolean }[] {
    const f = this.form;
    const hasVariants = f.controls.hasVariants.value;

    const titleOk = f.controls.title.valid;
    const catsOk = this.associationsValid();
    const imagesOk = this.images.length > 0 && this.images.valid;

    const priceOk = hasVariants
      ? this.variants.length > 0 &&
      this.variants.controls.every((v) => v.controls.originalPrice.valid)
      : f.controls.originalPrice.value !== null && f.controls.originalPrice.valid;

    const stockOk = hasVariants
      ? this.variants.length > 0 && this.variants.controls.every((v) => v.controls.stock.valid)
      : f.controls.stock.value !== null && f.controls.stock.valid;

    // Dimensions/taille : soit une taille prédéfinie, soit dimensions custom remplies
    const dimsOk =
      !hasVariants &&
      (f.controls.singleSize.value !== 'custom' ||
        (f.controls.dimensions.controls.width.value !== null &&
          f.controls.dimensions.controls.width.valid &&
          f.controls.dimensions.controls.height.value !== null &&
          f.controls.dimensions.controls.height.valid));

    // Variantes : validées uniquement si hasVariants ET variantes ajoutées ET valides
    const variantsOk = hasVariants
      ? this.variants.length > 0 &&
      this.variants.controls.every((_, i) => !this.hasVariantPriceError(i)) &&
      this.variants.controls.every(
        (v) => v.controls.originalPrice.valid && v.controls.stock.valid
      )
      : // Si pas de variantes, on vérifie que dimensions/taille est OK
      dimsOk;

    const descriptionOk = !!(f.controls.description.value && f.controls.description.value.trim());

    const items = [
      { key: 'title', label: 'Titre', done: titleOk },
      { key: 'categories', label: 'Catégories / sous-catégories', done: catsOk },
      { key: 'images', label: 'Images', done: imagesOk },
      { key: 'price', label: 'Prix', done: priceOk },
      { key: 'stock', label: 'Stock', done: stockOk },
      { key: 'dimensions', label: 'Dimensions / taille', done: !!dimsOk },
      { key: 'variants', label: 'Variantes', done: variantsOk },
      { key: 'description', label: 'Description', done: descriptionOk, optional: true },
    ];
    return items;
  }
  checklistDoneCount(): number {
    return this.checklist().filter((i) => i.done).length;
  }
  checklistTotalCount(): number {
    return this.checklist().length;
  }

  /** Pourcentage d'avancement UX : 100% = prêt à poster */
  progress(): number {
    const f = this.form;
    const checks: boolean[] = [];

    // Champs communs obligatoires
    checks.push(f.controls.title.valid);
    checks.push(this.associationsValid());
    checks.push(this.images.length > 0 && this.images.valid);

    const hasVariants = f.controls.hasVariants.value;

    if (!hasVariants) {
      checks.push(f.controls.originalPrice.value !== null && f.controls.originalPrice.valid);
      checks.push(f.controls.stock.value !== null && f.controls.stock.valid);

      if (f.controls.singleSize.value === 'custom') {
        const dim = f.controls.dimensions.controls;
        checks.push(dim.width.value !== null && dim.width.valid);
        checks.push(dim.height.value !== null && dim.height.valid);
      } else {
        checks.push(true);
      }

      const hasPriceInput =
        f.controls.originalPrice.value !== null || f.controls.reducedPrice.value !== null;
      if (hasPriceInput) {
        checks.push(!f.hasError('reducedPriceTooHigh'));
      }
    } else {
      checks.push(this.variants.length > 0);
      checks.push(
        this.variants.controls.every(
          (v) => v.controls.originalPrice.valid && v.controls.stock.valid
        )
      );
      checks.push(this.variants.controls.every((_, i) => !this.hasVariantPriceError(i)));
    }

    const done = checks.filter(Boolean).length;
    const total = checks.length || 1;
    const percent = Math.round((done / total) * 100);
    return Math.min(100, Math.max(0, percent));
  }

  /** Vrai si le formulaire est prêt à être posté */
  readyToPost(): boolean {
    return this.progress() === 100;
  }

  hasVariantPriceError(index: number): boolean {
    const variant = this.variants.at(index);
    const basePrice = variant.controls.originalPrice.value ?? null;
    const reducedPrice = variant.controls.reducedPrice.value ?? null;
    return !!(basePrice !== null && reducedPrice !== null && reducedPrice >= basePrice);
  }

  // Variantes
  openAddVariantModal(): void {
    this.showAddVariantModal.set(true);
  }
  closeAddVariantModal(): void {
    this.showAddVariantModal.set(false);
  }

  addVariant(size: PrintSize): void {
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
        originalPrice: 0,
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

  toggleHasVariants(): void {
    const currentValue = this.form.controls.hasVariants.value;
    this.form.controls.hasVariants.setValue(!currentValue);
    this.updateValidators();
  }

  // Images
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

  private async loadCustomFormats(): Promise<void> {
    this.customFormats = await this.formatsService.getAll(true); // seulement actifs
  }

  onSelectCustomFormat(id: number | null): void {
    this.selectedCustomFormatId.set(id);
    if (!id) return;
    const fmt = this.customFormats.find((f) => f.id === id);
    if (!fmt) return;
    this.form.controls.singleSize.setValue('custom');
    this.form.controls.dimensions.patchValue({
      width: fmt.width,
      height: fmt.height,
      unit: fmt.unit,
    });
    this.updateValidators();
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

  // Catégories
  openCategoryModal(): void {
    this.showCategoryModal.set(true);
    this.selectedCategoryForModal.set(null);
    this.selectedSubCategoriesForModal.set([]);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
  }

  onModalCategoryChange(): void {
    this.selectedSubCategoriesForModal.set([]);
  }

  onModalCategorySelectChange(value: number | null): void {
    this.selectedCategoryForModal.set(value);
    this.onModalCategoryChange();
  }

  toggleModalSubcategory(subCatId: number): void {
    const current = this.selectedSubCategoriesForModal();
    if (current.includes(subCatId)) {
      this.selectedSubCategoriesForModal.set(current.filter((id) => id !== subCatId));
    } else {
      this.selectedSubCategoriesForModal.set([...current, subCatId]);
    }
  }

  getAvailableCategories(): Category[] {
    const usedIds = this.categoryAssociations().map((a) => a.categoryId);
    return this.categories.filter((c) => !usedIds.includes(c.id));
  }

  getModalSubcategories() {
    const catId = this.selectedCategoryForModal();
    if (!catId) return [];
    const cat = this.categories.find((c) => c.id === catId);
    return cat?.subCategories || [];
  }

  addCategoryAssociation(): void {
    const catId = this.selectedCategoryForModal();
    if (!catId) return;

    const requiresSubs = this.categoryHasSubcategories(catId);
    const pickedSubs = this.selectedSubCategoriesForModal();

    if (requiresSubs && pickedSubs.length === 0) {
      this.toast.error('Sélectionnez au moins une sous-catégorie pour cette catégorie.');
      return;
    }

    const newAssoc: ProductCategoryAssociation = {
      categoryId: catId,
      subCategoryIds: pickedSubs.length > 0 ? pickedSubs : undefined,
    };

    this.categoryAssociations.update((assocs) => {
      const next = [...assocs, newAssoc];
      this.syncLegacyCategoryFields(next);
      return next;
    });

    this.associationsTouched.set(true);
    this.closeCategoryModal();
  }

  removeCategoryAssociation(categoryId: number): void {
    this.categoryAssociations.update((assocs) => {
      const next = assocs.filter((a) => a.categoryId !== categoryId);
      this.syncLegacyCategoryFields(next);
      return next;
    });
    this.associationsTouched.set(true);
  }

  /** Met à jour categoryId/subCategoryIds (legacy) avec la 1ʳᵉ association (ou vide). */
  private syncLegacyCategoryFields(assocs: ProductCategoryAssociation[]): void {
    if (assocs.length === 0) {
      this.form.controls.categoryId.setValue(null);
      this.form.controls.subCategoryIds.setValue([]);
      return;
    }
    const first = assocs[0];
    this.form.controls.categoryId.setValue(first.categoryId);
    this.form.controls.subCategoryIds.setValue(first.subCategoryIds ?? []);
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find((c) => c.id === categoryId)?.name || 'Catégorie inconnue';
  }

  getSubCategoryName(subCategoryId: number): string {
    for (const cat of this.categories) {
      const subCat = cat.subCategories?.find((sc) => sc.id === subCategoryId);
      if (subCat) return subCat.name;
    }
    return 'Sous-catégorie inconnue';
  }

  // Submit
  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    this.associationsTouched.set(true);

    const errors: string[] = [];

    if (this.form.controls.title.invalid) {
      errors.push('❌ Titre requis (3-120 caractères)');
    }

    if (!this.associationsValid()) {
      errors.push(
        '❌ Catégories: chaque catégorie ayant des sous-catégories doit en contenir au moins une.'
      );
    }

    if (!this.form.controls.hasVariants.value) {
      if (this.form.controls.originalPrice.invalid) {
        errors.push('❌ Prix de base requis (minimum 0€)');
      }
      if (this.form.controls.stock.invalid) {
        errors.push('❌ Stock requis (minimum 0)');
      }
      if (
        this.form.value.reducedPrice !== null &&
        this.form.value.originalPrice !== null &&
        (this.form.value.reducedPrice as number) >= (this.form.value.originalPrice as number)
      ) {
        errors.push('❌ Le prix réduit doit être inférieur au prix de base');
      }
      if (this.form.controls.singleSize.value === 'custom') {
        const dim = this.form.controls.dimensions.controls;
        if (dim.width.invalid || dim.height.invalid) {
          errors.push('❌ Dimensions personnalisées incomplètes');
        }
      }
    } else {
      if (this.variants.length === 0) {
        errors.push('❌ Au moins une variante est requise');
      }
      this.variants.controls.forEach((variant, index) => {
        const basePrice = variant.controls.originalPrice.value;
        const reduced = variant.controls.reducedPrice.value;
        const stockVal = variant.controls.stock.value;

        if (variant.controls.originalPrice.invalid || basePrice === null) {
          errors.push(`❌ Variante ${index + 1}: Prix de base requis`);
        }
        if (variant.controls.stock.invalid || stockVal === null) {
          errors.push(`❌ Variante ${index + 1}: Stock requis`);
        }
        if (reduced !== null && basePrice !== null && reduced >= basePrice) {
          errors.push(`❌ Variante ${index + 1}: Prix réduit doit être < prix de base`);
        }
      });
    }

    if (this.images.length === 0) {
      errors.push('❌ Au moins une image est requise');
    }

    if (errors.length > 0) {
      const errorMessage = '⚠️ Erreurs dans le formulaire:\n\n' + errors.join('\n');
      this.toast.error(errorMessage);
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500, .bg-red-50');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    this.submitting.set(true);
    try {
      const v = this.form.getRawValue();
      const hasVariants = v.hasVariants;
      const assocs = this.categoryAssociations();

      const payload: Partial<Product> = {
        title: v.title,
        categoryId: assocs[0]?.categoryId,
        subCategoryIds: assocs[0]?.subCategoryIds,
        categoryAssociations: assocs,
        technique: v.technique,
        description: v.description ?? undefined,
        tags: v.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
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
          originalPrice: vt.originalPrice ?? 0,
          reducedPrice: vt.reducedPrice ?? undefined,
          stock: vt.stock ?? 0,
          isAvailable: vt.isAvailable,
          dimensions: SIZE_DIMENSIONS[vt.size],
        }));
        payload.originalPrice = 0;
        payload.stock = 0;
        payload.isAvailable = true;
        payload.reducedPrice = undefined;
      } else {
        payload.originalPrice = v.originalPrice ?? 0;
        payload.reducedPrice = v.reducedPrice ?? undefined;
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
