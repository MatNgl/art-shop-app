import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FidelityStore } from '../../fidelity/services/fidelity-store';
import { FidelityReward, FidelityRewardType } from '../../fidelity/models/fidelity.models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-fidelity-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-12">
      <div class="max-w-7xl mx-auto px-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl mb-8">
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-cog text-3xl text-white"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">
                Configuration du programme de fidélité
              </h1>
              <p class="text-purple-100">Gérez les paramètres et les récompenses</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Settings globaux -->
          <div class="lg:col-span-1">
            <div
              class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden sticky top-6"
            >
              <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h2 class="text-xl font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-sliders"></i>
                  Paramètres généraux
                </h2>
              </div>
              <div class="p-6 space-y-4">
                <!-- Activer/Désactiver -->
                <div>
                  <label
                    class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
                    [class.bg-green-50]="settings().enabled"
                    [class.border-green-300]="settings().enabled"
                  >
                    <input
                      type="checkbox"
                      [checked]="settings().enabled"
                      (change)="toggleEnabled()"
                      class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
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
                  <span class="block text-sm font-semibold text-gray-700 mb-2">
                    Taux de conversion <i class="fa-solid fa-info-circle text-gray-400 ml-1"></i>
                  </span>
                  <div class="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      [value]="settings().ratePerEuro"
                      (change)="updateRate($event)"
                      class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <span class="absolute right-4 top-2.5 text-gray-500 font-semibold"
                      >pts / €</span
                    >
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    Ex: 10 pts par € → 100 € d'achat = 1000 points
                  </p>
                </div>

                <!-- Règle: une récompense max par commande (readonly) -->
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <i class="fa-solid fa-lock text-blue-600 mt-0.5"></i>
                    <div>
                      <div class="text-sm font-semibold text-blue-800 mb-1">
                        Règle : Une seule récompense par commande
                      </div>
                      <div class="text-xs text-blue-700">
                        Cette règle est active par défaut (MVP). Non modifiable.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CRUD Récompenses -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
              <div class="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-gifts"></i>
                    Récompenses
                  </h2>
                  <button
                    type="button"
                    (click)="openCreateModal()"
                    class="px-4 py-2 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-all"
                  >
                    <i class="fa-solid fa-plus mr-2"></i>
                    Créer une récompense
                  </button>
                </div>
              </div>

              <div class="p-6">
                @if (rewards().length === 0) {
                <div class="text-center py-12 text-gray-500">
                  <i class="fa-solid fa-gift text-6xl text-gray-300 mb-4"></i>
                  <p class="text-lg font-medium">Aucune récompense configurée</p>
                  <p class="text-sm mt-2">Créez votre première récompense pour démarrer !</p>
                </div>
                } @else {
                <div class="space-y-4">
                  @for (reward of sortedRewards(); track reward.id) {
                  <div
                    class="border-2 rounded-xl p-4 transition-all"
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
                      >
                        @if (reward.type === 'shipping') {
                        <i class="fa-solid fa-truck text-2xl"></i>
                        } @if (reward.type === 'amount') {
                        <i class="fa-solid fa-euro-sign text-2xl"></i>
                        } @if (reward.type === 'percent') {
                        <i class="fa-solid fa-percent text-2xl"></i>
                        } @if (reward.type === 'gift') {
                        <i class="fa-solid fa-gift text-2xl"></i>
                        }
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                          <div>
                            <h3 class="font-bold text-gray-800">{{ reward.label }}</h3>
                            <p class="text-xs text-gray-600 mt-1">{{ reward.description }}</p>
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              (click)="openEditModal(reward)"
                              class="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-all"
                            >
                              <i class="fa-solid fa-pen mr-1"></i>
                              Modifier
                            </button>
                            <button
                              type="button"
                              (click)="deleteReward(reward.id)"
                              class="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-all"
                            >
                              <i class="fa-solid fa-trash mr-1"></i>
                              Supprimer
                            </button>
                          </div>
                        </div>
                        <div class="flex items-center gap-3 text-xs">
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
                            [class.text-gray-600]="!reward.isActive"
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
    </div>

    <!-- Modal Create/Edit Reward -->
    @if (showModal()) {
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <h2 class="text-xl font-bold text-white">
            {{ editingReward() ? 'Modifier la récompense' : 'Créer une récompense' }}
          </h2>
        </div>
        <form [formGroup]="rewardForm" (ngSubmit)="saveReward()" class="p-6 space-y-4">
          <!-- Label -->
          <div>
            <span class="block text-sm font-semibold text-gray-700 mb-2">Libellé *</span>
            <input
              type="text"
              formControlName="label"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="Ex: Livraison offerte"
            />
          </div>

          <!-- Description -->
          <div>
            <span class="block text-sm font-semibold text-gray-700 mb-2">Description</span>
            <textarea
              formControlName="description"
              rows="2"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
              placeholder="Description visible par les utilisateurs"
            ></textarea>
          </div>

          <!-- Type -->
          <div>
            <span class="block text-sm font-semibold text-gray-700 mb-2">Type *</span>
            <select
              formControlName="type"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              <option value="shipping">Livraison gratuite</option>
              <option value="amount">Montant fixe (€)</option>
              <option value="percent">Pourcentage (%)</option>
              <option value="gift">Produit offert</option>
            </select>
          </div>

          <!-- Points requis -->
          <div>
            <span class="block text-sm font-semibold text-gray-700 mb-2">Points requis *</span>
            <input
              type="number"
              min="1"
              step="1"
              formControlName="pointsRequired"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="Ex: 100"
            />
          </div>

          <!-- Valeur (conditionnelle selon le type) -->
          @if (rewardForm.get('type')?.value !== 'shipping') {
          <div>
            <span class="block text-sm font-semibold text-gray-700 mb-2">
              @if (rewardForm.get('type')?.value === 'amount') { Montant de la réduction (€) * } @if
              (rewardForm.get('type')?.value === 'percent') { Pourcentage de réduction (%) * } @if
              (rewardForm.get('type')?.value === 'gift') { ID du produit offert * }
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              formControlName="value"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="Ex: 5"
            />
          </div>
          }

          <!-- Plafond (si type = percent) -->
          @if (rewardForm.get('type')?.value === 'percent') {
          <div>
            <span class="block text-sm font-semibold text-gray-700 mb-2"
              >Plafond en € (optionnel)</span
            >
            <input
              type="number"
              min="0"
              step="0.01"
              formControlName="percentCap"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="Ex: 30"
            />
          </div>
          }

          <!-- giftProductId (si type = gift) -->
          @if (rewardForm.get('type')?.value === 'gift') {
          <div>
            <span class="block text-sm font-semibold text-gray-700 mb-2"
              >ID du produit offert *</span
            >
            <input
              type="number"
              min="1"
              step="1"
              formControlName="giftProductId"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="Ex: 123"
            />
          </div>
          }

          <!-- Actif -->
          <div>
            <label
              class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
            >
              <input
                type="checkbox"
                formControlName="isActive"
                class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div>
                <div class="font-medium text-gray-900">Récompense active</div>
                <div class="text-xs text-gray-500 mt-0.5">
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
              class="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="!rewardForm.valid"
              class="px-6 py-2.5 rounded-xl font-semibold transition-all"
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
  `,
  styles: [],
})
export class AdminFidelitySettingsPage {
  private readonly fidelityStore = inject(FidelityStore);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly settings = this.fidelityStore.settings;
  readonly rewards = this.fidelityStore.rewards;

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

  toggleEnabled(): void {
    const current = this.settings().enabled;
    this.fidelityStore.updateSettings({ enabled: !current });
    this.toast.success(`Programme ${!current ? 'activé' : 'désactivé'}`);
  }

  updateRate(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (value > 0) {
      this.fidelityStore.updateSettings({ ratePerEuro: value });
      this.toast.success('Taux mis à jour');
    }
  }

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

    const formValue = this.rewardForm.value;
    const payload: Omit<FidelityReward, 'id' | 'createdAt' | 'updatedAt'> = {
      label: formValue.label!,
      description: formValue.description ?? undefined,
      type: formValue.type as FidelityRewardType,
      pointsRequired: formValue.pointsRequired!,
      value: formValue.value ?? 0,
      percentCap: formValue.type === 'percent' ? formValue.percentCap ?? undefined : undefined,
      giftProductId: formValue.type === 'gift' ? formValue.giftProductId ?? undefined : undefined,
      isActive: formValue.isActive ?? true,
    };

    const editing = this.editingReward();
    if (editing) {
      this.fidelityStore.updateReward(editing.id, payload);
      this.toast.success('Récompense modifiée');
    } else {
      this.fidelityStore.createReward(payload);
      this.toast.success('Récompense créée');
    }

    this.closeModal();
  }

  deleteReward(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette récompense ?')) return;

    this.fidelityStore.deleteReward(id);
    this.toast.success('Récompense supprimée');
  }
}
