// FILE: src/app/features/promotions/services/promotions-store.ts
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { PromotionService } from './promotion.service';
import type { Promotion } from '../models/promotion.model';
import { ToastService } from '../../../shared/services/toast.service';

@Injectable({ providedIn: 'root' })
export class PromotionsStore {
  private readonly api = inject(PromotionService);
  private readonly toast = inject(ToastService);

  // --- State
  private readonly _promotions = signal<Promotion[]>([]);
  private readonly _loading = signal<boolean>(false);

  // --- Public signals/computed
  promotions = this._promotions.asReadonly();
  loading = this._loading.asReadonly();

  count = computed<number>(() => this._promotions().length);
  activeCount = computed<number>(() => this._promotions().filter((p) => p.isActive).length);

  constructor() {
    // Persist simple (résilience navigation/admin) — clé dédiée au domaine
    effect(() => {
      try {
        const data = JSON.stringify(this._promotions());
        localStorage.setItem('promotions_cache', data);
      } catch {
        // noop
      }
    });

    // Hydrate depuis cache (optionnel, non bloquant)
    try {
      const raw = localStorage.getItem('promotions_cache');
      if (raw) {
        const parsed = JSON.parse(raw) as Promotion[];
        if (Array.isArray(parsed)) this._promotions.set(parsed);
      }
    } catch {
      // noop
    }
  }

  // --- Load
  async loadAll(): Promise<void> {
    this._loading.set(true);
    try {
      const list = await this.api.getAll();
      this._promotions.set(list);
    } catch {
      this.toast.error('Impossible de charger les promotions');
      // on ne jette pas l’erreur pour ne pas casser l’UI
    } finally {
      this._loading.set(false);
    }
  }

  // --- Toggle active (optimiste)
  async toggleActive(id: number): Promise<boolean> {
    const current = this._promotions();
    const idx = current.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    const before = current[idx];
    const optimistic = { ...before, isActive: !before.isActive } as Promotion;

    // Optimistic update
    this._promotions.set([...current.slice(0, idx), optimistic, ...current.slice(idx + 1)]);

    try {
      const ok = await this.api.update(id, { isActive: optimistic.isActive });
      if (!ok) {
        // rollback
        this._promotions.set([...current.slice(0, idx), before, ...current.slice(idx + 1)]);
        return false;
      }
      return true;
    } catch {
      // rollback
      this._promotions.set([...current.slice(0, idx), before, ...current.slice(idx + 1)]);
      return false;
    }
  }

  // --- Delete (met à jour le signal immédiatement si succès)
  async delete(id: number): Promise<boolean> {
    try {
      const ok = await this.api.delete(id);
      if (!ok) return false;

      // IMPORTANT : on retire l’élément du signal => l’UI se met à jour instantanément
      this._promotions.update((arr) => arr.filter((p) => p.id !== id));
      return true;
    } catch {
      return false;
    }
  }

  // --- Helpers si besoin ailleurs
  getById(id: number): Promotion | undefined {
    return this._promotions().find((p) => p.id === id);
  }

  upsert(promo: Promotion): void {
    const arr = this._promotions();
    const idx = arr.findIndex((p) => p.id === promo.id);
    if (idx === -1) this._promotions.set([promo, ...arr]);
    else {
      this._promotions.set([...arr.slice(0, idx), promo, ...arr.slice(idx + 1)]);
    }
  }
}
