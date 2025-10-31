import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour rembourser un paiement
 */
export class RefundPaymentDto {
  @ApiProperty({
    description: 'ID de la transaction à rembourser',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  transactionId: string;

  @ApiPropertyOptional({
    description: 'Montant à rembourser (optionnel, par défaut = montant total)',
    example: 50.00,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Raison du remboursement',
    example: 'Produit défectueux',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
