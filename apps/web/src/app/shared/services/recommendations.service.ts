import { Injectable, inject } from '@angular/core';
import { BrowsingHistoryService } from './browsing-history.service';
import { ProductService } from '../../features/catalog/services/product';
import { AuthHttpService as AuthService } from '../../features/auth/services/auth-http.service';
import { OrderStore } from '../../features/cart/services/order-store';
import { Product } from '../../features/catalog/models/product.model';

@Injectable({ providedIn: 'root' })
export class RecommendationsService {
  private browsingHistory = inject(BrowsingHistoryService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private orderStore = inject(OrderStore);

  /**
   * Récupère des produits recommandés basés sur l'historique, favoris et commandes
   */
  async getRecommendations(limit = 6, excludeProductId?: number): Promise<Product[]> {
    try {
      const allProducts = await this.productService.getAllProducts();

      // 1. Récupérer les catégories des produits consultés
      const browsedCategoryIds = this.getBrowsedCategoryIds();

      // 2. Récupérer les catégories des produits achetés
      const purchasedCategoryIds = await this.getPurchasedCategoryIds();

      // 3. Combiner toutes les catégories avec pondération
      const categoryScores = new Map<number, number>();

      // Produits achetés : poids 3
      purchasedCategoryIds.forEach((catId: number) => {
        categoryScores.set(catId, (categoryScores.get(catId) || 0) + 3);
      });

      // Produits consultés : poids 2
      browsedCategoryIds.forEach((catId: number) => {
        categoryScores.set(catId, (categoryScores.get(catId) || 0) + 2);
      });

      // 4. Filtrer et scorer les produits
      const scoredProducts = allProducts
        .filter((p: Product) => p.id !== excludeProductId) // Exclure le produit actuel
        .map((product: Product) => {
          let score = 0;

          // Score basé sur la catégorie
          if (categoryScores.has(product.categoryId)) {
            score += categoryScores.get(product.categoryId)! * 10;
          }

          // Bonus pour les produits populaires (mock: basé sur ID pair)
          if (product.id % 2 === 0) {
            score += 5;
          }

          // Bonus pour les produits en promotion
          if (product.reducedPrice) {
            score += 3;
          }

          // Bonus pour les nouveaux produits (créés dans les 30 derniers jours)
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          if (product.createdAt && new Date(product.createdAt).getTime() > thirtyDaysAgo) {
            score += 2;
          }

          return { product, score };
        })
        .filter((item: { product: Product; score: number }) => item.score > 0); // Garder seulement les produits avec un score

      // 5. Trier par score décroissant
      scoredProducts.sort((a: { product: Product; score: number }, b: { product: Product; score: number }) => b.score - a.score);

      // 6. Retourner les N meilleurs
      return scoredProducts.slice(0, limit).map((item: { product: Product; score: number }) => item.product);
    } catch (error) {
      console.error('Erreur lors du calcul des recommandations:', error);
      return [];
    }
  }

  /**
   * Récupère les IDs des catégories des produits consultés récemment
   */
  private getBrowsedCategoryIds(): number[] {
    // Pour l'instant, on ne peut pas récupérer les categoryIds de l'historique
    // car BrowsingHistoryItem ne les stocke pas. On retourne un tableau vide
    // et on se basera sur les autres sources (achats)
    return [];
  }

  /**
   * Récupère les IDs des catégories des produits achetés
   */
  private async getPurchasedCategoryIds(): Promise<number[]> {
    try {
      const orders = this.orderStore.orders();
      const productIds = orders.flatMap((order) =>
        order.items.map((item) => item.productId)
      );

      // Récupérer les produits pour obtenir leurs catégories
      const products = await Promise.all(
        productIds.map((id) => this.productService.getProductById(id))
      );

      return products
        .filter((p): p is Product => !!p)
        .map((p: Product) => p.categoryId)
        .filter((catId: number) => !!catId);
    } catch {
      return [];
    }
  }

  /**
   * Récupère des produits similaires basés sur un produit donné
   */
  async getSimilarProducts(product: Product, limit = 4): Promise<Product[]> {
    try {
      const allProducts = await this.productService.getAllProducts();

      // Filtrer par même catégorie + exclure le produit actuel
      const similar = allProducts
        .filter(
          (p: Product) =>
            p.id !== product.id &&
            p.categoryId === product.categoryId
        )
        .slice(0, limit);

      // Si pas assez de produits similaires, compléter avec d'autres produits
      if (similar.length < limit) {
        const remaining = allProducts
          .filter((p: Product) => p.id !== product.id && !similar.includes(p))
          .slice(0, limit - similar.length);

        return [...similar, ...remaining];
      }

      return similar;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits similaires:', error);
      return [];
    }
  }
}
