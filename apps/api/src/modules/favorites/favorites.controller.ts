import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les IDs des produits favoris de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Liste des IDs des produits favoris',
    type: [String],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getUserFavorites(@CurrentUser() user: User): Promise<string[]> {
    return this.favoritesService.findByUser(user.id);
  }

  @Get('details')
  @ApiOperation({ summary: 'Récupérer les favoris avec les détails des produits' })
  @ApiResponse({
    status: 200,
    description: 'Liste des favoris avec produits',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getUserFavoritesWithProducts(@CurrentUser() user: User) {
    return this.favoritesService.findByUserWithProducts(user.id);
  }

  @Post(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajouter/retirer un produit des favoris (toggle)' })
  @ApiParam({ name: 'productId', description: 'ID du produit', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Favori ajouté ou retiré',
    schema: {
      type: 'object',
      properties: {
        added: {
          type: 'boolean',
          description: 'true si ajouté, false si retiré',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async toggleFavorite(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<{ added: boolean }> {
    return this.favoritesService.toggle(user.id, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirer un produit des favoris' })
  @ApiParam({ name: 'productId', description: 'ID du produit', type: Number })
  @ApiResponse({ status: 204, description: 'Favori retiré avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Favori non trouvé' })
  async removeFavorite(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<void> {
    await this.favoritesService.remove(user.id, productId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer tous les favoris de l\'utilisateur' })
  @ApiResponse({ status: 204, description: 'Tous les favoris supprimés' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async removeAllFavorites(@CurrentUser() user: User): Promise<void> {
    await this.favoritesService.removeAllForUser(user.id);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Vérifier si un produit est dans les favoris' })
  @ApiParam({ name: 'productId', description: 'ID du produit', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Résultat de la vérification',
    schema: {
      type: 'object',
      properties: {
        isFavorite: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async checkFavorite(
    @CurrentUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<{ isFavorite: boolean }> {
    const isFavorite = await this.favoritesService.isFavorite(
      user.id,
      productId,
    );
    return { isFavorite };
  }
}
