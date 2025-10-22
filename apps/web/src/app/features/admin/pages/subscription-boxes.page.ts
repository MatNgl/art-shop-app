import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../auth/services/auth';
import { AdminHeaderComponent } from '../../../shared/components/admin-header/admin-header.component';
import { MonthlyBoxService } from '../../subscriptions/services/monthly-box.service';
import { ProductService } from '../../catalog/services/product';
import type { MonthlyBox, BoxProduct } from '../../subscriptions/models/monthly-box.model';
import type { Product } from '../../catalog/models/product.model';

type TabType = 'current' | 'next' | 'history';

@Component({
  selector: 'app-subscription-boxes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <app-admin-header
        title="Box Mensuelles Abonnements"
        description="Gérez les box à préparer et expédier chaque mois"
        icon="fa-box-open"
        gradientClass="bg-gradient-to-br from-pink-500 to-purple-500"
      >
        <div actions class="flex items-center gap-3">
          @if (activeTab() === 'next') {
          <button
            (click)="generateNextMonth()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            [disabled]="loading()"
          >
            <i class="fa-solid fa-wand-magic-sparkles text-sm"></i>
            Générer Box Mois Prochain
          </button>
          }
          <button
            (click)="refresh()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            [disabled]="loading()"
          >
            <i class="fa-solid fa-arrows-rotate text-sm" [class.animate-spin]="loading()"></i>
            Actualiser
          </button>
        </div>
      </app-admin-header>

      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Tabs -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div class="border-b border-gray-200">
            <nav class="flex -mb-px">
              <button
                (click)="activeTab.set('current')"
                class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
                [class.border-purple-500]="activeTab() === 'current'"
                [class.text-purple-600]="activeTab() === 'current'"
                [class.border-transparent]="activeTab() !== 'current'"
                [class.text-gray-500]="activeTab() !== 'current'"
                [class.hover:text-gray-700]="activeTab() !== 'current'"
              >
                <i class="fa-solid fa-calendar-day mr-2"></i>
                Mois en cours ({{ currentMonthLabel() }}) @if (currentStats().totalBoxes > 0) {
                <span
                  class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {{ currentStats().totalBoxes }}
                </span>
                }
              </button>

              <button
                (click)="activeTab.set('next')"
                class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
                [class.border-purple-500]="activeTab() === 'next'"
                [class.text-purple-600]="activeTab() === 'next'"
                [class.border-transparent]="activeTab() !== 'next'"
                [class.text-gray-500]="activeTab() !== 'next'"
                [class.hover:text-gray-700]="activeTab() !== 'next'"
              >
                <i class="fa-solid fa-calendar-plus mr-2"></i>
                Mois prochain ({{ nextMonthLabel() }}) @if (nextStats().totalBoxes > 0) {
                <span
                  class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ nextStats().totalBoxes }}
                </span>
                }
              </button>

              <button
                (click)="activeTab.set('history')"
                class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
                [class.border-purple-500]="activeTab() === 'history'"
                [class.text-purple-600]="activeTab() === 'history'"
                [class.border-transparent]="activeTab() !== 'history'"
                [class.text-gray-500]="activeTab() !== 'history'"
                [class.hover:text-gray-700]="activeTab() !== 'history'"
              >
                <i class="fa-solid fa-clock-rotate-left mr-2"></i>
                Historique
              </button>
            </nav>
          </div>
        </div>

        <!-- Current Month Tab -->
        @if (activeTab() === 'current') {
        <div>
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">À préparer</p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">
                    {{ currentStats().byStatus.pending }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-hourglass-half text-red-600 text-xl"></i>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Préparées</p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">
                    {{ currentStats().byStatus.prepared }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-box text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Expédiées</p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">
                    {{ currentStats().byStatus.shipped }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-truck text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Livrées</p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">
                    {{ currentStats().byStatus.delivered }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-check text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Box List -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">
                Box à préparer ({{ currentBoxes().length }})
              </h3>
            </div>

            @if (currentBoxes().length > 0) {
            <div class="divide-y divide-gray-200">
              @for (box of currentBoxes(); track box.id) {
              <div
                class="p-6 transition-colors"
                [class.bg-green-50]="box.status !== 'pending'"
                [class.hover:bg-gray-50]="box.status === 'pending'"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <!-- Header -->
                    <div class="flex items-center gap-4 mb-4">
                      <div
                        class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                        [class.bg-gradient-to-br]="true"
                        [class.from-purple-400]="true"
                        [class.to-pink-500]="true"
                      >
                        {{ getInitials(box.userName) }}
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center gap-3">
                          <h4 class="text-lg font-semibold text-gray-900">{{ box.userName }}</h4>
                          <span [ngClass]="getStatusBadge(box.status)">
                            {{ getStatusLabel(box.status) }}
                          </span>
                        </div>
                        <p class="text-sm text-gray-500">{{ box.userEmail }}</p>
                      </div>
                    </div>

                    <!-- Info Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p class="text-xs text-gray-500 uppercase font-medium">Plan</p>
                        <p class="text-sm font-semibold text-purple-600 mt-1">
                          <i class="fa-solid fa-crown mr-1"></i>
                          {{ box.planName }}
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ box.expectedProductCount }} produit(s)
                        </p>
                      </div>

                      <div>
                        <p class="text-xs text-gray-500 uppercase font-medium">Adresse</p>
                        <p class="text-sm text-gray-900 mt-1">{{ box.shippingAddress.street }}</p>
                        <p class="text-sm text-gray-900">
                          {{ box.shippingAddress.zip }} {{ box.shippingAddress.city }}
                        </p>
                      </div>

                      <div>
                        <p class="text-xs text-gray-500 uppercase font-medium">
                          Produits sélectionnés
                        </p>
                        @if (box.products.length > 0) {
                        <div class="mt-1 space-y-1">
                          @for (product of box.products; track product.productId) {
                          <p class="text-sm text-gray-900">
                            <i class="fa-solid fa-check text-green-600 mr-1"></i>
                            {{ product.productName }}
                          </p>
                          }
                        </div>
                        } @else {
                        <p class="text-sm text-gray-400 mt-1">Aucun produit sélectionné</p>
                        }
                      </div>
                    </div>

                    @if (box.notes) {
                    <div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p class="text-xs font-medium text-yellow-800 mb-1">
                        <i class="fa-solid fa-note-sticky mr-1"></i>
                        Note :
                      </p>
                      <p class="text-sm text-yellow-900">{{ box.notes }}</p>
                    </div>
                    }
                  </div>

                  <!-- Actions -->
                  <div class="flex flex-col gap-2 ml-4">
                    @if (box.status === 'pending') {
                    <button
                      (click)="openSelectProducts(box)"
                      class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>
                      Définir produits
                    </button>
                    } @if (box.status === 'prepared') {
                    <button
                      (click)="markAsShipped(box.id)"
                      class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <i class="fa-solid fa-truck mr-2"></i>
                      Marquer expédiée
                    </button>
                    } @if (box.status === 'shipped') {
                    <button
                      (click)="markAsDelivered(box.id)"
                      class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <i class="fa-solid fa-check mr-2"></i>
                      Marquer livrée
                    </button>
                    }
                    <a
                      [routerLink]="['/admin/users', box.userId]"
                      class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
                    >
                      <i class="fa-solid fa-user mr-2"></i>
                      Voir profil
                    </a>
                  </div>
                </div>
              </div>
              }
            </div>
            } @else {
            <div class="p-12 text-center">
              <i class="fa-solid fa-box-open text-5xl text-gray-400 mb-4"></i>
              <p class="text-lg font-medium text-gray-900 mb-2">Aucune box pour ce mois</p>
              <p class="text-sm text-gray-500">
                Les box mensuelles apparaîtront ici une fois générées
              </p>
            </div>
            }
          </div>
        </div>
        }

        <!-- Next Month Tab -->
        @if (activeTab() === 'next') {
        <div>
          <!-- Stats by Plan -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            @for (planStat of nextPlanStats(); track $index) {
            <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">{{ planStat.planName }}</p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">{{ planStat.count }}</p>
                  <p class="text-xs text-gray-500 mt-1">box à préparer</p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i class="fa-solid fa-crown text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>
            }
          </div>

          <!-- Info Box -->
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div class="flex items-start gap-3">
              <i class="fa-solid fa-info-circle text-blue-600 text-xl mt-0.5"></i>
              <div>
                <h3 class="font-semibold text-blue-900 mb-2">
                  Prochaines box - {{ nextMonthLabel() }}
                </h3>
                <p class="text-sm text-blue-800">
                  Cliquez sur "Générer Box Mois Prochain" pour créer toutes les box du mois suivant.
                  Vous pourrez ensuite préparer les produits à l'avance.
                </p>
              </div>
            </div>
          </div>

          <!-- Next boxes preview -->
          @if (nextBoxes().length > 0) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">
                Box planifiées ({{ nextBoxes().length }})
              </h3>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Utilisateur
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Plan
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Produits
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Adresse
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  @for (box of nextBoxes(); track box.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <div class="text-sm font-medium text-gray-900">{{ box.userName }}</div>
                      <div class="text-xs text-gray-500">{{ box.userEmail }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700"
                      >
                        <i class="fa-solid fa-crown mr-1"></i>
                        {{ box.planName }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                      {{ box.expectedProductCount }} produit(s)
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                      {{ box.shippingAddress.city }}
                    </td>
                  </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          }
        </div>
        }

        <!-- History Tab -->
        @if (activeTab() === 'history') {
        <div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <i class="fa-solid fa-clock-rotate-left text-5xl text-gray-400 mb-4"></i>
            <p class="text-lg font-medium text-gray-900 mb-2">Historique des box</p>
            <p class="text-sm text-gray-500">
              Fonctionnalité à venir - historique des box expédiées les mois précédents
            </p>
          </div>
        </div>
        }
      </div>
    </div>

    <!-- Modal Select Products -->
    @if (selectedBox()) {
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="button"
      tabindex="0"
      aria-label="Fermer la modale de sélection des produits"
      (click)="closeModal()"
      (keyup.enter)="closeModal()"
      (keyup.space)="closeModal()"
    >
      <div
        class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="selectProductsTitle"
        tabindex="0"
        (click)="$event.stopPropagation()"
        (keyup.enter)="$event.stopPropagation()"
        (keyup.space)="$event.stopPropagation()"
      >
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 id="selectProductsTitle" class="text-lg font-semibold text-gray-900">
            Sélectionner {{ selectedBox()!.expectedProductCount }} produit(s) pour
            {{ selectedBox()!.userName }}
          </h3>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <!-- Body (scrollable) -->
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <!-- Search -->
          <div class="mb-4">
            <input
              type="text"
              [(ngModel)]="productSearch"
              placeholder="Rechercher un produit..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <!-- Product Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (product of filteredProducts(); track product.id) {
            <button
              type="button"
              (click)="toggleProductSelection(product)"
              (keyup.enter)="toggleProductSelection(product)"
              (keyup.space)="toggleProductSelection(product)"
              [attr.aria-pressed]="isProductSelected(product.id)"
              class="w-full text-left border rounded-lg p-4 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
              [class.border-purple-500]="isProductSelected(product.id)"
              [class.bg-purple-50]="isProductSelected(product.id)"
              [class.border-gray-200]="!isProductSelected(product.id)"
              [class.hover:border-gray-300]="!isProductSelected(product.id)"
            >
              <div class="flex gap-3">
                @if (product.images && product.images.length > 0) {
                <img
                  [src]="product.images[0]"
                  [alt]="product.title"
                  class="w-16 h-16 object-cover rounded"
                />
                } @else {
                <div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  <i class="fa-solid fa-image text-gray-400"></i>
                </div>
                }
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900">{{ product.title }}</h4>
                  <p class="text-sm text-gray-500 line-clamp-2">{{ product.description }}</p>
                  @if (isProductSelected(product.id)) {
                  <div class="mt-2">
                    <i class="fa-solid fa-check-circle text-purple-600"></i>
                    <span class="text-sm text-purple-600 font-medium ml-1">Sélectionné</span>
                  </div>
                  }
                </div>
              </div>
            </button>
            }
          </div>
        </div>

        <!-- Footer (outside scroll) -->
        <div
          class="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50"
        >
          <p class="text-sm text-gray-600">
            {{ selectedProducts().length }} / {{ selectedBox()!.expectedProductCount }} produit(s)
            sélectionné(s)
          </p>
          <div class="flex gap-3">
            <button
              (click)="closeModal()"
              class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              (click)="saveSelectedProducts()"
              [disabled]="selectedProducts().length !== selectedBox()!.expectedProductCount"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fa-solid fa-check mr-2"></i>
              Valider la sélection
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `,
})
export class SubscriptionBoxesPage implements OnInit {
  private auth = inject(AuthService);
  private boxSvc = inject(MonthlyBoxService);
  private productSvc = inject(ProductService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(false);
  activeTab = signal<TabType>('current');

  // Modal state
  selectedBox = signal<MonthlyBox | null>(null);
  selectedProducts = signal<Product[]>([]);
  productSearch = '';
  allProducts = signal<Product[]>([]);

  currentMonth = this.boxSvc.getCurrentMonth();
  nextMonth = this.boxSvc.getNextMonth();

  currentBoxes = computed(() => this.boxSvc.getBoxesForMonth(this.currentMonth));
  nextBoxes = computed(() => this.boxSvc.getBoxesForMonth(this.nextMonth));

  currentStats = computed(() => this.boxSvc.getStatsForMonth(this.currentMonth));
  nextStats = computed(() => this.boxSvc.getStatsForMonth(this.nextMonth));

  currentMonthLabel = computed(() => this.boxSvc.formatMonth(this.currentMonth));
  nextMonthLabel = computed(() => this.boxSvc.formatMonth(this.nextMonth));

  nextPlanStats = computed(() => {
    const stats = this.nextStats();
    return Object.values(stats.byPlan);
  });

  filteredProducts = computed(() => {
    const search = this.productSearch.toLowerCase();
    if (!search) return this.allProducts();
    return this.allProducts().filter(
      (p) => p.title.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
    );
  });

  async ngOnInit() {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    await this.loadProducts();
    this.refresh();
  }

  async loadProducts() {
    try {
      const products = await this.productSvc.getAllProducts();
      this.allProducts.set(products);
    } catch (e) {
      console.error(e);
      this.toast.error('Erreur lors du chargement des produits');
    }
  }

  refresh() {
    // Trigger recomputation
    this.currentMonth = this.boxSvc.getCurrentMonth();
    this.nextMonth = this.boxSvc.getNextMonth();
  }

  async generateNextMonth() {
    this.loading.set(true);
    try {
      const result = await this.boxSvc.generateBoxesForMonth(this.nextMonth);
      this.toast.success(`${result.created} box créée(s) · ${result.existing} déjà existante(s)`);
      this.refresh();
    } catch (e) {
      console.error(e);
      this.toast.error('Erreur lors de la génération des box');
    } finally {
      this.loading.set(false);
    }
  }

  openSelectProducts(box: MonthlyBox) {
    this.selectedBox.set(box);
    this.selectedProducts.set([]);
    this.productSearch = '';
  }

  closeModal() {
    this.selectedBox.set(null);
    this.selectedProducts.set([]);
    this.productSearch = '';
  }

  toggleProductSelection(product: Product) {
    const current = this.selectedProducts();
    const index = current.findIndex((p) => p.id === product.id);

    if (index >= 0) {
      // Deselect
      this.selectedProducts.set(current.filter((p) => p.id !== product.id));
    } else {
      // Select only if not exceeded limit
      const box = this.selectedBox();
      if (box && current.length < box.expectedProductCount) {
        this.selectedProducts.set([...current, product]);
      } else {
        this.toast.warning(
          `Vous ne pouvez sélectionner que ${box?.expectedProductCount} produit(s)`
        );
      }
    }
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProducts().some((p) => p.id === productId);
  }

  saveSelectedProducts() {
    const box = this.selectedBox();
    if (!box) return;

    const boxProducts: BoxProduct[] = this.selectedProducts().map((p) => ({
      productId: p.id,
      productName: p.title,
      imageUrl: p.images?.[0],
    }));

    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) return;

    const success = this.boxSvc.setBoxProducts(box.id, boxProducts, currentUser.id);

    if (success) {
      this.toast.success('Produits définis avec succès');
      this.closeModal();
      this.refresh();
    } else {
      this.toast.error('Erreur lors de la sauvegarde');
    }
  }

  markAsShipped(boxId: string) {
    const success = this.boxSvc.updateBoxStatus(boxId, 'shipped');
    if (success) {
      this.toast.success('Box marquée comme expédiée');
      this.refresh();
    }
  }

  markAsDelivered(boxId: string) {
    const success = this.boxSvc.updateBoxStatus(boxId, 'delivered');
    if (success) {
      this.toast.success('Box marquée comme livrée');
      this.refresh();
    }
  }

  getStatusBadge(status: string): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${base} bg-red-100 text-red-800`;
      case 'prepared':
        return `${base} bg-yellow-100 text-yellow-800`;
      case 'shipped':
        return `${base} bg-blue-100 text-blue-800`;
      case 'delivered':
        return `${base} bg-green-100 text-green-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return '🔴 À préparer';
      case 'prepared':
        return '🟡 Préparée';
      case 'shipped':
        return '🔵 Expédiée';
      case 'delivered':
        return '🟢 Livrée';
      default:
        return status;
    }
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
