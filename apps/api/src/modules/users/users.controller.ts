import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor) // Exclut automatiquement les champs @Exclude()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Récupérer tous les utilisateurs',
    description:
      'Retourne la liste complète des utilisateurs (triés par date de création)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Statistiques utilisateurs',
    description:
      'Retourne les statistiques globales (total, actifs, suspendus, admins)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques',
    schema: {
      example: {
        total: 150,
        active: 142,
        suspended: 8,
        admins: 3,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur trouvé',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur',
    description:
      "Met à jour les informations d'un utilisateur (sauf email et password)",
  })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/suspend')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspendre un utilisateur',
    description: 'Suspend un utilisateur avec une raison',
  })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur à suspendre" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        suspendedBy: { type: 'string', format: 'uuid' },
        reason: { type: 'string' },
      },
      required: ['suspendedBy', 'reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur suspendu',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async suspend(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { suspendedBy: number; reason: string },
  ) {
    return this.usersService.suspend(id, body.suspendedBy, body.reason);
  }

  @Post(':id/reactivate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réactiver un utilisateur suspendu',
    description: 'Réactive un compte suspendu',
  })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur réactivé',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async reactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.reactivate(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un utilisateur',
    description: 'Supprime définitivement un utilisateur',
  })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({ status: 204, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
  }
}
