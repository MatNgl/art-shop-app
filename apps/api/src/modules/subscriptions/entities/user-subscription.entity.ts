import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionPlan, SubscriptionTerm, LoyaltyMultiplier } from './subscription-plan.entity';
import { User } from '../../users/entities/user.entity';

export type SubscriptionStatus = 'active' | 'canceled' | 'expired';

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.userSubscriptions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({
    type: 'varchar',
    length: 20,
  })
  term: SubscriptionTerm;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: SubscriptionStatus;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'current_period_start', type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ name: 'auto_renew', type: 'boolean', default: true })
  autoRenew: boolean;

  @Column({
    name: 'applied_multiplier',
    type: 'decimal',
    precision: 3,
    scale: 2,
  })
  appliedMultiplier: number;

  @Column({ name: 'canceled_at', type: 'timestamp', nullable: true })
  canceledAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
