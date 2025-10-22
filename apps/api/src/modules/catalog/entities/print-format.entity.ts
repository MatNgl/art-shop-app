import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductFormat } from './product-format.entity';

@Entity('print_formats')
export class PrintFormat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  width: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  height: number;

  @Column({ type: 'varchar', length: 10, default: 'cm' })
  unit: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ProductFormat, (productFormat) => productFormat.format)
  productFormats: ProductFormat[];
}
