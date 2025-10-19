import { Injectable, inject } from '@angular/core';
import {
  Promotion,
  PromotionInput,
  PromotionApplicationResult,
  ProductPromotion,
} from '../models/promotion.model';
import { Product } from '../../catalog/models/product.model';
import { CategoryService } from '../../catalog/services/category';
import { Category } from '../../catalog/models/category.model';

/**
 * Étend localement le type Product si le produit "de base" (hors variante)
 * peut porter un formatId. Évite tout recours à `any`.
 */
interface ProductWithFormat {
  formatId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PromotionService {
  private readonly STORAGE_KEY = 'art_shop_promotions';
  private readonly categoryService = inject(CategoryService);
  private promotions: Promotion[] = [];
  private categories: Category[] = [];

  constructor() {
    this.loadFromStorage();
    this.initializeSamplePromotions();
    void this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories = await this.categoryService.getAll();
    } catch {
      this.categories = [];
    }
  }

  /**
   * Récupère toutes les promotions
   */
  async getAll(): Promise<Promotion[]> {
    return this.promotions;
  }

  /**
   * Récupère le nombre total de promotions
   */
  async getCount(): Promise<number> {
    return this.promotions.length;
  }

  /**
   * Récupère les promotions actives
   */
  async getActive(): Promise<Promotion[]> {
    const now = new Date();
    return this.promotions.filter((promo) => {
      if (!promo.isActive) return false;

      const start = new Date(promo.startDate);
      if (start > now) return false;

      if (promo.endDate) {
        const end = new Date(promo.endDate);
        if (end < now) return false;
      }

      // Vérifier les limites d'utilisation
      if (promo.conditions?.maxUsageTotal) {
        if ((promo.currentUsage ?? 0) >= promo.conditions.maxUsageTotal) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Récupère une promotion par ID
   */
  async getById(id: number): Promise<Promotion | null> {
    return this.promotions.find((p) => p.id === id) ?? null;
  }

  /**
   * Récupère une promotion par code
   */
  async getByCode(code: string): Promise<Promotion | null> {
    const activePromos = await this.getActive();
    return (
      activePromos.find((p) => p.type === 'code' && p.code?.toLowerCase() === code.toLowerCase()) ??
      null
    );
  }

  /**
   * Récupère les promotions actives pour un plan d'abonnement
   */
  async getActiveForSubscriptionPlan(planId: number): Promise<Promotion[]> {
    const activePromos = await this.getActive();
    return activePromos.filter((promo) => {
      // Vérifier si c'est une promo automatique (pas de code)
      if (promo.type === 'code') return false;

      // Vérifier le scope
      if (promo.scope === 'subscription') {
        return promo.subscriptionPlanIds?.includes(planId) ?? false;
      }

      return false;
    });
  }

  /**
   * Calcule le prix avec promotion pour un abonnement
   */
  calculateSubscriptionPrice(basePrice: number, planId: number): {
    finalPrice: number;
    discount: number;
    promotion: Promotion | null;
  } {
    // Récupérer de manière synchrone (simplification)
    const now = new Date();
    const activePromo = this.promotions.find((promo) => {
      if (!promo.isActive || promo.type === 'code') return false;

      const start = new Date(promo.startDate);
      if (start > now) return false;

      if (promo.endDate) {
        const end = new Date(promo.endDate);
        if (end < now) return false;
      }

      if (promo.scope === 'subscription' && promo.subscriptionPlanIds?.includes(planId)) {
        return true;
      }

      return false;
    });

    if (!activePromo) {
      return { finalPrice: basePrice, discount: 0, promotion: null };
    }

    let discount = 0;
    if (activePromo.discountType === 'percentage') {
      discount = (basePrice * activePromo.discountValue) / 100;
    } else if (activePromo.discountType === 'fixed') {
      discount = activePromo.discountValue;
    }

    const finalPrice = Math.max(0, basePrice - discount);
    return { finalPrice, discount, promotion: activePromo };
  }

  /**
   * Crée une nouvelle promotion
   */
  async create(input: PromotionInput): Promise<Promotion> {
    const newPromotion: Promotion = {
      ...input,
      id: this.getNextId(),
      currentUsage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.promotions.push(newPromotion);
    this.saveToStorage();
    return newPromotion;
  }

  /**
   * Met à jour une promotion
   */
  async update(id: number, input: Partial<PromotionInput>): Promise<Promotion | null> {
    const index = this.promotions.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this.promotions[index] = {
      ...this.promotions[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage();
    return this.promotions[index];
  }

  /**
   * Supprime une promotion
   */
  async delete(id: number): Promise<boolean> {
    const index = this.promotions.findIndex((p) => p.id === id);
    if (index === -1) return false;

    this.promotions.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * Active/désactive une promotion
   */
  async toggleActive(id: number): Promise<Promotion | null> {
    const promotion = this.promotions.find((p) => p.id === id);
    if (!promotion) return null;

    promotion.isActive = !promotion.isActive;
    promotion.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return promotion;
  }

  /**
   * Récupère les promotions applicables à un produit
   */
  async getPromotionsForProduct(product: Product): Promise<Promotion[]> {
    const activePromos = await this.getActive();

    // Filtrer avec Promise.all pour supporter les checks async (format)
    const checks = await Promise.all(
      activePromos.map(async (promo) => {
        // Les codes promo ne sont pas automatiques
        if (promo.type === 'code') return false;

        // Vérifier le scope
        switch (promo.scope) {
          case 'site-wide':
            return true;

          case 'product':
            return promo.productIds?.includes(product.id) ?? false;

          case 'category':
            return this.productMatchesCategories(product, promo.categorySlugs);

          case 'subcategory':
            return this.productMatchesSubCategories(product, promo.subCategorySlugs);

          case 'format':
            return await this.productMatchesFormats(product, promo.formatIds);

          default:
            return false;
        }
      })
    );

    return activePromos.filter((_, i) => checks[i]);
  }

  /**
   * Vérifie si un produit appartient à une des catégories (par slugs)
   */
  private productMatchesCategories(product: Product, categorySlugs?: string[]): boolean {
    if (!categorySlugs || categorySlugs.length === 0) return false;

    for (const categorySlug of categorySlugs) {
      const category = this.categories.find((c) => c.slug === categorySlug);
      if (category && product.categoryId === category.id) {
        return true;
      }
    }
    return false;
  }

  /**
   * Vérifie si un produit appartient à une des sous-catégories (par slugs)
   */
  private productMatchesSubCategories(product: Product, subCategorySlugs?: string[]): boolean {
    if (!subCategorySlugs || subCategorySlugs.length === 0 || !product.subCategoryIds) {
      return false;
    }

    // Parcourir toutes les catégories pour trouver les sous-catégories
    for (const category of this.categories) {
      if (category.subCategories) {
        for (const subCategorySlug of subCategorySlugs) {
          const subCat = category.subCategories.find((sc) => sc.slug === subCategorySlug);
          if (subCat && product.subCategoryIds.includes(subCat.id)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Vérifie si un produit correspond à un des formats (via formatIds)
   */
  private async productMatchesFormats(product: Product, formatIds?: number[]): Promise<boolean> {
    if (!formatIds || formatIds.length === 0) return false;

    // Si le produit a des variantes, vérifier si l'une d'elles utilise un format ciblé
    if (product.variants && product.variants.length > 0) {
      return product.variants.some(
        (v) => typeof v.formatId === 'number' && formatIds.includes(v.formatId)
      );
    }

    // Sinon, vérifier un éventuel formatId porté par le produit principal
    const pWithFormat: ProductWithFormat = product as ProductWithFormat;
    return typeof pWithFormat.formatId === 'number'
      ? formatIds.includes(pWithFormat.formatId)
      : false;
  }

  /**
   * Calcule la meilleure promotion pour un produit
   */
  async getBestPromotionForProduct(product: Product): Promise<ProductPromotion> {
    const promotions = await this.getPromotionsForProduct(product);

    if (promotions.length === 0) {
      return {
        productId: product.id,
        promotions: [],
      };
    }

    const price = product.reducedPrice ?? product.originalPrice;
    let bestDiscount = 0;
    let bestPromotion: Promotion | undefined;

    promotions.forEach((promo) => {
      const discount = this.calculateDiscount(price, promo);
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestPromotion = promo;
      }
    });

    return {
      productId: product.id,
      promotions,
      bestDiscount: bestPromotion
        ? {
            promotion: bestPromotion,
            discountAmount: bestDiscount,
            finalPrice: price - bestDiscount,
          }
        : undefined,
    };
  }

  /**
   * Applique un code promo
   */
  async applyPromoCode(
    code: string,
    cartTotal: number,
    products: Product[]
  ): Promise<PromotionApplicationResult> {
    const promotion = await this.getByCode(code);

    if (!promotion) {
      return {
        success: false,
        discountAmount: 0,
        message: 'Code promo invalide',
      };
    }

    // Vérifier les conditions
    if (promotion.conditions) {
      if (promotion.conditions.minAmount && cartTotal < promotion.conditions.minAmount) {
        return {
          success: false,
          discountAmount: 0,
          message: `Montant minimum requis : ${promotion.conditions.minAmount}€`,
        };
      }

      if (promotion.conditions.minQuantity) {
        const totalQuantity = products.reduce((sum, p) => sum + (p.stock || 0), 0);
        if (totalQuantity < promotion.conditions.minQuantity) {
          return {
            success: false,
            discountAmount: 0,
            message: `Quantité minimum requise : ${promotion.conditions.minQuantity}`,
          };
        }
      }
    }

    // Calculer la réduction
    let discountAmount = 0;

    if (promotion.scope === 'site-wide') {
      discountAmount = this.calculateDiscount(cartTotal, promotion);
    } else {
      // Calculer sur les produits éligibles uniquement
      const eligibleProducts = await this.filterEligibleProducts(products, promotion);
      const eligibleTotal = eligibleProducts.reduce(
        (sum, p) => sum + (p.reducedPrice ?? p.originalPrice),
        0
      );
      discountAmount = this.calculateDiscount(eligibleTotal, promotion);
    }

    return {
      success: true,
      promotion,
      discountAmount,
      message: `Code promo "${code}" appliqué avec succès !`,
    };
  }

  /**
   * Calcule le montant de réduction
   */
  private calculateDiscount(price: number, promotion: Promotion): number {
    if (promotion.discountType === 'percentage') {
      return (price * promotion.discountValue) / 100;
    } else if (promotion.discountType === 'fixed') {
      return Math.min(promotion.discountValue, price);
    } else if (promotion.discountType === 'free_shipping') {
      // Pas de réduction directe sur le prix produit/panier
      return 0;
    }
    return 0;
  }

  /**
   * Filtre les produits éligibles pour une promotion
   */
  private async filterEligibleProducts(
    products: Product[],
    promotion: Promotion
  ): Promise<Product[]> {
    return products.filter((product) => {
      switch (promotion.scope) {
        case 'site-wide':
          return true;

        case 'product':
          return promotion.productIds?.includes(product.id) ?? false;

        case 'category':
          return this.productMatchesCategories(product, promotion.categorySlugs);

        case 'subcategory':
          return this.productMatchesSubCategories(product, promotion.subCategorySlugs);

        case 'format':
          // Pour un filtrage strict côté service synchrone,
          // on ne vérifie pas ici (préférer getPromotionsForProduct qui est async).
          return false;

        default:
          return false;
      }
    });
  }

  /**
   * Incrémente le compteur d'utilisation
   */
  async incrementUsage(id: number): Promise<void> {
    const promotion = this.promotions.find((p) => p.id === id);
    if (promotion) {
      promotion.currentUsage = (promotion.currentUsage ?? 0) + 1;
      promotion.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  /**
   * Génère le prochain ID
   */
  private getNextId(): number {
    return this.promotions.length > 0 ? Math.max(...this.promotions.map((p) => p.id)) + 1 : 1;
  }

  /**
   * Sauvegarde dans le localStorage
   */
  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.promotions));
  }

  /**
   * Charge depuis le localStorage
   */
  private loadFromStorage(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        this.promotions = JSON.parse(data) as Promotion[];
      } catch {
        this.promotions = [];
      }
    }
  }

  /**
   * Initialise des promotions d'exemple (uniquement si vide)
   */
  private initializeSamplePromotions(): void {
    if (this.promotions.length > 0) return;

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.promotions = [
      // 1. Réduction panier entier simple
      {
        id: 1,
        name: 'Panier -15%',
        description: '-15% sur votre panier',
        type: 'automatic',
        scope: 'cart',
        discountType: 'percentage',
        discountValue: 15,
        applicationStrategy: 'all',
        isStackable: false,
        priority: 3,
        startDate: now.toISOString(),
        endDate: nextMonth.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 2. Réduction panier avec seuil
      {
        id: 2,
        name: 'Panier -15% dès 50€',
        description: "-15% dès 50€ d'achat",
        type: 'automatic',
        scope: 'cart',
        discountType: 'percentage',
        discountValue: 15,
        applicationStrategy: 'all',
        isStackable: false,
        priority: 5,
        conditions: {
          minAmount: 50,
        },
        startDate: now.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 3. Livraison offerte conditionnelle
      {
        id: 3,
        name: 'Livraison offerte dès 40€',
        description: 'Livraison offerte dès 40€',
        type: 'automatic',
        scope: 'shipping',
        discountType: 'free_shipping',
        discountValue: 0,
        isStackable: true,
        priority: 10,
        conditions: {
          minAmount: 40,
        },
        startDate: now.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 4. Premier achat
      {
        id: 4,
        name: 'Premier achat -10%',
        description: '-10% pour votre premier achat',
        type: 'automatic',
        scope: 'user-segment',
        discountType: 'percentage',
        discountValue: 10,
        applicationStrategy: 'all',
        isStackable: false,
        priority: 8,
        conditions: {
          userSegment: 'first-purchase',
        },
        startDate: now.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 5. Offre "3 achetés = 1 offert"
      {
        id: 5,
        name: '3 achetés = 1 offert',
        description: '3 achetés = 1 offert (le moins cher)',
        type: 'automatic',
        scope: 'buy-x-get-y',
        discountType: 'percentage',
        discountValue: 100,
        buyXGetYConfig: {
          buyQuantity: 3,
          getQuantity: 1,
          applyOn: 'cheapest',
        },
        isStackable: false,
        priority: 7,
        startDate: now.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 6. Code promo simple
      {
        id: 6,
        name: 'Code WELCOME10',
        description: '-10€ sur votre commande',
        type: 'code',
        code: 'WELCOME10',
        scope: 'cart',
        discountType: 'fixed',
        discountValue: 10,
        applicationStrategy: 'all',
        isStackable: false,
        priority: 5,
        conditions: {
          minAmount: 50,
          maxUsagePerUser: 1,
        },
        startDate: now.toISOString(),
        isActive: true,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 7. Promo progressive
      {
        id: 7,
        name: 'Promo progressive',
        description: 'Plus vous achetez, plus vous économisez',
        type: 'automatic',
        scope: 'cart',
        discountType: 'percentage',
        discountValue: 10,
        progressiveTiers: [
          { minAmount: 50, discountValue: 10, discountType: 'percentage' },
          { minAmount: 100, discountValue: 20, discountType: 'percentage' },
          { minAmount: 150, discountValue: 30, discountType: 'percentage' },
        ],
        isStackable: false,
        priority: 6,
        startDate: now.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 8. Catégorie spécifique
      {
        id: 8,
        name: 'Promo Photographie',
        description: '-20% sur toute la photographie',
        type: 'automatic',
        scope: 'category',
        categorySlugs: ['photographie'],
        discountType: 'percentage',
        discountValue: 20,
        applicationStrategy: 'all',
        isStackable: true,
        priority: 4,
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 9. Produit le moins cher
      {
        id: 9,
        name: 'Promo article le moins cher',
        description: "-50% sur l'article le moins cher",
        type: 'automatic',
        scope: 'site-wide',
        discountType: 'percentage',
        discountValue: 50,
        applicationStrategy: 'cheapest',
        isStackable: true,
        priority: 2,
        startDate: now.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 10. Produit le plus cher
      {
        id: 10,
        name: 'Promo article le plus cher',
        description: "-30% sur l'article le plus cher",
        type: 'automatic',
        scope: 'site-wide',
        discountType: 'percentage',
        discountValue: 30,
        applicationStrategy: 'most-expensive',
        isStackable: true,
        priority: 3,
        startDate: now.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      // 11. Hors promo uniquement
      {
        id: 11,
        name: 'Promo articles plein tarif',
        description: '-10% sur les articles hors promo',
        type: 'automatic',
        scope: 'site-wide',
        discountType: 'percentage',
        discountValue: 10,
        applicationStrategy: 'non-promo-only',
        isStackable: true,
        priority: 1,
        conditions: {
          excludePromotedProducts: true,
        },
        startDate: now.toISOString(),
        isActive: false,
        currentUsage: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    this.saveToStorage();
  }
}
