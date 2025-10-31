import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../catalog/entities/product.entity';
import { PrintFormat } from '../../catalog/entities/print-format.entity';

export type FormatType = 'predefined' | 'custom';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  // Format: predefined (référence PrintFormat) ou custom (dimensions personnalisées)
  @Column({
    name: 'format_type',
    type: 'enum',
    enum: ['predefined', 'custom'],
  })
  formatType: FormatType;

  @Column({ name: 'format_id', type: 'uuid', nullable: true })
  formatId: string | null;

  @ManyToOne(() => PrintFormat, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'format_id' })
  format: PrintFormat | null;

  // Dimensions personnalisées (si formatType = 'custom')
  @Column({ name: 'custom_width', type: 'decimal', precision: 10, scale: 2, nullable: true })
  customWidth: number | null;

  @Column({ name: 'custom_height', type: 'decimal', precision: 10, scale: 2, nullable: true })
  customHeight: number | null;

  @Column({ name: 'custom_unit', type: 'varchar', length: 10, nullable: true, default: 'cm' })
  customUnit: string | null;

  // Prix (pas de discount ici, géré par Promotions)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // Stock (premier payé, premier servi - pas de réservation)
  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ name: 'low_stock_threshold', type: 'int', default: 5 })
  lowStockThreshold: number;

  // Poids (pour calcul livraison)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null;

  // Image spécifique à la variante (optionnel)
  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  // Statut
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Méthode helper: alerte stock bas
  get isLowStock(): boolean {
    return this.stockQuantity <= this.lowStockThreshold;
  }

  // Méthode helper: dimensions finales (prédéfini OU custom)
  getDimensions(): { width: number; height: number; unit: string } | null {
    if (this.formatType === 'predefined' && this.format) {
      return {
        width: this.format.width,
        height: this.format.height,
        unit: this.format.unit,
      };
    } else if (this.formatType === 'custom' && this.customWidth && this.customHeight) {
      return {
        width: this.customWidth,
        height: this.customHeight,
        unit: this.customUnit || 'cm',
      };
    }
    return null;
  }
}
