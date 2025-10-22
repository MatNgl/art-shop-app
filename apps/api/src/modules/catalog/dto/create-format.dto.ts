import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';

export class CreateFormatDto {
  @ApiProperty({ example: 'A4' })
  @IsString()
  @MaxLength(50)
  name: string;

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
  unit?: string;
}
