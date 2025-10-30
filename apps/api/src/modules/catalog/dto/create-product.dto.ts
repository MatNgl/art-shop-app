import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  IsEnum,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class DimensionsDto {
  @ApiProperty({ example: 210 })
  @IsNumber()
  width: number;

  @ApiProperty({ example: 297 })
  @IsNumber()
  height: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  depth?: number;

  @ApiProperty({ example: 'mm', enum: ['mm', 'cm', 'in', 'inches'] })
  @IsEnum(['mm', 'cm', 'in', 'inches'])
  unit: 'mm' | 'cm' | 'in' | 'inches';
}

export class ProductFormatDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  formatId: number;

  @ApiProperty({ example: 5.0, description: 'Modificateur de prix en euros' })
  @IsNumber()
  priceModifier: number;
}

export class ProductVariantDto {
  @ApiProperty({ example: 'SKU-001', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase().trim())
  sku?: string;

  @ApiProperty({ example: 1, description: 'ID du format', required: false })
  @IsOptional()
  @IsInt()
  formatId?: number;

  @ApiProperty({ example: 29.99, description: 'Prix original' })
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @ApiProperty({ example: 24.99, description: 'Prix réduit', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reducedPrice?: number;

  @ApiProperty({ example: 10, required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ type: DimensionsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @ApiProperty({ example: 'https://example.com/variant.jpg', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  imageUrl?: string;
}

export class CategoryAssociationDto {
  @ApiProperty({ example: 1, description: 'ID de la catégorie' })
  @IsInt()
  categoryId: number;

  @ApiProperty({ example: 2, description: 'ID de la sous-catégorie', required: false })
  @IsOptional()
  @IsInt()
  subCategoryId?: number;
}

export class CreateProductDto {
  // Identité du produit
  @ApiProperty({ example: 'Tableau Coucher de Soleil' })
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({ example: 'tableau-coucher-de-soleil' })
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.toLowerCase().trim().replace(/\s+/g, '-'))
  slug: string;

  @ApiProperty({
    example: 'Magnifique tableau représentant un coucher de soleil',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;

  // Pricing
  @ApiProperty({ example: 29.99, description: 'Prix original en euros' })
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @ApiProperty({ example: 24.99, description: 'Prix réduit en euros', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reducedPrice?: number;

  @ApiProperty({ example: true, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  hasPromotion?: boolean;

  @ApiProperty({ example: 15, description: 'Pourcentage de réduction', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discount?: number;

  // Catégories
  @ApiProperty({
    example: 1,
    description: 'ID de la catégorie principale',
    required: false,
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiProperty({
    type: [CategoryAssociationDto],
    required: false,
    description: 'Associations catégorie/sous-catégorie',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryAssociationDto)
  categoryAssociations?: CategoryAssociationDto[];

  // Données enrichies
  @ApiProperty({
    example: ['moderne', 'abstrait', 'coloré'],
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(v => v?.trim().toLowerCase()) : []
  )
  tags?: string[];

  @ApiProperty({
    example: 'https://example.com/product.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  imageUrl?: string;

  @ApiProperty({
    example: [
      'https://example.com/product1.jpg',
      'https://example.com/product2.jpg'
    ],
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(v => v?.trim()) : []
  )
  images?: string[];

  @ApiProperty({ example: 'Aquarelle', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  technique?: string;

  @ApiProperty({ type: DimensionsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @ApiProperty({ example: 1, description: 'ID du format par défaut', required: false })
  @IsOptional()
  @IsInt()
  formatId?: number;

  // Stock
  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ example: 10, required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  // Édition limitée
  @ApiProperty({ example: false, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isLimitedEdition?: boolean;

  @ApiProperty({ example: 42, description: 'Numéro de l\'édition', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  editionNumber?: number;

  @ApiProperty({ example: 100, description: 'Nombre total d\'éditions', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalEditions?: number;

  // Relations
  @ApiProperty({
    type: [ProductFormatDto],
    required: false,
    description: 'Formats disponibles avec modificateurs de prix',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductFormatDto)
  formats?: ProductFormatDto[];

  @ApiProperty({
    type: [ProductVariantDto],
    required: false,
    description: 'Variantes du produit (différentes tailles, formats)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}
