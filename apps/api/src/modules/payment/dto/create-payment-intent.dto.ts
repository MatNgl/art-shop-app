import { IsUUID, IsNumber, IsString, IsEnum, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment-transaction.entity';

/**
 * DTO pour créer une intention de paiement
 */
export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'ID de la commande à payer',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Montant du paiement en euros',
    example: 199.97,
    minimum: 0.5,
  })
  @IsNumber()
  @Min(0.5, { message: 'Le montant minimum est de 0,50€' })
  amount: number;

  @ApiProperty({
    description: 'Devise (ISO 4217)',
    example: 'EUR',
    default: 'EUR',
    maxLength: 3,
  })
  @IsString()
  @MaxLength(3)
  currency: string;

  @ApiProperty({
    description: 'Méthode de paiement',
    enum: ['card', 'apple_pay', 'google_pay', 'paypal', 'bank'],
    example: 'card',
  })
  @IsEnum(['card', 'apple_pay', 'google_pay', 'paypal', 'bank'])
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'URL de retour après paiement réussi (PayPal)',
    example: 'https://monsite.com/payment/success',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({
    description: 'URL de retour après annulation (PayPal)',
    example: 'https://monsite.com/payment/cancel',
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @ApiPropertyOptional({
    description: 'Email du client (pour Stripe)',
    example: 'client@example.com',
  })
  @IsOptional()
  @IsString()
  customerEmail?: string;
}
