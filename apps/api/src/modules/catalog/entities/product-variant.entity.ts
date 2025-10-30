import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Dimensions } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ name: 'format_id', type: 'uuid', nullable: true })
  formatId: string | null;

  @Column({
    name: 'original_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  originalPrice: number;

  @Column({
    name: 'reduced_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  reducedPrice: number | null;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: Dimensions | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
