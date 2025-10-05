import { Injectable, inject } from '@angular/core';
import { PromotionService } from './promotion.service';
import { Product } from '../../catalog/models/product.model';
import { Promotion } from '../models/promotion.model';

/**
 * Service pour appliquer les promotions aux produits
 */
@Injectable({
  providedIn: 'root',
})
export class ProductPromotionService {
  private readonly promotionService = inject(PromotionService);

  /**
   * Applique les promotions automatiques à un produit
   * Retourne un nouveau produit avec le prix réduit calculé
   */
  async applyPromotionsToProduct(product: Product): Promise<Product> {
    const productPromo = await this.promotionService.getBestPromotionForProduct(product);

    if (!productPromo.bestDiscount) {
      return product;
    }

    // Créer une copie du produit avec le prix réduit
    return {
      ...product,
      reducedPrice: productPromo.bestDiscount.finalPrice,
    };
  }

  /**
   * Applique les promotions à une liste de produits
   */
  async applyPromotionsToProducts(products: Product[]): Promise<Product[]> {
    const promises = products.map(p => this.applyPromotionsToProduct(p));
    return Promise.all(promises);
  }

  /**
   * Récupère la meilleure promotion pour un produit
   */
  async getBestPromotionForProduct(product: Product): Promise<Promotion | null> {
    const productPromo = await this.promotionService.getBestPromotionForProduct(product);
    return productPromo.bestDiscount?.promotion ?? null;
  }

  /**
   * Calcule le montant de réduction pour un produit
   */
  async getDiscountAmount(product: Product): Promise<number> {
    const productPromo = await this.promotionService.getBestPromotionForProduct(product);
    return productPromo.bestDiscount?.discountAmount ?? 0;
  }
}
