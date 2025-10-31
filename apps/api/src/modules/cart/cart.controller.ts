import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Headers,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemQuantityDto } from './dto/update-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controller Cart - Endpoints panier
 * Réplique les méthodes CartStore frontend
 */
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('🛍️ Panier')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ==================== ENDPOINTS UTILISATEUR CONNECTÉ ====================

  /**
   * GET /cart - Récupère le panier de l'utilisateur connecté
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer mon panier (utilisateur connecté)',
    description: 'Récupère le panier avec tous les items, totaux et métadonnées',
  })
  @ApiResponse({
    status: 200,
    description: 'Panier récupéré avec succès',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getCart(@CurrentUser() user: User): Promise<CartResponseDto> {
    return this.cartService.getCart(user.id);
  }

  /**
   * POST /cart/items - Ajoute un item au panier
   */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ajouter un item au panier',
    description:
      'Ajoute un produit (avec variante optionnelle) au panier. Si l\'item existe déjà, incrémente la quantité.',
  })
  @ApiResponse({
    status: 200,
    description: 'Item ajouté au panier',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Produit ou variante introuvable' })
  async addItem(
    @CurrentUser() user: User,
    @Body() dto: AddItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user.id, dto);
  }

  /**
   * PATCH /cart/items/:id/quantity - Modifie la quantité d'un item
   */
  @Patch('items/:id/quantity')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Modifier la quantité d\'un item',
    description: 'Change la quantité d\'un item existant dans le panier (1-99)',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'item (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Quantité mise à jour',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item introuvable' })
  async updateItemQuantity(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateItemQuantityDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItemQuantity(user.id, itemId, dto);
  }

  /**
   * POST /cart/items/:id/increment - Incrémente la quantité (+1)
   */
  @Post('items/:id/increment')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Incrémenter la quantité d\'un item (+1)',
    description: 'Augmente la quantité de 1 (max 99)',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'item (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Quantité incrémentée',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Quantité maximum atteinte (99)' })
  @ApiResponse({ status: 404, description: 'Item introuvable' })
  async incrementItem(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.incrementItem(user.id, itemId);
  }

  /**
   * POST /cart/items/:id/decrement - Décrémente la quantité (-1)
   */
  @Post('items/:id/decrement')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Décrémenter la quantité d\'un item (-1)',
    description: 'Diminue la quantité de 1. Si quantité = 1, supprime l\'item.',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'item (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Quantité décrémentée ou item supprimé',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item introuvable' })
  async decrementItem(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.decrementItem(user.id, itemId);
  }

  /**
   * DELETE /cart/items/:id - Supprime un item du panier
   */
  @Delete('items/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Supprimer un item du panier',
    description: 'Retire complètement un item du panier',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'item (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Item supprimé',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item introuvable' })
  async removeItem(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user.id, itemId);
  }

  /**
   * DELETE /cart - Vide complètement le panier
   */
  @Delete()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Vider le panier',
    description: 'Supprime tous les items du panier',
  })
  @ApiResponse({
    status: 200,
    description: 'Panier vidé',
    type: CartResponseDto,
  })
  async clearCart(@CurrentUser() user: User): Promise<CartResponseDto> {
    return this.cartService.clearCart(user.id);
  }

  /**
   * POST /cart/merge - Fusionne panier invité dans panier utilisateur
   */
  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fusionner panier invité',
    description:
      'Fusionne le panier invité (guestToken) dans le panier utilisateur connecté. Utilisé lors de la connexion.',
  })
  @ApiHeader({
    name: 'X-Guest-Token',
    description: 'Token du panier invité (optionnel)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Paniers fusionnés',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Panier invité introuvable' })
  async mergeGuestCart(
    @CurrentUser() user: User,
    @Headers('x-guest-token') guestToken?: string,
  ): Promise<CartResponseDto> {
    if (!guestToken) {
      // Pas de panier invité à fusionner, retourne panier utilisateur
      return this.cartService.getCart(user.id);
    }

    return this.cartService.mergeGuestCart(user.id, guestToken);
  }

  // ==================== ENDPOINTS INVITÉ (PUBLICS) ====================

  /**
   * GET /cart/guest - Récupère le panier invité
   */
  @Get('guest')
  @Public()
  @ApiOperation({
    summary: 'Récupérer panier invité (public)',
    description:
      'Récupère ou crée un panier invité. Le guestToken est retourné dans la réponse pour être stocké en localStorage côté client.',
  })
  @ApiHeader({
    name: 'X-Guest-Token',
    description: 'Token du panier invité (optionnel)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Panier invité récupéré ou créé',
    type: CartResponseDto,
  })
  async getGuestCart(@Headers('x-guest-token') guestToken?: string): Promise<CartResponseDto> {
    return this.cartService.getGuestCart(guestToken);
  }

  /**
   * POST /cart/guest/items - Ajoute un item au panier invité
   */
  @Post('guest/items')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Ajouter un item au panier invité (public)',
    description: 'Ajoute un produit au panier invité sans authentification',
  })
  @ApiHeader({
    name: 'X-Guest-Token',
    description: 'Token du panier invité (optionnel)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Item ajouté au panier invité',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Produit ou variante introuvable' })
  async addItemGuest(
    @Headers('x-guest-token') guestToken: string | undefined,
    @Body() dto: AddItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItemGuest(guestToken, dto);
  }
}
