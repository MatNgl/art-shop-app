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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { Public } from '../../auth/decorators/public.decorator';
import { OrderStatus } from '../entities/order.entity';

@ApiTags('orders')
@Controller('orders')
@UseInterceptors(ClassSerializerInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une nouvelle commande' })
  @ApiResponse({ status: 201, description: 'Commande créée avec orderNumber généré' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  create(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les commandes (admin)' })
  @ApiResponse({ status: 200, description: 'Liste des commandes avec items' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des commandes' })
  @ApiResponse({ status: 200, description: 'Stats par statut (pending, processing, accepted, refused, delivered)' })
  getStats() {
    return this.ordersService.getStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les commandes de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Liste des commandes utilisateur avec items' })
  findMyOrders(@CurrentUser() user: User) {
    return this.ordersService.findByUser(user.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une commande par ID' })
  @ApiResponse({ status: 200, description: 'Commande trouvée avec items, customer et payment' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une commande' })
  @ApiResponse({ status: 200, description: 'Commande mise à jour' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Public()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une commande' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour (pending|processing|accepted|refused|delivered)' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.ordersService.updateStatus(id, body.status);
  }

  @Public()
  @Patch(':id/notes')
  @ApiOperation({ summary: 'Mettre à jour les notes d\'une commande' })
  @ApiResponse({ status: 200, description: 'Notes mises à jour' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  updateNotes(
    @Param('id') id: string,
    @Body() body: { notes: string },
  ) {
    return this.ordersService.updateNotes(id, body.notes);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une commande' })
  @ApiResponse({ status: 200, description: 'Commande supprimée' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
