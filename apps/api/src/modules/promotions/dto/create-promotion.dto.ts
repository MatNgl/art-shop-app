import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  Max,
  ValidateNested,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DiscountType,
  PromotionType,
  PromotionScope,
  ApplicationStrategy,
  ProgressiveTier,
  BuyXGetYConfig,
  PromotionCondition,
} from '../entities/promotion.entity';

export class ProgressiveTierDto implements ProgressiveTier {
  @ApiProperty({ example: 50, description: 'Montant minimum pour ce palier (€)' })
  @IsNumber()
  @Min(0)
  minAmount: number;

  @ApiProperty({ example: 10, description: 'Valeur de la réduction pour ce palier' })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({
    example: 'percentage',
    enum: ['percentage', 'fixed'],
    description: 'Type de réduction',
  })
  @IsEnum(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';
}

export class BuyXGetYConfigDto implements BuyXGetYConfig {
  @ApiProperty({ example: 3, description: 'Nombre de produits à acheter (X)' })
  @IsInt()
  @Min(1)
  buyQuantity: number;

  @ApiProperty({ example: 1, description: 'Nombre de produits offerts (Y)' })
  @IsInt()
  @Min(1)
  getQuantity: number;

  @ApiProperty({
    example: 'cheapest',
    enum: ['cheapest', 'most-expensive'],
    description: 'Sur quel produit appliquer la réduction',
  })
  @IsEnum(['cheapest', 'most-expensive'])
  applyOn: 'cheapest' | 'most-expensive';
}

export class PromotionConditionDto implements PromotionCondition {
  @ApiPropertyOptional({ example: 2, description: 'Quantité minimum de produits' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 50, description: 'Montant minimum du panier (€)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Nombre d\'utilisations max par utilisateur',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsagePerUser?: number;

  @ApiPropertyOptional({ example: 100, description: 'Nombre d\'utilisations max total' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsageTotal?: number;

  @ApiPropertyOptional({
    example: 'first-purchase',
    enum: ['first-purchase', 'returning', 'vip', 'all'],
    description: 'Segment utilisateur ciblé',
  })
  @IsOptional()
  @IsEnum(['first-purchase', 'returning', 'vip', 'all'])
  userSegment?: 'first-purchase' | 'returning' | 'vip' | 'all';

  @ApiPropertyOptional({
    example: true,
    description: 'Exclure les produits déjà en promotion',
  })
  @IsOptional()
  @IsBoolean()
  excludePromotedProducts?: boolean;
}

export class CreatePromotionDto {
  @ApiProperty({ example: 'Promo Été 2025', description: 'Nom interne de la promotion' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: '-20% sur toutes les photographies',
    description: 'Description publique',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'automatic',
    enum: ['automatic', 'code'],
    description: 'Type de promotion (automatique ou avec code)',
  })
  @IsEnum(['automatic', 'code'])
  type: PromotionType;

  @ApiPropertyOptional({
    example: 'SUMMER20',
    description: 'Code promo (requis si type=code)',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  code?: string;

  @ApiProperty({
    example: 'category',
    enum: [
      'product',
      'category',
      'subcategory',
      'site-wide',
      'format',
      'cart',
      'shipping',
      'user-segment',
      'buy-x-get-y',
      'subscription',
    ],
    description: 'Portée de la promotion',
  })
  @IsEnum([
    'product',
    'category',
    'subcategory',
    'site-wide',
    'format',
    'cart',
    'shipping',
    'user-segment',
    'buy-x-get-y',
    'subscription',
  ])
  scope: PromotionScope;

  @ApiProperty({
    example: 'percentage',
    enum: ['percentage', 'fixed', 'free_shipping'],
    description: 'Type de réduction',
  })
  @IsEnum(['percentage', 'fixed', 'free_shipping'])
  discountType: DiscountType;

  @ApiProperty({
    example: 20,
    description: 'Valeur de la réduction (% ou € selon discountType)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountValue: number;

  @ApiPropertyOptional({
    example: ['uuid-1', 'uuid-2'],
    description: 'IDs des produits concernés (si scope=product)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @ApiPropertyOptional({
    example: ['photographie', 'peinture'],
    description: 'Slugs des catégories concernées (si scope=category)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categorySlugs?: string[];

  @ApiPropertyOptional({
    example: ['photographie-portrait'],
    description: 'Slugs des sous-catégories (si scope=subcategory)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subCategorySlugs?: string[];

  @ApiPropertyOptional({
    example: ['uuid-format-1'],
    description: 'IDs des formats d\'impression (si scope=format)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  formatIds?: string[];

  @ApiPropertyOptional({
    example: ['uuid-sub-1'],
    description: 'IDs des plans d\'abonnement (si scope=subscription)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subscriptionPlanIds?: string[];

  @ApiPropertyOptional({
    example: 'all',
    enum: ['all', 'cheapest', 'most-expensive', 'proportional', 'non-promo-only'],
    description: 'Stratégie d\'application de la réduction',
  })
  @IsOptional()
  @IsEnum(['all', 'cheapest', 'most-expensive', 'proportional', 'non-promo-only'])
  applicationStrategy?: ApplicationStrategy;

  @ApiPropertyOptional({
    type: [ProgressiveTierDto],
    description: 'Paliers progressifs (montant → réduction)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressiveTierDto)
  progressiveTiers?: ProgressiveTier[];

  @ApiPropertyOptional({
    type: BuyXGetYConfigDto,
    description: 'Configuration "X achetés = Y offerts"',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BuyXGetYConfigDto)
  buyXGetYConfig?: BuyXGetYConfig;

  @ApiPropertyOptional({
    example: false,
    description: 'La promotion peut se cumuler avec d\'autres',
  })
  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  @ApiPropertyOptional({
    example: 5,
    description: 'Priorité (plus élevé = prioritaire)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional({
    type: PromotionConditionDto,
    description: 'Conditions d\'application',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PromotionConditionDto)
  conditions?: PromotionCondition;

  @ApiProperty({
    example: '2025-06-01T00:00:00Z',
    description: 'Date de début de la promotion',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    example: '2025-09-01T00:00:00Z',
    description: 'Date de fin de la promotion (null = pas de fin)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: true, description: 'Promotion active ?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
