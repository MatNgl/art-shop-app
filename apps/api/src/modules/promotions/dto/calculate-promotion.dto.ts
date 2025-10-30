import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VariantPriceInput {
  @ApiProperty({ description: 'ID de la variante', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  variantId: string;

  @ApiProperty({ description: 'SKU de la variante', example: 'TABLEAU-A3-001' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Prix original de la variante', example: 79.99 })
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @ApiPropertyOptional({ description: 'Quantité (pour promos buy-x-get-y)', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class ProductPriceInput {
  @ApiProperty({ description: 'ID du produit', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Prix original du produit (si pas de variantes)', example: 59.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({ description: 'Variantes du produit avec leurs prix', type: [VariantPriceInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantPriceInput)
  variants?: VariantPriceInput[];
}

export class CalculatePromotionDto {
  @ApiProperty({ description: 'Liste des produits avec leurs variantes', type: [ProductPriceInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPriceInput)
  products: ProductPriceInput[];

  @ApiPropertyOptional({ description: 'Code promo à appliquer (optionnel)', example: 'SUMMER20' })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({ description: 'ID utilisateur (pour promos user-segment)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

// DTO de réponse
export class VariantPriceOutput {
  @ApiProperty({ description: 'ID de la variante' })
  variantId: string;

  @ApiProperty({ description: 'SKU de la variante' })
  sku: string;

  @ApiProperty({ description: 'Prix original' })
  originalPrice: number;

  @ApiProperty({ description: 'Prix réduit (après promotions)' })
  reducedPrice: number;

  @ApiProperty({ description: 'Montant économisé' })
  saved: number;

  @ApiProperty({ description: 'Pourcentage de réduction' })
  discountPercentage: number;

  @ApiProperty({ description: 'Promotion appliquée' })
  hasPromotion: boolean;

  @ApiProperty({ description: 'Codes promo appliqués', type: [String] })
  appliedPromoCodes: string[];
}

export class ProductPriceOutput {
  @ApiProperty({ description: 'ID du produit' })
  productId: string;

  @ApiProperty({ description: 'Prix original du produit (si pas de variantes)' })
  originalPrice?: number;

  @ApiProperty({ description: 'Prix réduit du produit (si pas de variantes)' })
  reducedPrice?: number;

  @ApiProperty({ description: 'Promotion appliquée sur le produit' })
  hasPromotion: boolean;

  @ApiProperty({ description: 'Variantes avec prix calculés', type: [VariantPriceOutput] })
  variants: VariantPriceOutput[];
}

export class CalculatePromotionResponse {
  @ApiProperty({ description: 'Produits avec prix calculés', type: [ProductPriceOutput] })
  products: ProductPriceOutput[];

  @ApiProperty({ description: 'Montant total économisé' })
  totalSaved: number;

  @ApiProperty({ description: 'Codes promo appliqués avec succès', type: [String] })
  appliedPromoCodes: string[];
}
