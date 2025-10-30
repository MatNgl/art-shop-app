import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @ApiProperty({ description: 'SKU unique de la variante', example: 'TABLEAU-A3-001' })
  @IsString()
  @MaxLength(100)
  sku: string;

  @ApiProperty({
    description: 'Type de format',
    enum: ['predefined', 'custom'],
    example: 'predefined'
  })
  @IsEnum(['predefined', 'custom'])
  formatType: 'predefined' | 'custom';

  @ApiPropertyOptional({
    description: 'ID du format prédéfini (requis si formatType=predefined)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ValidateIf((o) => o.formatType === 'predefined')
  @IsUUID()
  formatId?: string;

  @ApiPropertyOptional({
    description: 'Largeur personnalisée (requis si formatType=custom)',
    example: 50
  })
  @ValidateIf((o) => o.formatType === 'custom')
  @IsNumber()
  @Min(0.1)
  customWidth?: number;

  @ApiPropertyOptional({
    description: 'Hauteur personnalisée (requis si formatType=custom)',
    example: 70
  })
  @ValidateIf((o) => o.formatType === 'custom')
  @IsNumber()
  @Min(0.1)
  customHeight?: number;

  @ApiPropertyOptional({
    description: 'Unité des dimensions personnalisées',
    example: 'cm',
    default: 'cm'
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  customUnit?: string;

  @ApiProperty({ description: 'Prix de la variante', example: 79.99 })
  @IsNumber()
  @Min(0.01)
  price: number;

  @ApiProperty({ description: 'Quantité en stock', example: 50 })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiPropertyOptional({ description: 'Quantité réservée (paniers)', example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedQuantity?: number;

  @ApiPropertyOptional({ description: 'Seuil stock bas', example: 5, default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Poids en kg', example: 0.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'URL image spécifique à la variante' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Variante active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Ordre d\'affichage', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
