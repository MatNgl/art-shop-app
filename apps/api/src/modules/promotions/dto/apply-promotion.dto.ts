import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsNumber,
  IsInt,
  IsOptional,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @ApiProperty({ example: 'uuid-product-1', description: 'ID du produit' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: 'uuid-variant-1', description: 'ID de la variante' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ example: 2, description: 'Quantité' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 29.99, description: 'Prix unitaire (€)' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    example: 'photographie',
    description: 'Slug de la catégorie du produit',
  })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({
    example: 'photographie-portrait',
    description: 'Slug de la sous-catégorie',
  })
  @IsOptional()
  @IsString()
  subCategorySlug?: string;

  @ApiPropertyOptional({
    example: 'uuid-format-1',
    description: 'ID du format d\'impression',
  })
  @IsOptional()
  @IsString()
  formatId?: string;
}

export class ApplyPromotionDto {
  @ApiProperty({ example: 'SUMMER20', description: 'Code promo à appliquer' })
  @IsString()
  code: string;

  @ApiProperty({
    type: [CartItemDto],
    description: 'Articles du panier',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiProperty({ example: 99.99, description: 'Sous-total du panier (€)' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({
    example: 'uuid-user-1',
    description: 'ID de l\'utilisateur (optionnel pour guest checkout)',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
