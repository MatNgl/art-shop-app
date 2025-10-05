import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PromotionService } from '../services/promotion.service';
import { CategoryService } from '../../catalog/services/category';
import { ProductService } from '../../catalog/services/product';
import { ToastService } from '../../../shared/services/toast.service';
import { PromotionInput } from '../models/promotion.model';
import { Category } from '../../catalog/models/category.model';
import { Product } from '../../catalog/models/product.model';

@Component({
  selector: 'app-promotion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  styleUrls: ['./promotion-form.component.scss'],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
      <!-- Header avec dégradé orange -->
      <div class="bg-gradient-to-r from-orange-600 to-red-600 shadow-xl">
        <div class="max-w-5xl mx-auto px-6 py-8">
          <!-- Breadcrumb -->
          <nav class="text-sm text-orange-100 mb-4 flex items-center gap-2">
            <a
              routerLink="/admin/dashboard"
              class="hover:text-white transition-colors flex items-center gap-1"
            >
              <i class="fa-solid fa-home text-xs"></i>
              Dashboard
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <a routerLink="/admin/promotions" class="hover:text-white transition-colors">
              Promotions
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <span class="text-white font-medium">{{ isEditMode() ? 'Modifier' : 'Nouvelle' }}</span>
          </nav>

          <!-- Titre avec icône -->
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
            >
              <i
                class="fa-solid {{
                  isEditMode() ? 'fa-pen-to-square' : 'fa-plus'
                }} text-3xl text-white"
              ></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">
                {{ isEditMode() ? 'Modifier la promotion' : 'Nouvelle promotion' }}
              </h1>
              <p class="text-orange-100">
                {{
                  isEditMode()
                    ? 'Modifiez les paramètres de votre promotion'
                    : 'Créez une nouvelle promotion pour vos clients'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu -->
      <div class="max-w-5xl mx-auto px-6 py-8">
        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="pf-form space-y-6">
          <!-- Barre de progression sticky -->
          <div
            class="pf-progress-sticky bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 shadow-sm rounded-2xl"
            role="region"
            aria-label="Préparation de la promotion"
          >
            <div class="px-4 py-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">
                  <i class="fa-solid fa-gauge-high text-orange-600 mr-1"></i>
                  Préparation de la promotion
                </span>
                <div class="flex items-center gap-3">
                  <span
                    class="text-sm font-semibold"
                    [class.text-green-600]="progress() === 100"
                    [class.text-orange-600]="progress() !== 100"
                  >
                    {{ progress() }}%
                  </span>
                  <button
                    type="button"
                    (click)="toggleProgressDetails()"
                    class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                  >
                    <i
                      class="fa-solid"
                      [class.fa-chevron-down]="!progressDetailsOpen()"
                      [class.fa-chevron-up]="progressDetailsOpen()"
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
                  [class.bg-green-500]="progress() === 100"
                  [class.bg-orange-500]="progress() !== 100"
                  [style.width.%]="progress()"
                ></div>
              </div>

              <div class="mt-2 flex items-start justify-between">
                <p
                  class="text-xs"
                  [class.text-green-700]="progress() === 100"
                  [class.text-gray-500]="progress() !== 100"
                >
                  @if (progress() === 100) { Prêt à être enregistré 🎉 } @else { Complétez les
                  champs requis pour atteindre 100%. }
                </p>
                <span class="text-xs text-gray-600 font-medium">
                  {{ completedFields() }}/{{ totalFields() }}
                </span>
              </div>

              @if (progressDetailsOpen()) {
              <div class="mt-3 border-t pt-3">
                <ul class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <li
                    class="flex items-center gap-2 rounded-lg px-2.5 py-2 border"
                    [class.border-green-200]="form.get('name')?.valid"
                    [class.bg-green-50]="form.get('name')?.valid"
                    [class.border-gray-200]="!form.get('name')?.valid"
                    [class.bg-gray-50]="!form.get('name')?.valid"
                  >
                    <i
                      class="fa-solid text-xs"
                      [class.fa-check]="form.get('name')?.valid"
                      [class.fa-xmark]="!form.get('name')?.valid"
                      [class.text-green-600]="form.get('name')?.valid"
                      [class.text-gray-400]="!form.get('name')?.valid"
                    ></i>
                    <span class="text-xs">Nom</span>
                  </li>
                  <li
                    class="flex items-center gap-2 rounded-lg px-2.5 py-2 border"
                    [class.border-green-200]="form.get('type')?.valid"
                    [class.bg-green-50]="form.get('type')?.valid"
                    [class.border-gray-200]="!form.get('type')?.valid"
                    [class.bg-gray-50]="!form.get('type')?.valid"
                  >
                    <i
                      class="fa-solid text-xs"
                      [class.fa-check]="form.get('type')?.valid"
                      [class.fa-xmark]="!form.get('type')?.valid"
                      [class.text-green-600]="form.get('type')?.valid"
                      [class.text-gray-400]="!form.get('type')?.valid"
                    ></i>
                    <span class="text-xs">Type</span>
                  </li>
                  <li
                    class="flex items-center gap-2 rounded-lg px-2.5 py-2 border"
                    [class.border-green-200]="isCodeValid()"
                    [class.bg-green-50]="isCodeValid()"
                    [class.border-gray-200]="!isCodeValid()"
                    [class.bg-gray-50]="!isCodeValid()"
                  >
                    <i
                      class="fa-solid text-xs"
                      [class.fa-check]="isCodeValid()"
                      [class.fa-xmark]="!isCodeValid()"
                      [class.text-green-600]="isCodeValid()"
                      [class.text-gray-400]="!isCodeValid()"
                    ></i>
                    <span class="text-xs">Code promo</span>
                  </li>
                  <li
                    class="flex items-center gap-2 rounded-lg px-2.5 py-2 border"
                    [class.border-green-200]="form.get('discountValue')?.valid"
                    [class.bg-green-50]="form.get('discountValue')?.valid"
                    [class.border-gray-200]="!form.get('discountValue')?.valid"
                    [class.bg-gray-50]="!form.get('discountValue')?.valid"
                  >
                    <i
                      class="fa-solid text-xs"
                      [class.fa-check]="form.get('discountValue')?.valid"
                      [class.fa-xmark]="!form.get('discountValue')?.valid"
                      [class.text-green-600]="form.get('discountValue')?.valid"
                      [class.text-gray-400]="!form.get('discountValue')?.valid"
                    ></i>
                    <span class="text-xs">Réduction</span>
                  </li>
                  <li
                    class="flex items-center gap-2 rounded-lg px-2.5 py-2 border"
                    [class.border-green-200]="isScopeValid()"
                    [class.bg-green-50]="isScopeValid()"
                    [class.border-gray-200]="!isScopeValid()"
                    [class.bg-gray-50]="!isScopeValid()"
                  >
                    <i
                      class="fa-solid text-xs"
                      [class.fa-check]="isScopeValid()"
                      [class.fa-xmark]="!isScopeValid()"
                      [class.text-green-600]="isScopeValid()"
                      [class.text-gray-400]="!isScopeValid()"
                    ></i>
                    <span class="text-xs">Portée</span>
                  </li>
                  <li
                    class="flex items-center gap-2 rounded-lg px-2.5 py-2 border"
                    [class.border-green-200]="form.get('startDate')?.valid"
                    [class.bg-green-50]="form.get('startDate')?.valid"
                    [class.border-gray-200]="!form.get('startDate')?.valid"
                    [class.bg-gray-50]="!form.get('startDate')?.valid"
                  >
                    <i
                      class="fa-solid text-xs"
                      [class.fa-check]="form.get('startDate')?.valid"
                      [class.fa-xmark]="!form.get('startDate')?.valid"
                      [class.text-green-600]="form.get('startDate')?.valid"
                      [class.text-gray-400]="!form.get('startDate')?.valid"
                    ></i>
                    <span class="text-xs">Date début</span>
                  </li>
                </ul>
              </div>
              }
            </div>
          </div>

          <!-- Informations générales -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
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
              <!-- Nom -->
              <div>
                <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i class="fa-solid fa-tag text-orange-500"></i>
                  Nom de la promotion <span class="text-red-500">*</span>
                </span>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  placeholder="Ex: Soldes d'hiver"
                />
              </div>

              <!-- Description -->
              <div>
                <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i class="fa-solid fa-align-left text-orange-500"></i>
                  Description publique
                </span>
                <textarea
                  id="description"
                  formControlName="description"
                  rows="3"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-none"
                  placeholder="Description visible par les clients"
                ></textarea>
              </div>

              <!-- Type -->
              <div>
                <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i class="fa-solid fa-wand-magic-sparkles text-orange-500"></i>
                  Type de promotion <span class="text-red-500">*</span>
                </span>
                <div class="grid grid-cols-2 gap-3">
                  <label
                    class="relative flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-all"
                  >
                    <input type="radio" formControlName="type" value="automatic" class="mr-3" />
                    <div>
                      <div class="font-semibold text-gray-900">Automatique</div>
                      <div class="text-xs text-gray-500">Appliquée automatiquement</div>
                    </div>
                  </label>

                  <label
                    class="relative flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-all"
                  >
                    <input type="radio" formControlName="type" value="code" class="mr-3" />
                    <div>
                      <div class="font-semibold text-gray-900">Code promo</div>
                      <div class="text-xs text-gray-500">Nécessite un code</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Code promo -->
              @if (form.get('type')?.value === 'code') {
              <div>
                <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <i class="fa-solid fa-ticket text-orange-500"></i>
                  Code promo <span class="text-red-500">*</span>
                </span>
                <input
                  id="code"
                  type="text"
                  formControlName="code"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-mono uppercase"
                  placeholder="BIENVENUE"
                  style="text-transform: uppercase"
                />
              </div>
              }
            </div>
          </div>

          <!-- Réduction -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-percent text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">Réduction</h2>
              </div>
            </div>

            <div class="p-6 space-y-5">
              <div class="grid grid-cols-2 gap-5">
                <!-- Type de réduction -->
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-sliders text-green-500"></i>
                    Type <span class="text-red-500">*</span>
                  </span>
                  <select
                    id="discountType"
                    formControlName="discountType"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (€)</option>
                  </select>
                </div>

                <!-- Valeur -->
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-calculator text-green-500"></i>
                    Valeur <span class="text-red-500">*</span>
                  </span>
                  <div class="relative">
                    <input
                      id="discountValue"
                      type="number"
                      formControlName="discountValue"
                      min="0"
                      [max]="form.get('discountType')?.value === 'percentage' ? 100 : null"
                      step="0.01"
                      class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    />
                    <span class="absolute right-4 top-2.5 text-gray-500 font-semibold">
                      {{ form.get('discountType')?.value === 'percentage' ? '%' : '€' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Portée -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-bullseye text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">Portée de la promotion</h2>
              </div>
            </div>
            <div class="p-6 space-y-5">
              <div class="space-y-5">
                <!-- Scope selection -->
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <i class="fa-solid fa-crosshairs text-blue-500"></i>
                    Appliquer sur <span class="text-red-500">*</span>
                  </span>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label
                      class="relative flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <input type="radio" formControlName="scope" value="site-wide" class="mr-3" />
                      <span class="text-sm font-semibold text-gray-900">Tout le site</span>
                    </label>

                    <label
                      class="relative flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <input type="radio" formControlName="scope" value="category" class="mr-3" />
                      <span class="text-sm font-semibold text-gray-900">Catégories</span>
                    </label>

                    <label
                      class="relative flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <input
                        type="radio"
                        formControlName="scope"
                        value="subcategory"
                        class="mr-3"
                      />
                      <span class="text-sm font-semibold text-gray-900">Sous-catégories</span>
                    </label>

                    <label
                      class="relative flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <input type="radio" formControlName="scope" value="product" class="mr-3" />
                      <span class="text-sm font-semibold text-gray-900">Produits</span>
                    </label>

                    <label
                      class="relative flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <input type="radio" formControlName="scope" value="size" class="mr-3" />
                      <span class="text-sm font-semibold text-gray-900">Tailles</span>
                    </label>
                  </div>
                </div>

                <!-- Multi-Category selection -->
                @if (form.get('scope')?.value === 'category') {
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-layer-group text-blue-500"></i>
                    Sélectionner les catégories <span class="text-red-500">*</span>
                  </span>
                  <div
                    class="border-2 border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto bg-gray-50"
                  >
                    <div class="grid grid-cols-2 gap-3">
                      @for (category of categories(); track category.id) {
                      <label
                        class="flex items-center p-3 hover:bg-white rounded-lg cursor-pointer transition-colors border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          [checked]="isCategorySelected(category.slug)"
                          (change)="toggleCategory(category.slug)"
                          class="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span class="text-sm font-medium text-gray-700">{{ category.name }}</span>
                      </label>
                      }
                    </div>
                  </div>
                  <p class="text-xs text-blue-600 mt-2 font-medium">
                    <i class="fa-solid fa-check-circle mr-1"></i>
                    {{ selectedCategorySlugs().length }} catégorie(s) sélectionnée(s)
                  </p>
                </div>
                }

                <!-- Multi-Subcategory selection -->
                @if (form.get('scope')?.value === 'subcategory') {
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-sitemap text-blue-500"></i>
                    Sélectionner les sous-catégories <span class="text-red-500">*</span>
                  </span>
                  <div
                    class="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto bg-gray-50"
                  >
                    @if (getAllSubCategories().length === 0) {
                    <p class="text-sm text-gray-500 text-center py-4">
                      Aucune sous-catégorie disponible
                    </p>
                    } @else {
                    <div class="space-y-3">
                      @for (sub of getAllSubCategories(); track sub.id) {
                      <label
                        class="flex items-center p-3 hover:bg-white rounded-lg cursor-pointer transition-colors border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          [checked]="isSubCategorySelected(sub.slug)"
                          (change)="toggleSubCategory(sub.slug)"
                          class="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div class="flex-1">
                          <div class="text-sm font-medium text-gray-700">{{ sub.name }}</div>
                          <div class="text-xs text-gray-500">{{ sub.categoryName }}</div>
                        </div>
                      </label>
                      }
                    </div>
                    }
                  </div>
                  <p class="text-xs text-blue-600 mt-2 font-medium">
                    <i class="fa-solid fa-check-circle mr-1"></i>
                    {{ selectedSubCategorySlugs().length }} sous-catégorie(s) sélectionnée(s)
                  </p>
                </div>
                }

                <!-- Product selection with images -->
                @if (form.get('scope')?.value === 'product') {
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-cubes text-blue-500"></i>
                    Sélectionner les produits <span class="text-red-500">*</span>
                  </span>
                  <div
                    class="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto bg-gray-50"
                  >
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      @for (product of products(); track product.id) {
                      <label
                        class="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-colors border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          [checked]="isProductSelected(product.id)"
                          (change)="toggleProduct(product.id)"
                          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        @if (product.images && product.images.length > 0) {
                        <img
                          [src]="product.images[0]"
                          [alt]="product.title"
                          class="w-12 h-12 object-cover rounded-lg"
                        />
                        } @else {
                        <div
                          class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"
                        >
                          <i class="fa-solid fa-image text-gray-400"></i>
                        </div>
                        }
                        <span class="text-sm font-medium text-gray-700 flex-1">{{
                          product.title
                        }}</span>
                      </label>
                      }
                    </div>
                  </div>
                  <p class="text-xs text-blue-600 mt-2 font-medium">
                    <i class="fa-solid fa-check-circle mr-1"></i>
                    {{ selectedProductIds().length }} produit(s) sélectionné(s)
                  </p>
                </div>
                }

                <!-- Size selection -->
                @if (form.get('scope')?.value === 'size') {
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-ruler-combined text-blue-500"></i>
                    Sélectionner les tailles <span class="text-red-500">*</span>
                  </span>
                  <div class="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div class="grid grid-cols-4 gap-3">
                      @for (size of availableSizes; track size) {
                      <label
                        class="flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all border-2"
                        [class.bg-blue-100]="isSizeSelected(size)"
                        [class.border-blue-500]="isSizeSelected(size)"
                        [class.bg-white]="!isSizeSelected(size)"
                        [class.border-gray-200]="!isSizeSelected(size)"
                      >
                        <input
                          type="checkbox"
                          [checked]="isSizeSelected(size)"
                          (change)="toggleSize(size)"
                          class="sr-only"
                        />
                        <span
                          class="text-lg font-bold mb-1"
                          [class.text-blue-700]="isSizeSelected(size)"
                          [class.text-gray-700]="!isSizeSelected(size)"
                          >{{ size }}</span
                        >
                        <i
                          class="fa-solid fa-check text-xs"
                          [class.text-blue-600]="isSizeSelected(size)"
                          [class.text-transparent]="!isSizeSelected(size)"
                        ></i>
                      </label>
                      }
                    </div>
                  </div>
                  <p class="text-xs text-blue-600 mt-2 font-medium">
                    <i class="fa-solid fa-check-circle mr-1"></i>
                    {{ selectedProductSizes().length }} taille(s) sélectionnée(s)
                  </p>
                </div>
                }
              </div>
            </div>
          </div>

          <!-- Conditions -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-sliders text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">Conditions (optionnelles)</h2>
              </div>
            </div>
            <div class="p-6 space-y-5">
              <div class="grid grid-cols-2 gap-5">
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-euro-sign text-purple-500"></i>
                    Montant minimum du panier (€)
                  </span>
                  <input
                    id="minAmount"
                    type="number"
                    formControlName="minAmount"
                    min="0"
                    step="0.01"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-box text-purple-500"></i>
                    Quantité minimum de produits
                  </span>
                  <input
                    id="minQuantity"
                    type="number"
                    formControlName="minQuantity"
                    min="0"
                    step="1"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-user text-purple-500"></i>
                    Utilisations max par utilisateur
                  </span>
                  <input
                    id="maxUsagePerUser"
                    type="number"
                    formControlName="maxUsagePerUser"
                    min="0"
                    step="1"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    placeholder="Illimité"
                  />
                </div>

                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-users text-purple-500"></i>
                    Utilisations max totales
                  </span>
                  <input
                    id="maxUsageTotal"
                    type="number"
                    formControlName="maxUsageTotal"
                    min="0"
                    step="1"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    placeholder="Illimité"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Validité -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-calendar-days text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">Période de validité</h2>
              </div>
            </div>

            <div class="p-6 space-y-5">
              <div class="grid grid-cols-2 gap-5">
                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-play text-amber-500"></i>
                    Date de début <span class="text-red-500">*</span>
                  </span>
                  <input
                    id="startDate"
                    type="date"
                    formControlName="startDate"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                </div>

                <div>
                  <span class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <i class="fa-solid fa-stop text-amber-500"></i>
                    Date de fin (optionnelle)
                  </span>
                  <input
                    id="endDate"
                    type="date"
                    formControlName="endDate"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                  <p class="text-xs text-gray-500 mt-2">
                    <i class="fa-solid fa-info-circle mr-1"></i>
                    Laisser vide pour aucune date de fin
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- État -->
          <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-slate-600 to-gray-700 px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <i class="fa-solid fa-power-off text-xl text-white"></i>
                </div>
                <h2 class="text-lg font-bold text-white">État de la promotion</h2>
              </div>
            </div>
            <div class="p-6">
              <label
                class="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
              >
                <input
                  type="checkbox"
                  formControlName="isActive"
                  class="w-6 h-6 text-orange-600 border-gray-300 rounded-lg focus:ring-orange-500"
                />
                <div>
                  <div class="font-semibold text-gray-900">Activer cette promotion</div>
                  <div class="text-sm text-gray-500 mt-0.5">
                    La promotion sera immédiatement active si cochée
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Actions sticky -->
          <div
            class="sticky bottom-0 bg-white/95 backdrop-blur border-t-2 border-gray-200 px-6 py-4 -mx-4 rounded-b-2xl shadow-2xl"
          >
            <div class="flex justify-between items-center gap-4">
              <div class="text-sm text-gray-600">
                @if (form.valid) {
                <i class="fa-solid fa-check-circle text-green-600 mr-1"></i>
                Formulaire prêt } @else {
                <i class="fa-solid fa-exclamation-circle text-amber-600 mr-1"></i>
                Vérifiez les champs requis }
              </div>
              <div class="flex gap-3">
                <button
                  type="button"
                  (click)="goBack()"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all border-2 border-gray-200"
                >
                  <i class="fa-solid fa-times"></i>
                  Annuler
                </button>
                <button
                  type="submit"
                  [disabled]="!form.valid"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all border-2 shadow-lg"
                  [class.bg-gradient-to-r]="form.valid"
                  [class.from-orange-600]="form.valid"
                  [class.to-red-600]="form.valid"
                  [class.text-white]="form.valid"
                  [class.border-transparent]="form.valid"
                  [class.hover:shadow-xl]="form.valid"
                  [class.bg-gray-300]="!form.valid"
                  [class.text-gray-500]="!form.valid"
                  [class.border-gray-300]="!form.valid"
                  [class.cursor-not-allowed]="!form.valid"
                >
                  <i
                    class="fa-solid"
                    [class.fa-save]="!isEditMode()"
                    [class.fa-pen-to-square]="isEditMode()"
                  ></i>
                  {{ isEditMode() ? 'Modifier' : 'Créer' }} la promotion
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      input[type='radio']:checked + div,
      input[type='radio']:checked ~ span {
        color: rgb(79 70 229);
      }
    `,
  ],
})
export class PromotionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly promotionService = inject(PromotionService);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  form!: FormGroup;
  isEditMode = signal(false);
  promotionId = signal<number | null>(null);

  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  selectedProductIds = signal<number[]>([]);
  selectedCategorySlugs = signal<string[]>([]);
  selectedSubCategorySlugs = signal<string[]>([]);
  selectedProductSizes = signal<string[]>([]);

  // Pour l'ancien système de sous-catégories (à garder pour compatibilité)
  selectedCategoryForSub = '';
  availableSubCategories = signal<{ id: number; name: string; slug: string }[]>([]);

  // Liste des tailles disponibles
  availableSizes = ['A3', 'A4', 'A5', 'A6'];

  progressDetailsOpen = signal(false);
  totalFields = signal(6);

  completedFields = computed(() => {
    let count = 0;
    if (this.form?.get('name')?.valid) count++;
    if (this.form?.get('type')?.valid) count++;
    if (this.isCodeValid()) count++;
    if (this.form?.get('discountValue')?.valid) count++;
    if (this.isScopeValid()) count++;
    if (this.form?.get('startDate')?.valid) count++;
    return count;
  });

  progress = computed(() => {
    const completed = this.completedFields();
    const total = this.totalFields();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  async ngOnInit(): Promise<void> {
    this.initForm();

    // Load data
    await Promise.all([this.loadCategories(), this.loadProducts()]);

    // Check edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.promotionId.set(parseInt(id, 10));
      await this.loadPromotion(parseInt(id, 10));
    }

    // Subscribe to scope changes
    this.form.get('scope')?.valueChanges.subscribe(() => {
      this.clearScopeFields();
    });
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: ['automatic', Validators.required],
      code: [''],
      scope: ['site-wide', Validators.required],
      discountType: ['percentage', Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0)]],
      categorySlug: [''],
      subCategorySlug: [''],
      startDate: [today, Validators.required],
      endDate: [''],
      isActive: [true],
      minAmount: [null],
      minQuantity: [null],
      maxUsagePerUser: [null],
      maxUsageTotal: [null],
    });
  }

  private async loadCategories(): Promise<void> {
    try {
      const categories = await this.categoryService.getAll();
      this.categories.set(categories.filter((c) => c.isActive));
    } catch {
      this.categories.set([]);
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      const products = await this.productService.getAll();
      this.products.set(products);
    } catch {
      this.products.set([]);
    }
  }

  private async loadPromotion(id: number): Promise<void> {
    try {
      const promotion = await this.promotionService.getById(id);
      if (!promotion) {
        this.toast.error('Promotion introuvable');
        void this.goBack();
        return;
      }

      this.form.patchValue({
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        code: promotion.code,
        scope: promotion.scope,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        startDate: this.formatDateForInput(promotion.startDate),
        endDate: promotion.endDate ? this.formatDateForInput(promotion.endDate) : '',
        isActive: promotion.isActive,
        minAmount: promotion.conditions?.minAmount,
        minQuantity: promotion.conditions?.minQuantity,
        maxUsagePerUser: promotion.conditions?.maxUsagePerUser,
        maxUsageTotal: promotion.conditions?.maxUsageTotal,
      });

      if (promotion.productIds) {
        this.selectedProductIds.set([...promotion.productIds]);
      }
      if (promotion.categorySlugs) {
        this.selectedCategorySlugs.set([...promotion.categorySlugs]);
      }
      if (promotion.subCategorySlugs) {
        this.selectedSubCategorySlugs.set([...promotion.subCategorySlugs]);
      }
      if (promotion.productSizes) {
        this.selectedProductSizes.set([...promotion.productSizes]);
      }
    } catch {
      this.toast.error('Erreur lors du chargement');
      void this.goBack();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid) {
      this.toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.form.value;

    const input: PromotionInput = {
      name: formValue.name,
      description: formValue.description,
      type: formValue.type,
      code: formValue.type === 'code' ? formValue.code?.toUpperCase() : undefined,
      scope: formValue.scope,
      discountType: formValue.discountType,
      discountValue: parseFloat(formValue.discountValue),
      categorySlugs: formValue.scope === 'category' ? this.selectedCategorySlugs() : undefined,
      subCategorySlugs:
        formValue.scope === 'subcategory' ? this.selectedSubCategorySlugs() : undefined,
      productIds: formValue.scope === 'product' ? this.selectedProductIds() : undefined,
      productSizes: formValue.scope === 'size' ? this.selectedProductSizes() : undefined,
      startDate: formValue.startDate,
      endDate: formValue.endDate || undefined,
      isActive: formValue.isActive,
      conditions: {
        minAmount: formValue.minAmount || undefined,
        minQuantity: formValue.minQuantity || undefined,
        maxUsagePerUser: formValue.maxUsagePerUser || undefined,
        maxUsageTotal: formValue.maxUsageTotal || undefined,
      },
    };

    try {
      if (this.isEditMode() && this.promotionId()) {
        await this.promotionService.update(this.promotionId()!, input);
        this.toast.success('Promotion modifiée avec succès');
      } else {
        await this.promotionService.create(input);
        this.toast.success('Promotion créée avec succès');
      }
      void this.goBack();
    } catch {
      this.toast.error("Erreur lors de l'enregistrement");
    }
  }

  onCategoryChange(): void {
    const category = this.categories().find((c) => c.slug === this.selectedCategoryForSub);
    if (category?.subCategories) {
      this.availableSubCategories.set(category.subCategories.filter((sc) => sc.isActive));
    } else {
      this.availableSubCategories.set([]);
    }
    this.form.patchValue({ subCategorySlug: '' });
  }

  toggleProduct(productId: number): void {
    const current = this.selectedProductIds();
    if (current.includes(productId)) {
      this.selectedProductIds.set(current.filter((id) => id !== productId));
    } else {
      this.selectedProductIds.set([...current, productId]);
    }
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProductIds().includes(productId);
  }

  private clearScopeFields(): void {
    this.form.patchValue({
      categorySlug: '',
      subCategorySlug: '',
    });
    this.selectedProductIds.set([]);
    this.selectedCategorySlugs.set([]);
    this.selectedSubCategorySlugs.set([]);
    this.selectedProductSizes.set([]);
    this.selectedCategoryForSub = '';
    this.availableSubCategories.set([]);
  }

  private formatDateForInput(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  goBack(): void {
    void this.router.navigate(['/admin/promotions']);
  }

  toggleProgressDetails(): void {
    this.progressDetailsOpen.set(!this.progressDetailsOpen());
  }

  isCodeValid(): boolean {
    const type = this.form?.get('type')?.value;
    if (type !== 'code') return true;
    return !!this.form?.get('code')?.value;
  }

  isScopeValid(): boolean {
    const scope = this.form?.get('scope')?.value;
    if (scope === 'site-wide') return true;
    if (scope === 'category') return this.selectedCategorySlugs().length > 0;
    if (scope === 'subcategory') return this.selectedSubCategorySlugs().length > 0;
    if (scope === 'product') return this.selectedProductIds().length > 0;
    if (scope === 'size') return this.selectedProductSizes().length > 0;
    return false;
  }

  toggleCategory(slug: string): void {
    const current = this.selectedCategorySlugs();
    if (current.includes(slug)) {
      this.selectedCategorySlugs.set(current.filter((s) => s !== slug));
    } else {
      this.selectedCategorySlugs.set([...current, slug]);
    }
  }

  isCategorySelected(slug: string): boolean {
    return this.selectedCategorySlugs().includes(slug);
  }

  toggleSubCategory(slug: string): void {
    const current = this.selectedSubCategorySlugs();
    if (current.includes(slug)) {
      this.selectedSubCategorySlugs.set(current.filter((s) => s !== slug));
    } else {
      this.selectedSubCategorySlugs.set([...current, slug]);
    }
  }

  isSubCategorySelected(slug: string): boolean {
    return this.selectedSubCategorySlugs().includes(slug);
  }

  toggleSize(size: string): void {
    const current = this.selectedProductSizes();
    if (current.includes(size)) {
      this.selectedProductSizes.set(current.filter((s) => s !== size));
    } else {
      this.selectedProductSizes.set([...current, size]);
    }
  }

  isSizeSelected(size: string): boolean {
    return this.selectedProductSizes().includes(size);
  }

  // Récupère toutes les sous-catégories de toutes les catégories
  getAllSubCategories(): { id: number; name: string; slug: string; categoryName: string }[] {
    const subs: { id: number; name: string; slug: string; categoryName: string }[] = [];
    for (const cat of this.categories()) {
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          if (sub.isActive) {
            subs.push({
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              categoryName: cat.name,
            });
          }
        }
      }
    }
    return subs;
  }
}
