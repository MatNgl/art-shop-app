import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFormatDto {
  @ApiProperty({ example: 'A4' })
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ example: 'a4', required: false, description: 'Slug pour les URLs' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.toLowerCase().trim().replace(/\s+/g, '-'))
  slug?: string;

  @ApiProperty({ example: 'paper', required: false, description: 'Type de format (paper, canvas, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toLowerCase().trim())
  type?: string;

  @ApiProperty({ example: 21, description: 'Largeur en cm' })
  @IsNumber()
  @Min(0)
  width: number;

  @ApiProperty({ example: 29.7, description: 'Hauteur en cm' })
  @IsNumber()
  @Min(0)
  height: number;

  @ApiProperty({ example: 'cm', required: false, default: 'cm' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Transform(({ value }) => value?.toLowerCase().trim())
  unit?: string;

  @ApiProperty({ example: true, required: false, default: true, description: 'Format actif ou non' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'Format standard A4 pour impressions papier', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;
}
