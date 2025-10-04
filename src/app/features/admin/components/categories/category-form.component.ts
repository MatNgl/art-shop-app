// src/app/features/admin/components/categories/category-form.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
  inject,
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

/** Payload émis par le formulaire (catégorie + diff sous-catégories) */
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

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6" novalidate>
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
                />
                <input
                  type="text"
                  placeholder="#3b82f6"
                  class="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-mono text-sm"
                  formControlName="color"
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
                  [src]="form.controls.image.value"
                  alt="Aperçu"
                  class="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                />
              </div>
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

      <!-- Association produits (legacy - affiché seulement si aucune sous-catégorie) -->
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
              <!-- Photo produit -->
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

              <!-- Infos produit -->
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

                  <!-- Checkbox -->
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

              <!-- Erreur d'unicité des slugs -->
              <div
                *ngIf="subSlugDuplicateError()"
                class="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg"
              >
                <p class="text-xs text-red-700 flex items-center gap-2 font-semibold">
                  <i class="fa-solid fa-circle-exclamation"></i>
                  Le slug doit être unique parmi les sous-catégories
                </p>
              </div>

              <!-- Gestion des produits de la sous-catégorie -->
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

                <!-- Liste des produits avec photos -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto pr-2">
                  <div
                    *ngFor="let p of getFilteredProductsForSubCategory(i)"
                    (click)="toggleSubCategoryProduct(i, p.id)"
                    (keyup.enter)="toggleSubCategoryProduct(i, p.id)"
                    (keyup.space)="toggleSubCategoryProduct(i, p.id)"
                    tabindex="0"
                    role="button"
                    [attr.aria-pressed]="hasSubCategoryProduct(i, p.id)"
                    [attr.aria-label]="'Sélectionner le produit ' + p.title + ' pour cette sous-catégorie'"
                    class="flex gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    [class.border-cyan-500]="hasSubCategoryProduct(i, p.id)"
                    [class.bg-cyan-50]="hasSubCategoryProduct(i, p.id)"
                    [class.border-gray-200]="!hasSubCategoryProduct(i, p.id)"
                    [class.hover:border-cyan-300]="!hasSubCategoryProduct(i, p.id)"
                  >
                    <!-- Photo produit -->
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

                    <!-- Infos produit -->
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

                        <!-- Checkbox -->
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

                <!-- Empty state -->
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

      <!-- Aperçu et récapitulatif -->
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
export class CategoryFormComponent implements OnInit, OnChanges {
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
    isActive: this.fb.nonNullable.control(true),
    productIds: this.fb.array<FormControl<number>>([]),
    subCategories: this.fb.array<FormGroup<SubCategoryControls>>([]), // validator ajouté après init
  });

  async ngOnInit(): Promise<void> {
    this.allProducts = await this.productSvc.getAllProducts();
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
      }

      this.subCategories.setValidators(this.uniqueSubSlugValidator.bind(this));
      this.subCategories.updateValueAndValidity({ emitEvent: false });
    }
  }

  // Accessors
  get productIds(): FormArray<FormControl<number>> {
    return this.form.controls.productIds;
  }
  get subCategories(): FormArray<FormGroup<SubCategoryControls>> {
    return this.form.controls.subCategories;
  }

  // Validators helpers
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

  // UI handlers
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

  // Produits helpers (category level - legacy)
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

  // Produits helpers (subcategory level)
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

  // Prix helpers utilisés en template
  currentPrice(p: Product): number {
    return p.reducedPrice ?? p.originalPrice;
  }
  hasDiscount(p: Product): boolean {
    return !!p.reducedPrice && p.reducedPrice < p.originalPrice;
  }

  // Submit
  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    this.form.markAllAsTouched();

    // Collect all errors
    const errors: string[] = [];

    if (this.form.controls.name.invalid) {
      errors.push('❌ Nom requis (2-60 caractères)');
    }

    if (this.form.controls.slug.invalid) {
      errors.push('❌ Slug requis (format: minuscules-tirets)');
    }

    // Check subcategories
    this.subCategories.controls.forEach((sub, index) => {
      if (sub.controls.name.invalid) {
        errors.push(`❌ Sous-catégorie ${index + 1}: Nom requis`);
      }
      if (sub.controls.slug.invalid) {
        errors.push(`❌ Sous-catégorie ${index + 1}: Slug requis`);
      }
    });

    if (errors.length > 0) {
      const errorMessage = '⚠️ Erreurs dans le formulaire:\n\n' + errors.join('\n');
      this.toast.error(errorMessage);
      console.error('Form validation errors:', errors);

      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    this.submitting = true;

    const v = this.form.getRawValue();

    const categoryPatch: Partial<Category> = {
      name: v.name,
      slug: v.slug,
      description: v.description ?? undefined,
      color: v.color ?? undefined,
      icon: v.icon ?? undefined,
      image: v.image ?? undefined,
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
}
