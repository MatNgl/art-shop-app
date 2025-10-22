import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFormatDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  formatId: string;

  @ApiProperty({ example: 5.0, description: 'Modificateur de prix en euros' })
  @IsNumber()
  priceModifier: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Tableau Coucher de Soleil' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'tableau-coucher-de-soleil' })
  @IsString()
  @MaxLength(200)
  slug: string;

  @ApiProperty({
    example: 'Magnifique tableau représentant un coucher de soleil',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 29.99, description: 'Prix de base en euros' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 10, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty({
    example: 'https://example.com/product.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

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
}
