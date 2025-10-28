import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductFormat } from './product-format.entity';

@Entity('print_formats')
export class PrintFormat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  slug: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  width: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  height: number;

  @Column({ type: 'varchar', length: 10, default: 'cm' })
  unit: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ProductFormat, (productFormat) => productFormat.format)
  productFormats: ProductFormat[];
}
