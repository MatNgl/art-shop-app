import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FormatsService } from '../services/formats.service';
import { CreateFormatDto } from '../dto/create-format.dto';
import { UpdateFormatDto } from '../dto/update-format.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('formats')
@Controller('formats')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class FormatsController {
  constructor(private readonly formatsService: FormatsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau format d\'impression' })
  @ApiResponse({ status: 201, description: 'Format créé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  create(@Body() createFormatDto: CreateFormatDto) {
    return this.formatsService.create(createFormatDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les formats' })
  @ApiResponse({ status: 200, description: 'Liste des formats' })
  findAll() {
    return this.formatsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un format par son ID' })
  @ApiResponse({ status: 200, description: 'Format trouvé' })
  @ApiResponse({ status: 404, description: 'Format introuvable' })
  findOne(@Param('id') id: string) {
    return this.formatsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un format' })
  @ApiResponse({ status: 200, description: 'Format mis à jour' })
  @ApiResponse({ status: 404, description: 'Format introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  update(@Param('id') id: string, @Body() updateFormatDto: UpdateFormatDto) {
    return this.formatsService.update(id, updateFormatDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un format' })
  @ApiResponse({ status: 200, description: 'Format supprimé' })
  @ApiResponse({ status: 404, description: 'Format introuvable' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  remove(@Param('id') id: string) {
    return this.formatsService.remove(id);
  }
}
