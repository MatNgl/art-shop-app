import { IsUUID, IsString, IsNumber, IsOptional, Min, Max, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CartItemType } from '../entities/cart-item.entity';

/**
 * DTO pour ajouter un item au panier
 * Réplique la logique de CartStore.add() frontend
 */
export class AddItemDto {
  @ApiProperty({
    description: 'ID du produit (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    description: 'ID de la variante (format A3, A4, custom...)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({
    description: 'Quantité à ajouter',
    example: 1,
    default: 1,
    minimum: 1,
    maximum: 99,
  })
  @IsNumber()
  @Min(1, { message: 'La quantité doit être au minimum de 1' })
  @Max(99, { message: 'La quantité maximum est de 99' })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Type de ligne (product ou subscription)',
    example: 'product',
    default: 'product',
    enum: ['product', 'subscription'],
  })
  @IsOptional()
  @IsEnum(['product', 'subscription'])
  kind?: CartItemType;

  // Données optionnelles pour snapshot (si fournies, sinon récupérées depuis Product/Variant)

  @ApiPropertyOptional({
    description: 'Nom du produit (snapshot)',
    example: 'Tableau Abstrait Moderne',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'URL de l\'image (snapshot)',
    example: 'https://example.com/images/product.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Label de la variante (snapshot)',
    example: 'A4 (21 × 29.7 cm)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  variantLabel?: string;

  @ApiPropertyOptional({
    description: 'Prix unitaire (snapshot)',
    example: 59.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  unitPrice?: number;

  @ApiPropertyOptional({
    description: 'Nom de l\'artiste (snapshot)',
    example: 'Jean Dupont',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  artistName?: string;

  @ApiPropertyOptional({
    description: 'Slug de la catégorie (snapshot)',
    example: 'abstract-art',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categorySlug?: string;
}
