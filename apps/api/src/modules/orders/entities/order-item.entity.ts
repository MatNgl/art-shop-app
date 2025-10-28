import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id', type: 'integer' })
  productId: number;

  @Column({ name: 'variant_id', type: 'integer', nullable: true })
  variantId: number | null;

  @Column({ name: 'variant_label', type: 'varchar', length: 100, nullable: true })
  variantLabel: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'integer' })
  qty: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;
}
