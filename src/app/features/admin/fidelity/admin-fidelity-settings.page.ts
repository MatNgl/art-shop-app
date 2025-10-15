// src/app/features/admin/pages/admin-fidelity-settings.page.ts
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FidelityStore } from '../../fidelity/services/fidelity-store';
import { FidelityReward, FidelityRewardType } from '../../fidelity/models/fidelity.models';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { AdminHeaderComponent } from '../../../shared/components/admin-header/admin-header.component';

interface FidelityStats {
  total: number;
  active: number;
  inactive: number;
  ratePerEuro: number;
  enabled: boolean;
}

@Component({
  selector: 'app-admin-fidelity-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminHeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header uniforme -->
      <app-admin-header
        title="Programme de fidélité"
        description="Gérez les paramètres et les récompenses"
        icon="fa-gift"
        gradientClass="bg-gradient-to-br from-purple-600 to-pink-600"
      >
        <div actions class="flex items-center gap-3">
          <button
            type="button"
            (click)="openCreateModal()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <i class="fa-solid fa-plus text-sm"></i>
            Nouvelle récompense
          </button>
        </div>
      </app-admin-header>

      <div class="container-wide">
        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            class="bg-white rounded-xl shadow-sm p-6 border-l-4"
            [class.border-green-500]="stats().enabled"
            [class.border-gray-400]="!stats().enabled"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Statut</p>
                <p
                  class="text-3xl font-bold mt-2"
                  [class.text-green-700]="stats().enabled"
                  [class.text-gray-800]="!stats().enabled"
                >
                  {{ stats().enabled ? 'Activé' : 'Désactivé' }}
                </p>
              </div>
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center"
                [class.bg-green-100]="stats().enabled"
                [class.bg-gray-100]="!stats().enabled"
              >
                <i
                  class="fa-solid"
                  [class.fa-toggle-on]="stats().enabled"
                  [class.fa-toggle-off]="!stats().enabled"
                  [class.text-green-600]="stats().enabled"
                  [class.text-gray-500]="!stats().enabled"
                ></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Taux</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().ratePerEuro }}</p>
                <p class="text-xs text-gray-500">points / €</p>
              </div>
              <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-scale-balanced text-indigo-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Récompenses actives</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().active }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-check text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Inactives</p>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats().inactive }}</p>
              </div>
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-pause text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Panneaux -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Paramètres généraux -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div class="px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-indigo-600">
                <h2 class="text-white font-semibold flex items-center gap-2">
                  <i class="fa-solid fa-sliders" aria-hidden="true"></i>
                  Paramètres généraux
                </h2>
              </div>

              <div class="p-6 space-y-5">
                <!-- Activer/Désactiver -->
                <div>
                  <label
                    class="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.bg-green-50]="settings().enabled"
                    [class.border-green-300]="settings().enabled"
                  >
                    <input
                      type="checkbox"
                      [checked]="settings().enabled"
                      (change)="toggleEnabled()"
                      class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      aria-label="Activer le programme de fidélité"
                    />
                    <div>
                      <div class="font-medium text-gray-900">Programme activé</div>
                      <div class="text-xs text-gray-500 mt-0.5">
                        Les utilisateurs peuvent cumuler et utiliser leurs points
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Taux €/points -->
                <div>
                  <span class="block text-sm font-medium text-gray-700 mb-2"
                    >Taux de conversion</span
                  >
                  <div class="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      [value]="settings().ratePerEuro"
                      (change)="updateRate($event)"
                      class="w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      aria-label="Taux de points par euro"
                    />
                    <span class="absolute right-3 top-2.5 text-gray-500 text-sm font-semibold"
                      >pts / €</span
                    >
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    Ex&nbsp;: 10 pts par € → 100 € d'achat = 1000 points
                  </p>
                </div>

                <!-- Règle fixe -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-start gap-3">
                    <i class="fa-solid fa-lock text-blue-600 mt-0.5" aria-hidden="true"></i>
                    <div>
                      <div class="text-sm font-semibold text-blue-800 mb-1">
                        Une seule récompense par commande
                      </div>
                      <div class="text-xs text-blue-700">
                        Règle active par défaut (non modifiable pour le MVP).
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Liste des récompenses -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div
                class="px-6 py-4 border-b bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-between"
              >
                <h2 class="text-white font-semibold flex items-center gap-2">
                  <i class="fa-solid fa-gifts" aria-hidden="true"></i>
                  Récompenses
                </h2>
                <button
                  type="button"
                  (click)="openCreateModal()"
                  class="px-4 py-2 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
                >
                  <i class="fa-solid fa-plus mr-2" aria-hidden="true"></i> Créer
                </button>
              </div>

              <div class="p-6">
                @if (rewards().length === 0) {
                <div class="p-12 text-center">
                  <i class="fa-solid fa-gift text-5xl text-gray-300 mb-4" aria-hidden="true"></i>
                  <p class="text-lg font-medium text-gray-900 mb-2">Aucune récompense configurée</p>
                  <p class="text-sm text-gray-500 mb-6">
                    Créez votre première récompense pour démarrer
                  </p>
                  <button
                    type="button"
                    (click)="openCreateModal()"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <i class="fa-solid fa-plus text-sm"></i> Nouvelle récompense
                  </button>
                </div>
                } @else {
                <div class="space-y-4">
                  @for (reward of sortedRewards(); track reward.id) {
                  <div
                    class="border rounded-xl p-4 transition-colors"
                    [class.border-green-200]="reward.isActive"
                    [class.bg-green-50]="reward.isActive"
                    [class.border-gray-200]="!reward.isActive"
                    [class.bg-gray-50]="!reward.isActive"
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        [class.bg-green-600]="reward.isActive"
                        [class.text-white]="reward.isActive"
                        [class.bg-gray-400]="!reward.isActive"
                        [class.text-white]="!reward.isActive"
                        aria-hidden="true"
                      >
                        @if (reward.type === 'shipping') {
                        <i class="fa-solid fa-truck text-2xl"></i> } @if (reward.type === 'amount')
                        { <i class="fa-solid fa-euro-sign text-2xl"></i> } @if (reward.type ===
                        'percent') { <i class="fa-solid fa-percent text-2xl"></i> } @if (reward.type
                        === 'gift') { <i class="fa-solid fa-gift text-2xl"></i> }
                      </div>

                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1 gap-3">
                          <div>
                            <h3 class="font-bold text-gray-900">{{ reward.label }}</h3>
                            <p class="text-xs text-gray-600 mt-0.5">{{ reward.description }}</p>
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              (click)="openEditModal(reward)"
                              class="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                            >
                              <i class="fa-solid fa-pen mr-1" aria-hidden="true"></i> Modifier
                            </button>
                            <button
                              type="button"
                              (click)="confirmDeleteReward(reward)"
                              class="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
                              aria-label="Supprimer la récompense"
                            >
                              <i class="fa-solid fa-trash mr-1" aria-hidden="true"></i> Supprimer
                            </button>
                          </div>
                        </div>

                        <div class="flex items-center flex-wrap gap-3 text-xs mt-2">
                          <span
                            class="font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded"
                          >
                            {{ reward.pointsRequired }} pts requis
                          </span>
                          @if (reward.type === 'amount') {
                          <span class="text-gray-700">Réduction : {{ reward.value }} €</span>
                          } @if (reward.type === 'percent') {
                          <span class="text-gray-700">Réduction : {{ reward.value }}%</span>
                          @if (reward.percentCap) {
                          <span class="text-gray-500">(plafonné à {{ reward.percentCap }} €)</span>
                          } } @if (reward.type === 'gift') {
                          <span class="text-gray-700">Produit ID : {{ reward.giftProductId }}</span>
                          }
                          <span
                            class="px-2 py-1 rounded text-xs font-semibold"
                            [class.bg-green-200]="reward.isActive"
                            [class.text-green-700]="reward.isActive"
                            [class.bg-gray-300]="!reward.isActive"
                            [class.text-gray-700]="!reward.isActive"
                          >
                            {{ reward.isActive ? 'Actif' : 'Inactif' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  }
                </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Create/Edit Reward -->
      @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-pink-600">
            <h2 class="text-white font-semibold">
              {{ editingReward() ? 'Modifier la récompense' : 'Créer une récompense' }}
            </h2>
          </div>

          <form [formGroup]="rewardForm" (ngSubmit)="saveReward()" class="p-6 space-y-4">
            <!-- Label -->
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-1">Libellé *</span>
              <input
                type="text"
                formControlName="label"
                class="w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="Ex: Livraison offerte"
              />
              @if (rewardForm.get('label')?.touched && rewardForm.get('label')?.invalid) {
              <p class="text-xs text-red-600 mt-1">Le libellé est requis.</p>
              }
            </div>

            <!-- Description -->
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-1">Description</span>
              <textarea
                formControlName="description"
                rows="2"
                class="w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
                placeholder="Description visible par les utilisateurs"
              ></textarea>
            </div>

            <!-- Type -->
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-1">Type *</span>
              <select
                formControlName="type"
                class="w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="shipping">Livraison gratuite</option>
                <option value="amount">Montant fixe (€)</option>
                <option value="percent">Pourcentage (%)</option>
                <option value="gift">Produit offert</option>
              </select>
            </div>

            <!-- Points requis -->
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-1">Points requis *</span>
              <input
                type="number"
                min="1"
                step="1"
                formControlName="pointsRequired"
                class="w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="Ex: 100"
              />
              @if (rewardForm.get('pointsRequired')?.touched &&
              rewardForm.get('pointsRequired')?.errors?.['min']) {
              <p class="text-xs text-red-600 mt-1">Minimum 1 point requis.</p>
              }
            </div>

            <!-- Valeur selon type -->
            @if (rewardForm.get('type')?.value !== 'shipping') {
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-1">
                @if (rewardForm.get('type')?.value === 'amount') { Montant de la réduction (€) * }
                @if (rewardForm.get('type')?.value === 'percent') { Pourcentage de réduction (%) * }
                @if (rewardForm.get('type')?.value === 'gift') { ID du produit offert * }
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                formControlName="value"
                class="w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="Ex: 5"
              />
            </div>
            }

            <!-- Plafond -->
            @if (rewardForm.get('type')?.value === 'percent') {
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-1"
                >Plafond en € (optionnel)</span
              >
              <input
                type="number"
                min="0"
                step="0.01"
                formControlName="percentCap"
                class="w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="Ex: 30"
              />
            </div>
            }

            <!-- giftProductId -->
            @if (rewardForm.get('type')?.value === 'gift') {
            <div>
              <span class="block text-sm font-medium text-gray-700 mb-1"
                >ID du produit offert *</span
              >
              <input
                type="number"
                min="1"
                step="1"
                formControlName="giftProductId"
                class="w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="Ex: 123"
              />
            </div>
            }

            <!-- Actif -->
            <div>
              <label
                class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  formControlName="isActive"
                  class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <div class="font-medium text-gray-900">Récompense active</div>
                  <div class="text-xs text-gray-500">
                    Les utilisateurs pourront utiliser cette récompense
                  </div>
                </div>
              </label>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                (click)="closeModal()"
                class="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                [disabled]="!rewardForm.valid"
                class="px-5 py-2 rounded-lg font-semibold transition-colors"
                [class.bg-gradient-to-r]="rewardForm.valid"
                [class.from-purple-600]="rewardForm.valid"
                [class.to-pink-600]="rewardForm.valid"
                [class.text-white]="rewardForm.valid"
                [class.hover:shadow-lg]="rewardForm.valid"
                [class.bg-gray-300]="!rewardForm.valid"
                [class.text-gray-500]="!rewardForm.valid"
                [class.cursor-not-allowed]="!rewardForm.valid"
              >
                {{ editingReward() ? 'Modifier' : 'Créer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      }
    </div>
  `,
  styles: [],
})
export class AdminFidelitySettingsPage {
  private readonly store = inject(FidelityStore);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly settings = this.store.settings;
  readonly rewards = this.store.rewards;

  // KPIs
  readonly stats = computed<FidelityStats>(() => {
    const list = this.rewards();
    const active = list.filter((r) => r.isActive).length;
    return {
      total: list.length,
      active,
      inactive: Math.max(0, list.length - active),
      ratePerEuro: this.settings().ratePerEuro,
      enabled: this.settings().enabled,
    };
  });

  readonly sortedRewards = computed(() =>
    [...this.rewards()].sort((a, b) => a.pointsRequired - b.pointsRequired)
  );

  readonly showModal = signal(false);
  readonly editingReward = signal<FidelityReward | null>(null);

  readonly rewardForm = this.fb.group({
    label: ['', Validators.required],
    description: [''],
    type: ['shipping' as FidelityRewardType, Validators.required],
    pointsRequired: [100, [Validators.required, Validators.min(1)]],
    value: [0],
    percentCap: [0],
    giftProductId: [0],
    isActive: [true],
  });

  // Settings
  toggleEnabled(): void {
    const current = this.settings().enabled;
    this.store.updateSettings({ enabled: !current });
    this.toast.success(`Programme ${!current ? 'activé' : 'désactivé'}`);
  }

  updateRate(event: Event): void {
    const next = Number.parseInt((event.target as HTMLInputElement).value, 10);
    if (Number.isFinite(next) && next > 0) {
      this.store.updateSettings({ ratePerEuro: next });
      this.toast.success('Taux mis à jour');
    } else {
      this.toast.warning('Veuillez saisir un entier positif');
    }
  }

  // CRUD
  openCreateModal(): void {
    this.editingReward.set(null);
    this.rewardForm.reset({
      label: '',
      description: '',
      type: 'shipping',
      pointsRequired: 100,
      value: 0,
      percentCap: 0,
      giftProductId: 0,
      isActive: true,
    });
    this.showModal.set(true);
  }

  openEditModal(reward: FidelityReward): void {
    this.editingReward.set(reward);
    this.rewardForm.patchValue({
      label: reward.label,
      description: reward.description ?? '',
      type: reward.type,
      pointsRequired: reward.pointsRequired,
      value: reward.value,
      percentCap: reward.percentCap ?? 0,
      giftProductId: reward.giftProductId ?? 0,
      isActive: reward.isActive,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingReward.set(null);
    this.rewardForm.reset();
  }

  saveReward(): void {
    if (!this.rewardForm.valid) return;

    const v = this.rewardForm.value;
    const payload: Omit<FidelityReward, 'id' | 'createdAt' | 'updatedAt'> = {
      label: v.label!,
      description: v.description ?? undefined,
      type: v.type as FidelityRewardType,
      pointsRequired: v.pointsRequired!,
      value: v.value ?? 0,
      percentCap: v.type === 'percent' ? v.percentCap ?? undefined : undefined,
      giftProductId: v.type === 'gift' ? v.giftProductId ?? undefined : undefined,
      isActive: v.isActive ?? true,
    };

    const editing = this.editingReward();
    if (editing) {
      this.store.updateReward(editing.id, payload);
      this.toast.success('Récompense modifiée');
    } else {
      this.store.createReward(payload);
      this.toast.success('Récompense créée');
    }
    this.closeModal();
  }

  async confirmDeleteReward(reward: FidelityReward): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Supprimer la récompense',
      message: `Cette action supprimera définitivement « ${reward.label} ».`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
      requireText: {
        placeholder: 'Tapez "SUPPRIMER" pour confirmer',
        requiredValue: 'SUPPRIMER',
      },
    });
    if (!ok) return;

    try {
      this.store.deleteReward(reward.id);
      this.toast.success(`Récompense « ${reward.label} » supprimée`);
    } catch {
      this.toast.error('Suppression impossible');
    }
  }
}
