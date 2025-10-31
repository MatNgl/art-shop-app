import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../catalog/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

/**
 * Type de ligne panier (équivalent 'kind' frontend)
 */
export type CartItemType = 'product' | 'subscription';

/**
 * Entité CartItem - Ligne du panier
 * Réplique CartProductItem frontend
 */
@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation vers le panier
  @Column({ name: 'cart_id', type: 'uuid' })
  cartId: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  // Type de ligne (product ou subscription)
  @Column({ type: 'varchar', length: 20, default: 'product' })
  kind: CartItemType;

  // Relation produit
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Relation variante (optionnelle - pour formats A3, A4, custom...)
  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant | null;

  // Données dénormalisées (snapshot au moment de l'ajout)
  // Permet d'afficher le panier même si produit supprimé/modifié
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'variant_label', type: 'varchar', length: 100, nullable: true })
  variantLabel: string | null; // Ex: "A4 (21 × 29.7 cm)"

  @Column({ name: 'artist_name', type: 'varchar', length: 255, nullable: true })
  artistName: string | null;

  @Column({ name: 'category_slug', type: 'varchar', length: 100, nullable: true })
  categorySlug: string | null;

  // Prix et quantité
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'max_stock', type: 'int', default: 0 })
  maxStock: number; // Stock disponible au moment de l'ajout

  // Métadonnées
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Getters calculés

  /**
   * Prix total de la ligne (unitPrice * quantity)
   */
  get lineTotal(): number {
    return this.unitPrice * this.quantity;
  }

  /**
   * Vérifie si la quantité demandée est disponible en stock
   */
  get isAvailable(): boolean {
    return this.quantity <= this.maxStock;
  }

  /**
   * Vérifie si c'est une ligne avec variante
   */
  get hasVariant(): boolean {
    return this.variantId !== null;
  }
}
