import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CartItemType } from '../entities/cart-item.entity';

/**
 * DTO de réponse pour un item du panier
 */
export class CartItemResponseDto {
  @ApiProperty({ description: 'ID de la ligne du panier' })
  id: string;

  @ApiProperty({ description: 'Type de ligne', enum: ['product', 'subscription'] })
  kind: CartItemType;

  @ApiProperty({ description: 'ID du produit' })
  productId: string;

  @ApiPropertyOptional({ description: 'ID de la variante' })
  variantId: string | null;

  @ApiProperty({ description: 'Nom du produit' })
  title: string;

  @ApiPropertyOptional({ description: 'URL de l\'image' })
  imageUrl: string | null;

  @ApiPropertyOptional({ description: 'Label de la variante (ex: "A4")' })
  variantLabel: string | null;

  @ApiPropertyOptional({ description: 'Nom de l\'artiste' })
  artistName: string | null;

  @ApiPropertyOptional({ description: 'Slug de la catégorie' })
  categorySlug: string | null;

  @ApiProperty({ description: 'Prix unitaire' })
  unitPrice: number;

  @ApiProperty({ description: 'Quantité' })
  quantity: number;

  @ApiProperty({ description: 'Stock maximum disponible' })
  maxStock: number;

  @ApiProperty({ description: 'Prix total de la ligne' })
  lineTotal: number;

  @ApiProperty({ description: 'Disponibilité (quantity <= maxStock)' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;
}

/**
 * DTO de réponse pour le panier complet
 */
export class CartResponseDto {
  @ApiProperty({ description: 'ID du panier' })
  id: string;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur (null pour invité)' })
  userId: string | null;

  @ApiPropertyOptional({ description: 'Token invité (null pour utilisateur connecté)' })
  guestToken: string | null;

  @ApiProperty({ description: 'Liste des items', type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ description: 'Nombre total d\'items' })
  itemCount: number;

  @ApiProperty({ description: 'Sous-total (somme des prix)' })
  subtotal: number;

  @ApiProperty({ description: 'Taxes (actuellement 0)' })
  taxes: number;

  @ApiProperty({ description: 'Total du panier' })
  total: number;

  @ApiProperty({ description: 'Panier vide ?' })
  isEmpty: boolean;

  @ApiProperty({ description: 'Panier invité ?' })
  isGuest: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;
}
