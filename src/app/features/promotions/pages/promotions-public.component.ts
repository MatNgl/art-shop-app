import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PromotionsStore } from '../services/promotions-store';
import { Promotion } from '../models/promotion.model';

@Component({
  selector: 'app-promotions-public',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-4xl font-bold mb-3">Promotions en cours</h1>
          <p class="text-lg text-white/90">
            Profitez de nos offres exceptionnelles sur une sélection d'œuvres
          </p>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Loading -->
        @if (store.loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (i of [1,2,3,4]; track i) {
              <div class="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            }
          </div>
        }

        <!-- Empty state -->
        @else if (automaticPromotions().length === 0) {
          <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <i class="fa-solid fa-tag text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune promotion active</h3>
            <p class="text-gray-600 mb-4">
              Revenez bientôt pour découvrir nos nouvelles offres !
            </p>
            <a
              routerLink="/catalog"
              class="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Découvrir le catalogue
            </a>
          </div>
        }

        <!-- Promotions automatiques -->
        @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (promo of automaticPromotions(); track promo.id) {
              <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <!-- Header -->
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ promo.name }}</h3>
                    @if (promo.description) {
                      <p class="text-sm text-gray-600">{{ promo.description }}</p>
                    }
                  </div>

                  <!-- Badge réduction -->
                  <div class="ml-4 flex-shrink-0">
                    <div class="bg-gradient-to-br from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg text-center">
                      <div class="text-2xl font-bold">
                        @if (promo.discountType === 'percentage') {
                          -{{ promo.discountValue }}%
                        } @else {
                          -{{ promo.discountValue }}€
                        }
                      </div>
                      <div class="text-xs">de réduction</div>
                    </div>
                  </div>
                </div>

                <!-- Details -->
                <div class="space-y-2 mb-4">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-tag text-gray-400"></i>
                    <span class="text-gray-700">
                      <strong>Applicable sur :</strong> {{ getScopeLabel(promo.scope) }}
                    </span>
                  </div>

                  @if (promo.endDate) {
                    <div class="flex items-center gap-2 text-sm">
                      <i class="fa-solid fa-clock text-gray-400"></i>
                      <span class="text-gray-700">
                        <strong>Valable jusqu'au :</strong> {{ promo.endDate | date: 'dd/MM/yyyy' }}
                      </span>
                    </div>
                  }

                  @if (promo.conditions?.minAmount) {
                    <div class="flex items-center gap-2 text-sm">
                      <i class="fa-solid fa-shopping-cart text-gray-400"></i>
                      <span class="text-gray-700">
                        <strong>Montant minimum :</strong> {{ promo.conditions?.minAmount }}€
                      </span>
                    </div>
                  }
                </div>

                <!-- CTA -->
                <button
                  (click)="shopPromotion(promo)"
                  class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  @if (promo.scope === 'site-wide') {
                    Voir le catalogue
                  } @else if (promo.scope === 'category' || promo.scope === 'subcategory') {
                    Voir les produits
                  } @else {
                    Découvrir les produits
                  }
                </button>
              </div>
            }
          </div>
        }

        <!-- Codes promo section -->
        @if (codePromotions().length > 0) {
          <div class="mt-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Codes promo disponibles</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              @for (promo of codePromotions(); track promo.id) {
                <div class="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                  <div class="text-center mb-4">
                    <div class="inline-block px-4 py-2 bg-white border-2 border-dashed border-purple-400 rounded-lg">
                      <code class="text-2xl font-bold text-purple-700">{{ promo.code }}</code>
                    </div>
                  </div>

                  @if (promo.description) {
                    <p class="text-sm text-gray-700 text-center mb-3">{{ promo.description }}</p>
                  }

                  <div class="text-center text-sm text-gray-600">
                    @if (promo.discountType === 'percentage') {
                      <strong class="text-purple-700">{{ promo.discountValue }}%</strong> de réduction
                    } @else {
                      <strong class="text-purple-700">{{ promo.discountValue }}€</strong> de réduction
                    }
                  </div>

                  @if (promo.conditions?.minAmount) {
                    <div class="mt-2 text-xs text-gray-500 text-center">
                      Dès {{ promo.conditions?.minAmount }}€ d'achat
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class PromotionsPublicComponent implements OnInit {
  readonly store = inject(PromotionsStore);
  private readonly router = inject(Router);

  automaticPromotions = signal<Promotion[]>([]);
  codePromotions = signal<Promotion[]>([]);

  async ngOnInit(): Promise<void> {
    await this.store.loadActivePromotions();
    this.updatePromotions();
  }

  private updatePromotions(): void {
    const active = this.store.activePromotions();
    this.automaticPromotions.set(active.filter(p => p.type === 'automatic'));
    this.codePromotions.set(active.filter(p => p.type === 'code'));
  }

  shopPromotion(promo: Promotion): void {
    const queryParams: Record<string, string> = {};

    if (promo.scope === 'category' && promo.categorySlugs && promo.categorySlugs.length > 0) {
      queryParams['categorySlug'] = promo.categorySlugs[0]; // Première catégorie
    } else if (promo.scope === 'subcategory' && promo.subCategorySlugs && promo.subCategorySlugs.length > 0) {
      queryParams['subCategorySlug'] = promo.subCategorySlugs[0]; // Première sous-catégorie
    }

    void this.router.navigate(['/catalog'], { queryParams });
  }

  getScopeLabel(scope: string): string {
    const labels: Record<string, string> = {
      'site-wide': 'Tout le site',
      'category': 'Catégories',
      'subcategory': 'Sous-catégories',
      'product': 'Produits sélectionnés',
      'size': 'Tailles spécifiques',
    };
    return labels[scope] || scope;
  }
}
