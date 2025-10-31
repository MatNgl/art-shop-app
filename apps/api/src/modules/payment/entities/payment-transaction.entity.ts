import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Type de méthode de paiement
 */
export type PaymentMethod = 'card' | 'paypal' | 'bank' | 'apple_pay' | 'google_pay';

/**
 * Provider de paiement
 */
export type PaymentProvider = 'stripe' | 'paypal';

/**
 * Statut du paiement
 */
export type PaymentStatus =
  | 'pending'      // En attente (PaymentIntent créé)
  | 'processing'   // En cours de traitement
  | 'requires_action' // Requiert action (3D Secure)
  | 'succeeded'    // Paiement réussi
  | 'failed'       // Paiement échoué
  | 'canceled'     // Annulé par l'utilisateur
  | 'refunded'     // Remboursé (partiel ou total)
  | 'disputed';    // Litige ouvert

/**
 * Entité PaymentTransaction - Historique des paiements
 */
@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation utilisateur (nullable pour paiement invité)
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  // ID de commande (référence externe - pas de FK car Orders peut être dans autre module)
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  // Montant
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  // Méthode de paiement
  @Column({ name: 'payment_method', type: 'varchar', length: 20 })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 20 })
  provider: PaymentProvider;

  // IDs du provider externe (Stripe ou PayPal)
  @Column({ name: 'provider_transaction_id', type: 'varchar', length: 255, nullable: true })
  providerTransactionId: string | null; // Stripe: payment_intent_id, PayPal: order_id

  @Column({ name: 'provider_customer_id', type: 'varchar', length: 255, nullable: true })
  providerCustomerId: string | null; // Stripe: customer_id (pour cartes sauvegardées)

  // Statut
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: PaymentStatus;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @Column({ name: 'failure_code', type: 'varchar', length: 50, nullable: true })
  failureCode: string | null; // Ex: "card_declined", "insufficient_funds"

  // Métadonnées (JSON)
  // Ex: { last4: "4242", brand: "visa", exp_month: 12, exp_year: 2025 }
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // Remboursement
  @Column({ name: 'refunded_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ name: 'is_refunded', type: 'boolean', default: false })
  isRefunded: boolean;

  // Dates
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt: Date | null;

  // Getters calculés

  /**
   * Vérifie si le paiement est terminé (réussi ou échoué)
   */
  get isCompleted(): boolean {
    return ['succeeded', 'failed', 'canceled'].includes(this.status);
  }

  /**
   * Vérifie si le paiement est réussi
   */
  get isSuccessful(): boolean {
    return this.status === 'succeeded';
  }

  /**
   * Vérifie si le paiement a échoué
   */
  get isFailed(): boolean {
    return this.status === 'failed';
  }

  /**
   * Vérifie si c'est un remboursement partiel
   */
  get isPartiallyRefunded(): boolean {
    return this.refundedAmount > 0 && this.refundedAmount < this.amount;
  }

  /**
   * Vérifie si c'est un remboursement total
   */
  get isFullyRefunded(): boolean {
    return this.refundedAmount >= this.amount;
  }

  /**
   * Montant restant (non remboursé)
   */
  get remainingAmount(): number {
    return Math.max(0, this.amount - this.refundedAmount);
  }
}
