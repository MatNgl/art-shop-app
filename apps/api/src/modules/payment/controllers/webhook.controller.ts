import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { PaymentService } from '../services/payment.service';
import { StripeService } from '../services/stripe.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Controller Webhooks - Gestion des webhooks Stripe
 * IMPORTANT : Les webhooks sont des appels HTTP de Stripe vers notre serveur
 * pour nous notifier d'événements (paiement réussi, remboursement, etc.)
 */
@ApiTags('🔔 Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /webhooks/stripe - Webhook Stripe
   *
   * SÉCURITÉ IMPORTANTE :
   * - @Public() car Stripe appelle sans JWT
   * - Vérification de signature obligatoire
   * - Seules les requêtes signées par Stripe sont acceptées
   *
   * CONFIGURATION REQUISE :
   * 1. Dashboard Stripe → Developers → Webhooks
   * 2. Add endpoint: https://ton-site.com/webhooks/stripe
   * 3. Événements à sélectionner :
   *    - payment_intent.succeeded
   *    - payment_intent.payment_failed
   *    - charge.refunded
   * 4. Récupérer le "Signing secret" (whsec_xxx)
   * 5. Ajouter STRIPE_WEBHOOK_SECRET dans .env
   */
  @Post('stripe')
  @Public() // Important : pas de JWT requis pour les webhooks
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook Stripe (appelé par Stripe)',
    description: 'Reçoit les événements Stripe en temps réel (paiement réussi, échec, remboursement, etc.)',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Signature cryptographique Stripe pour vérifier l\'authenticité',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  @ApiResponse({ status: 400, description: 'Signature invalide ou erreur de traitement' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    // 1. Vérifier que le header signature existe
    if (!signature) {
      this.logger.error('❌ Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    // 2. Récupérer le webhook secret depuis .env
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    // 3. Récupérer le corps brut de la requête (IMPORTANT : doit être brut, pas parsé en JSON)
    const rawBody = request.rawBody;

    if (!rawBody) {
      this.logger.error('❌ Raw body not available');
      throw new BadRequestException('Raw body required for webhook verification');
    }

    let event;

    try {
      // 4. Vérifier la signature Stripe
      // Si la signature ne matche pas, Stripe lancera une exception
      event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      this.logger.log(`✅ Webhook signature verified: ${event.type}`);
    } catch (err) {
      this.logger.error(`❌ Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // 5. Traiter l'événement selon le type
    try {
      await this.paymentService.handleStripeWebhook(event);

      this.logger.log(`✅ Webhook processed successfully: ${event.type} (${event.id})`);

      // 6. IMPORTANT : Toujours retourner 200 OK à Stripe
      // Si on ne retourne pas 200, Stripe va réessayer le webhook
      return {
        received: true,
        eventType: event.type,
        eventId: event.id,
      };
    } catch (err) {
      this.logger.error(`❌ Error processing webhook ${event.type}:`, err);

      // Même en cas d'erreur de traitement, on retourne 200
      // pour que Stripe ne réessaye pas indéfiniment
      // (on log l'erreur pour investigation)
      return {
        received: true,
        error: err.message,
        eventType: event.type,
      };
    }
  }

  /**
   * GET /webhooks/test - Endpoint de test (dev only)
   * Permet de tester que le endpoint est accessible
   */
  @Post('test')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test endpoint webhook',
    description: 'Endpoint de test pour vérifier que les webhooks sont accessibles',
  })
  async testWebhook(@Req() request: Request) {
    this.logger.log('📥 Test webhook called');

    return {
      success: true,
      message: 'Webhook endpoint is accessible',
      timestamp: new Date().toISOString(),
      ip: request.ip,
      headers: request.headers,
    };
  }
}
