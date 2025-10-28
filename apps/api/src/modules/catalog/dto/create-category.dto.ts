import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Tableaux Modernes' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'tableaux-modernes' })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiProperty({ example: 'Collection de tableaux contemporains', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    description: 'ID de la catégorie parente',
  })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: '#FF5733', required: false, description: 'Couleur hex pour l\'UI' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @ApiProperty({ example: 'palette', required: false, description: 'Nom de l\'icône Material' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiProperty({
    example: 'https://example.com/banner.jpg',
    required: false,
    description: 'Image de bannière de la catégorie',
  })
  @IsOptional()
  @IsString()
  bannerImageUrl?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
