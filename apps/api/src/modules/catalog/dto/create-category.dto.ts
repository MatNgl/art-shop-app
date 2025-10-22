import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, MaxLength } from 'class-validator';

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
  @IsUUID()
  parentId?: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
