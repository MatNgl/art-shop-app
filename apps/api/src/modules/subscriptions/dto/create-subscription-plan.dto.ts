import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'starter', description: 'Slug unique (kebab-case)' })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiProperty({ example: 'Starter Box', description: 'Nom du plan' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    example: 'Box mensuelle idéale pour débuter',
    description: 'Description du plan',
  })
  @IsString()
  description: string;

  @ApiProperty({ example: 29.99, description: 'Prix mensuel en euros' })
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiProperty({ example: 299.9, description: 'Prix annuel en euros' })
  @IsNumber()
  @Min(0)
  annualPrice: number;

  @ApiProperty({
    example: 2,
    description: 'Nombre de mois offerts sur abonnement annuel',
  })
  @IsNumber()
  @Min(0)
  @Max(12)
  monthsOfferedOnAnnual: number;

  @ApiProperty({
    example: ['1 œuvre par mois', 'Livraison gratuite', 'Support prioritaire'],
    description: 'Liste courte des avantages (3-6 points)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  perksShort: string[];

  @ApiProperty({
    example: [
      '1 œuvre originale par mois',
      'Livraison gratuite en France',
      'Support client prioritaire',
      'Accès anticipé aux nouvelles collections',
    ],
    description: 'Liste complète des avantages',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  perksFull: string[];

  @ApiProperty({
    example: 1.2,
    description: 'Multiplicateur de points fidélité',
    enum: [1.1, 1.2, 1.5],
  })
  @IsNumber()
  @IsEnum([1.1, 1.2, 1.5])
  loyaltyMultiplier: number;

  @ApiProperty({
    example: 500,
    description: 'Plafond de points gagnables par mois (0 = illimité)',
  })
  @IsNumber()
  @Min(0)
  monthlyPointsCap: number;

  @ApiProperty({
    example: 'public',
    description: 'Visibilité du plan',
    enum: ['public', 'admin'],
  })
  @IsString()
  @IsEnum(['public', 'admin'])
  visibility: 'public' | 'admin';

  @ApiProperty({ example: true, description: 'Plan actif et vendable' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Plan déprécié (plus vendable)',
  })
  @IsOptional()
  @IsBoolean()
  deprecated?: boolean;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Ordre d\'affichage',
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
