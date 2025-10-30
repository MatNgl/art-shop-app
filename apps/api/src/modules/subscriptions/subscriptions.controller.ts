import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';

interface RequestWithUser {
  user: {
    sub: string;
    email: string;
    role: UserRole;
  };
}

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * PLANS - Admin endpoints
   */

  @Post('plans')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un plan d\'abonnement (Admin)' })
  @ApiResponse({ status: 201, description: 'Plan créé avec succès' })
  @ApiResponse({ status: 409, description: 'Slug déjà utilisé' })
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Get('plans')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lister tous les plans (Admin)' })
  @ApiResponse({ status: 200, description: 'Liste des plans' })
  getAllPlans() {
    return this.subscriptionsService.getAllPlans();
  }

  @Get('plans/public')
  @Public()
  @ApiOperation({ summary: 'Lister les plans publics actifs' })
  @ApiResponse({ status: 200, description: 'Liste des plans publics' })
  getPublicPlans() {
    return this.subscriptionsService.getPublicPlans();
  }

  @Get('plans/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Détails d\'un plan (Admin)' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID du plan (UUID)' })
  @ApiResponse({ status: 200, description: 'Détails du plan' })
  @ApiResponse({ status: 404, description: 'Plan introuvable' })
  getPlanById(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionsService.getPlanById(id);
  }

  @Get('plans/slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Récupérer un plan par slug' })
  @ApiParam({ name: 'slug', type: 'string', description: 'Slug du plan' })
  @ApiResponse({ status: 200, description: 'Plan trouvé' })
  @ApiResponse({ status: 404, description: 'Plan introuvable' })
  getPlanBySlug(@Param('slug') slug: string) {
    return this.subscriptionsService.getPlanBySlug(slug);
  }

  @Patch('plans/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un plan (Admin)' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID du plan (UUID)' })
  @ApiResponse({ status: 200, description: 'Plan mis à jour' })
  @ApiResponse({ status: 404, description: 'Plan introuvable' })
  @ApiResponse({ status: 409, description: 'Slug déjà utilisé' })
  updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un plan (Admin)' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID du plan (UUID)' })
  @ApiResponse({ status: 200, description: 'Plan supprimé' })
  @ApiResponse({ status: 404, description: 'Plan introuvable' })
  @ApiResponse({ status: 409, description: 'Plan utilisé par des abonnements actifs' })
  deletePlan(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionsService.deletePlan(id);
  }

  /**
   * USER SUBSCRIPTIONS - User endpoints
   */

  @Post('subscribe')
  @ApiOperation({ summary: 'S\'abonner à un plan' })
  @ApiResponse({ status: 201, description: 'Abonnement créé' })
  @ApiResponse({ status: 400, description: 'Plan non disponible' })
  @ApiResponse({ status: 409, description: 'Abonnement actif existant' })
  subscribe(@Request() req: RequestWithUser, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(req.user.sub, dto);
  }

  @Get('my-subscription')
  @ApiOperation({ summary: 'Mon abonnement actif' })
  @ApiResponse({ status: 200, description: 'Abonnement actif' })
  @ApiResponse({ status: 404, description: 'Aucun abonnement actif' })
  getMySubscription(@Request() req: RequestWithUser) {
    return this.subscriptionsService.getUserSubscription(req.user.sub);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Annuler mon abonnement' })
  @ApiResponse({ status: 200, description: 'Abonnement annulé' })
  @ApiResponse({ status: 404, description: 'Aucun abonnement actif' })
  cancelSubscription(@Request() req: RequestWithUser) {
    return this.subscriptionsService.cancelSubscription(req.user.sub);
  }

  @Post('reactivate')
  @ApiOperation({ summary: 'Réactiver mon abonnement annulé' })
  @ApiResponse({ status: 200, description: 'Abonnement réactivé' })
  @ApiResponse({ status: 404, description: 'Aucun abonnement annulé' })
  @ApiResponse({ status: 400, description: 'Abonnement expiré' })
  reactivateSubscription(@Request() req: RequestWithUser) {
    return this.subscriptionsService.reactivateSubscription(req.user.sub);
  }

  /**
   * ADMIN - Monitoring
   */

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lister tous les abonnements (Admin)' })
  @ApiResponse({ status: 200, description: 'Liste des abonnements' })
  getAllSubscriptions() {
    return this.subscriptionsService.getAllUserSubscriptions();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Statistiques des abonnements (Admin)' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  getStats() {
    return this.subscriptionsService.getStats();
  }
}
