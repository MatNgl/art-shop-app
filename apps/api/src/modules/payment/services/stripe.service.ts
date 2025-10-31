import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * Service Stripe - Gestion des paiements Stripe
 * Supporte : Cartes bancaires, Apple Pay, Google Pay, Link
 */
@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') ||
      'sk_test_51DEMO'; // Clé de démo pour développement

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });

    this.logger.log('✅ Stripe Service initialized');
  }

  /**
   * Créer un PaymentIntent
   * Supporte automatiquement : cartes, Apple Pay, Google Pay, Link
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    orderId: string,
    customerEmail?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir en centimes
        currency: currency.toLowerCase(),

        // 🔥 Active automatiquement toutes les méthodes de paiement !
        // - Cartes bancaires
        // - Apple Pay (si Safari + Apple Pay configuré)
        // - Google Pay (si Chrome/Android + Google Pay configuré)
        // - Link (paiement 1-clic Stripe)
        automatic_payment_methods: {
          enabled: true,
        },

        // Métadonnées pour retrouver la commande
        metadata: {
          orderId,
          source: 'art-shop-api',
        },

        // Email client (optionnel, pour envoi reçu Stripe)
        receipt_email: customerEmail,

        // Description
        description: `Commande ArtShop #${orderId}`,
      });

      this.logger.log(`✅ PaymentIntent created: ${paymentIntent.id} for order ${orderId}`);

      return paymentIntent;
    } catch (error) {
      this.logger.error('❌ Error creating PaymentIntent:', error);
      throw error;
    }
  }

  /**
   * Récupérer un PaymentIntent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`❌ Error retrieving PaymentIntent ${paymentIntentId}:`, error);
      throw error;
    }
  }

  /**
   * Annuler un PaymentIntent (avant confirmation)
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      this.logger.log(`✅ PaymentIntent canceled: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`❌ Error canceling PaymentIntent ${paymentIntentId}:`, error);
      throw error;
    }
  }

  /**
   * Rembourser un paiement (total ou partiel)
   */
  async refund(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // undefined = remboursement total
        reason: reason ? 'requested_by_customer' : undefined,
        metadata: {
          reason: reason || 'No reason provided',
        },
      });

      this.logger.log(`✅ Refund created: ${refund.id} for PaymentIntent ${paymentIntentId}`);

      return refund;
    } catch (error) {
      this.logger.error(`❌ Error creating refund for ${paymentIntentId}:`, error);
      throw error;
    }
  }

  /**
   * Construire un événement webhook depuis la signature
   * SÉCURITÉ : Vérifie que le webhook vient bien de Stripe
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('❌ Invalid webhook signature:', error);
      throw error;
    }
  }

  /**
   * Récupérer une instance Stripe (pour usages avancés)
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
