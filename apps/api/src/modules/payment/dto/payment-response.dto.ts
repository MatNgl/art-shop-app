import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentProvider, PaymentStatus } from '../entities/payment-transaction.entity';

/**
 * DTO de réponse après création d'un PaymentIntent
 */
export class PaymentIntentResponseDto {
  @ApiProperty({ description: 'ID de la transaction créée' })
  transactionId: string;

  @ApiProperty({ description: 'Montant du paiement' })
  amount: number;

  @ApiProperty({ description: 'Devise' })
  currency: string;

  @ApiPropertyOptional({ description: 'Client Secret Stripe (pour Stripe Elements)' })
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'URL d\'approbation PayPal' })
  approvalUrl?: string;

  @ApiPropertyOptional({ description: 'ID de commande PayPal' })
  paypalOrderId?: string;

  @ApiProperty({ description: 'Provider utilisé' })
  provider: PaymentProvider;

  @ApiProperty({ description: 'Statut initial' })
  status: PaymentStatus;
}

/**
 * DTO de réponse pour une transaction
 */
export class PaymentTransactionResponseDto {
  @ApiProperty({ description: 'ID de la transaction' })
  id: string;

  @ApiProperty({ description: 'ID de la commande' })
  orderId: string;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur' })
  userId: string | null;

  @ApiProperty({ description: 'Montant' })
  amount: number;

  @ApiProperty({ description: 'Devise' })
  currency: string;

  @ApiProperty({ description: 'Méthode de paiement' })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Provider' })
  provider: PaymentProvider;

  @ApiProperty({ description: 'Statut' })
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Raison de l\'échec' })
  failureReason: string | null;

  @ApiPropertyOptional({ description: 'Métadonnées (last4, brand, etc.)' })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Montant remboursé' })
  refundedAmount: number;

  @ApiProperty({ description: 'Est remboursé ?' })
  isRefunded: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Date de complétion' })
  completedAt: Date | null;
}
