import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour confirmer un paiement
 */
export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'ID de la transaction créée',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  transactionId: string;

  @ApiPropertyOptional({
    description: 'ID du PaymentIntent Stripe (si Stripe)',
    example: 'pi_3AbCdEfGhIjKlMnO',
  })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiPropertyOptional({
    description: 'ID de la commande PayPal (si PayPal)',
    example: '5O190127TN364715T',
  })
  @IsOptional()
  @IsString()
  paypalOrderId?: string;
}
