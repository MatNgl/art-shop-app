import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth';
import { FidelityStore } from '../../services/fidelity-store';
import { FidelityCalculatorService } from '../../services/fidelity-calculator.service';
import { FidelityProgressComponent } from '../../components/fidelity-progress/fidelity-progress.component';

@Component({
  selector: 'app-user-fidelity',
  standalone: true,
  imports: [CommonModule, FidelityProgressComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12">
      <div class="max-w-6xl mx-auto px-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl mb-8">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <i class="fa-solid fa-trophy text-3xl text-white"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">Mon programme de fidélité</h1>
              <p class="text-purple-100">Cumulez des points et profitez de récompenses exclusives</p>
            </div>
          </div>
          <div class="flex items-center gap-6 mt-6">
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-6 py-3 flex-1">
              <div class="text-xs text-purple-100 mb-1">Solde actuel</div>
              <div class="text-3xl font-bold text-white">{{ currentPoints() }} pts</div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-6 py-3 flex-1">
              <div class="text-xs text-purple-100 mb-1">Récompenses disponibles</div>
              <div class="text-3xl font-bold text-white">{{ availableRewards().length }}</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left: Progress + Available Rewards -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Progress bar -->
            @if (currentUser(); as user) {
              <app-fidelity-progress [userId]="user.id" />
            }

            <!-- Catalogue de récompenses disponibles -->
            <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
              <div class="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
                <div class="flex items-center gap-3">
                  <i class="fa-solid fa-gifts text-2xl text-white"></i>
                  <h2 class="text-xl font-bold text-white">Récompenses disponibles</h2>
                </div>
              </div>
              <div class="p-6">
                @if (availableRewards().length === 0) {
                  <div class="text-center py-12 text-gray-500">
                    <i class="fa-solid fa-gift text-6xl text-gray-300 mb-4"></i>
                    <p class="text-lg font-medium">Aucune récompense disponible pour le moment</p>
                    <p class="text-sm mt-2">Cumulez plus de points pour débloquer des récompenses !</p>
                  </div>
                } @else {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @for (reward of availableRewards(); track reward.id) {
                      <div
                        class="border-2 border-green-200 bg-green-50 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
                        [class.opacity-50]="selectedRewardId() === reward.id"
                      >
                        <div class="flex items-start gap-3">
                          <div class="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                            @if (reward.type === 'shipping') {
                              <i class="fa-solid fa-truck text-xl"></i>
                            }
                            @if (reward.type === 'amount') {
                              <i class="fa-solid fa-euro-sign text-xl"></i>
                            }
                            @if (reward.type === 'percent') {
                              <i class="fa-solid fa-percent text-xl"></i>
                            }
                            @if (reward.type === 'gift') {
                              <i class="fa-solid fa-gift text-xl"></i>
                            }
                          </div>
                          <div class="flex-1">
                            <h3 class="font-bold text-gray-800 mb-1">{{ reward.label }}</h3>
                            <p class="text-xs text-gray-600 mb-2">{{ reward.description }}</p>
                            <div class="flex items-center justify-between">
                              <span class="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded">
                                {{ reward.pointsRequired }} pts
                              </span>
                              <button
                                (click)="useReward(reward.id)"
                                [disabled]="selectedRewardId() === reward.id"
                                class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                [class.bg-green-600]="selectedRewardId() !== reward.id"
                                [class.text-white]="selectedRewardId() !== reward.id"
                                [class.hover:bg-green-700]="selectedRewardId() !== reward.id"
                                [class.bg-gray-300]="selectedRewardId() === reward.id"
                                [class.text-gray-500]="selectedRewardId() === reward.id"
                                [class.cursor-not-allowed]="selectedRewardId() === reward.id"
                              >
                                @if (selectedRewardId() === reward.id) {
                                  Utilisée
                                } @else {
                                  Utiliser
                                }
                              </button>
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

          <!-- Right: Historique (Ledger) -->
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
                            @if (entry.type === 'earn') {
                              <i class="fa-solid fa-plus text-xs"></i>
                            }
                            @if (entry.type === 'use') {
                              <i class="fa-solid fa-minus text-xs"></i>
                            }
                            @if (entry.type === 'adjust') {
                              <i class="fa-solid fa-wrench text-xs"></i>
                            }
                            @if (entry.type === 'revoke') {
                              <i class="fa-solid fa-ban text-xs"></i>
                            }
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
                              <span class="text-xs text-gray-400">
                                {{ formatDate(entry.createdAt) }}
                              </span>
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

  readonly currentUser = computed(() => this.auth.currentUser$());
  readonly selectedRewardId = signal<number | null>(null);

  readonly currentPoints = computed(() => {
    const user = this.currentUser();
    return user ? this.fidelityStore.getPoints(user.id) : 0;
  });

  readonly ledger = computed(() => {
    const user = this.currentUser();
    return user ? this.fidelityStore.getLedger(user.id) : [];
  });

  readonly allRewards = computed(() => this.fidelityStore.rewards().filter((r) => r.isActive));

  readonly availableRewards = computed(() => {
    return this.calculator.findAvailableRewards(this.currentPoints(), this.allRewards());
  });

  useReward(rewardId: number): void {
    const user = this.currentUser();
    if (!user) {
      void this.router.navigate(['/login']);
      return;
    }

    const result = this.fidelityStore.useReward(user.id, rewardId);
    if (result.success) {
      this.selectedRewardId.set(rewardId);
      alert(`Récompense utilisée ! Elle sera appliquée lors de votre prochain passage en caisse.`);
      // Note : dans une vraie app, on stockerait la récompense sélectionnée dans le panier ou checkout
    } else {
      alert(`Erreur : ${result.error}`);
    }
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

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
