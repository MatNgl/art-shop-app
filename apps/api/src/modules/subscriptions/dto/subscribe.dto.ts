import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'uuid-plan-1', description: 'ID du plan' })
  @IsString()
  planId: string;

  @ApiProperty({
    example: 'monthly',
    description: 'Durée d\'abonnement',
    enum: ['monthly', 'annual'],
  })
  @IsString()
  @IsEnum(['monthly', 'annual'])
  term: 'monthly' | 'annual';

  @ApiProperty({
    example: true,
    required: false,
    description: 'Renouvellement automatique',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
