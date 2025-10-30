import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum PaymentBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  PAYPAL = 'paypal',
  OTHER = 'other',
}

@Entity('user_payment_methods')
export class UserPaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: PaymentBrand,
  })
  brand: PaymentBrand;

  @Column({ type: 'varchar', length: 4 })
  last4: string;

  @Column({ name: 'exp_month', type: 'integer' })
  expMonth: number;

  @Column({ name: 'exp_year', type: 'integer' })
  expYear: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  holder: string | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
