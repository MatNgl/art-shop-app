import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductFormat } from './product-format.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductCategoryAssociation } from './product-category-association.entity';

export interface Dimensions {
  width: number;
  height: number;
  depth?: number;
  unit: 'mm' | 'cm' | 'in' | 'inches';
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Pricing
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

  @Column({ name: 'has_promotion', type: 'boolean', default: false })
  hasPromotion: boolean;

  @Column({ type: 'int', nullable: true })
  discount: number | null;

  // Category relations (UUID)
  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @OneToMany(
    () => ProductCategoryAssociation,
    (assoc) => assoc.product,
    { cascade: true },
  )
  categoryAssociations: ProductCategoryAssociation[];

  // Rich data
  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  technique: string | null;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: Dimensions | null;

  @Column({ name: 'format_id', type: 'uuid', nullable: true })
  formatId: string | null;

  // Stock
  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'int', default: 0 })
  stock: number;

  // Limited edition
  @Column({ name: 'is_limited_edition', type: 'boolean', default: false })
  isLimitedEdition: boolean;

  @Column({ name: 'edition_number', type: 'int', nullable: true })
  editionNumber: number | null;

  @Column({ name: 'total_editions', type: 'int', nullable: true })
  totalEditions: number | null;

  // Relations
  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductFormat, (productFormat) => productFormat.product, {
    cascade: true,
  })
  productFormats: ProductFormat[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
