import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './controllers/payment.controller';
import { WebhookController } from './controllers/webhook.controller';
import { PaymentService } from './services/payment.service';
import { StripeService } from './services/stripe.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';

/**
 * PaymentModule - Module de gestion des paiements
 * Supporte Stripe (cartes, Apple Pay, Google Pay, Link)
 */
@Module({
  imports: [
    ConfigModule, // Pour accéder aux variables d'environnement (STRIPE_SECRET_KEY, etc.)
    TypeOrmModule.forFeature([PaymentTransaction]),
  ],
  controllers: [
    PaymentController, // Endpoints utilisateur (/payment/*)
    WebhookController, // Webhooks Stripe (/webhooks/stripe)
  ],
  providers: [
    PaymentService,  // Service principal (orchestration)
    StripeService,   // Service Stripe (API calls)
  ],
  exports: [
    PaymentService,  // Exporté pour être utilisé par d'autres modules (ex: OrdersModule)
  ],
})
export class PaymentModule {}
