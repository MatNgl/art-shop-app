import { Injectable, inject } from '@angular/core';
import { PromotionService } from './promotion.service';
import { Product } from '../../catalog/models/product.model';
import { Promotion } from '../models/promotion.model';

export interface ProductPromotionResult {
  hasPromotion: boolean;
  bestPromotion: Promotion | null;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  allPromotions: Promotion[];
  badge: string; // Ex: "-20%", "-10€"
  message: string; // Ex: "Soldes d'hiver"
}

/**
 * Service pour calculer et afficher les promotions sur les produits individuels
 * Gère la cumulabilité, les priorités, et génère les badges/messages
 */
@Injectable({
  providedIn: 'root',
})
export class ProductPromotionService {
  private readonly promotionService = inject(PromotionService);

  /**
   * Calcule la meilleure promotion applicable pour un produit
   * Prend en compte la cumulabilité et la priorité
   */
  async calculateProductPromotion(product: Product): Promise<ProductPromotionResult> {
    // Récupérer toutes les promotions automatiques pour ce produit
    const allPromotions = await this.getApplicablePromotions(product);

    if (allPromotions.length === 0) {
      return this.getEmptyResult(product);
    }

    // Séparer les promotions cumulables et non-cumulables
    const stackablePromotions = allPromotions.filter((p) => p.isStackable);
    const nonStackablePromotions = allPromotions.filter((p) => !p.isStackable);

    let bestPromotion: Promotion | null = null;
    let totalDiscount = 0;
    let appliedPromotions: Promotion[] = [];

    // Si on a des promotions non-cumulables, prendre la meilleure
    if (nonStackablePromotions.length > 0) {
      const best = this.getBestPromotion(product, nonStackablePromotions);
      bestPromotion = best.promotion;
      totalDiscount = best.discount;
      appliedPromotions = [bestPromotion];
    } else if (stackablePromotions.length > 0) {
      // Sinon, cumuler toutes les promotions cumulables
      for (const promo of stackablePromotions) {
        const discount = this.calculateDiscount(product, promo);
        totalDiscount += discount;
        appliedPromotions.push(promo);
      }
      // La "meilleure" est celle qui a la plus grande réduction individuelle
      const best = this.getBestPromotion(product, stackablePromotions);
      bestPromotion = best.promotion;
    }

    const originalPrice = product.reducedPrice || product.originalPrice;
    const discountedPrice = Math.max(0, originalPrice - totalDiscount);
    const discountPercentage = originalPrice > 0 ? (totalDiscount / originalPrice) * 100 : 0;

    return {
      hasPromotion: true,
      bestPromotion,
      originalPrice,
      discountedPrice,
      discountAmount: totalDiscount,
      discountPercentage,
      allPromotions: appliedPromotions,
      badge: this.generateBadge(bestPromotion!, totalDiscount, discountPercentage),
      message: bestPromotion?.description || bestPromotion?.name || '',
    };
  }

  /**
   * Récupère toutes les promotions applicables pour un produit
   */
  private async getApplicablePromotions(product: Product): Promise<Promotion[]> {
    try {
      const allPromotions = await this.promotionService.getPromotionsForProduct(product);

      // Filtrer uniquement les promotions automatiques et actives
      const validPromotions = allPromotions.filter((promo) => {
        if (promo.type !== 'automatic') return false;
        if (!promo.isActive) return false;

        // Vérifier les dates
        const now = new Date();
        const start = new Date(promo.startDate);
        if (start > now) return false;

        if (promo.endDate) {
          const end = new Date(promo.endDate);
          if (end < now) return false;
        }

        // Vérifier si le produit est déjà en promo et si on doit l'exclure
        if (promo.conditions?.excludePromotedProducts && product.reducedPrice) {
          return false;
        }

        // Filtrer les scopes qui ne s'appliquent pas aux produits individuels
        const validScopes = ['product', 'category', 'subcategory', 'size', 'site-wide'];
        return validScopes.includes(promo.scope);
      });

      // Trier par priorité décroissante
      return validPromotions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    } catch (error) {
      console.error('Erreur lors de la récupération des promotions:', error);
      return [];
    }
  }

  /**
   * Trouve la meilleure promotion (celle qui donne le plus de réduction)
   */
  private getBestPromotion(
    product: Product,
    promotions: Promotion[]
  ): { promotion: Promotion; discount: number } {
    let bestPromo = promotions[0];
    let bestDiscount = this.calculateDiscount(product, bestPromo);

    for (const promo of promotions) {
      const discount = this.calculateDiscount(product, promo);
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestPromo = promo;
      }
    }

    return { promotion: bestPromo, discount: bestDiscount };
  }

  /**
   * Calcule le montant de réduction pour un produit et une promotion
   */
  private calculateDiscount(product: Product, promotion: Promotion): number {
    const price = product.reducedPrice || product.originalPrice;

    if (promotion.discountType === 'percentage') {
      return (price * promotion.discountValue) / 100;
    } else if (promotion.discountType === 'fixed') {
      return Math.min(promotion.discountValue, price);
    }

    return 0;
  }

  /**
   * Génère le badge à afficher sur la carte produit
   */
  private generateBadge(promotion: Promotion, totalDiscount: number, discountPercentage: number): string {
    // Si on a une seule promotion, utiliser son format
    if (promotion.discountType === 'percentage') {
      return `-${Math.round(discountPercentage)}%`;
    } else {
      return `-${totalDiscount.toFixed(0)}€`;
    }
  }

  /**
   * Retourne un résultat vide (pas de promotion)
   */
  private getEmptyResult(product: Product): ProductPromotionResult {
    const price = product.reducedPrice || product.originalPrice;
    return {
      hasPromotion: false,
      bestPromotion: null,
      originalPrice: price,
      discountedPrice: price,
      discountAmount: 0,
      discountPercentage: 0,
      allPromotions: [],
      badge: '',
      message: '',
    };
  }

  /**
   * Calcule les promotions pour plusieurs produits en une fois (optimisation)
   */
  async calculateProductPromotions(products: Product[]): Promise<Map<number, ProductPromotionResult>> {
    const results = new Map<number, ProductPromotionResult>();

    await Promise.all(
      products.map(async (product) => {
        const result = await this.calculateProductPromotion(product);
        results.set(product.id, result);
      })
    );

    return results;
  }

  // ===== Méthodes legacy (pour compatibilité) =====

  /**
   * @deprecated Utiliser calculateProductPromotion() à la place
   */
  async applyPromotionsToProduct(product: Product): Promise<Product> {
    const result = await this.calculateProductPromotion(product);
    return {
      ...product,
      reducedPrice: result.hasPromotion ? result.discountedPrice : product.reducedPrice,
    };
  }

  /**
   * @deprecated Utiliser calculateProductPromotions() à la place
   */
  async applyPromotionsToProducts(products: Product[]): Promise<Product[]> {
    const promises = products.map((p) => this.applyPromotionsToProduct(p));
    return Promise.all(promises);
  }

  /**
   * @deprecated Utiliser calculateProductPromotion() à la place
   */
  async getBestPromotionForProduct(product: Product): Promise<Promotion | null> {
    const result = await this.calculateProductPromotion(product);
    return result.bestPromotion;
  }

  /**
   * @deprecated Utiliser calculateProductPromotion() à la place
   */
  async getDiscountAmount(product: Product): Promise<number> {
    const result = await this.calculateProductPromotion(product);
    return result.discountAmount;
  }
}
