import { Injectable, signal, computed, inject } from '@angular/core';
import { Promotion } from '../models/promotion.model';
import { PromotionService } from './promotion.service';

/**
 * Store pour gérer l'état des promotions côté front-end
 */
@Injectable({
  providedIn: 'root',
})
export class PromotionsStore {
  private readonly promotionService = inject(PromotionService);

  // État
  private readonly _promotions = signal<Promotion[]>([]);
  private readonly _activePromotions = signal<Promotion[]>([]);
  private readonly _loading = signal<boolean>(false);

  // Signaux publics
  readonly promotions = this._promotions.asReadonly();
  readonly activePromotions = this._activePromotions.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed
  readonly automaticPromotions = computed(() =>
    this._activePromotions().filter((p) => p.type === 'automatic')
  );

  readonly codePromotions = computed(() =>
    this._activePromotions().filter((p) => p.type === 'code')
  );

  readonly siteWidePromotions = computed(() =>
    this._activePromotions().filter((p) => p.scope === 'site-wide' && p.type === 'automatic')
  );

  readonly count = computed(() => this._promotions().length);
  readonly activeCount = computed(() => this._activePromotions().length);

  constructor() {
    void this.loadActivePromotions();
  }

  /**
   * Charge toutes les promotions
   */
  async loadAll(): Promise<void> {
    this._loading.set(true);
    try {
      const promotions = await this.promotionService.getAll();
      this._promotions.set(promotions);
    } catch (error) {
      console.error('Erreur lors du chargement des promotions:', error);
      this._promotions.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Charge uniquement les promotions actives
   */
  async loadActivePromotions(): Promise<void> {
    try {
      const activePromotions = await this.promotionService.getActive();
      this._activePromotions.set(activePromotions);
    } catch (error) {
      console.error('Erreur lors du chargement des promotions actives:', error);
      this._activePromotions.set([]);
    }
  }

  /**
   * Rafraîchit les données
   */
  async refresh(): Promise<void> {
    await Promise.all([this.loadAll(), this.loadActivePromotions()]);
  }

  /**
   * Active/désactive une promotion
   */
  async toggleActive(id: number): Promise<boolean> {
    try {
      const updated = await this.promotionService.toggleActive(id);
      if (updated) {
        await this.refresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors du toggle de la promotion:', error);
      return false;
    }
  }

  /**
   * Supprime une promotion
   */
  async delete(id: number): Promise<boolean> {
    try {
      const success = await this.promotionService.delete(id);
      if (success) {
        await this.refresh();
      }
      return success;
    } catch (error) {
      console.error('Erreur lors de la suppression de la promotion:', error);
      return false;
    }
  }
}
