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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('auth')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor) // Exclut automatiquement les champs @Exclude()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouvel utilisateur',
    description: 'Crée un nouvel utilisateur avec email et mot de passe',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les utilisateurs',
    description: 'Retourne la liste complète des utilisateurs (triés par date de création)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs',
    type: [UserResponseDto],
  })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques utilisateurs',
    description: 'Retourne les statistiques globales (total, actifs, suspendus, admins)',
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
  async getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur trouvé',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur',
    description: 'Met à jour les informations d\'un utilisateur (sauf email et password)',
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspendre un utilisateur',
    description: 'Suspend un utilisateur avec une raison',
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur à suspendre' })
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
  async suspend(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { suspendedBy: number; reason: string },
  ) {
    return this.usersService.suspend(id, body.suspendedBy, body.reason);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réactiver un utilisateur suspendu',
    description: 'Réactive un compte suspendu',
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur réactivé',
    type: UserResponseDto,
  })
  async reactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.reactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un utilisateur',
    description: 'Supprime définitivement un utilisateur',
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  @ApiResponse({ status: 204, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
  }
}
