import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemQuantityDto } from './dto/update-item.dto';
import { CartResponseDto, CartItemResponseDto } from './dto/cart-response.dto';
import { Product } from '../catalog/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { randomBytes } from 'crypto';

/**
 * Service Cart - Gestion du panier
 * Réplique la logique CartStore frontend avec persistence BDD
 */
@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
  ) {}

  /**
   * Récupère ou crée un panier pour un utilisateur
   */
  async getOrCreateCartForUser(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, guestToken: null });
      cart = await this.cartRepo.save(cart);
    }

    return cart;
  }

  /**
   * Récupère ou crée un panier invité avec token
   */
  async getOrCreateGuestCart(guestToken?: string): Promise<Cart> {
    if (guestToken) {
      const cart = await this.cartRepo.findOne({
        where: { guestToken },
        relations: ['items'],
      });

      if (cart) {
        return cart;
      }
    }

    // Créer nouveau panier invité avec token unique
    const newToken = this.generateGuestToken();
    const cart = this.cartRepo.create({
      userId: null,
      guestToken: newToken,
    });

    return await this.cartRepo.save(cart);
  }

  /**
   * Récupère le panier d'un utilisateur
   */
  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCartForUser(userId);
    return this.mapToResponse(cart);
  }

  /**
   * Récupère le panier invité
   */
  async getGuestCart(guestToken?: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateGuestCart(guestToken);
    return this.mapToResponse(cart);
  }

  /**
   * Ajoute un item au panier (ou incrémente quantité si existe)
   * Réplique CartStore.add() frontend
   */
  async addItem(userId: string, dto: AddItemDto): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCartForUser(userId);

    // Vérifier que le produit existe
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Produit ${dto.productId} introuvable`);
    }

    // Vérifier la variante si fournie
    let variant: ProductVariant | null = null;
    if (dto.variantId) {
      variant = await this.variantRepo.findOne({
        where: { id: dto.variantId, productId: dto.productId },
        relations: ['format'],
      });

      if (!variant) {
        throw new NotFoundException(
          `Variante ${dto.variantId} introuvable pour le produit ${dto.productId}`,
        );
      }
    }

    // Vérifier si l'item existe déjà dans le panier
    const whereCondition: any = {
      cartId: cart.id,
      productId: dto.productId,
    };

    if (dto.variantId) {
      whereCondition.variantId = dto.variantId;
    } else {
      whereCondition.variantId = IsNull();
    }

    const existingItem = await this.cartItemRepo.findOne({
      where: whereCondition,
    });

    if (existingItem) {
      // Incrémenter la quantité
      const newQuantity = existingItem.quantity + dto.quantity;

      if (newQuantity > 99) {
        throw new BadRequestException('Quantité maximum de 99 atteinte');
      }

      existingItem.quantity = newQuantity;
      await this.cartItemRepo.save(existingItem);
    } else {
      // Créer nouvelle ligne
      const itemData = await this.buildCartItemData(cart.id, product, variant, dto);
      const newItem = this.cartItemRepo.create(itemData);
      await this.cartItemRepo.save(newItem);
    }

    // Recharger le panier avec items
    const updatedCart = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    return this.mapToResponse(updatedCart!);
  }

  /**
   * Ajoute un item au panier invité
   */
  async addItemGuest(guestToken: string | undefined, dto: AddItemDto): Promise<CartResponseDto> {
    const cart = await this.getOrCreateGuestCart(guestToken);

    // Même logique que addItem mais pour panier invité
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Produit ${dto.productId} introuvable`);
    }

    let variant: ProductVariant | null = null;
    if (dto.variantId) {
      variant = await this.variantRepo.findOne({
        where: { id: dto.variantId, productId: dto.productId },
        relations: ['format'],
      });

      if (!variant) {
        throw new NotFoundException(
          `Variante ${dto.variantId} introuvable pour le produit ${dto.productId}`,
        );
      }
    }

    const whereConditionGuest: any = {
      cartId: cart.id,
      productId: dto.productId,
    };

    if (dto.variantId) {
      whereConditionGuest.variantId = dto.variantId;
    } else {
      whereConditionGuest.variantId = IsNull();
    }

    const existingItem = await this.cartItemRepo.findOne({
      where: whereConditionGuest,
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;

      if (newQuantity > 99) {
        throw new BadRequestException('Quantité maximum de 99 atteinte');
      }

      existingItem.quantity = newQuantity;
      await this.cartItemRepo.save(existingItem);
    } else {
      const itemData = await this.buildCartItemData(cart.id, product, variant, dto);
      const newItem = this.cartItemRepo.create(itemData);
      await this.cartItemRepo.save(newItem);
    }

    const updatedCart = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    return this.mapToResponse(updatedCart!);
  }

  /**
   * Met à jour la quantité d'un item
   * Réplique CartStore.setQty() frontend
   */
  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateItemQuantityDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCartForUser(userId);

    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} introuvable dans le panier`);
    }

    item.quantity = dto.quantity;
    await this.cartItemRepo.save(item);

    const updatedCart = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    return this.mapToResponse(updatedCart!);
  }

  /**
   * Incrémente la quantité d'un item (+1)
   * Réplique CartStore.inc() frontend
   */
  async incrementItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCartForUser(userId);

    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} introuvable dans le panier`);
    }

    if (item.quantity >= 99) {
      throw new BadRequestException('Quantité maximum de 99 atteinte');
    }

    item.quantity += 1;
    await this.cartItemRepo.save(item);

    const updatedCart = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    return this.mapToResponse(updatedCart!);
  }

  /**
   * Décrémente la quantité d'un item (-1)
   * Réplique CartStore.dec() frontend
   */
  async decrementItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCartForUser(userId);

    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} introuvable dans le panier`);
    }

    if (item.quantity <= 1) {
      // Si quantité = 1, on supprime l'item au lieu de décrémenter à 0
      await this.cartItemRepo.remove(item);
    } else {
      item.quantity -= 1;
      await this.cartItemRepo.save(item);
    }

    const updatedCart = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    return this.mapToResponse(updatedCart!);
  }

  /**
   * Supprime un item du panier
   * Réplique CartStore.remove() frontend
   */
  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCartForUser(userId);

    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} introuvable dans le panier`);
    }

    await this.cartItemRepo.remove(item);

    const updatedCart = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    return this.mapToResponse(updatedCart!);
  }

  /**
   * Vide complètement le panier
   * Réplique CartStore.clear() frontend
   */
  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCartForUser(userId);

    await this.cartItemRepo.delete({ cartId: cart.id });

    const updatedCart = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });

    return this.mapToResponse(updatedCart!);
  }

  /**
   * Fusionne panier invité dans panier utilisateur
   * Réplique CartStore.mergeGuestIntoUser() frontend
   */
  async mergeGuestCart(userId: string, guestToken: string): Promise<CartResponseDto> {
    const userCart = await this.getOrCreateCartForUser(userId);
    const guestCart = await this.cartRepo.findOne({
      where: { guestToken },
      relations: ['items'],
    });

    if (!guestCart || guestCart.items.length === 0) {
      // Pas de panier invité ou panier vide
      return this.mapToResponse(userCart);
    }

    // Fusionner les items
    for (const guestItem of guestCart.items) {
      const whereMerge: any = {
        cartId: userCart.id,
        productId: guestItem.productId,
      };

      if (guestItem.variantId) {
        whereMerge.variantId = guestItem.variantId;
      } else {
        whereMerge.variantId = IsNull();
      }

      const existingItem = await this.cartItemRepo.findOne({
        where: whereMerge,
      });

      if (existingItem) {
        // Additionner les quantités
        const newQuantity = Math.min(99, existingItem.quantity + guestItem.quantity);
        existingItem.quantity = newQuantity;
        await this.cartItemRepo.save(existingItem);
      } else {
        // Transférer l'item au panier utilisateur
        guestItem.cartId = userCart.id;
        await this.cartItemRepo.save(guestItem);
      }
    }

    // Supprimer le panier invité
    await this.cartRepo.remove(guestCart);

    // Recharger le panier utilisateur
    const mergedCart = await this.cartRepo.findOne({
      where: { id: userCart.id },
      relations: ['items'],
    });

    return this.mapToResponse(mergedCart!);
  }

  /**
   * Construit les données d'un CartItem à partir du produit/variante
   */
  private async buildCartItemData(
    cartId: string,
    product: Product,
    variant: ProductVariant | null,
    dto: AddItemDto,
  ): Promise<Partial<CartItem>> {
    // Prix: variante > produit > dto
    const unitPrice = dto.unitPrice ?? variant?.price ?? product.originalPrice;

    // Stock: variante > produit > 0
    const maxStock = variant?.stockQuantity ?? product.stock ?? 0;

    // Label variante
    let variantLabel = dto.variantLabel;
    if (!variantLabel && variant) {
      const dims = variant.getDimensions();
      if (dims) {
        variantLabel = `${dims.width} × ${dims.height} ${dims.unit}`;
      }
    }

    return {
      cartId,
      kind: dto.kind ?? 'product',
      productId: product.id,
      variantId: variant?.id ?? null,
      title: dto.title ?? product.title,
      imageUrl: dto.imageUrl ?? product.imageUrl ?? null,
      variantLabel: variantLabel ?? null,
      artistName: dto.artistName ?? null,
      categorySlug: dto.categorySlug ?? null,
      unitPrice,
      quantity: dto.quantity,
      maxStock,
    };
  }

  /**
   * Génère un token unique pour panier invité
   */
  private generateGuestToken(): string {
    return `guest_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Mappe Cart entity vers CartResponseDto
   */
  private mapToResponse(cart: Cart): CartResponseDto {
    return {
      id: cart.id,
      userId: cart.userId,
      guestToken: cart.guestToken,
      items: cart.items?.map((item) => this.mapItemToResponse(item)) || [],
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      taxes: cart.taxes,
      total: cart.total,
      isEmpty: cart.isEmpty,
      isGuest: cart.isGuest,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Mappe CartItem entity vers CartItemResponseDto
   */
  private mapItemToResponse(item: CartItem): CartItemResponseDto {
    return {
      id: item.id,
      kind: item.kind,
      productId: item.productId,
      variantId: item.variantId,
      title: item.title,
      imageUrl: item.imageUrl,
      variantLabel: item.variantLabel,
      artistName: item.artistName,
      categorySlug: item.categorySlug,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      maxStock: item.maxStock,
      lineTotal: item.lineTotal,
      isAvailable: item.isAvailable,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
