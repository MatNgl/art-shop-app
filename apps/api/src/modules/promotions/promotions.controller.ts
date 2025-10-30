import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
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
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ApplyPromotionDto } from './dto/apply-promotion.dto';
import { CalculatePromotionDto } from './dto/calculate-promotion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('promotions')
@Controller('promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // ==================== ENDPOINTS ADMIN ====================

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle promotion (admin)' })
  @ApiResponse({ status: 201, description: 'Promotion créée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Code promo déjà existant' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer toutes les promotions (admin)' })
  @ApiResponse({ status: 200, description: 'Liste des promotions' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Statistiques des promotions (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques (total, active, codePromos, automatic)',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  getStats() {
    return this.promotionsService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer une promotion par ID (admin)' })
  @ApiParam({ name: 'id', description: 'ID de la promotion (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Promotion trouvée' })
  @ApiResponse({ status: 404, description: 'Promotion introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une promotion (admin)' })
  @ApiParam({ name: 'id', description: 'ID de la promotion (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Promotion mise à jour' })
  @ApiResponse({ status: 404, description: 'Promotion introuvable' })
  @ApiResponse({ status: 409, description: 'Code promo déjà existant' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une promotion (admin)' })
  @ApiParam({ name: 'id', description: 'ID de la promotion (UUID)', type: String })
  @ApiResponse({ status: 204, description: 'Promotion supprimée' })
  @ApiResponse({ status: 404, description: 'Promotion introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.promotionsService.remove(id);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activer/désactiver une promotion (admin)' })
  @ApiParam({ name: 'id', description: 'ID de la promotion (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'État modifié' })
  @ApiResponse({ status: 404, description: 'Promotion introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.toggleActive(id);
  }

  // ==================== ENDPOINTS PUBLICS ====================

  @Public()
  @Get('active/list')
  @ApiOperation({ summary: 'Récupérer les promotions actives (public)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des promotions actives et valides',
  })
  getActivePromotions() {
    return this.promotionsService.getActivePromotions();
  }

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valider un code promo (public)' })
  @ApiResponse({
    status: 200,
    description: 'Résultat de la validation',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        promotion: { type: 'object', nullable: true },
        reason: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Code invalide ou expiré' })
  validateCode(@Body() body: { code: string }) {
    return this.promotionsService.validateCode(body.code);
  }

  @Public()
  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Appliquer un code promo au panier (public)' })
  @ApiResponse({
    status: 200,
    description: 'Résultat de l\'application',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        promotion: { type: 'object', nullable: true },
        discountAmount: { type: 'number' },
        affectedItems: { type: 'array', items: { type: 'string' } },
        message: { type: 'string' },
        freeShipping: { type: 'boolean', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Conditions non remplies' })
  applyPromotion(@Body() applyPromotionDto: ApplyPromotionDto) {
    return this.promotionsService.applyPromotion(applyPromotionDto);
  }

  @Public()
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculer les prix avec promotions pour produits et variantes (public)' })
  @ApiResponse({
    status: 200,
    description: 'Prix calculés avec promotions appliquées',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  calculatePrices(@Body() calculateDto: CalculatePromotionDto) {
    return this.promotionsService.calculatePrices(calculateDto);
  }
}
