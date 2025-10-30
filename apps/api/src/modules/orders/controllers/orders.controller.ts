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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { Public } from '../../auth/decorators/public.decorator';
import { OrderStatus } from '../entities/order.entity';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle commande' })
  @ApiResponse({ status: 201, description: 'Commande créée avec orderNumber généré' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  create(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer toutes les commandes (admin)' })
  @ApiResponse({ status: 200, description: 'Liste des commandes avec items' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Statistiques des commandes' })
  @ApiResponse({ status: 200, description: 'Stats par statut (pending, processing, accepted, refused, delivered)' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  getStats() {
    return this.ordersService.getStats();
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Récupérer les commandes de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Liste des commandes utilisateur avec items' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  findMyOrders(@CurrentUser() user: User) {
    return this.ordersService.findByUser(user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer une commande par ID' })
  @ApiResponse({ status: 200, description: 'Commande trouvée avec items, customer et payment' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une commande' })
  @ApiResponse({ status: 200, description: 'Commande mise à jour' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une commande' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour (pending|processing|accepted|refused|delivered)' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.ordersService.updateStatus(id, body.status);
  }

  @Patch(':id/notes')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour les notes d\'une commande' })
  @ApiResponse({ status: 200, description: 'Notes mises à jour' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  updateNotes(
    @Param('id') id: string,
    @Body() body: { notes: string },
  ) {
    return this.ordersService.updateNotes(id, body.notes);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer une commande' })
  @ApiResponse({ status: 200, description: 'Commande supprimée' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
