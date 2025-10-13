import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

import { CategoryService } from '../../../catalog/services/category';
import type { Category } from '../../../catalog/models/category.model';
import type { Product } from '../../../catalog/models/product.model';
import { ProductService } from '../../../catalog/services/product';
import { ToastService } from '../../../../shared/services/toast.service';

/** Form model */
interface CategoryFormControls {
  name: FormControl<string>;
  slug: FormControl<string>;
  description: FormControl<string | null>;
  color: FormControl<string | null>;
  icon: FormControl<string | null>;
  image: FormControl<string | null>;
  bannerImage: FormControl<string | File | null>;
  isActive: FormControl<boolean>;
  productIds: FormArray<FormControl<number>>;
  subCategories: FormArray<FormGroup<SubCategoryControls>>;
}
type CategoryFormGroup = FormGroup<CategoryFormControls>;

interface SubCategoryControls {
  id: FormControl<number | null>;
  name: FormControl<string>;
  slug: FormControl<string>;
  description: FormControl<string | null>;
  isActive: FormControl<boolean>;
  productIds: FormArray<FormControl<number>>;
}

/** Payload émis par le parent si besoin */
export interface CategorySavePayload {
  category: Partial<Category>;
  subCategories: {
    toCreate: {
      name: string;
      slug: string;
      description?: string;
      isActive: boolean;
      productIds?: number[];
    }[];
    toUpdate: {
      id: number;
      name: string;
      slug: string;
      description?: string;
      isActive: boolean;
      productIds?: number[];
    }[];
    toDeleteIds: number[];
  };
}

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  optional?: boolean;
}

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./category-form.component.scss'],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
      class="cf-form space-y-6 mx-auto max-w-7xl px-4"
      novalidate
    >
      <!-- === BARRE DE PROGRESSION STICKY === -->
      <div
        class="cf-progress-sticky bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 shadow-sm rounded-2xl"
        role="region"
        aria-label="Préparation de la catégorie"
      >
        <div class="px-4 py-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">
              <i class="fa-solid fa-gauge-high text-indigo-600 mr-1"></i>
              Préparation de la catégorie
            </span>
            <div class="flex items-center gap-3">
              <span
                class="text-sm font-semibold"
                [class.text-green-600]="readyToPost()"
                [class.text-indigo-600]="!readyToPost()"
              >
                {{ progress() }}%
              </span>

              <button
                type="button"
                (click)="detailsOpen.set(!detailsOpen())"
                class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                [attr.aria-expanded]="detailsOpen()"
                aria-controls="cf-progress-details"
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
              [class.bg-indigo-500]="!readyToPost()"
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

            <span class="text-xs text-gray-600 font-medium">
              {{ checklistDoneCount() }}/{{ checklistTotalCount() }}
            </span>
          </div>

          @if (detailsOpen()) {
          <div id="cf-progress-details" class="mt-3 border-t pt-3">
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

      <!-- Informations principales -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-info-circle text-xl text-white"></i>
            </div>
            <h3 class="text-lg font-bold text-white">Informations principales</h3>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-tag text-indigo-500"></i>
                Nom de la catégorie
              </span>
              <input
                type="text"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                formControlName="name"
                (input)="onNameChange()"
                placeholder="Ex: Peinture, Sculpture..."
              />
              <p
                *ngIf="isInvalid('name')"
                class="text-sm text-red-600 mt-1.5 flex items-center gap-1"
              >
                <i class="fa-solid fa-circle-exclamation"></i>
                Nom requis (2–60 caractères)
              </p>
            </div>

            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-link text-indigo-500"></i>
                Slug (URL)
              </span>
              <input
                type="text"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                formControlName="slug"
                placeholder="peinture-moderne"
              />
              <p class="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <i class="fa-solid fa-lightbulb"></i>
                Identifiant URL (généré automatiquement, modifiable)
              </p>
              <p
                *ngIf="isInvalid('slug')"
                class="text-sm text-red-600 mt-1.5 flex items-center gap-1"
              >
                <i class="fa-solid fa-circle-exclamation"></i>
                Slug requis (2–80 caractères)
              </p>
            </div>

            <div class="md:col-span-2">
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-align-left text-indigo-500"></i>
                Description
              </span>
              <textarea
                rows="3"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                formControlName="description"
                placeholder="Décrivez cette catégorie..."
              ></textarea>
            </div>

            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-palette text-indigo-500"></i>
                Couleur d'accentuation
              </span>
              <div class="flex items-center gap-3">
                <input
                  type="color"
                  class="h-12 w-20 rounded-xl border-2 border-gray-200 cursor-pointer"
                  formControlName="color"
                  aria-label="Choisir une couleur d'accentuation"
                />
                <input
                  type="text"
                  placeholder="#3b82f6"
                  class="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-mono text-sm"
                  formControlName="color"
                  aria-label="Code hex de la couleur"
                />
              </div>
            </div>

            <div>
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-icons text-indigo-500"></i>
                Icône FontAwesome
              </span>
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <i
                    *ngIf="form.controls.icon.value"
                    class="fa-solid text-2xl"
                    [ngClass]="form.controls.icon.value"
                    [style.color]="form.controls.color.value || '#6366f1'"
                  ></i>
                  <i
                    *ngIf="!form.controls.icon.value"
                    class="fa-solid fa-question text-2xl text-gray-400"
                  ></i>
                </div>
                <input
                  type="text"
                  placeholder="fa-palette"
                  class="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-mono text-sm"
                  formControlName="icon"
                />
              </div>
            </div>

            <div class="md:col-span-2">
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-image text-indigo-500"></i>
                Image de couverture (URL)
              </span>
              <input
                type="url"
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                formControlName="image"
                placeholder="https://..."
              />
              <div *ngIf="form.controls.image.value" class="mt-3">
                <img
                  [src]="form.controls.image.value || ''"
                  alt="Aperçu couverture"
                  class="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                />
              </div>
            </div>

            <!-- Bannière spécifique (URL ou fichier) -->
            <div class="md:col-span-2">
              <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i class="fa-solid fa-panorama text-indigo-500"></i>
                Bannière spécifique (URL ou fichier)
              </span>

              <!-- Champ URL -->
              <input
                type="url"
                class="w-full px-4 py-2.5 border-2 rounded-xl mb-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                [class.border-gray-200]="!isInvalid('bannerImage')"
                [class.border-red-500]="isInvalid('bannerImage')"
                placeholder="https://... ou data:image/...;base64,..."
                (change)="onBannerUrlInput($event)"
                [value]="getBannerUrlValue()"
              />

              <!-- Zone drag & drop -->
              <div
                class="relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-6 px-4 text-center cursor-pointer transition-all"
                [class.border-gray-300]="!dragOver"
                [class.border-indigo-500]="dragOver"
                [class.bg-indigo-50]="dragOver"
                (dragover)="onBannerDragOver($event)"
                (dragleave)="onBannerDragLeave($event)"
                (drop)="onBannerDrop($event)"
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  (change)="onBannerFileSelect($event)"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Sélectionner une image de bannière"
                />
                <i
                  class="fa-solid text-4xl mb-2 text-indigo-500"
                  [class.fa-cloud-arrow-up]="!dragOver"
                  [class.fa-file-arrow-up]="dragOver"
                ></i>
                <p class="text-sm text-gray-600">
                  Glissez une image ici ou cliquez pour choisir un fichier
                </p>
                <p class="text-xs text-gray-400 mt-1">Formats : PNG, JPG, WebP</p>
              </div>

              <div *ngIf="isBannerAFile()" class="mt-3 flex items-center gap-3">
                <span class="text-sm text-gray-700 truncate flex-1">
                  <i class="fa-solid fa-file-image text-indigo-500 mr-1"></i>
                  {{ getBannerFileName() }}
                </span>
                <button
                  type="button"
                  (click)="clearBannerFile()"
                  class="text-xs px-3 py-1.5 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Supprimer
                </button>
              </div>

              <!-- Aperçu (⚠️ utilise une URL mémorisée) -->
              <div class="mt-3">
                <ng-container *ngIf="bannerPreviewUrl(); else defaultBanner">
                  <img
                    [src]="bannerPreviewUrl()!"
                    alt="Aperçu bannière"
                    class="w-full h-36 md:h-44 object-cover rounded-xl border-2 border-indigo-200"
                  />
                </ng-container>
                <ng-template #defaultBanner>
                  <div
                    class="w-full h-20 md:h-24 rounded-xl border-2 border-dashed border-gray-300 grid place-items-center bg-gray-50"
                    role="img"
                    aria-label="Bannière par défaut"
                  >
                    <span class="text-xs text-gray-500">Aucune bannière personnalisée</span>
                  </div>
                </ng-template>
              </div>

              <p
                *ngIf="isInvalid('bannerImage')"
                class="text-sm text-red-600 mt-1.5 flex items-center gap-1"
              >
                <i class="fa-solid fa-circle-exclamation"></i>
                Fichier ou URL invalide
              </p>
            </div>

            <div
              class="md:col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4"
            >
              <span class="flex items-center gap-3 cursor-pointer group">
                <div class="relative">
                  <input
                    id="isActive"
                    type="checkbox"
                    formControlName="isActive"
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
                    Catégorie active
                  </span>
                  <p class="text-xs text-gray-600 mt-0.5">
                    Les catégories actives sont visibles sur le site public
                  </p>
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Association produits (legacy) -->
      <div
        *ngIf="subCategories.controls.length === 0"
        class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden"
      >
        <div class="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
              >
                <i class="fa-solid fa-box text-xl text-white"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">Produits associés</h3>
                <p class="text-sm text-orange-100">
                  <i class="fa-solid fa-info-circle mr-1"></i>
                  Association temporaire (jusqu'à création de sous-catégories)
                </p>
              </div>
            </div>
            <input
              type="text"
              [formControl]="productFilterCtrl"
              placeholder="Rechercher un produit..."
              class="px-4 py-2 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
            />
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto pr-2">
            <div
              *ngFor="let p of filteredProducts()"
              (click)="toggleProduct(p.id)"
              (keyup.enter)="toggleProduct(p.id)"
              (keyup.space)="toggleProduct(p.id)"
              tabindex="0"
              role="button"
              [attr.aria-pressed]="hasProduct(p.id)"
              [attr.aria-label]="'Sélectionner le produit ' + p.title"
              class="flex gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400"
              [class.border-orange-500]="hasProduct(p.id)"
              [class.bg-orange-50]="hasProduct(p.id)"
              [class.border-gray-200]="!hasProduct(p.id)"
              [class.hover:border-orange-300]="!hasProduct(p.id)"
            >
              <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img
                  *ngIf="p.images && p.images.length > 0"
                  [src]="p.images[0]"
                  [alt]="p.title"
                  class="w-full h-full object-cover"
                />
                <div
                  *ngIf="!p.images || p.images.length === 0"
                  class="w-full h-full flex items-center justify-center"
                >
                  <i class="fa-solid fa-image text-gray-400"></i>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <h5 class="text-sm font-semibold text-gray-900 truncate">{{ p.title }}</h5>

                    <div class="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <span><i class="fa-solid fa-hashtag"></i>{{ p.id }}</span>

                      <span class="inline-flex items-center gap-1">
                        <i class="fa-solid fa-euro-sign"></i>
                        <ng-container *ngIf="hasDiscount(p); else noDisc1">
                          <span class="font-semibold text-emerald-700">{{ currentPrice(p) }}</span>
                          <span class="line-through text-gray-400">{{ p.originalPrice }}</span>
                        </ng-container>
                        <ng-template #noDisc1>
                          <span>{{ currentPrice(p) }}</span>
                        </ng-template>
                      </span>

                      <span
                        class="px-1.5 py-0.5 rounded"
                        [class.bg-green-100]="p.stock > 0"
                        [class.text-green-700]="p.stock > 0"
                        [class.bg-red-100]="p.stock === 0"
                        [class.text-red-700]="p.stock === 0"
                      >
                        Stock: {{ p.stock }}
                      </span>
                    </div>
                  </div>

                  <div class="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      [checked]="hasProduct(p.id)"
                      (click)="$event.stopPropagation()"
                      (change)="toggleProduct(p.id)"
                      class="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-gray-300 checked:bg-orange-500 checked:border-orange-500 transition-all"
                    />
                    <i
                      class="fa-solid fa-check absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none"
                    ></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="filteredProducts().length === 0" class="text-center py-8">
            <div
              class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3"
            >
              <i class="fa-solid fa-search text-2xl text-gray-400"></i>
            </div>
            <p class="text-gray-600 font-medium">Aucun produit trouvé</p>
            <p class="text-sm text-gray-500 mt-1">Essayez de modifier votre recherche</p>
          </div>
        </div>
      </div>

      <!-- Sous-catégories -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
              >
                <i class="fa-solid fa-layer-group text-xl text-white"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">Sous-catégories</h3>
                <p class="text-sm text-cyan-100">Organisez vos produits en sous-groupes</p>
              </div>
            </div>
            <button
              type="button"
              (click)="addSubCategory()"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-cyan-600 font-semibold hover:bg-cyan-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <i class="fa-solid fa-plus"></i>
              Ajouter
            </button>
          </div>
        </div>

        <div class="p-6">
          <div *ngIf="subCategories.controls.length === 0" class="text-center py-12">
            <div
              class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl mb-4"
            >
              <i class="fa-solid fa-layer-group text-4xl text-cyan-400"></i>
            </div>
            <p class="text-lg font-semibold text-gray-800 mb-2">Aucune sous-catégorie</p>
            <p class="text-sm text-gray-600 mb-4">
              Ajoutez des sous-catégories pour mieux organiser vos produits
            </p>
            <button
              type="button"
              (click)="addSubCategory()"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg"
            >
              <i class="fa-solid fa-plus"></i>
              Créer la première sous-catégorie
            </button>
          </div>

          <div class="space-y-4">
            <div
              *ngFor="let group of subCategories.controls; let i = index"
              [formGroup]="group"
              class="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 p-5 hover:border-cyan-300 transition-all"
            >
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div class="md:col-span-4">
                  <span class="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-tag text-cyan-500"></i>
                    Nom
                  </span>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all"
                    formControlName="name"
                    (input)="onSubNameChange(i)"
                    placeholder="Ex: Huile, Acrylique..."
                  />
                  <p
                    *ngIf="subInvalid(i, 'name')"
                    class="text-xs text-red-600 mt-1.5 flex items-center gap-1"
                  >
                    <i class="fa-solid fa-circle-exclamation"></i>
                    Nom requis (2–60)
                  </p>
                </div>

                <div class="md:col-span-3">
                  <span class="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-link text-cyan-500"></i>
                    Slug
                  </span>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all font-mono text-sm"
                    formControlName="slug"
                    placeholder="huile"
                  />
                  <p
                    *ngIf="subInvalid(i, 'slug')"
                    class="text-xs text-red-600 mt-1.5 flex items-center gap-1"
                  >
                    <i class="fa-solid fa-circle-exclamation"></i>
                    Slug requis (2–80)
                  </p>
                </div>

                <div class="md:col-span-3">
                  <span class="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-align-left text-cyan-500"></i>
                    Description
                  </span>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all"
                    formControlName="description"
                    placeholder="Courte description..."
                  />
                </div>

                <div class="md:col-span-2 flex flex-col gap-2">
                  <span
                    class="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border-2 cursor-pointer group"
                    [class.border-green-500]="group.controls.isActive.value"
                    [class.bg-green-50]="group.controls.isActive.value"
                    [class.border-gray-200]="!group.controls.isActive.value"
                  >
                    <div class="relative">
                      <input
                        type="checkbox"
                        formControlName="isActive"
                        class="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-gray-300 checked:bg-green-500 checked:border-green-500 transition-all"
                      />
                      <i
                        class="fa-solid fa-check absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none"
                      ></i>
                    </div>
                    <span class="text-xs font-medium">Active</span>
                  </span>

                  <button
                    type="button"
                    (click)="removeSubCategory(i)"
                    class="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200 transition-all font-semibold text-xs"
                    [title]="
                      group.controls.id.value
                        ? 'Suppression appliquée lors de la sauvegarde'
                        : 'Retirer'
                    "
                  >
                    <i class="fa-solid fa-trash"></i>
                    Supprimer
                  </button>
                </div>
              </div>

              <div
                *ngIf="subSlugDuplicateError()"
                class="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg"
              >
                <p class="text-xs text-red-700 flex items-center gap-2 font-semibold">
                  <i class="fa-solid fa-circle-exclamation"></i>
                  Le slug doit être unique parmi les sous-catégories
                </p>
              </div>

              <!-- Produits de la sous-catégorie -->
              <div class="mt-5 pt-5 border-t-2 border-cyan-200">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="font-semibold text-gray-800 flex items-center gap-2">
                    <i class="fa-solid fa-box text-cyan-500"></i>
                    Produits de cette sous-catégorie
                    <span class="text-xs font-normal text-gray-500">
                      ({{ getSubCategoryProductIds(i).length }})
                    </span>
                  </h4>
                  <input
                    type="text"
                    [value]="subProductSearchTerms[i] || ''"
                    (input)="setSubProductSearchTerm(i, $event)"
                    placeholder="Rechercher..."
                    class="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-xs focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto pr-2">
                  <div
                    *ngFor="let p of getFilteredProductsForSubCategory(i)"
                    (click)="toggleSubCategoryProduct(i, p.id)"
                    (keyup.enter)="toggleSubCategoryProduct(i, p.id)"
                    (keyup.space)="toggleSubCategoryProduct(i, p.id)"
                    tabindex="0"
                    role="button"
                    [attr.aria-pressed]="hasSubCategoryProduct(i, p.id)"
                    [attr.aria-label]="
                      'Sélectionner le produit ' + p.title + ' pour cette sous-catégorie'
                    "
                    class="flex gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    [class.border-cyan-500]="hasSubCategoryProduct(i, p.id)"
                    [class.bg-cyan-50]="hasSubCategoryProduct(i, p.id)"
                    [class.border-gray-200]="!hasSubCategoryProduct(i, p.id)"
                    [class.hover:border-cyan-300]="!hasSubCategoryProduct(i, p.id)"
                  >
                    <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        *ngIf="p.images && p.images.length > 0"
                        [src]="p.images[0]"
                        [alt]="p.title"
                        class="w-full h-full object-cover"
                      />
                      <div
                        *ngIf="!p.images || p.images.length === 0"
                        class="w-full h-full flex items-center justify-center"
                      >
                        <i class="fa-solid fa-image text-gray-400"></i>
                      </div>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                          <h5 class="text-sm font-semibold text-gray-900 truncate">
                            {{ p.title }}
                          </h5>

                          <div class="flex items-center gap-2 mt-1 text-xs text-gray-600">
                            <span><i class="fa-solid fa-hashtag"></i>{{ p.id }}</span>

                            <span class="inline-flex items-center gap-1">
                              <i class="fa-solid fa-euro-sign"></i>
                              <ng-container *ngIf="hasDiscount(p); else noDisc2">
                                <span class="font-semibold text-emerald-700">{{
                                  currentPrice(p)
                                }}</span>
                                <span class="line-through text-gray-400">{{
                                  p.originalPrice
                                }}</span>
                              </ng-container>
                              <ng-template #noDisc2>
                                <span>{{ currentPrice(p) }}</span>
                              </ng-template>
                            </span>

                            <span
                              class="px-1.5 py-0.5 rounded"
                              [class.bg-green-100]="p.stock > 0"
                              [class.text-green-700]="p.stock > 0"
                              [class.bg-red-100]="p.stock === 0"
                              [class.text-red-700]="p.stock === 0"
                            >
                              Stock: {{ p.stock }}
                            </span>
                          </div>
                        </div>

                        <div class="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            [checked]="hasSubCategoryProduct(i, p.id)"
                            (click)="$event.stopPropagation()"
                            (change)="toggleSubCategoryProduct(i, p.id)"
                            class="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-gray-300 checked:bg-cyan-500 checked:border-cyan-500 transition-all"
                          />
                          <i
                            class="fa-solid fa-check absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none"
                          ></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  *ngIf="getFilteredProductsForSubCategory(i).length === 0"
                  class="text-center py-8 bg-gray-50 rounded-xl"
                >
                  <i class="fa-solid fa-search text-3xl text-gray-300 mb-2"></i>
                  <p class="text-sm text-gray-500">Aucun produit trouvé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Aperçu & récap -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-eye text-xl text-white"></i>
            </div>
            <h3 class="text-lg font-bold text-white">Aperçu</h3>
          </div>
        </div>

        <div class="p-6 space-y-3">
          <div class="flex items-center gap-3 text-sm">
            <span class="font-semibold text-gray-700 min-w-[100px]">
              <i class="fa-solid fa-link text-purple-500 mr-2"></i>
              URL finale :
            </span>
            <code
              class="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-mono border border-purple-200"
            >
              {{ form.controls.slug.value || '—' }}
            </code>
          </div>

          <div *ngIf="form.controls.color.value" class="flex items-center gap-3 text-sm">
            <span class="font-semibold text-gray-700 min-w-[100px]">
              <i class="fa-solid fa-palette text-purple-500 mr-2"></i>
              Couleur :
            </span>
            <div class="flex items-center gap-2">
              <span
                class="inline-block w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm"
                [style.background]="form.controls.color.value"
              ></span>
              <code
                class="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-mono border border-purple-200"
              >
                {{ form.controls.color.value }}
              </code>
            </div>
          </div>

          <div *ngIf="form.controls.icon.value" class="flex items-center gap-3 text-sm">
            <span class="font-semibold text-gray-700 min-w-[100px]">
              <i class="fa-solid fa-icons text-purple-500 mr-2"></i>
              Icône :
            </span>
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-200"
              >
                <i
                  class="fa-solid text-lg"
                  [ngClass]="form.controls.icon.value"
                  [style.color]="form.controls.color.value || '#a855f7'"
                ></i>
              </div>
              <code
                class="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-mono border border-purple-200"
              >
                {{ form.controls.icon.value }}
              </code>
            </div>
          </div>

          <div class="flex items-center gap-3 text-sm" *ngIf="form.controls.bannerImage.value">
            <span class="font-semibold text-gray-700 min-w-[100px]">
              <i class="fa-solid fa-panorama text-purple-500 mr-2"></i>
              Bannière :
            </span>
            <code
              class="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-mono border border-purple-200 truncate"
              [title]="getBannerDisplayLabel()"
            >
              {{ getBannerDisplayLabel() }}
            </code>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div
        class="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4 -mx-6 -mb-6 rounded-b-2xl shadow-2xl"
      >
        <div class="flex justify-between items-center gap-4">
          <div class="text-sm text-gray-600">
            <i class="fa-solid fa-info-circle text-gray-400 mr-1"></i>
            Les modifications seront enregistrées dans la base de données
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              (click)="cancelEvent.emit()"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all border-2 border-gray-200"
            >
              <i class="fa-solid fa-times"></i>
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || submitting"
              class="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              [class.bg-gradient-to-r]="!form.invalid && !submitting"
              [class.from-green-500]="!form.invalid && !submitting"
              [class.to-emerald-600]="!form.invalid && !submitting"
              [class.hover:from-green-600]="!form.invalid && !submitting"
              [class.hover:to-emerald-700]="!form.invalid && !submitting"
              [class.bg-gray-300]="form.invalid || submitting"
            >
              <i
                class="fa-solid"
                [class.fa-save]="!submitting"
                [class.fa-spinner]="submitting"
                [class.fa-spin]="submitting"
              ></i>
              {{ submitting ? 'Enregistrement...' : submitLabel }}
            </button>
          </div>
        </div>
      </div>
    </form>
  `,
})
export class CategoryFormComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly catSvc = inject(CategoryService);
  private readonly productSvc = inject(ProductService);
  private readonly toast = inject(ToastService);

  @Input() initial?: Category | null;
  @Input() submitLabel = 'Enregistrer';

  @Output() save = new EventEmitter<CategorySavePayload>();
  @Output() cancelEvent = new EventEmitter<void>();

  submitting = false;
  allProducts: Product[] = [];

  productFilterCtrl = new FormControl<string>('', { nonNullable: true });
  subProductSearchTerms: Record<number, string> = {};
  private deletedSubIds = new Set<number>();

  detailsOpen = signal(false);

  // 👇 Prévisualisation bannière mémorisée (évite NG0100)
  bannerPreviewUrl = signal<string | null>(null);
  private lastBlobUrl: string | null = null;

  form: CategoryFormGroup = this.fb.group<CategoryFormControls>({
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
    color: this.fb.control<string | null>(null),
    icon: this.fb.control<string | null>(null),
    image: this.fb.control<string | null>(null),

    bannerImage: this.fb.control<string | File | null>(null, {
      validators: [
        (ctrl: AbstractControl<string | File | null>): ValidationErrors | null => {
          const v = ctrl.value;
          if (!v) return null;
          if (typeof v === 'string') {
            const http = /^(https?:\/\/)([\w-]+\.)?[\w-]+(\.[\w-]+)+(\/[^\s]*)?$/i;
            const data = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i;
            return http.test(v.trim()) || data.test(v.trim()) ? null : { url: true };
          }
          if (v instanceof File) {
            const allowed = ['image/png', 'image/jpeg', 'image/webp'];
            return allowed.includes(v.type) ? null : { fileType: true };
          }
          return { invalid: true };
        },
      ],
    }),

    isActive: this.fb.nonNullable.control(true),
    productIds: this.fb.array<FormControl<number>>([]),
    subCategories: this.fb.array<FormGroup<SubCategoryControls>>([]),
  });

  async ngOnInit(): Promise<void> {
    this.allProducts = await this.productSvc.getAll();

    // maj preview à chaque changement de control
    this.form.controls.bannerImage.valueChanges.subscribe((v) => {
      this.updateBannerPreviewFromValue(v);
    });

    this.subCategories.addValidators(this.uniqueSubSlugValidator.bind(this));
    this.subCategories.updateValueAndValidity({ emitEvent: false });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initial']) {
      this.form.reset();
      this.productIds.clear();
      this.subCategories.clear();
      this.deletedSubIds.clear();

      const v = this.initial ?? null;
      if (v) {
        this.form.patchValue({
          name: v.name ?? '',
          slug: v.slug ?? '',
          description: v.description ?? null,
          color: v.color ?? null,
          icon: v.icon ?? null,
          image: v.image ?? null,
          bannerImage: v.bannerImage ?? null,
          isActive: v.isActive ?? true,
        });

        (v.productIds ?? []).forEach((pid) =>
          this.productIds.push(this.fb.nonNullable.control(pid))
        );

        (v.subCategories ?? []).forEach((s) => {
          const productIdsArray = this.fb.array<FormControl<number>>([]);
          (s.productIds ?? []).forEach((pid) =>
            productIdsArray.push(this.fb.nonNullable.control(pid))
          );

          this.subCategories.push(
            this.fb.group<SubCategoryControls>({
              id: this.fb.control<number | null>(s.id, { nonNullable: false }),
              name: this.fb.nonNullable.control(s.name, [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(60),
              ]),
              slug: this.fb.nonNullable.control(s.slug, [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(80),
              ]),
              description: this.fb.control<string | null>(s.description ?? null),
              isActive: this.fb.nonNullable.control(s.isActive),
              productIds: productIdsArray,
            })
          );
        });
      } else {
        this.form.controls.slug.setValue('');
        // reset preview si pas d'initial
        this.updateBannerPreviewFromValue(null);
      }

      // (re)valider l'unicité des slugs
      this.subCategories.setValidators(this.uniqueSubSlugValidator.bind(this));
      this.subCategories.updateValueAndValidity({ emitEvent: false });

      // maj preview à partir de la valeur initiale (si fournie)
      this.updateBannerPreviewFromValue(this.form.controls.bannerImage.value);
    }
  }

  // ===== Accessors
  get productIds(): FormArray<FormControl<number>> {
    return this.form.controls.productIds;
  }
  get subCategories(): FormArray<FormGroup<SubCategoryControls>> {
    return this.form.controls.subCategories;
  }

  // ===== Validators helpers
  isInvalid(name: keyof CategoryFormControls): boolean {
    const c = this.form.get(name as string);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
  subInvalid(index: number, name: keyof SubCategoryControls): boolean {
    const group = this.subCategories.at(index);
    const c = group.get(name as string);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
  private uniqueSubSlugValidator(ctrl: AbstractControl): ValidationErrors | null {
    const arr = ctrl as FormArray<FormGroup<SubCategoryControls>>;
    const slugs: string[] = [];
    for (const g of arr.controls) {
      const slug = (g.controls.slug.value ?? '').trim().toLowerCase();
      if (slug.length === 0) return { subSlugEmpty: true };
      slugs.push(slug);
    }
    const set = new Set(slugs);
    if (set.size !== slugs.length) return { subSlugDuplicate: true };
    return null;
  }
  subSlugDuplicateError(): boolean {
    const errors = this.subCategories.errors;
    return !!errors && 'subSlugDuplicate' in errors;
  }

  // ===== UI handlers (slug auto)
  onNameChange(): void {
    const name = this.form.controls.name.value ?? '';
    if (!this.initial) {
      const slug = this.catSvc.slugify(name);
      this.form.controls.slug.setValue(slug);
    }
  }
  onSubNameChange(index: number): void {
    const group = this.subCategories.at(index);
    if (!group) return;
    const id = group.controls.id.value;
    const name = group.controls.name.value ?? '';
    const currentSlug = group.controls.slug.value ?? '';
    const auto = this.catSvc.slugify(name);
    if (!id && (!currentSlug || currentSlug.length < 2)) {
      group.controls.slug.setValue(auto);
    }
  }

  addSubCategory(): void {
    this.subCategories.push(
      this.fb.group<SubCategoryControls>({
        id: this.fb.control<number | null>(null),
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
        productIds: this.fb.array<FormControl<number>>([]),
      })
    );
    this.subCategories.updateValueAndValidity({ emitEvent: false });
  }
  removeSubCategory(index: number): void {
    const g = this.subCategories.at(index);
    const id = g.controls.id.value;
    if (typeof id === 'number') {
      this.deletedSubIds.add(id);
    }
    this.subCategories.removeAt(index);
    this.subCategories.updateValueAndValidity({ emitEvent: false });
  }

  // ===== Produits (category level)
  hasProduct(id: number): boolean {
    return this.productIds.controls.some((c) => c.value === id);
  }
  toggleProduct(id: number): void {
    const idx = this.productIds.controls.findIndex((c) => c.value === id);
    if (idx >= 0) this.productIds.removeAt(idx);
    else this.productIds.push(this.fb.nonNullable.control(id));
  }
  filteredProducts(): Product[] {
    if (!this.allProducts || this.allProducts.length === 0) return [];
    const q = this.productFilterCtrl.value.trim().toLowerCase();
    let products = [...this.allProducts];
    if (q) {
      products = products.filter(
        (p) => p.title.toLowerCase().includes(q) || String(p.id).includes(q)
      );
    }
    const selectedIds = new Set(this.productIds.controls.map((c) => c.value));
    return products.sort((a, b) => {
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }

  // ===== Produits (subcategory level)
  getSubCategoryProductIds(index: number): FormArray<FormControl<number>> {
    const group = this.subCategories.at(index);
    return group.controls.productIds;
  }
  hasSubCategoryProduct(subIndex: number, productId: number): boolean {
    const productIds = this.getSubCategoryProductIds(subIndex);
    return productIds.controls.some((c) => c.value === productId);
  }
  toggleSubCategoryProduct(subIndex: number, productId: number): void {
    const productIds = this.getSubCategoryProductIds(subIndex);
    const idx = productIds.controls.findIndex((c) => c.value === productId);
    if (idx >= 0) productIds.removeAt(idx);
    else productIds.push(this.fb.nonNullable.control(productId));
  }
  setSubProductSearchTerm(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.subProductSearchTerms[index] = value;
  }
  getFilteredProductsForSubCategory(index: number): Product[] {
    const searchTerm = (this.subProductSearchTerms[index] || '').trim().toLowerCase();
    let products = this.allProducts;
    if (searchTerm) {
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm) ||
          String(p.id).includes(searchTerm) ||
          (p.technique && p.technique.toLowerCase().includes(searchTerm))
      );
    }
    const productIds = this.getSubCategoryProductIds(index);
    const selectedIds = new Set(productIds.controls.map((c) => c.value));
    return products.sort((a, b) => {
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }

  // ===== Prix helpers (template)
  currentPrice(p: Product): number {
    return p.reducedPrice ?? p.originalPrice;
  }
  hasDiscount(p: Product): boolean {
    return !!p.reducedPrice && p.reducedPrice < p.originalPrice;
  }

  // ===== File -> data URL (pour persister dans la mock API / localStorage)
  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Lecture du fichier échouée'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  // ===== Submit (normalise bannerImage en string http(s) OU data URL)
  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();

    const errors: string[] = [];
    if (this.form.controls.name.invalid) errors.push('❌ Nom requis (2-60 caractères)');
    if (this.form.controls.slug.invalid) errors.push('❌ Slug requis (format: minuscules-tirets)');

    this.subCategories.controls.forEach((sub, index) => {
      if (sub.controls.name.invalid) errors.push(`❌ Sous-catégorie ${index + 1}: Nom requis`);
      if (sub.controls.slug.invalid) errors.push(`❌ Sous-catégorie ${index + 1}: Slug requis`);
    });

    if (errors.length > 0) {
      const errorMessage = '⚠️ Erreurs dans le formulaire:\n\n' + errors.join('\n');
      this.toast.error(errorMessage);
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    this.submitting = true;

    const v = this.form.getRawValue();
    const bannerValue = v.bannerImage as string | File | null;

    let bannerImageOut: string | undefined;
    try {
      if (typeof bannerValue === 'string') {
        bannerImageOut = bannerValue.trim() || undefined;
      } else if (bannerValue instanceof File) {
        bannerImageOut = await this.readFileAsDataUrl(bannerValue);
      }
    } catch {
      this.toast.error("Impossible de traiter l'image de bannière.");
      this.submitting = false;
      return;
    }

    const categoryPatch: Partial<Category> = {
      name: v.name,
      slug: v.slug,
      description: v.description ?? undefined,
      color: v.color ?? undefined,
      icon: v.icon ?? undefined,
      image: v.image ?? undefined,
      bannerImage: bannerImageOut,
      isActive: v.isActive,
      productIds: v.productIds,
    };

    const currentSubs = this.subCategories.getRawValue();
    const toCreate = currentSubs
      .filter((s) => !s.id)
      .map((s) => ({
        name: s.name,
        slug: s.slug,
        description: s.description ?? undefined,
        isActive: s.isActive,
        productIds: s.productIds ?? [],
      }));
    const toUpdate = currentSubs
      .filter(
        (
          s
        ): s is {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          isActive: boolean;
          productIds: number[];
        } => typeof s.id === 'number'
      )
      .map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description ?? undefined,
        isActive: s.isActive,
        productIds: s.productIds ?? [],
      }));
    const toDeleteIds = Array.from(this.deletedSubIds);

    const payload: CategorySavePayload = {
      category: categoryPatch,
      subCategories: { toCreate, toUpdate, toDeleteIds },
    };

    this.save.emit(payload);
    this.submitting = false;
  }

  // ===== Checklist & progression (UX)
  checklist(): ChecklistItem[] {
    const f = this.form;

    const nameOk = !!f.controls.name.valid;
    const slugOk = !!f.controls.slug.valid;
    const descriptionOk = Boolean(
      f.controls.description.value && f.controls.description.value.trim()
    );
    const colorOk = Boolean(f.controls.color.value && f.controls.color.value.trim());
    const iconOk = Boolean(f.controls.icon.value && f.controls.icon.value.trim());
    const imageOk = Boolean(f.controls.image.value && f.controls.image.value.trim());

    const bv = f.controls.bannerImage.value;
    const bannerOk = Boolean(
      (typeof bv === 'string' && bv.trim()) ||
        (bv && typeof File !== 'undefined' && bv instanceof File)
    );

    const subCategoriesOk = Boolean(
      this.subCategories.length === 0 ||
        this.subCategories.controls.every(
          (sub: FormGroup<SubCategoryControls>) =>
            sub.controls.name.valid && sub.controls.slug.valid
        )
    );

    const items: ChecklistItem[] = [
      { key: 'name', label: 'Nom', done: nameOk },
      { key: 'slug', label: 'Slug', done: slugOk },
      { key: 'color', label: 'Couleur', done: colorOk },
      { key: 'icon', label: 'Icône', done: iconOk },
      { key: 'description', label: 'Description', done: descriptionOk, optional: true },
      { key: 'image', label: 'Image de couverture', done: imageOk, optional: true },
      { key: 'bannerImage', label: 'Bannière spécifique', done: bannerOk, optional: true },
      { key: 'subCategories', label: 'Sous-catégories', done: subCategoriesOk, optional: true },
    ];

    return items;
  }
  checklistDoneCount(): number {
    return this.checklist().filter((i) => i.done).length;
  }
  checklistTotalCount(): number {
    return this.checklist().length;
  }
  progress(): number {
    const f = this.form;
    const checks: boolean[] = [];
    checks.push(f.controls.name.valid);
    checks.push(f.controls.slug.valid);
    checks.push(!!(f.controls.color.value && f.controls.color.value.trim()));
    checks.push(!!(f.controls.icon.value && f.controls.icon.value.trim()));
    checks.push(!this.subSlugDuplicateError());

    const bv2 = f.controls.bannerImage.value;
    if (
      (typeof bv2 === 'string' && !!bv2.trim()) ||
      (bv2 && typeof File !== 'undefined' && bv2 instanceof File)
    ) {
      checks.push(f.controls.bannerImage.valid);
    }
    const image = f.controls.image.value?.trim();
    if (image) checks.push(f.controls.image.valid);

    if (this.subCategories.length > 0) {
      const subsValid = this.subCategories.controls.every(
        (sub: FormGroup<SubCategoryControls>) => sub.controls.name.valid && sub.controls.slug.valid
      );
      checks.push(subsValid);
    }

    const done = checks.filter(Boolean).length;
    const total = checks.length || 1;
    const percent = Math.round((done / total) * 100);
    return Math.min(100, Math.max(0, percent));
  }
  readyToPost(): boolean {
    return this.progress() === 100;
  }

  // ===== Bannière : URL + Fichier + Preview (sans NG0100)
  onBannerUrlInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.form.controls.bannerImage.setValue(value || null);
    this.updateBannerPreviewFromValue(value || null);
  }

  onBannerFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    this.form.controls.bannerImage.setValue(file);
    this.updateBannerPreviewFromValue(file);
  }

  clearBannerFile(): void {
    this.form.controls.bannerImage.setValue(null);
    this.updateBannerPreviewFromValue(null);
  }

  getBannerUrlValue(): string {
    const v = this.form.controls.bannerImage.value;
    return typeof v === 'string' ? v : '';
  }

  isBannerAFile(): boolean {
    const v = this.form.controls.bannerImage.value;
    return !!v && typeof File !== 'undefined' && v instanceof File;
  }

  getBannerFileName(): string {
    const v = this.form.controls.bannerImage.value;
    return this.isBannerAFile() ? (v as File).name : '';
  }

  getBannerDisplayLabel(): string {
    const v = this.form.controls.bannerImage.value;
    if (typeof v === 'string') return v;
    if (this.isBannerAFile()) return (v as File).name;
    return '';
  }

  // Drag & drop bannière
  dragOver = false;
  onBannerDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }
  onBannerDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }
  onBannerDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    const file = event.dataTransfer?.files?.[0] ?? null;
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.toast.error('Format non supporté (PNG, JPG ou WebP uniquement)');
      return;
    }
    this.form.controls.bannerImage.setValue(file);
    this.updateBannerPreviewFromValue(file);
  }

  /**
   * Met à jour l’URL de prévisualisation de façon *stable* pour éviter NG0100.
   * - Révoque l’ancien blob URL si nécessaire
   * - Utilise un microtask pour setter le signal en dehors du cycle en cours
   */
  private updateBannerPreviewFromValue(v: string | File | null): void {
    // Révoquer l’ancien blob URL au besoin
    if (this.lastBlobUrl) {
      URL.revokeObjectURL(this.lastBlobUrl);
      this.lastBlobUrl = null;
    }

    let nextUrl: string | null = null;

    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed) {
        nextUrl = trimmed; // http(s) ou data URL
      }
    } else if (v && v instanceof File) {
      nextUrl = URL.createObjectURL(v);
      this.lastBlobUrl = nextUrl;
    }

    // Déplacer la mise à jour après le cycle courant
    queueMicrotask(() => this.bannerPreviewUrl.set(nextUrl));
  }

  // ===== Cleanup
  ngOnDestroy(): void {
    if (this.lastBlobUrl) {
      URL.revokeObjectURL(this.lastBlobUrl);
      this.lastBlobUrl = null;
    }
  }
}
