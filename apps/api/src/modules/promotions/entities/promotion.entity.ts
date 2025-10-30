import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';
export type PromotionType = 'automatic' | 'code';
export type PromotionScope =
  | 'product'
  | 'category'
  | 'subcategory'
  | 'site-wide'
  | 'format'
  | 'cart'
  | 'shipping'
  | 'user-segment'
  | 'buy-x-get-y'
  | 'subscription';

export type ApplicationStrategy =
  | 'all'
  | 'cheapest'
  | 'most-expensive'
  | 'proportional'
  | 'non-promo-only';

export type UserSegment = 'first-purchase' | 'returning' | 'vip' | 'all';

export interface ProgressiveTier {
  minAmount: number;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
}

export interface BuyXGetYConfig {
  buyQuantity: number;
  getQuantity: number;
  applyOn: 'cheapest' | 'most-expensive';
}

export interface PromotionCondition {
  minQuantity?: number;
  minAmount?: number;
  maxUsagePerUser?: number;
  maxUsageTotal?: number;
  userSegment?: UserSegment;
  excludePromotedProducts?: boolean;
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['automatic', 'code'],
    default: 'automatic',
  })
  type: PromotionType;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  code: string;

  @Column({
    type: 'enum',
    enum: [
      'product',
      'category',
      'subcategory',
      'site-wide',
      'format',
      'cart',
      'shipping',
      'user-segment',
      'buy-x-get-y',
      'subscription',
    ],
  })
  scope: PromotionScope;

  @Column({
    name: 'discount_type',
    type: 'enum',
    enum: ['percentage', 'fixed', 'free_shipping'],
  })
  discountType: DiscountType;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  // Cibles (selon scope)
  @Column({ name: 'product_ids', type: 'simple-array', nullable: true })
  productIds: string[];

  @Column({ name: 'category_slugs', type: 'simple-array', nullable: true })
  categorySlugs: string[];

  @Column({ name: 'sub_category_slugs', type: 'simple-array', nullable: true })
  subCategorySlugs: string[];

  @Column({ name: 'format_ids', type: 'simple-array', nullable: true })
  formatIds: string[];

  @Column({ name: 'subscription_plan_ids', type: 'simple-array', nullable: true })
  subscriptionPlanIds: string[];

  // Stratégies avancées
  @Column({
    name: 'application_strategy',
    type: 'enum',
    enum: ['all', 'cheapest', 'most-expensive', 'proportional', 'non-promo-only'],
    nullable: true,
    default: 'all',
  })
  applicationStrategy: ApplicationStrategy;

  @Column({ name: 'progressive_tiers', type: 'jsonb', nullable: true })
  progressiveTiers: ProgressiveTier[];

  @Column({ name: 'buy_x_get_y_config', type: 'jsonb', nullable: true })
  buyXGetYConfig: BuyXGetYConfig;

  // Cumulabilité et priorité
  @Column({ name: 'is_stackable', type: 'boolean', default: false })
  isStackable: boolean;

  @Column({ type: 'int', default: 5 })
  priority: number;

  // Conditions
  @Column({ type: 'jsonb', nullable: true })
  conditions: PromotionCondition;

  // Validité
  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null;

  // État
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Tracking
  @Column({ name: 'current_usage', type: 'int', default: 0 })
  currentUsage: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
