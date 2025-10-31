import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { PaymentIntentResponseDto, PaymentTransactionResponseDto } from '../dto/payment-response.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly transactionRepo: Repository<PaymentTransaction>,
    private readonly stripeService: StripeService,
  ) {}

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
    userId?: string,
  ): Promise<PaymentIntentResponseDto> {
    // 1. Créer transaction en BDD (status: pending)
    const transaction = this.transactionRepo.create({
      userId: userId || null,
      orderId: dto.orderId,
      amount: dto.amount,
      currency: dto.currency,
      paymentMethod: dto.paymentMethod,
      provider: 'stripe', // Pour l'instant uniquement Stripe
      status: 'pending',
    });

    await this.transactionRepo.save(transaction);

    // 2. Créer PaymentIntent Stripe
    const paymentIntent = await this.stripeService.createPaymentIntent(
      dto.amount,
      dto.currency,
      dto.orderId,
      dto.customerEmail,
    );

    // 3. Mettre à jour transaction avec l'ID Stripe
    transaction.providerTransactionId = paymentIntent.id;
    await this.transactionRepo.save(transaction);

    this.logger.log(`✅ Payment created: ${transaction.id} for order ${dto.orderId}`);

    return {
      transactionId: transaction.id,
      amount: dto.amount,
      currency: dto.currency,
      clientSecret: paymentIntent.client_secret!,
      provider: 'stripe',
      status: 'pending',
    };
  }

  async confirmPayment(dto: ConfirmPaymentDto): Promise<PaymentTransactionResponseDto> {
    const transaction = await this.transactionRepo.findOne({
      where: { id: dto.transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${dto.transactionId} not found`);
    }

    // Récupérer le PaymentIntent Stripe pour vérifier le statut
    if (dto.paymentIntentId) {
      const paymentIntent = await this.stripeService.retrievePaymentIntent(dto.paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        transaction.status = 'succeeded';
        transaction.completedAt = new Date();
        transaction.metadata = {
          last4: (paymentIntent.payment_method as any)?.card?.last4,
          brand: (paymentIntent.payment_method as any)?.card?.brand,
        };
      } else if (paymentIntent.status === 'requires_action') {
        transaction.status = 'requires_action';
      } else if (paymentIntent.status === 'processing') {
        transaction.status = 'processing';
      }

      await this.transactionRepo.save(transaction);
    }

    return this.mapToResponse(transaction);
  }

  async refundPayment(dto: RefundPaymentDto): Promise<PaymentTransactionResponseDto> {
    const transaction = await this.transactionRepo.findOne({
      where: { id: dto.transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${dto.transactionId} not found`);
    }

    if (transaction.status !== 'succeeded') {
      throw new BadRequestException('Cannot refund a payment that is not succeeded');
    }

    if (!transaction.providerTransactionId) {
      throw new BadRequestException('No provider transaction ID found');
    }

    // Créer le remboursement Stripe
    const refund = await this.stripeService.refund(
      transaction.providerTransactionId,
      dto.amount,
      dto.reason,
    );

    // Mettre à jour la transaction
    transaction.refundedAmount += refund.amount / 100;
    transaction.isRefunded = transaction.refundedAmount >= transaction.amount;
    transaction.status = transaction.isRefunded ? 'refunded' : transaction.status;
    transaction.refundedAt = new Date();

    await this.transactionRepo.save(transaction);

    this.logger.log(`✅ Refund processed: ${refund.id} for transaction ${transaction.id}`);

    return this.mapToResponse(transaction);
  }

  async findByUser(userId: string): Promise<PaymentTransactionResponseDto[]> {
    const transactions = await this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return transactions.map((t) => this.mapToResponse(t));
  }

  async findByOrder(orderId: string): Promise<PaymentTransactionResponseDto[]> {
    const transactions = await this.transactionRepo.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });

    return transactions.map((t) => this.mapToResponse(t));
  }

  async handleStripeWebhook(event: any): Promise<void> {
    this.logger.log(`📥 Webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    const transaction = await this.transactionRepo.findOne({
      where: { providerTransactionId: paymentIntent.id },
    });

    if (!transaction) {
      this.logger.error(`Transaction not found for PaymentIntent ${paymentIntent.id}`);
      return;
    }

    transaction.status = 'succeeded';
    transaction.completedAt = new Date();
    await this.transactionRepo.save(transaction);

    this.logger.log(`✅ Payment succeeded: ${transaction.id}`);
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const transaction = await this.transactionRepo.findOne({
      where: { providerTransactionId: paymentIntent.id },
    });

    if (!transaction) return;

    transaction.status = 'failed';
    transaction.failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
    transaction.failureCode = paymentIntent.last_payment_error?.code || 'unknown';
    await this.transactionRepo.save(transaction);

    this.logger.log(`❌ Payment failed: ${transaction.id}`);
  }

  private async handleRefund(charge: any): Promise<void> {
    // Gérer les remboursements via webhooks si nécessaire
    this.logger.log(`Refund webhook received for charge: ${charge.id}`);
  }

  private mapToResponse(transaction: PaymentTransaction): PaymentTransactionResponseDto {
    return {
      id: transaction.id,
      orderId: transaction.orderId,
      userId: transaction.userId,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      provider: transaction.provider,
      status: transaction.status,
      failureReason: transaction.failureReason,
      metadata: transaction.metadata,
      refundedAmount: transaction.refundedAmount,
      isRefunded: transaction.isRefunded,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      completedAt: transaction.completedAt,
    };
  }
}
