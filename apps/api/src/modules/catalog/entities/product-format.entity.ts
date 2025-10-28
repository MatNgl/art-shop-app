import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Product } from './product.entity';
import { PrintFormat } from './print-format.entity';

@Entity('product_formats')
export class ProductFormat {
  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId: number;

  @PrimaryColumn({ name: 'format_id', type: 'uuid' })
  formatId: number;

  @ManyToOne(() => Product, (product) => product.productFormats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => PrintFormat, (format) => format.productFormats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'format_id' })
  format: PrintFormat;

  @Column({
    name: 'price_modifier',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  priceModifier: number;
}
