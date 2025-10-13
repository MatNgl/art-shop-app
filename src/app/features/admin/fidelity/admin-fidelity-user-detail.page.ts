import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../auth/services/auth';
import { FidelityStore } from '../../fidelity/services/fidelity-store';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-fidelity-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-12">
      <div class="max-w-6xl mx-auto px-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl mb-8">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button
                type="button"
                (click)="goBack()"
                class="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm hover:bg-opacity-30 transition-all"
              >
                <i class="fa-solid fa-arrow-left text-xl text-white"></i>
              </button>
              <div
                class="w-16 h-16 bg-gradient-to-br from-white to-purple-100 rounded-2xl flex items-center justify-center text-purple-600 font-bold text-2xl"
              >
                {{ getInitials() }}
              </div>
              <div>
                <h1 class="text-3xl font-bold text-white mb-1">
                  {{ user()?.firstName }} {{ user()?.lastName }}
                </h1>
                <p class="text-purple-100">{{ user()?.email }}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-4xl font-bold text-white">{{ account()?.points ?? 0 }}</div>
              <div class="text-sm text-purple-100">points disponibles</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Timeline (Ledger) -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h2 class="text-xl font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-history"></i>
                  Historique des transactions
                </h2>
              </div>
              <div class="p-6 max-h-[700px] overflow-y-auto">
                @if (ledger().length === 0) {
                <div class="text-center py-12 text-gray-500">
                  <i class="fa-solid fa-clock-rotate-left text-6xl text-gray-300 mb-4"></i>
                  <p class="text-lg font-medium">Aucune transaction</p>
                  <p class="text-sm mt-2">L'historique apparaîtra ici</p>
                </div>
                } @else {
                <div class="space-y-4">
                  @for (entry of ledger(); track entry.id) {
                  <div
                    class="border-2 rounded-xl p-4 transition-all"
                    [class.border-green-200]="entry.points > 0"
                    [class.bg-green-50]="entry.points > 0"
                    [class.border-red-200]="entry.points < 0"
                    [class.bg-red-50]="entry.points < 0"
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        [class.bg-green-600]="entry.points > 0"
                        [class.text-white]="entry.points > 0"
                        [class.bg-red-600]="entry.points < 0"
                        [class.text-white]="entry.points < 0"
                      >
                        @if (entry.type === 'earn') {
                        <i class="fa-solid fa-plus text-xl"></i>
                        } @if (entry.type === 'use') {
                        <i class="fa-solid fa-minus text-xl"></i>
                        } @if (entry.type === 'adjust') {
                        <i class="fa-solid fa-wrench text-xl"></i>
                        } @if (entry.type === 'revoke') {
                        <i class="fa-solid fa-ban text-xl"></i>
                        }
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                          <div>
                            <span
                              class="text-lg font-bold"
                              [class.text-green-700]="entry.points > 0"
                              [class.text-red-700]="entry.points < 0"
                            >
                              {{ entry.points > 0 ? '+' : '' }}{{ entry.points }} pts
                            </span>
                            <span
                              class="ml-3 text-xs font-semibold uppercase px-2 py-1 rounded"
                              [class.bg-green-200]="entry.type === 'earn'"
                              [class.text-green-700]="entry.type === 'earn'"
                              [class.bg-blue-200]="entry.type === 'use'"
                              [class.text-blue-700]="entry.type === 'use'"
                              [class.bg-orange-200]="entry.type === 'adjust'"
                              [class.text-orange-700]="entry.type === 'adjust'"
                              [class.bg-red-200]="entry.type === 'revoke'"
                              [class.text-red-700]="entry.type === 'revoke'"
                            >
                              {{ getTypeLabel(entry.type) }}
                            </span>
                          </div>
                          <span class="text-xs text-gray-400">
                            {{ formatDate(entry.createdAt) }}
                          </span>
                        </div>
                        <p class="text-sm text-gray-700">{{ entry.note }}</p>
                        @if (entry.orderId) {
                        <div class="mt-2">
                          <span class="text-xs font-medium text-gray-500">
                            Commande #{{ entry.orderId }}
                          </span>
                        </div>
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

          <!-- Actions Admin -->
          <div class="lg:col-span-1">
            <div class="space-y-6">
              <!-- Ajuster les points -->
              <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div class="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-wrench"></i>
                    Ajuster les points
                  </h2>
                </div>
                <form [formGroup]="adjustForm" (ngSubmit)="adjustPoints()" class="p-6 space-y-4">
                  <div>
                    <span class="block text-sm font-semibold text-gray-700 mb-2">
                      Delta (positif ou négatif)
                    </span>
                    <input
                      type="number"
                      formControlName="delta"
                      class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      placeholder="Ex: +100 ou -50"
                    />
                  </div>
                  <div>
                    <span class="block text-sm font-semibold text-gray-700 mb-2">
                      Note (obligatoire)
                    </span>
                    <textarea
                      formControlName="note"
                      rows="3"
                      class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 resize-none"
                      placeholder="Raison de l'ajustement..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    [disabled]="!adjustForm.valid"
                    class="w-full px-4 py-2.5 rounded-xl font-semibold transition-all"
                    [class.bg-gradient-to-r]="adjustForm.valid"
                    [class.from-orange-600]="adjustForm.valid"
                    [class.to-red-600]="adjustForm.valid"
                    [class.text-white]="adjustForm.valid"
                    [class.hover:shadow-lg]="adjustForm.valid"
                    [class.bg-gray-300]="!adjustForm.valid"
                    [class.text-gray-500]="!adjustForm.valid"
                    [class.cursor-not-allowed]="!adjustForm.valid"
                  >
                    <i class="fa-solid fa-check mr-2"></i>
                    Appliquer l'ajustement
                  </button>
                </form>
              </div>

              <!-- Révoquer par commande -->
              <div class="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div class="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-ban"></i>
                    Révoquer une commande
                  </h2>
                </div>
                <form [formGroup]="revokeForm" (ngSubmit)="revokeOrder()" class="p-6 space-y-4">
                  <div>
                    <span class="block text-sm font-semibold text-gray-700 mb-2">
                      ID de la commande
                    </span>
                    <input
                      type="number"
                      min="1"
                      formControlName="orderId"
                      class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      placeholder="Ex: 1234"
                    />
                    <p class="text-xs text-gray-500 mt-2">
                      Les points gagnés pour cette commande seront débités.
                    </p>
                  </div>
                  <button
                    type="submit"
                    [disabled]="!revokeForm.valid"
                    class="w-full px-4 py-2.5 rounded-xl font-semibold transition-all"
                    [class.bg-gradient-to-r]="revokeForm.valid"
                    [class.from-red-600]="revokeForm.valid"
                    [class.to-pink-600]="revokeForm.valid"
                    [class.text-white]="revokeForm.valid"
                    [class.hover:shadow-lg]="revokeForm.valid"
                    [class.bg-gray-300]="!revokeForm.valid"
                    [class.text-gray-500]="!revokeForm.valid"
                    [class.cursor-not-allowed]="!revokeForm.valid"
                  >
                    <i class="fa-solid fa-ban mr-2"></i>
                    Révoquer la commande
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminFidelityUserDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly fidelityStore = inject(FidelityStore);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly userId = signal<number | null>(null);
  private allUsers = signal<Awaited<ReturnType<typeof this.authService.getAllUsers>>>([]);

  readonly user = computed(() => {
    const uid = this.userId();
    if (!uid) return null;
    return this.allUsers().find((u) => u.id === uid);
  });

  readonly account = computed(() => {
    const uid = this.userId();
    if (!uid) return null;
    return this.fidelityStore.getAccount(uid);
  });

  readonly ledger = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    return this.fidelityStore.getLedger(uid);
  });

  readonly adjustForm = this.fb.group({
    delta: [0, [Validators.required]],
    note: ['', [Validators.required, Validators.minLength(5)]],
  });

  readonly revokeForm = this.fb.group({
    orderId: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(parseInt(id, 10));
    }
    void this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    try {
      const users = await this.authService.getAllUsers();
      this.allUsers.set(users);
    } catch {
      this.allUsers.set([]);
    }
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    const first = u.firstName?.charAt(0).toUpperCase() ?? '';
    const last = u.lastName?.charAt(0).toUpperCase() ?? '';
    return first + last || '?';
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'earn':
        return 'Gagné';
      case 'use':
        return 'Utilisé';
      case 'adjust':
        return 'Ajustement';
      case 'revoke':
        return 'Révoqué';
      default:
        return type;
    }
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  adjustPoints(): void {
    if (!this.adjustForm.valid) return;

    const uid = this.userId();
    if (!uid) return;

    const delta = this.adjustForm.value.delta!;
    const note = this.adjustForm.value.note!;

    this.fidelityStore.adjustPoints(uid, delta, note);
    this.toast.success(`Ajustement de ${delta > 0 ? '+' : ''}${delta} points effectué`);
    this.adjustForm.reset({ delta: 0, note: '' });
  }

  revokeOrder(): void {
    if (!this.revokeForm.valid) return;

    const orderId = this.revokeForm.value.orderId!;
    const result = this.fidelityStore.revokeForOrder(orderId);

    if (result.success) {
      this.toast.success(`Révocation effectuée : ${result.revokedPoints} points débités`);
      this.revokeForm.reset({ orderId: 0 });
    } else {
      this.toast.error(result.error ?? 'Erreur lors de la révocation');
    }
  }

  goBack(): void {
    void this.router.navigate(['/admin/fidelity/users']);
  }
}
