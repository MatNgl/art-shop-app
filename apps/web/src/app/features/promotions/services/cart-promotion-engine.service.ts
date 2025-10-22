import { Injectable, inject } from '@angular/core';
import { PromotionService } from './promotion.service';
import { ProductService } from '../../catalog/services/product';
import { AuthService } from '../../auth/services/auth';
import {
  Promotion,
  CartPromotionResult,
  AppliedPromotion,
  PromotionProgress,
  ProgressiveTier,
} from '../models/promotion.model';
import { CartItem } from '../../cart/models/cart.model';
import { Product } from '../../catalog/models/product.model';

/**
 * Service de calcul avancé des promotions sur le panier
 * Gère tous les types de promotions complexes
 */
@Injectable({ providedIn: 'root' })
export class CartPromotionEngine {
  private promotionService = inject(PromotionService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  /**
   * Calcule toutes les promotions applicables au panier
   */
  async calculateCartPromotions(
    cartItems: CartItem[],
    subtotal: number,
    manualPromoCode?: string
  ): Promise<CartPromotionResult> {
    const appliedPromotions: AppliedPromotion[] = [];
    const progressIndicators: PromotionProgress[] = [];
    let totalDiscount = 0;
    let freeShipping = false;

    // Récupérer toutes les promotions actives
    const allPromotions = await this.promotionService.getActive();

    // Séparer les promotions automatiques et à code
    const automaticPromotions = allPromotions.filter((p) => p.type === 'automatic');
    const codePromotions = manualPromoCode
      ? allPromotions.filter(
          (p) => p.type === 'code' && p.code?.toUpperCase() === manualPromoCode.toUpperCase()
        )
      : [];

    // Combiner les promotions (selon cumulabilité)
    const eligiblePromotions = [...automaticPromotions, ...codePromotions];

    // Trier par priorité (plus haute priorité d'abord)
    eligiblePromotions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Récupérer les produits complets
    const productsMap = new Map<number, Product>();
    for (const item of cartItems) {
      const product = await this.productService.getProductById(item.productId);
      if (product) {
        productsMap.set(item.productId, product);
      }
    }

    // Calculer le nombre total de commandes de l'utilisateur
    const userOrderCount = await this.getUserOrderCount();

    // Traiter chaque promotion
    for (const promotion of eligiblePromotions) {
      // Vérifier si la promotion est valide
      if (!this.isPromotionValid(promotion, subtotal, cartItems, userOrderCount)) {
        // Créer un indicateur de progression si proche du seuil
        const progress = this.createProgressIndicator(promotion, subtotal, cartItems);
        if (progress) {
          progressIndicators.push(progress);
        }
        continue;
      }

      // Vérifier la cumulabilité
      if (appliedPromotions.length > 0 && !promotion.isStackable) {
        // Si non cumulable, on ne garde que la meilleure
        const currentTotal = appliedPromotions.reduce((sum, p) => sum + p.discountAmount, 0);
        const potentialDiscount = await this.calculatePromotionDiscount(
          promotion,
          cartItems,
          productsMap,
          subtotal
        );

        if (potentialDiscount.discountAmount > currentTotal) {
          // Cette promo est meilleure, on remplace
          appliedPromotions.length = 0;
          totalDiscount = 0;
          appliedPromotions.push(potentialDiscount);
          totalDiscount += potentialDiscount.discountAmount;
        }
        continue;
      }

      // Appliquer la promotion
      const result = await this.calculatePromotionDiscount(
        promotion,
        cartItems,
        productsMap,
        subtotal
      );

      if (result.discountAmount > 0 || promotion.discountType === 'free_shipping') {
        appliedPromotions.push(result);
        totalDiscount += result.discountAmount;

        if (promotion.discountType === 'free_shipping') {
          freeShipping = true;
        }
      }
    }

    return {
      appliedPromotions,
      progressIndicators,
      totalDiscount: +totalDiscount.toFixed(2),
      freeShipping,
    };
  }

  /**
   * Calcule la réduction pour une promotion donnée
   */
  private async calculatePromotionDiscount(
    promotion: Promotion,
    cartItems: CartItem[],
    productsMap: Map<number, Product>,
    subtotal: number
  ): Promise<AppliedPromotion> {
    let discountAmount = 0;
    let message = '';
    const affectedItems: number[] = [];

    switch (promotion.scope) {
      case 'cart': {
        // Réduction sur tout le panier
        const cartResult = this.calculateCartDiscount(promotion, subtotal);
        discountAmount = cartResult.amount;
        message = cartResult.message;
        break;
      }

      case 'shipping': {
        // Livraison gratuite
        message = promotion.description || 'Livraison offerte';
        break;
      }

      case 'buy-x-get-y': {
        // X achetés = Y offerts
        const buyGetResult = await this.calculateBuyXGetY(promotion, cartItems, productsMap);
        discountAmount = buyGetResult.amount;
        message = buyGetResult.message;
        affectedItems.push(...buyGetResult.affectedItems);
        break;
      }

      case 'site-wide':
      case 'product':
      case 'category':
      case 'subcategory':
      case 'format': {
        // Réduction sur produits spécifiques
        const productResult = await this.calculateProductDiscount(
          promotion,
          cartItems,
          productsMap
        );
        discountAmount = productResult.amount;
        message = productResult.message;
        affectedItems.push(...productResult.affectedItems);
        break;
      }

      default: {
        message = promotion.description || promotion.name;
        break;
      }
    }

    return {
      promotion,
      discountAmount,
      affectedItems: affectedItems.length > 0 ? affectedItems : undefined,
      message,
    };
  }

  /**
   * Calcule une réduction sur le panier entier
   */
  private calculateCartDiscount(
    promotion: Promotion,
    subtotal: number
  ): { amount: number; message: string } {
    let amount = 0;
    let message = '';

    // Promotion progressive ?
    if (promotion.progressiveTiers && promotion.progressiveTiers.length > 0) {
      const applicableTier = this.getApplicableTier(promotion.progressiveTiers, subtotal);
      if (applicableTier) {
        if (applicableTier.discountType === 'percentage') {
          amount = (subtotal * applicableTier.discountValue) / 100;
          message = `-${applicableTier.discountValue}% sur votre panier`;
        } else {
          amount = Math.min(applicableTier.discountValue, subtotal);
          message = `-${applicableTier.discountValue}€ sur votre panier`;
        }
      }
    } else {
      // Réduction simple
      if (promotion.discountType === 'percentage') {
        amount = (subtotal * promotion.discountValue) / 100;
        message = promotion.description || `-${promotion.discountValue}% sur votre panier`;
      } else if (promotion.discountType === 'fixed') {
        amount = Math.min(promotion.discountValue, subtotal);
        message = promotion.description || `-${promotion.discountValue}€ sur votre panier`;
      }
    }

    return { amount, message };
  }

  /**
   * Calcule une réduction "X achetés = Y offerts"
   */
  private async calculateBuyXGetY(
    promotion: Promotion,
    cartItems: CartItem[],
    productsMap: Map<number, Product>
  ): Promise<{ amount: number; message: string; affectedItems: number[] }> {
    if (!promotion.buyXGetYConfig) {
      return { amount: 0, message: '', affectedItems: [] };
    }

    const config = promotion.buyXGetYConfig;
    const eligibleItems = await this.getEligibleItems(promotion, cartItems, productsMap);

    // Calculer combien de fois on peut appliquer l'offre
    const totalQuantity = eligibleItems.reduce((sum, item) => sum + item.qty, 0);
    const sets = Math.floor(totalQuantity / (config.buyQuantity + config.getQuantity));

    if (sets === 0) {
      return { amount: 0, message: '', affectedItems: [] };
    }

    // Trier les items selon la stratégie
    const sortedItems = [...eligibleItems].sort((a, b) =>
      config.applyOn === 'cheapest' ? a.unitPrice - b.unitPrice : b.unitPrice - a.unitPrice
    );

    // Calculer le montant offert
    let amount = 0;
    let itemsToGift = sets * config.getQuantity;
    const affectedItems: number[] = [];

    for (const item of sortedItems) {
      if (itemsToGift === 0) break;

      const qtyToGift = Math.min(itemsToGift, item.qty);
      amount += item.unitPrice * qtyToGift;
      affectedItems.push(item.productId);
      itemsToGift -= qtyToGift;
    }

    const message = `${config.buyQuantity} achetés = ${config.getQuantity} offert${
      config.getQuantity > 1 ? 's' : ''
    }`;

    return { amount, message, affectedItems };
  }

  /**
   * Calcule une réduction sur des produits spécifiques
   */
  private async calculateProductDiscount(
    promotion: Promotion,
    cartItems: CartItem[],
    productsMap: Map<number, Product>
  ): Promise<{ amount: number; message: string; affectedItems: number[] }> {
    const eligibleItems = await this.getEligibleItems(promotion, cartItems, productsMap);

    if (eligibleItems.length === 0) {
      return { amount: 0, message: '', affectedItems: [] };
    }

    const strategy = promotion.applicationStrategy || 'all';
    let amount = 0;
    const affectedItems: number[] = [];
    let message = promotion.description || '';

    switch (strategy) {
      case 'all': {
        // Appliquer à tous les produits éligibles
        for (const item of eligibleItems) {
          const itemTotal = item.unitPrice * item.qty;
          if (promotion.discountType === 'percentage') {
            amount += (itemTotal * promotion.discountValue) / 100;
          } else {
            amount += Math.min(promotion.discountValue, itemTotal);
          }
          affectedItems.push(item.productId);
        }
        break;
      }

      case 'cheapest': {
        // Appliquer au produit le moins cher
        const cheapest = eligibleItems.reduce((min, item) =>
          item.unitPrice < min.unitPrice ? item : min
        );
        const cheapestTotal = cheapest.unitPrice * cheapest.qty;
        if (promotion.discountType === 'percentage') {
          amount = (cheapestTotal * promotion.discountValue) / 100;
        } else {
          amount = Math.min(promotion.discountValue, cheapestTotal);
        }
        affectedItems.push(cheapest.productId);
        message = message || `Réduction sur le produit le moins cher`;
        break;
      }

      case 'most-expensive': {
        // Appliquer au produit le plus cher
        const mostExpensive = eligibleItems.reduce((max, item) =>
          item.unitPrice > max.unitPrice ? item : max
        );
        const expensiveTotal = mostExpensive.unitPrice * mostExpensive.qty;
        if (promotion.discountType === 'percentage') {
          amount = (expensiveTotal * promotion.discountValue) / 100;
        } else {
          amount = Math.min(promotion.discountValue, expensiveTotal);
        }
        affectedItems.push(mostExpensive.productId);
        message = message || `Réduction sur le produit le plus cher`;
        break;
      }

      case 'proportional': {
        // Répartir proportionnellement
        const total = eligibleItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
        const totalDiscount =
          promotion.discountType === 'percentage'
            ? (total * promotion.discountValue) / 100
            : Math.min(promotion.discountValue, total);

        for (const item of eligibleItems) {
          const itemTotal = item.unitPrice * item.qty;
          const itemDiscount = total > 0 ? (totalDiscount * itemTotal) / total : 0;
          amount += itemDiscount;
          affectedItems.push(item.productId);
        }
        message = message || `Réduction répartie sur les produits éligibles`;
        break;
      }

      case 'non-promo-only': {
        // Appliquer uniquement aux produits non promotionnels
        const nonPromoItems = eligibleItems.filter((item) => {
          const product = productsMap.get(item.productId);
          return product && !product.reducedPrice;
        });

        for (const item of nonPromoItems) {
          const itemTotal = item.unitPrice * item.qty;
          if (promotion.discountType === 'percentage') {
            amount += (itemTotal * promotion.discountValue) / 100;
          } else {
            amount += Math.min(promotion.discountValue, itemTotal);
          }
          affectedItems.push(item.productId);
        }
        message = message || `Réduction sur les produits hors promotion`;
        break;
      }
    }

    return { amount, message, affectedItems };
  }

  /**
   * Récupère les items du panier éligibles pour une promotion
   */
  private async getEligibleItems(
    promotion: Promotion,
    cartItems: CartItem[],
    productsMap: Map<number, Product>
  ): Promise<CartItem[]> {
    const checks = await Promise.all(cartItems.map(async (item) => {
      const product = productsMap.get(item.productId);
      if (!product) return false;

      // Exclure les produits en promo si demandé
      if (promotion.conditions?.excludePromotedProducts && product.reducedPrice) {
        return false;
      }

      // Vérifier le scope
      switch (promotion.scope) {
        case 'site-wide':
        case 'cart':
          return true;

        case 'product':
          return promotion.productIds?.includes(item.productId) || false;

        case 'category':
          if (!promotion.categorySlugs) return false;
          return this.promotionService['productMatchesCategories'](
            product,
            promotion.categorySlugs
          );

        case 'subcategory':
          if (!promotion.subCategorySlugs) return false;
          return this.promotionService['productMatchesSubCategories'](
            product,
            promotion.subCategorySlugs
          );

        case 'format':
          if (!promotion.formatIds) return false;
          return await this.promotionService['productMatchesFormats'](product, promotion.formatIds);

        case 'buy-x-get-y':
          // Pour buy-x-get-y, on peut cibler des produits spécifiques
          if (promotion.productIds && promotion.productIds.length > 0) {
            return promotion.productIds.includes(item.productId);
          }
          return true;

        default:
          return false;
      }
    }));

    return cartItems.filter((_, i) => checks[i]);
  }

  /**
   * Vérifie si une promotion est valide (dates, conditions)
   */
  private isPromotionValid(
    promotion: Promotion,
    subtotal: number,
    cartItems: CartItem[],
    userOrderCount: number
  ): boolean {
    // Vérifier les dates
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = promotion.endDate ? new Date(promotion.endDate) : null;

    if (now < startDate) return false;
    if (endDate && now > endDate) return false;

    // Vérifier les conditions
    const conditions = promotion.conditions;
    if (!conditions) return true;

    // Montant minimum
    if (conditions.minAmount && subtotal < conditions.minAmount) {
      return false;
    }

    // Quantité minimum
    if (conditions.minQuantity) {
      const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
      if (totalQty < conditions.minQuantity) {
        return false;
      }
    }

    // Segment utilisateur
    if (conditions.userSegment && conditions.userSegment !== 'all') {
      if (conditions.userSegment === 'first-purchase' && userOrderCount > 0) {
        return false;
      }
      // Ajouter d'autres vérifications de segment ici
    }

    return true;
  }

  /**
   * Crée un indicateur de progression pour une promotion
   */
  private createProgressIndicator(
    promotion: Promotion,
    subtotal: number,
    cartItems: CartItem[]
  ): PromotionProgress | null {
    const conditions = promotion.conditions;
    if (!conditions) return null;

    // Progression par montant
    if (conditions.minAmount && subtotal < conditions.minAmount) {
      const remaining = conditions.minAmount - subtotal;
      if (remaining <= conditions.minAmount * 0.5) {
        // Afficher seulement si on est à moins de 50% du seuil
        return {
          promotion,
          type: 'amount',
          current: subtotal,
          target: conditions.minAmount,
          remaining,
          isUnlocked: false,
          message: `Plus que ${remaining.toFixed(2)}€ pour débloquer : ${
            promotion.description || promotion.name
          }`,
        };
      }
    }

    // Progression par quantité
    if (conditions.minQuantity) {
      const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
      if (totalQty < conditions.minQuantity) {
        const remaining = conditions.minQuantity - totalQty;
        if (remaining <= conditions.minQuantity * 0.5) {
          return {
            promotion,
            type: 'quantity',
            current: totalQty,
            target: conditions.minQuantity,
            remaining,
            isUnlocked: false,
            message: `Plus que ${remaining} article${remaining > 1 ? 's' : ''} pour débloquer : ${
              promotion.description || promotion.name
            }`,
          };
        }
      }
    }

    // Progression Buy X Get Y
    if (promotion.scope === 'buy-x-get-y' && promotion.buyXGetYConfig) {
      const config = promotion.buyXGetYConfig;
      const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
      const target = config.buyQuantity + config.getQuantity;
      if (totalQty < target && totalQty > 0) {
        const remaining = target - totalQty;
        return {
          promotion,
          type: 'buy-x-get-y',
          current: totalQty,
          target,
          remaining,
          isUnlocked: false,
          message: `Plus que ${remaining} article${remaining > 1 ? 's' : ''} pour ${
            config.getQuantity
          } offert${config.getQuantity > 1 ? 's' : ''}`,
        };
      }
    }

    return null;
  }

  /**
   * Trouve le palier applicable pour une promotion progressive
   */
  private getApplicableTier(tiers: ProgressiveTier[], subtotal: number): ProgressiveTier | null {
    // Trier par montant décroissant
    const sortedTiers = [...tiers].sort((a, b) => b.minAmount - a.minAmount);

    // Trouver le premier palier dont le montant minimum est atteint
    for (const tier of sortedTiers) {
      if (subtotal >= tier.minAmount) {
        return tier;
      }
    }

    return null;
  }

  /**
   * Récupère le nombre de commandes de l'utilisateur
   */
  private async getUserOrderCount(): Promise<number> {
    const user = this.authService.currentUser$();
    if (!user) return 0;

    // TODO: Implémenter la récupération du nombre de commandes
    // Pour l'instant, retourner 0 (considéré comme premier achat)
    return 0;
  }
}
