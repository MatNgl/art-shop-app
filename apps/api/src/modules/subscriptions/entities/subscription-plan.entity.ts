import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSubscription } from './user-subscription.entity';

export type SubscriptionTerm = 'monthly' | 'annual';
export type SubscriptionVisibility = 'public' | 'admin';
export type LoyaltyMultiplier = 1.1 | 1.2 | 1.5;

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'monthly_price', type: 'decimal', precision: 10, scale: 2 })
  monthlyPrice: number;

  @Column({ name: 'annual_price', type: 'decimal', precision: 10, scale: 2 })
  annualPrice: number;

  @Column({ name: 'months_offered_on_annual', type: 'int', default: 0 })
  monthsOfferedOnAnnual: number;

  @Column({ name: 'perks_short', type: 'text', array: true, default: '{}' })
  perksShort: string[];

  @Column({ name: 'perks_full', type: 'text', array: true, default: '{}' })
  perksFull: string[];

  @Column({
    name: 'loyalty_multiplier',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 1.0,
  })
  loyaltyMultiplier: number;

  @Column({ name: 'monthly_points_cap', type: 'int', default: 0 })
  monthlyPointsCap: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'public',
  })
  visibility: SubscriptionVisibility;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  deprecated: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserSubscription, (sub) => sub.plan)
  userSubscriptions: UserSubscription[];
}
