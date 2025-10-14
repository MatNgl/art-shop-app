// src/app/features/fidelity/pages/user-fidelity/user-fidelity.page.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { FidelityStore } from '../../services/fidelity-store';
import { FidelityCalculatorService } from '../../services/fidelity-calculator.service';
import { FidelityReward } from '../../models/fidelity.models';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface RewardStatus {
  reward: FidelityReward;
  isUnlocked: boolean;
  isApplied: boolean;     // Nouveau: état appliqué au panier (pas "utilisée" au sens débitée)
  pointsRemaining: number;
}

@Component({
  selector: 'app-user-fidelity',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12">
      <div class="max-w-6xl mx-auto px-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl mb-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <i class="fa-solid fa-trophy text-3xl text-white"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">Mon programme de fidélité</h1>
              <p class="text-purple-100">Cumulez des points et profitez de récompenses exclusives</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <div class="text-xs uppercase tracking-wide text-purple-100 mb-1">Récompenses disponibles</div>
              <div class="text-3xl font-bold text-white">{{ availableCount() }}</div>
              <p class="text-xs text-purple-100 mt-1">{{ availableCount() === 0 ? 'Aucune pour le moment' : 'Prêtes à être appliquées' }}</p>
            </div>

            <div class="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <div class="text-xs uppercase tracking-wide text-purple-100 mb-1">Points actuels</div>
              <div class="text-3xl font-bold text-white">{{ currentPoints() }}</div>
              <p class="text-xs text-purple-100 mt-1">{{ currentPoints() === 0 ? 'Commencez à gagner des points' : 'Continuez à cumuler !' }}</p>
            </div>

            <div class="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <div class="text-xs uppercase tracking-wide text-purple-100 mb-1">Récompense appliquée</div>
              <div class="text-white font-semibold">
                {{ appliedReward() ? appliedReward()!.label : 'Aucune' }}
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Toutes les récompenses -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
              <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <i class="fa-solid fa-star text-2xl text-white"></i>
                    <h2 class="text-xl font-bold text-white">Toutes les récompenses</h2>
                  </div>
                  <div class="text-sm text-purple-100">
                    {{ unlockedCount() }} / {{ rewardsStatus().length }} débloquées
                  </div>
                </div>
              </div>

              <div class="p-6">
                @if (rewardsStatus().length === 0) {
                  <div class="text-center py-12 text-gray-500">
                    <i class="fa-solid fa-gift text-4xl text-gray-300 mb-4"></i>
                    <p class="text-sm">Aucune récompense configurée pour le moment</p>
                  </div>
                } @else {
                  <div class="space-y-3">
                    @for (status of rewardsStatus(); track status.reward.id) {
                      <div
                        class="border-2 rounded-xl p-4 transition-all"
                        [class.border-green-200]="status.isApplied"
                        [class.bg-green-50]="status.isApplied"
                        [class.border-purple-200]="status.isUnlocked && !status.isApplied"
                        [class.bg-purple-50]="status.isUnlocked && !status.isApplied"
                        [class.border-gray-200]="!status.isUnlocked"
                        [class.bg-gray-50]="!status.isUnlocked"
                      >
                        <div class="flex items-center gap-4">
                          <div
                            class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            [class.bg-green-600]="status.isApplied"
                            [class.text-white]="status.isApplied"
                            [class.bg-purple-600]="status.isUnlocked && !status.isApplied"
                            [class.text-white]="status.isUnlocked && !status.isApplied"
                            [class.bg-gray-300]="!status.isUnlocked"
                            [class.text-gray-500]="!status.isUnlocked"
                          >
                            @if (status.isUnlocked) { <i class="fa-solid fa-check text-xl"></i> }
                            @else { <i class="fa-solid fa-lock text-xl"></i> }
                          </div>

                          <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-gray-800 mb-1">{{ status.reward.label }}</h3>
                            <p class="text-xs text-gray-600 mb-2">{{ status.reward.description }}</p>
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="text-xs font-semibold bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded">
                                {{ status.reward.pointsRequired }} points requis
                              </span>
                              @if (!status.isUnlocked && status.pointsRemaining > 0) {
                                <span class="text-xs font-semibold text-orange-600">
                                  {{ status.pointsRemaining }} points restants
                                </span>
                              }
                              @if (status.isApplied) {
                                <span class="text-xs font-semibold text-green-600">
                                  <i class="fa-solid fa-badge-check"></i> Appliquée à la commande en cours
                                </span>
                              }
                            </div>
                          </div>

                          <div class="flex-shrink-0">
                            @if (status.isApplied) {
                              <button
                                type="button"
                                (click)="cancelApplied()"
                                class="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold text-sm hover:bg-orange-200 hover:shadow-lg transition-all"
                              >
                                <i class="fa-solid fa-times mr-1"></i>
                                Annuler
                              </button>
                            } @else if (status.isUnlocked) {
                              <button
                                type="button"
                                (click)="applyReward(status.reward.id, status.reward.label)"
                                class="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 hover:shadow-lg transition-all"
                                [disabled]="appliedReward() && appliedReward()!.id !== status.reward.id && oneRewardPerOrder()"
                                aria-disabled="{{ appliedReward() && appliedReward()!.id !== status.reward.id && oneRewardPerOrder() ? 'true' : 'false' }}"
                              >
                                <i class="fa-solid fa-gift mr-1"></i>
                                Utiliser
                              </button>
                            } @else {
                              <button
                                type="button"
                                disabled
                                class="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg font-semibold text-sm cursor-not-allowed"
                              >
                                <i class="fa-solid fa-lock mr-1"></i>
                                Verrouillée
                              </button>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Historique -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden sticky top-6">
              <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <div class="flex items-center gap-3">
                  <i class="fa-solid fa-clock-rotate-left text-2xl text-white"></i>
                  <h2 class="text-xl font-bold text-white">Historique</h2>
                </div>
              </div>
              <div class="p-6 max-h-[600px] overflow-y-auto">
                @if (ledger().length === 0) {
                  <div class="text-center py-12 text-gray-500">
                    <i class="fa-solid fa-history text-4xl text-gray-300 mb-4"></i>
                    <p class="text-sm">Aucune activité pour le moment</p>
                    <p class="text-xs text-gray-400 mt-2">Passez une commande pour gagner vos premiers points !</p>
                  </div>
                } @else {
                  <div class="space-y-3">
                    @for (entry of ledger(); track entry.id) {
                      <div
                        class="border-2 rounded-lg p-3 transition-all"
                        [class.border-green-200]="entry.points > 0"
                        [class.bg-green-50]="entry.points > 0"
                        [class.border-red-200]="entry.points < 0"
                        [class.bg-red-50]="entry.points < 0"
                      >
                        <div class="flex items-start gap-3">
                          <div
                            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            [class.bg-green-600]="entry.points > 0"
                            [class.text-white]="entry.points > 0"
                            [class.bg-red-600]="entry.points < 0"
                            [class.text-white]="entry.points < 0"
                          >
                            @if (entry.type === 'earn')   { <i class="fa-solid fa-plus text-xs"></i> }
                            @if (entry.type === 'use')    { <i class="fa-solid fa-minus text-xs"></i> }
                            @if (entry.type === 'adjust') { <i class="fa-solid fa-wrench text-xs"></i> }
                            @if (entry.type === 'revoke') { <i class="fa-solid fa-ban text-xs"></i> }
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-2">
                              <span
                                class="text-sm font-bold"
                                [class.text-green-700]="entry.points > 0"
                                [class.text-red-700]="entry.points < 0"
                              >
                                {{ entry.points > 0 ? '+' : '' }}{{ entry.points }} pts
                              </span>
                              <span class="text-xs text-gray-400">{{ formatDate(entry.createdAt) }}</span>
                            </div>
                            <p class="text-xs text-gray-600 mt-1 break-words">{{ entry.note }}</p>
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
  `,
  styles: [],
})
export class UserFidelityPage {
  private readonly auth = inject(AuthService);
  private readonly fidelityStore = inject(FidelityStore);
  private readonly calculator = inject(FidelityCalculatorService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly currentUser = computed(() => this.auth.currentUser$());
  readonly oneRewardPerOrder = computed(() => this.fidelityStore.settings().oneRewardPerOrder);

  readonly currentPoints = computed(() => {
    const user = this.currentUser();
    return user ? this.fidelityStore.getPoints(user.id) : 0;
  });

  readonly ledger = computed(() => {
    const user = this.currentUser();
    return user ? this.fidelityStore.getLedger(user.id) : [];
  });

  readonly allRewards = computed(() => this.fidelityStore.rewards().filter((r) => r.isActive));

  readonly appliedReward = computed(() => {
    const user = this.currentUser();
    return user ? this.fidelityStore.getAppliedReward(user.id) : null;
  });

  readonly rewardsStatus = computed((): RewardStatus[] => {
    const points = this.currentPoints();
    const applied = this.appliedReward();
    const appliedId = applied?.id ?? null;

    return this.allRewards()
      .sort((a, b) => a.pointsRequired - b.pointsRequired)
      .map((reward) => ({
        reward,
        isUnlocked: reward.pointsRequired <= points,
        isApplied: appliedId === reward.id,
        pointsRemaining: Math.max(0, reward.pointsRequired - points),
      }));
  });

  readonly availableCount = computed(() =>
    this.rewardsStatus().filter((s) => s.isUnlocked && !s.isApplied).length
  );

  readonly unlockedCount = computed(() => this.rewardsStatus().filter((s) => s.isUnlocked).length);

  readonly nextReward = computed(() => {
    const points = this.currentPoints();
    const rewards = this.allRewards();
    return this.calculator.findNextReward(points, rewards);
  });

  readonly pointsToNext = computed(() => {
    const next = this.nextReward();
    return next ? Math.max(0, next.pointsRequired - this.currentPoints()) : 0;
  });

  async applyReward(rewardId: number, rewardLabel: string): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      await this.router.navigate(['/login']);
      return;
    }

    const ok = await this.confirm.ask({
      title: 'Utiliser cette récompense ?',
      message:
        `Appliquer “${rewardLabel}” à votre panier ?\n\nUne seule récompense par commande. Vous pourrez annuler avant le paiement.`,
      confirmText: 'Appliquer',
      cancelText: 'Annuler',
      variant: 'primary',
    });
    if (!ok) return;

    const res = this.fidelityStore.applyRewardToCart(user.id, rewardId);
    if (!res.success) {
      this.toast.error(res.error ?? 'Impossible d’appliquer la récompense');
      return;
    }
    this.toast.success(`Récompense “${rewardLabel}” appliquée à la commande en cours.`);
  }

  async cancelApplied(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    const ok = await this.confirm.ask({
      title: 'Annuler l’utilisation ?',
      message:
        'La récompense ne sera plus appliquée à la commande en cours. Aucun point ne sera débité/crédité.',
      confirmText: 'Annuler l’utilisation',
      cancelText: 'Garder',
      variant: 'primary',
    });
    if (!ok) return;

    this.fidelityStore.cancelAppliedReward(user.id);
    this.toast.success('Récompense annulée pour cette commande.');
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
