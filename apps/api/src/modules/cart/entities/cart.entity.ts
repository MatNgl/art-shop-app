import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

/**
 * Entité Cart - Panier utilisateur
 * Réplique la logique frontend CartStore mais avec persistence BDD
 */
@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation utilisateur (nullable pour panier invité)
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  // Token pour panier invité (équivalent cart:guest en localStorage)
  @Column({ name: 'guest_token', type: 'varchar', length: 255, nullable: true, unique: true })
  guestToken: string | null;

  // Items du panier (produits + variantes)
  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];

  // Métadonnées
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Getters calculés (équivalent computed signals frontend)

  /**
   * Nombre total d'items dans le panier
   */
  get itemCount(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  /**
   * Sous-total du panier (somme des prix)
   */
  get subtotal(): number {
    return this.items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) || 0;
  }

  /**
   * Taxes (actuellement 0, comme frontend)
   */
  get taxes(): number {
    return 0;
  }

  /**
   * Total du panier
   */
  get total(): number {
    return this.subtotal + this.taxes;
  }

  /**
   * Vérifie si le panier est vide
   */
  get isEmpty(): boolean {
    return !this.items || this.items.length === 0;
  }

  /**
   * Vérifie si c'est un panier invité
   */
  get isGuest(): boolean {
    return this.userId === null && this.guestToken !== null;
  }
}
