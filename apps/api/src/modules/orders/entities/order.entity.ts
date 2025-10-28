import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'accepted'
  | 'refused'
  | 'delivered';

export type OrderType = 'product' | 'subscription';

export type PaymentMethod = 'card' | 'paypal' | 'bank';

export type PaymentBrand = 'visa' | 'mastercard' | 'amex' | 'paypal' | 'other';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
}

export interface PaymentInfo {
  method: PaymentMethod;
  last4?: string;
  brand?: PaymentBrand;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: OrderStatus;

  @Column({ type: 'jsonb' })
  customer: CustomerInfo;

  @Column({ type: 'jsonb' })
  payment: PaymentInfo;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    name: 'order_type',
    type: 'varchar',
    length: 20,
    default: 'product',
  })
  orderType: OrderType;

  @Column({ name: 'subscription_id', type: 'varchar', length: 100, nullable: true })
  subscriptionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateOrderNumber() {
    if (!this.orderNumber) {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0');
      this.orderNumber = `ORD-${year}-${randomNum}`;
    }
  }
}
