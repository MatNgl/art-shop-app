import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ApplyPromotionDto, CartItemDto } from './dto/apply-promotion.dto';

export interface PromotionApplicationResult {
  valid: boolean;
  promotion?: Promotion;
  discountAmount: number;
  affectedItems: string[];
  message: string;
  freeShipping?: boolean;
}

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promoRepo: Repository<Promotion>,
  ) {}

  /**
   * Créer une nouvelle promotion
   */
  async create(dto: CreatePromotionDto): Promise<Promotion> {
    // Vérifier que le code n'existe pas déjà (si code promo)
    if (dto.type === 'code' && dto.code) {
      const existing = await this.promoRepo.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Le code promo "${dto.code}" existe déjà`,
        );
      }
    }

    // Vérifier cohérence type/code
    if (dto.type === 'code' && !dto.code) {
      throw new BadRequestException(
        'Un code est requis pour une promotion de type "code"',
      );
    }

    const promotionData: Partial<Promotion> = {
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isActive: dto.isActive ?? true,
      currentUsage: 0,
    };

    const promotion = this.promoRepo.create(promotionData);
    return this.promoRepo.save(promotion);
  }

  /**
   * Récupérer toutes les promotions
   */
  async findAll(): Promise<Promotion[]> {
    return this.promoRepo.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Récupérer les promotions actives
   */
  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();

    return this.promoRepo
      .createQueryBuilder('promo')
      .where('promo.isActive = :active', { active: true })
      .andWhere('promo.startDate <= :now', { now })
      .andWhere('(promo.endDate IS NULL OR promo.endDate >= :now)', { now })
      .orderBy('promo.priority', 'DESC')
      .addOrderBy('promo.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Récupérer une promotion par ID
   */
  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promoRepo.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException(`Promotion avec l'ID ${id} introuvable`);
    }
    return promotion;
  }

  /**
   * Récupérer une promotion par code
   */
  async findByCode(code: string): Promise<Promotion | null> {
    return this.promoRepo.findOne({
      where: {
        code: code.toUpperCase(),
        type: 'code',
        isActive: true,
      },
    });
  }

  /**
   * Mettre à jour une promotion
   */
  async update(id: string, dto: UpdatePromotionDto): Promise<Promotion> {
    const promotion = await this.findOne(id);

    // Vérifier cohérence code si changement
    if (dto.code && dto.code !== promotion.code) {
      const existing = await this.promoRepo.findOne({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Le code "${dto.code}" existe déjà`);
      }
    }

    Object.assign(promotion, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : promotion.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : promotion.endDate,
    });

    return this.promoRepo.save(promotion);
  }

  /**
   * Supprimer une promotion
   */
  async remove(id: string): Promise<void> {
    const promotion = await this.findOne(id);
    await this.promoRepo.remove(promotion);
  }

  /**
   * Activer/désactiver une promotion
   */
  async toggleActive(id: string): Promise<Promotion> {
    const promotion = await this.findOne(id);
    promotion.isActive = !promotion.isActive;
    return this.promoRepo.save(promotion);
  }

  /**
   * Valider un code promo
   */
  async validateCode(
    code: string,
  ): Promise<{ valid: boolean; promotion?: Promotion; reason?: string }> {
    const promo = await this.findByCode(code);

    if (!promo) {
      return { valid: false, reason: 'Code promo invalide' };
    }

    const now = new Date();

    // Vérifier dates
    if (promo.startDate && now < promo.startDate) {
      return {
        valid: false,
        reason: `Cette promotion sera active à partir du ${promo.startDate.toLocaleDateString()}`,
      };
    }

    if (promo.endDate && now > promo.endDate) {
      return { valid: false, reason: 'Cette promotion a expiré' };
    }

    // Vérifier limite d'utilisation totale
    if (
      promo.conditions?.maxUsageTotal &&
      promo.currentUsage >= promo.conditions.maxUsageTotal
    ) {
      return {
        valid: false,
        reason: 'Cette promotion a atteint sa limite d\'utilisations',
      };
    }

    return { valid: true, promotion: promo };
  }

  /**
   * Appliquer une promotion au panier
   */
  async applyPromotion(dto: ApplyPromotionDto): Promise<PromotionApplicationResult> {
    const { valid, promotion, reason } = await this.validateCode(dto.code);

    if (!valid || !promotion) {
      return {
        valid: false,
        discountAmount: 0,
        affectedItems: [],
        message: reason || 'Code invalide',
      };
    }

    // Vérifier conditions
    if (promotion.conditions) {
      // Montant minimum
      if (
        promotion.conditions.minAmount &&
        dto.subtotal < promotion.conditions.minAmount
      ) {
        return {
          valid: false,
          discountAmount: 0,
          affectedItems: [],
          message: `Montant minimum requis : ${promotion.conditions.minAmount}€`,
        };
      }

      // Quantité minimum
      if (promotion.conditions.minQuantity) {
        const totalQuantity = dto.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        if (totalQuantity < promotion.conditions.minQuantity) {
          return {
            valid: false,
            discountAmount: 0,
            affectedItems: [],
            message: `Quantité minimum requise : ${promotion.conditions.minQuantity} articles`,
          };
        }
      }
    }

    // Calculer la réduction selon le scope
    let discountAmount = 0;
    const affectedItems: string[] = [];
    let freeShipping = false;

    switch (promotion.scope) {
      case 'site-wide':
      case 'cart':
        discountAmount = this.calculateDiscount(dto.subtotal, promotion);
        affectedItems.push(...dto.items.map((i) => i.productId));
        break;

      case 'product':
        const eligibleProductItems = dto.items.filter((i) =>
          promotion.productIds?.includes(i.productId),
        );
        const eligibleTotal = this.calculateItemsTotal(eligibleProductItems);
        discountAmount = this.calculateDiscount(eligibleTotal, promotion);
        affectedItems.push(...eligibleProductItems.map((i) => i.productId));
        break;

      case 'category':
        const categoryItems = dto.items.filter((i) =>
          promotion.categorySlugs?.includes(i.categorySlug || ''),
        );
        const categoryTotal = this.calculateItemsTotal(categoryItems);
        discountAmount = this.calculateDiscount(categoryTotal, promotion);
        affectedItems.push(...categoryItems.map((i) => i.productId));
        break;

      case 'subcategory':
        const subCategoryItems = dto.items.filter((i) =>
          promotion.subCategorySlugs?.includes(i.subCategorySlug || ''),
        );
        const subCategoryTotal = this.calculateItemsTotal(subCategoryItems);
        discountAmount = this.calculateDiscount(subCategoryTotal, promotion);
        affectedItems.push(...subCategoryItems.map((i) => i.productId));
        break;

      case 'format':
        const formatItems = dto.items.filter((i) =>
          promotion.formatIds?.includes(i.formatId || ''),
        );
        const formatTotal = this.calculateItemsTotal(formatItems);
        discountAmount = this.calculateDiscount(formatTotal, promotion);
        affectedItems.push(...formatItems.map((i) => i.productId));
        break;

      case 'shipping':
        if (promotion.discountType === 'free_shipping') {
          freeShipping = true;
        }
        break;

      case 'buy-x-get-y':
        if (promotion.buyXGetYConfig) {
          const result = this.calculateBuyXGetY(
            dto.items,
            promotion.buyXGetYConfig,
          );
          discountAmount = result.discount;
          affectedItems.push(...result.affectedItems);
        }
        break;

      default:
        break;
    }

    // Appliquer la stratégie d'application si définie
    if (
      promotion.applicationStrategy &&
      promotion.applicationStrategy !== 'all' &&
      affectedItems.length > 0
    ) {
      const strategyResult = this.applyStrategy(
        dto.items.filter((i) => affectedItems.includes(i.productId)),
        promotion,
      );
      discountAmount = strategyResult.discount;
    }

    // Arrondir à 2 décimales
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      promotion,
      discountAmount,
      affectedItems,
      message: this.getPromotionMessage(promotion, discountAmount),
      freeShipping,
    };
  }

  /**
   * Calculer la réduction selon le type
   */
  private calculateDiscount(amount: number, promo: Promotion): number {
    if (promo.discountType === 'percentage') {
      return (amount * promo.discountValue) / 100;
    }
    if (promo.discountType === 'fixed') {
      return Math.min(Number(promo.discountValue), amount);
    }
    return 0;
  }

  /**
   * Calculer le total d'une liste d'items
   */
  private calculateItemsTotal(items: CartItemDto[]): number {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  /**
   * Calculer la réduction Buy X Get Y
   */
  private calculateBuyXGetY(
    items: CartItemDto[],
    config: { buyQuantity: number; getQuantity: number; applyOn: string },
  ): { discount: number; affectedItems: string[] } {
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const sets = Math.floor(totalQty / (config.buyQuantity + config.getQuantity));

    if (sets === 0) {
      return { discount: 0, affectedItems: [] };
    }

    // Trier les items selon la stratégie
    const sortedItems = [...items].sort((a, b) =>
      config.applyOn === 'cheapest'
        ? a.unitPrice - b.unitPrice
        : b.unitPrice - a.unitPrice,
    );

    let qtyToGift = sets * config.getQuantity;
    let discount = 0;
    const affectedItems: string[] = [];

    for (const item of sortedItems) {
      if (qtyToGift === 0) break;
      const giftQty = Math.min(qtyToGift, item.quantity);
      discount += item.unitPrice * giftQty;
      affectedItems.push(item.productId);
      qtyToGift -= giftQty;
    }

    return { discount, affectedItems };
  }

  /**
   * Appliquer une stratégie spécifique
   */
  private applyStrategy(
    items: CartItemDto[],
    promo: Promotion,
  ): { discount: number } {
    if (!items.length) return { discount: 0 };

    switch (promo.applicationStrategy) {
      case 'cheapest': {
        const cheapest = items.reduce((min, item) =>
          item.unitPrice < min.unitPrice ? item : min,
        );
        return {
          discount: this.calculateDiscount(
            cheapest.unitPrice * cheapest.quantity,
            promo,
          ),
        };
      }

      case 'most-expensive': {
        const mostExpensive = items.reduce((max, item) =>
          item.unitPrice > max.unitPrice ? item : max,
        );
        return {
          discount: this.calculateDiscount(
            mostExpensive.unitPrice * mostExpensive.quantity,
            promo,
          ),
        };
      }

      case 'proportional': {
        const total = this.calculateItemsTotal(items);
        return { discount: this.calculateDiscount(total, promo) };
      }

      default:
        return { discount: 0 };
    }
  }

  /**
   * Générer le message de promotion
   */
  private getPromotionMessage(promo: Promotion, discount: number): string {
    if (promo.discountType === 'free_shipping') {
      return 'Livraison gratuite offerte !';
    }

    if (promo.discountType === 'percentage') {
      return `Code "${promo.code}" appliqué : -${promo.discountValue}% (-${discount.toFixed(2)}€)`;
    }

    return `Code "${promo.code}" appliqué : -${discount.toFixed(2)}€`;
  }

  /**
   * Incrémenter le compteur d'utilisation
   */
  async incrementUsage(id: string): Promise<void> {
    await this.promoRepo.increment({ id }, 'currentUsage', 1);
  }

  /**
   * Statistiques des promotions
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    codePromos: number;
    automatic: number;
  }> {
    const all = await this.findAll();
    const active = await this.getActivePromotions();

    return {
      total: all.length,
      active: active.length,
      codePromos: all.filter((p) => p.type === 'code').length,
      automatic: all.filter((p) => p.type === 'automatic').length,
    };
  }
}
