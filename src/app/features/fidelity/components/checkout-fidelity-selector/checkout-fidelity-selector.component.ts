import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth';
import { FidelityStore } from '../../services/fidelity-store';
import { FidelityCalculatorService, AppliedFidelityDiscount } from '../../services/fidelity-calculator.service';
import { FidelityReward } from '../../models/fidelity.models';
import { ConfirmService } from '../../../../shared/services/confirm.service';

export interface SelectedFidelityReward {
  reward: FidelityReward;
  appliedDiscount: AppliedFidelityDiscount;
}

@Component({
  selector: 'app-checkout-fidelity-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ===== Mode COMPACT ===== -->
    @if (variant() === 'compact') {
      @if (isEnabled() && currentUser()) {
        <div class="fid-compact">
          <div class="fid-compact__header">Récompenses fidélité</div>

          <!-- Applied -->
          @if (appliedReward()) {
            <div class="fid-compact__applied">
              <div class="text">
                <span class="dot dot--green"></span>
                <strong>{{ appliedReward()!.label }}</strong> appliquée
              </div>
              <button type="button" class="link" (click)="onCancelApplied()">Annuler</button>
            </div>
          }

          <!-- List -->
          @if (availableRewards().length > 0) {
            <ul class="fid-compact__list">
              @for (reward of availableRewards().slice(0, 5); track reward.id) {
                <li class="row">
                  <div class="row__main">
                    <span class="row__label">{{ reward.label }}</span>
                    <span class="row__pts">{{ reward.pointsRequired }} pts</span>
                  </div>
                  <button
                    type="button"
                    class="btn-mini"
                    (click)="onConfirmApply(reward.id)"
                    [disabled]="!!appliedReward() && appliedReward()!.id !== reward.id && oneRewardPerOrder()"
                  >
                    Utiliser
                  </button>
                </li>
              }
            </ul>
          } @else {
            <div class="fid-compact__empty">Aucune récompense disponible.</div>
          }
        </div>
      }
    }

    <!-- ===== Mode COMPLET (ancien rendu) ===== -->
    @if (variant() === 'full') {
      @if (isEnabled() && currentUser() && allRewards().length > 0) {
        <div class="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <i class="fa-solid fa-star text-xl text-white"></i>
              </div>
              <div class="flex-1">
                <h2 class="text-lg font-bold text-white">Programme de fidélité</h2>
                <p class="text-xs text-purple-100">Utilisez vos points pour obtenir une récompense</p>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-white">{{ currentPoints() }}</div>
                <div class="text-xs text-purple-100">points disponibles</div>
              </div>
            </div>
          </div>

          <div class="p-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
              <i class="fa-solid fa-info-circle mr-2"></i>
              <strong>Une seule récompense fidélité</strong> peut être appliquée par commande.
            </div>

            @if (appliedReward()) {
              <div class="mb-4 p-3 border-2 border-green-300 bg-green-50 rounded-lg">
                <div class="flex items-center justify-between">
                  <div class="text-sm text-green-800">
                    <i class="fa-solid fa-badge-check mr-2"></i>
                    Récompense appliquée :
                    <strong>{{ appliedReward()!.label }}</strong>
                  </div>
                  <button
                    type="button"
                    class="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                    (click)="onCancelApplied()"
                  >
                    Annuler l'utilisation
                  </button>
                </div>
              </div>
            }

            <div class="space-y-3">
              @for (reward of availableRewards(); track reward.id) {
                <label
                  class="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md"
                  [class.border-gray-300]="selectedRewardId() !== reward.id"
                  [class.bg-white]="selectedRewardId() !== reward.id"
                  [class.border-purple-500]="selectedRewardId() === reward.id"
                  [class.bg-purple-50]="selectedRewardId() === reward.id"
                >
                  <input
                    type="radio"
                    name="fidelityReward"
                    [value]="reward.id"
                    [checked]="selectedRewardId() === reward.id"
                    (change)="selectReward(reward.id)"
                    class="mt-1"
                    [disabled]="!!appliedReward() && appliedReward()!.id !== reward.id && oneRewardPerOrder()"
                    [attr.aria-describedby]="'reward-' + reward.id + '-desc'"
                  />
                  <div
                    class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    [class.bg-purple-600]="selectedRewardId() === reward.id"
                    [class.text-white]="selectedRewardId() === reward.id"
                    [class.bg-gray-200]="selectedRewardId() !== reward.id"
                    [class.text-gray-500]="selectedRewardId() !== reward.id"
                  >
                    @if (reward.type === 'shipping') { <i class="fa-solid fa-truck text-xl"></i> }
                    @if (reward.type === 'amount') { <i class="fa-solid fa-euro-sign text-xl"></i> }
                    @if (reward.type === 'percent') { <i class="fa-solid fa-percent text-xl"></i> }
                    @if (reward.type === 'gift') { <i class="fa-solid fa-gift text-xl"></i> }
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <div class="font-bold text-gray-800">{{ reward.label }}</div>
                      <div class="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded">
                        {{ reward.pointsRequired }} pts
                      </div>
                    </div>
                    <div [id]="'reward-' + reward.id + '-desc'" class="text-xs text-gray-600 mb-2">
                      {{ reward.description }}
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="px-3 py-1.5 text-xs rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        (click)="onConfirmApply(reward.id)"
                        [disabled]="!!appliedReward() && appliedReward()!.id !== reward.id && oneRewardPerOrder()"
                      >
                        {{ appliedReward()?.id === reward.id ? 'Réappliquer' : 'Utiliser cette récompense' }}
                      </button>
                    </div>
                  </div>
                </label>
              }
            </div>

            @if (selectedRewardId()) {
              <div class="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-700">Points après utilisation (théorique) :</span>
                  <span class="font-bold text-purple-700">{{ remainingPoints() }} pts</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (isEnabled() && currentUser() && availableRewards().length === 0) {
        <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <i class="fa-solid fa-star text-purple-600 text-xl mt-0.5"></i>
            <div>
              <div class="text-sm font-semibold text-gray-800 mb-1">Aucune récompense disponible</div>
              <div class="text-xs text-gray-600">
                Vous avez actuellement <strong>{{ currentPoints() }} points</strong>.
                Continuez à cumuler pour débloquer des récompenses !
              </div>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    /* ------- Compact ------- */
    .fid-compact { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #fff; }
    .fid-compact__header { font-weight: 600; font-size: 0.95rem; margin-bottom: 8px; }
    .fid-compact__applied { display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; margin-bottom:8px; }
    .fid-compact__applied .text { display:flex; align-items:center; gap:8px; font-size:0.85rem; color:#065f46; }
    .dot { width:8px; height:8px; border-radius:9999px; display:inline-block; }
    .dot--green { background:#16a34a; }
    .link { font-size:0.78rem; color:#7c3aed; text-decoration:underline; text-underline-offset:2px; }
    .fid-compact__list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px; }
    .row { display:flex; justify-content:space-between; align-items:center; border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px; }
    .row__main { display:flex; align-items:center; gap:8px; }
    .row__label { font-size:0.9rem; color:#111827; }
    .row__pts { font-size:0.75rem; color:#6b7280; }
    .btn-mini { font-size:0.78rem; padding:4px 8px; border-radius:6px; background:#7c3aed; color:#fff; }
    .btn-mini[disabled] { opacity:.5; }
    .fid-compact__empty { font-size:.85rem; color:#6b7280; }
  `],
})
export class CheckoutFidelitySelectorComponent {
  // NEW: compact/full
  readonly variant = input<'full' | 'compact'>('full');

  private readonly auth = inject(AuthService);
  private readonly fidelityStore = inject(FidelityStore);
  private readonly calculator = inject(FidelityCalculatorService);
  private readonly confirm = inject(ConfirmService);

  // (legacy output conservé)
  rewardSelected = output<SelectedFidelityReward | null>();

  readonly selectedRewardId = signal<number | null>(null);

  readonly isEnabled = computed(() => this.fidelityStore.isEnabled());
  readonly currentUser = computed(() => this.auth.currentUser$());
  readonly oneRewardPerOrder = computed(() => this.fidelityStore.settings().oneRewardPerOrder);

  readonly currentPoints = computed(() => {
    const user = this.currentUser();
    return user ? this.fidelityStore.getPoints(user.id) : 0;
  });

  readonly allRewards = computed(() => this.fidelityStore.rewards().filter((r) => r.isActive));

  readonly availableRewards = computed(() =>
    this.calculator.findAvailableRewards(this.currentPoints(), this.allRewards())
  );

  readonly appliedReward = computed(() => {
    const user = this.currentUser();
    return user ? this.fidelityStore.getAppliedReward(user.id) : null;
  });

  readonly remainingPoints = computed(() => {
    const rewardId = this.selectedRewardId();
    if (!rewardId) return this.currentPoints();
    const reward = this.allRewards().find((r) => r.id === rewardId);
    if (!reward) return this.currentPoints();
    return Math.max(0, this.currentPoints() - reward.pointsRequired);
  });

  selectReward(rewardId: number | null): void {
    this.selectedRewardId.set(rewardId);
    if (!rewardId) {
      this.rewardSelected.emit(null);
      return;
    }
    const reward = this.allRewards().find((r) => r.id === rewardId);
    if (!reward) {
      this.rewardSelected.emit(null);
      return;
    }
    const appliedDiscount = this.calculator.applyReward(reward, 100);
    if (!appliedDiscount) {
      this.rewardSelected.emit(null);
      return;
    }
    this.rewardSelected.emit({ reward, appliedDiscount });
  }

  async onConfirmApply(rewardId: number): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    const ok = await this.confirm.ask({
      title: 'Confirmer l’utilisation de la récompense',
      message: 'Une seule récompense peut être utilisée par commande. Voulez-vous appliquer cette récompense à votre panier ?',
      variant: 'primary',
      confirmText: 'Utiliser',
      cancelText: 'Annuler',
    });
    if (!ok) return;

    const res = this.fidelityStore.applyRewardToCart(user.id, rewardId);
    if (!res.success) {
      await this.confirm.ask({
        title: 'Impossible d’appliquer la récompense',
        message: res.error,
        variant: 'warning',
        confirmText: 'Ok',
        cancelText: 'Fermer',
      });
      return;
    }
    this.selectedRewardId.set(rewardId);
  }

  async onCancelApplied(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    const ok = await this.confirm.ask({
      title: 'Annuler l’utilisation ?',
      message: 'La récompense ne sera plus appliquée à cette commande.',
      variant: 'primary',
      confirmText: 'Annuler l’utilisation',
      cancelText: 'Garder',
    });
    if (!ok) return;

    this.fidelityStore.cancelAppliedReward(user.id);
    if (this.selectedRewardId() && this.appliedReward() && this.appliedReward()!.id === this.selectedRewardId()) {
      this.selectedRewardId.set(null);
    }
    this.rewardSelected.emit(null);
  }
}
